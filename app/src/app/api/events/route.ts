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

  // Flood protection for ALL event types. The threshold is generous so heavy
  // real browsing (many impressions) passes, but a bot firing hundreds/min is
  // throttled — protecting funnel/ranking integrity. Impressions/profile_views
  // lack ip_hash, so they're counted by visitor_id.
  if (visitorId || ctx.ipHash) {
    try {
      const r = await sql`
        SELECT
          (SELECT count(*) FROM contact_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash}))
        + (SELECT count(*) FROM search_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash}))
        + (SELECT count(*) FROM impression_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash}))
        + (SELECT count(*) FROM profile_view_events
             WHERE created_at > now() - interval '1 minute'
               AND (visitor_id = ${visitorId} OR ip_hash = ${ctx.ipHash})) AS n
      `;
      if (Number(r[0]?.n ?? 0) >= 250) {
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
      const utmSource = typeof body.utm_source === "string" ? body.utm_source.slice(0, 80) : null;
      const utmMedium = typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 80) : null;
      const utmCampaign = typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 120) : null;

      if (!professionalId) {
        return NextResponse.json({ error: "professional_id required" }, { status: 400 });
      }

      // Category/location come from the professional so the row is self-contained.
      await sql`
        INSERT INTO contact_events
          (professional_id, category_id, channel, source, neighborhood, city,
           visitor_id, result_position, pathname, referrer, ua_hash, ip_hash,
           utm_source, utm_medium, utm_campaign)
        SELECT ${professionalId}, p.category_id, ${channel}, ${source}, p.neighborhood, p.city,
               ${visitorId}, ${position}, ${pathname}, ${ctx.referrer}, ${ctx.uaHash}, ${ctx.ipHash},
               ${utmSource}, ${utmMedium}, ${utmCampaign}
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
      const city = typeof body.city === "string" ? body.city.slice(0, 100) : null;

      const matched = categorySlug
        ? await sql`SELECT id, slug FROM categories WHERE slug = ${categorySlug} LIMIT 1`
        : [];
      const categoryId = matched[0]?.id ?? null;
      const resolvedSlug = matched[0]?.slug ?? categorySlug;

      await sql`
        INSERT INTO search_events
          (query, normalized_query, category_id, category_slug, source, result_count,
           city, visitor_id, pathname, ua_hash, ip_hash)
        VALUES
          (NULL, NULL, ${categoryId}, ${resolvedSlug}, 'category_browse', ${resultCount},
           ${city}, ${visitorId}, ${pathname}, ${ctx.uaHash}, ${ctx.ipHash})
      `;

      return NextResponse.json({ ok: true });
    }

    if (body.type === "impression") {
      // Batched (cards that actually entered the viewport). category_id is
      // resolved server-side from the professional; page_type is per item.
      const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
      const ids: string[] = [];
      const positions: number[] = [];
      const pageTypes: string[] = [];
      for (const it of items) {
        const pid = it && typeof it.professional_id === "string" ? it.professional_id : null;
        if (!pid) continue;
        ids.push(pid);
        positions.push(typeof it.position === "number" ? it.position : 0);
        pageTypes.push(typeof it.page_type === "string" ? it.page_type.slice(0, 20) : "");
      }
      if (ids.length) {
        // Dedup by visitor_id OR ip_hash (so dedup still works when visitor_id is
        // absent): don't re-record the same professional+page_type within 30min.
        const dedupKey = visitorId ?? ctx.ipHash;
        await sql`
          INSERT INTO impression_events
            (professional_id, category_id, position, source, page_type, visitor_id, pathname, ua_hash, ip_hash)
          SELECT t.pid, p.category_id, t.pos, t.pt, t.pt, ${visitorId}, ${pathname}, ${ctx.uaHash}, ${ctx.ipHash}
          FROM unnest(${ids}::uuid[], ${positions}::int[], ${pageTypes}::text[]) AS t(pid, pos, pt)
          JOIN professionals p ON p.id = t.pid
          WHERE ${dedupKey}::text IS NULL OR NOT EXISTS (
            SELECT 1 FROM impression_events ie
            WHERE ie.professional_id = t.pid AND ie.page_type = t.pt
              AND (ie.visitor_id = ${visitorId} OR ie.ip_hash = ${ctx.ipHash})
              AND ie.created_at > now() - interval '30 minutes'
          )
        `;
      }
      return NextResponse.json({ ok: true });
    }

    if (body.type === "profile_view") {
      const professionalId = String(body.professional_id || "");
      if (!professionalId) {
        return NextResponse.json({ error: "professional_id required" }, { status: 400 });
      }
      // Dedup repeat views of the same profile by the same visitor/ip within 30min.
      const dedupKey = visitorId ?? ctx.ipHash;
      await sql`
        INSERT INTO profile_view_events (professional_id, visitor_id, pathname, referrer, ua_hash, ip_hash)
        SELECT ${professionalId}, ${visitorId}, ${pathname}, ${ctx.referrer}, ${ctx.uaHash}, ${ctx.ipHash}
        WHERE ${dedupKey}::text IS NULL OR NOT EXISTS (
          SELECT 1 FROM profile_view_events v
          WHERE v.professional_id = ${professionalId}
            AND (v.visitor_id = ${visitorId} OR v.ip_hash = ${ctx.ipHash})
            AND v.created_at > now() - interval '30 minutes'
        )
      `;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown event type" }, { status: 400 });
  } catch (e) {
    console.error("Event tracking error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
