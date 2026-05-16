// ============================================================================
// POST /api/leaderboard/submit
// ============================================================================
// Accepts a submission, validates it server-side, verifies the Cloudflare
// Turnstile token, hashes the requester IP, and inserts into Supabase. The
// browser cannot insert directly (RLS blocks it) — all writes funnel through
// here so we can enforce sanity checks, bot challenges, and rate limits.
//
// Request body:
//   {
//     name: string (1-16 chars, sanitized),
//     company: string (0-40 chars, sanitized) | null,
//     pounds_loaded: integer,
//     trucks_shipped: integer,
//     courses_cleared: integer,
//     game_duration_s: integer,
//     turnstile_token: string  <-- new in Stage 2b
//   }
//
// Returns:
//   200 { id: "..." } on success
//   400 { error: "..." } on validation failure
//   401 { error: "..." } on Turnstile verification failure
//   429 { error: "..." } on rate limit
//   500 { error: "..." } on server error
// ============================================================================

import crypto from "node:crypto";

const RATE_LIMIT_WINDOW_MS = 4 * 60 * 1000; // 4 minutes
const submissionsByIp = new Map();

const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "cunt", "asshole", "dick", "cock", "pussy",
  "nigger", "nigga", "faggot", "retard", "whore", "slut", "bastard",
  "damn", "piss", "crap", "twat", "wank", "porn", "anal", "rape",
  "nazi", "hitler", "kkk",
];

function sanitizeString(raw, { maxLength, required, fieldName }) {
  if (raw == null) {
    return required
      ? { error: `${fieldName} is required` }
      : { value: null };
  }
  let v = String(raw)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (v.length === 0) {
    return required
      ? { error: `${fieldName} is required` }
      : { value: null };
  }
  if (v.length > maxLength) {
    return { error: `${fieldName} too long (max ${maxLength})` };
  }
  const lower = v.toLowerCase();
  for (const bad of PROFANITY_LIST) {
    if (lower.includes(bad)) {
      return { error: `${fieldName} contains unacceptable language` };
    }
  }
  return { value: v };
}

function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || "sse-steel-stacker-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  if (Array.isArray(fwd) && fwd.length > 0) {
    return fwd[0].split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

// Verify a Turnstile token against Cloudflare. Returns { ok: true } if valid,
// { ok: false, reason } if invalid. If the secret isn't configured (env var
// missing), skip verification rather than blocking all submissions — lets the
// site keep working if Cloudflare is misconfigured.
async function verifyTurnstile(token, remoteIp) {
  const secret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) {
    return { ok: true, skipped: true };
  }
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "Missing verification token" };
  }
  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (remoteIp) form.append("remoteip", remoteIp);

    const cfResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form },
    );
    const cfData = await cfResponse.json().catch(() => ({}));
    if (cfData.success === true) return { ok: true };
    return {
      ok: false,
      reason: "Verification failed",
      codes: cfData["error-codes"],
    };
  } catch (e) {
    return { ok: false, reason: "Could not verify request" };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const body = req.body || {};

  // -- Validate name + company --
  const nameCheck = sanitizeString(body.name, {
    maxLength: 16,
    required: true,
    fieldName: "Name",
  });
  if (nameCheck.error) return res.status(400).json({ error: nameCheck.error });

  const companyCheck = sanitizeString(body.company, {
    maxLength: 40,
    required: false,
    fieldName: "Company",
  });
  if (companyCheck.error)
    return res.status(400).json({ error: companyCheck.error });

  // -- Validate score fields --
  const pounds_loaded = parseInt(body.pounds_loaded, 10);
  const trucks_shipped = parseInt(body.trucks_shipped, 10);
  const courses_cleared = parseInt(body.courses_cleared, 10);
  const game_duration_s = parseInt(body.game_duration_s, 10);

  if (
    !Number.isFinite(pounds_loaded) ||
    !Number.isFinite(trucks_shipped) ||
    !Number.isFinite(courses_cleared) ||
    !Number.isFinite(game_duration_s)
  ) {
    return res.status(400).json({ error: "Invalid score fields" });
  }
  if (pounds_loaded < 0 || trucks_shipped < 0 || courses_cleared < 0 || game_duration_s < 0) {
    return res.status(400).json({ error: "Score fields cannot be negative" });
  }
  if (game_duration_s < 60) {
    return res.status(400).json({ error: "Game was too short to submit" });
  }
  const maxPossibleLb = game_duration_s * 800;
  if (pounds_loaded > maxPossibleLb) {
    return res.status(400).json({ error: "Score outside physical limits" });
  }
  const expectedTrucks = Math.floor(pounds_loaded / 40000);
  if (trucks_shipped > expectedTrucks + 1) {
    return res.status(400).json({ error: "Truck count doesn't match tonnage" });
  }

  // -- Get client IP --
  const clientIp = getClientIp(req);

  // -- Verify Turnstile token (Stage 2b bot protection) --
  // Runs BEFORE the rate limit so failed verifications don't burn the
  // rate-limit slot. Returns 401 on failure so the client knows to refresh
  // the widget and retry.
  const tsResult = await verifyTurnstile(body.turnstile_token, clientIp);
  if (!tsResult.ok) {
    return res.status(401).json({ error: tsResult.reason || "Verification failed" });
  }

  // -- Rate limit --
  const ip_hash = hashIp(clientIp);
  const now = Date.now();
  const last = submissionsByIp.get(ip_hash);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) {
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - last);
    return res.status(429).json({
      error: `Too many submissions. Try again in ${Math.ceil(waitMs / 1000)}s.`,
    });
  }

  // -- Build the row and insert --
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const row = {
    id,
    name: nameCheck.value,
    company: companyCheck.value,
    pounds_loaded,
    trucks_shipped,
    courses_cleared,
    game_duration_s,
    ip_hash,
  };

  try {
    const insertUrl = `${supabaseUrl}/rest/v1/leaderboard_entries`;
    const response = await fetch(insertUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(500)
        .json({ error: "Database write failed", detail: text.slice(0, 200) });
    }

    submissionsByIp.set(ip_hash, now);

    if (submissionsByIp.size > 1000) {
      const cutoff = now - RATE_LIMIT_WINDOW_MS * 2;
      for (const [key, ts] of submissionsByIp.entries()) {
        if (ts < cutoff) submissionsByIp.delete(key);
      }
    }

    return res.status(200).json({ id, success: true });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error" });
  }
}
