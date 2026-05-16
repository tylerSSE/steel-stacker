// ============================================================================
// GET /api/leaderboard/top?limit=10
// ============================================================================
// Returns the top N leaderboard entries by pounds_loaded, descending.
// Uses the SUPABASE_SERVICE_ROLE_KEY so RLS doesn't get in the way — the
// table itself is publicly readable per the RLS policy in the schema, but
// going through the service role here keeps the access pattern consistent
// with the submit endpoint.
//
// Query params:
//   limit (optional, default 10, max 100) — how many rows to return
//
// Returns:
//   200 { entries: [...] }
//   500 { error: "..." }
// ============================================================================

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  // Parse and clamp the limit. Anything outside 1-100 gets clamped, anything
  // unparseable defaults to 10.
  let limit = parseInt(req.query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  try {
    // Direct REST API call rather than the supabase-js client — keeps the
    // bundle slim and avoids a dependency. The REST endpoint mirrors the
    // SQL: order by pounds_loaded desc, limit N.
    const url = new URL(`${supabaseUrl}/rest/v1/leaderboard_entries`);
    url.searchParams.set(
      "select",
      "id,name,company,pounds_loaded,trucks_shipped,courses_cleared,created_at",
    );
    url.searchParams.set("order", "pounds_loaded.desc");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Database read failed" });
    }
    const entries = await response.json();

    // Cache for 30 seconds at the edge — leaderboard updates aren't real-time
    // critical, and this dramatically reduces Supabase reads under load.
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ entries });
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error" });
  }
}
