/**
 * /sitemap-citycat.xml
 *
 * Dedicated sitemap shard: one <url> per category×city combo that has ≥2
 * active professionals (enforced by getCitiesForCategory's HAVING count(*) >= 2
 * clause). Thin combos (<2 pros) are intentionally excluded to avoid Soft-404
 * signals to Google.
 *
 * Cache-Control: s-maxage=86400 so CDN/Googlebot don't hammer Neon on every
 * crawl while still refreshing daily as the scraper adds new professionals.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getCitiesForCategory } from "@/lib/seo/city-stats";
import { citySlug } from "@/lib/seo/slug-utils";

const BASE = "https://chamei.app";

type CategoryRow = { slug: string };

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return new NextResponse("<!-- sitemap unavailable: no DATABASE_URL -->", {
      status: 503,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  let categories: CategoryRow[] = [];
  try {
    categories = (await sql`SELECT slug FROM categories ORDER BY name`) as CategoryRow[];
  } catch (err) {
    console.error("[sitemap-citycat] categories query failed", err);
    return new NextResponse("<!-- sitemap unavailable: db error -->", {
      status: 503,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const seen = new Set<string>();
  const urlEntries: string[] = [];

  // Fan-out: one query per category (getCitiesForCategory is already a grouped
  // aggregation — no per-row queries, Neon-safe).
  await Promise.all(
    categories.map(async (cat) => {
      try {
        const cities = await getCitiesForCategory(cat.slug);
        for (const c of cities) {
          if (!c.city) continue;
          const slug = citySlug(c.city, c.state);
          const key = `${cat.slug}/${slug}`;
          if (seen.has(key)) continue;
          seen.add(key);
          urlEntries.push(
            `  <url><loc>${BASE}/${cat.slug}/${slug}</loc><changefreq>daily</changefreq><priority>0.85</priority></url>`
          );
        }
      } catch (err) {
        console.error(`[sitemap-citycat] getCitiesForCategory(${cat.slug}) failed`, err);
      }
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
