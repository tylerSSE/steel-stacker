// ============================================================================
// POST /api/leaderboard/submit
// ============================================================================
// Accepts a submission, validates it server-side, hashes the requester IP,
// and inserts into Supabase. The browser cannot insert directly (RLS blocks
// it) — all writes funnel through here so we can enforce sanity checks and
// rate limits without trusting client-side code.
//
// Request body:
//   {
//     name: string (1-16 chars, sanitized),
//     company: string (0-40 chars, sanitized) | null,
//     pounds_loaded: integer,
//     trucks_shipped: integer,
//     courses_cleared: integer,
//     game_duration_s: integer,
//     turnstile_token: string (Stage 2b — added later)
//   }
//
// Returns:
//   200 { id: "..." } on success
//   400 { error: "..." } on validation failure
//   429 { error: "..." } on rate limit
//   500 { error: "..." } on server error
// ============================================================================

import crypto from "node:crypto";

// In-memory rate limiter. Keyed by hashed IP. Survives only as long as this
// serverless instance is warm (Vercel reuses instances for a few minutes).
// For production scale, swap to Upstash Redis or a Supabase rate-limit table.
// For our traffic volume this is more than adequate.
const RATE_LIMIT_WINDOW_MS = 4 * 60 * 1000; // 4 minutes
const submissionsByIp = new Map();

// Same profanity list as the client. Server-authoritative — even if the
// client check is bypassed, we re-validate here.
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
  // Hash the IP with a salt so a database leak doesn't expose visitors.
  // Salt comes from env var; if missing, fall back to a static string (still
  // protects against trivial reverse lookups, just not against the database
  // owner). Production should always set IP_HASH_SALT.
  const salt = process.env.IP_HASH_SALT || "sse-steel-stacker-default-salt";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

function getClientIp(req) {
  // Vercel sets x-forwarded-for with the real client IP at the leftmost slot.
  // Fall back to req.socket if running locally.
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  if (Array.isArray(fwd) && fwd.length > 0) {
    return fwd[0].split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
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

  // Sanity checks (mirror the client check, server-authoritative).
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

  // -- Rate limit --
  const clientIp = getClientIp(req);
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
      // Common case: duplicate id (essentially impossible with our id format,
      // but if it happened we'd return 500 and let the client retry).
      return res
        .status(500)
        .json({ error: "Database write failed", detail: text.slice(0, 200) });
    }

    // Only record the rate-limit timestamp AFTER a successful insert. That
    // way a failed submission (validation error, etc.) doesn't burn the
    // 4-minute window.
    submissionsByIp.set(ip_hash, now);

    // Light housekeeping: prune very old rate-limit map entries so memory
    // doesn't grow forever on warm instances.
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
