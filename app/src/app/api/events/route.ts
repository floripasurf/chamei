import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Records monetization events: visitor->professional contacts and searches.
// Called via navigator.sendBeacon / keepalive fetch from the client, so it must
// stay fast and never throw back at the user.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (body.type === "contact") {
      const professionalId = String(body.professional_id || "");
      const channel = body.channel === "phone" ? "phone" : "whatsapp";
      const source = typeof body.source === "string" ? body.source : null;

      if (!professionalId) {
        return NextResponse.json({ error: "professional_id required" }, { status: 400 });
      }

      // Resolve category/location from the professional so the row is
      // self-contained for fast grouping later.
      await sql`
        INSERT INTO contact_events
          (professional_id, category_id, channel, source, neighborhood, city)
        SELECT ${professionalId}, p.category_id, ${channel}, ${source}, p.neighborhood, p.city
        FROM professionals p
        WHERE p.id = ${professionalId}
      `;

      return NextResponse.json({ ok: true });
    }

    if (body.type === "search") {
      const source = body.source === "category_browse" ? "category_browse" : "search";
      const rawQuery = typeof body.query === "string" ? body.query.slice(0, 200) : null;
      const normalized = rawQuery ? rawQuery.trim().toLowerCase() : null;
      const categorySlug =
        typeof body.category_slug === "string" ? body.category_slug : null;
      const resultCount =
        typeof body.result_count === "number" ? body.result_count : null;

      // Resolve a category id either from an explicit slug (category browse)
      // or by best-effort matching the free-text query against category names.
      const matched = await sql`
        SELECT id, slug FROM categories
        WHERE
          (${categorySlug}::text IS NOT NULL AND slug = ${categorySlug})
          OR (${normalized}::text IS NOT NULL AND ${normalized} <> ''
              AND (lower(name) = ${normalized} OR ${normalized} LIKE '%' || lower(name) || '%'
                   OR lower(name) LIKE '%' || ${normalized} || '%'))
        ORDER BY (slug = ${categorySlug}) DESC
        LIMIT 1
      `;
      const categoryId = matched[0]?.id ?? null;
      const resolvedSlug = matched[0]?.slug ?? categorySlug;

      await sql`
        INSERT INTO search_events
          (query, normalized_query, category_id, category_slug, source, result_count)
        VALUES
          (${rawQuery}, ${normalized}, ${categoryId}, ${resolvedSlug}, ${source}, ${resultCount})
      `;

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown event type" }, { status: 400 });
  } catch (e) {
    console.error("Event tracking error:", e);
    // Swallow errors — analytics must never break UX.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
