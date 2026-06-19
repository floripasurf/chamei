import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requestContext } from "@/lib/event-context";

// Records monetization events: visitor->professional contacts and category
// browses. Free-text searches are logged inside /api/professionals/search
// instead (the category is taken from the actual results, not guessed).
// Called via navigator.sendBeacon / keepalive fetch, so it must stay fast and
// never throw back at the user.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const ctx = await requestContext(request);
  const visitorId = typeof body.visitor_id === "string" ? body.visitor_id.slice(0, 64) : null;
  const pathname = typeof body.pathname === "string" ? body.pathname.slice(0, 200) : null;

  // Flood protection: cap events from the same visitor/IP across both tables in
  // a short window so a bot can't inflate clicks/searches for billing/ranking.
  if (visitorId || ctx.ipHash) {
    try {
      const r = await sql`
        SELECT
          (SELECT count(*) FROM contact_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash}))
        + (SELECT count(*) FROM search_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash})) AS n
      `;
      if (Number(r[0]?.n ?? 0) >= 30) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    } catch {
      // never block the user on the rate-limit check itself
    }
  }

  try {
    if (body.type === "contact") {
      const professionalId = String(body.professional_id || "");
      const channel = body.channel === "phone" ? "phone" : "whatsapp";
      const source = typeof body.source === "string" ? body.source : null;
      const position =
        typeof body.result_position === "number" ? body.result_position : null;

      if (!professionalId) {
        return NextResponse.json({ error: "professional_id required" }, { status: 400 });
      }

      // Category/location come from the professional so the row is self-contained.
      await sql`
        INSERT INTO contact_events
          (professional_id, category_id, channel, source, neighborhood, city,
           visitor_id, result_position, pathname, referrer, ua_hash, ip_hash)
        SELECT ${professionalId}, p.category_id, ${channel}, ${source}, p.neighborhood, p.city,
               ${visitorId}, ${position}, ${pathname}, ${ctx.referrer}, ${ctx.uaHash}, ${ctx.ipHash}
        FROM professionals p
        WHERE p.id = ${professionalId}
      `;

      return NextResponse.json({ ok: true });
    }

    if (body.type === "search") {
      // Only category browses reach here now (explicit slug — no guessing).
      const categorySlug =
        typeof body.category_slug === "string" ? body.category_slug : null;
      const resultCount =
        typeof body.result_count === "number" ? body.result_count : null;

      const matched = categorySlug
        ? await sql`SELECT id, slug FROM categories WHERE slug = ${categorySlug} LIMIT 1`
        : [];
      const categoryId = matched[0]?.id ?? null;
      const resolvedSlug = matched[0]?.slug ?? categorySlug;

      await sql`
        INSERT INTO search_events
          (query, normalized_query, category_id, category_slug, source, result_count,
           visitor_id, pathname, ua_hash, ip_hash)
        VALUES
          (NULL, NULL, ${categoryId}, ${resolvedSlug}, 'category_browse', ${resultCount},
           ${visitorId}, ${pathname}, ${ctx.uaHash}, ${ctx.ipHash})
      `;

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown event type" }, { status: 400 });
  } catch (e) {
    console.error("Event tracking error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
