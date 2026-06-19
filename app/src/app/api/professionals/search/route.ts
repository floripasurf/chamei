import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requestContext } from "@/lib/event-context";

type SearchRow = { category_id: string | null; category_slug: string | null; city?: string | null };

// Log a free-text search with the category derived from the ACTUAL results
// (the dominant category among hits) — not a fragile guess on the query string.
async function logSearch(request: NextRequest, q: string, results: SearchRow[]) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const counts = new Map<string, { id: string; slug: string | null; n: number }>();
    for (const r of results) {
      if (!r.category_id) continue;
      const c = counts.get(r.category_id) || { id: r.category_id, slug: r.category_slug, n: 0 };
      c.n++;
      counts.set(r.category_id, c);
    }
    const dominant = [...counts.values()].sort((a, b) => b.n - a.n)[0] || null;
    const vid = new URL(request.url).searchParams.get("vid");
    const ctx = await requestContext(request);
    let pathname: string | null = null;
    try {
      pathname = ctx.referrer ? new URL(ctx.referrer).pathname : null;
    } catch {}
    const normalized = q.trim().toLowerCase().slice(0, 200);
    // Dedup: skip an identical search from the same visitor within 60s (re-renders,
    // double submits) so search counts stay honest.
    if (vid) {
      const dup = await sql`
        SELECT 1 FROM search_events
        WHERE visitor_id = ${vid} AND normalized_query = ${normalized}
          AND created_at > now() - interval '60 seconds'
        LIMIT 1
      `;
      if (dup.length) return;
    }
    await sql`
      INSERT INTO search_events
        (query, normalized_query, category_id, category_slug, source, result_count,
         visitor_id, pathname, ua_hash, ip_hash)
      VALUES
        (${q.slice(0, 200)}, ${normalized},
         ${dominant?.id ?? null}, ${dominant?.slug ?? null}, 'search', ${results.length},
         ${vid}, ${pathname}, ${ctx.uaHash}, ${ctx.ipHash})
    `;
  } catch {
    // analytics must never break search
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  // Cap the limit so a request can't force an unbounded heavy query.
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30") || 30, 1), 50);

  const sql = neon(process.env.DATABASE_URL!);

  // If we have a query, search by name/category
  if (q) {
    const searchTerm = `%${q}%`;
    const results = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM professionals p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND (
          p.name ILIKE ${searchTerm}
          OR c.name ILIKE ${searchTerm}
          OR p.address ILIKE ${searchTerm}
          OR p.neighborhood ILIKE ${searchTerm}
          OR p.city ILIKE ${searchTerm}
        )
      ORDER BY p.google_rating DESC NULLS LAST
      LIMIT ${limit}
    `;
    await logSearch(request, q, results as SearchRow[]);
    return NextResponse.json({ professionals: results, total: results.length });
  }

  // If we have coordinates, return nearby
  if (!isNaN(lat) && !isNaN(lng)) {
    const results = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(p.latitude))
        )) AS distance_km
      FROM professionals p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT ${limit}
    `;
    return NextResponse.json({ professionals: results, total: results.length });
  }

  // If we have city name, filter by city
  if (city) {
    const cityTerm = `%${city}%`;
    const results = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM professionals p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND (p.city ILIKE ${cityTerm} OR p.address ILIKE ${cityTerm} OR p.state ILIKE ${cityTerm})
      ORDER BY p.google_rating DESC NULLS LAST
      LIMIT ${limit}
    `;
    return NextResponse.json({ professionals: results, total: results.length });
  }

  // Default: top rated
  const results = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM professionals p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.google_rating DESC NULLS LAST
    LIMIT ${limit}
  `;
  return NextResponse.json({ professionals: results, total: results.length });
}
