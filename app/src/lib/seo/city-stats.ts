import { neon } from "@neondatabase/serverless";

export type CityCatStats = {
  count: number;
  avgRating: number | null;
  reviewCount: number;
  neighborhoods: string[];
  topNames: string[];
};

const sql = () => neon(process.env.DATABASE_URL!);

export async function getCityCategoryStats(
  categorySlug: string,
  city: string,
  state: string
): Promise<CityCatStats | null> {
  const db = sql();
  const rows = await db`
    SELECT count(*)::int AS count,
           round(avg(p.google_rating)::numeric, 1)::float AS avg_rating,
           coalesce(sum(p.google_review_count),0)::int AS review_count,
           (array_remove(array_agg(DISTINCT p.neighborhood), NULL))[1:6] AS neighborhoods,
           (array_agg(p.name ORDER BY p.is_verified DESC, p.google_rating DESC NULLS LAST, p.google_review_count DESC))[1:3] AS top_names
    FROM professionals p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active AND c.slug = ${categorySlug}
      AND lower(p.city) = lower(${city})
      AND upper(coalesce(p.state,'')) = upper(${state})
  `;
  const r = rows[0];
  if (!r || r.count === 0) return null;
  return {
    count: r.count,
    avgRating: r.avg_rating,
    reviewCount: r.review_count,
    neighborhoods: r.neighborhoods || [],
    topNames: r.top_names || [],
  };
}

export async function getCitiesForCategory(
  categorySlug: string
): Promise<Array<{ city_key: string; city: string; state: string; count: number }>> {
  const db = sql();
  const rows = await db`
    SELECT lower(p.city) AS city_key, p.city, coalesce(p.state,'') AS state, count(*)::int AS count
    FROM professionals p JOIN categories c ON c.id = p.category_id
    WHERE p.is_active AND c.slug = ${categorySlug}
    GROUP BY lower(p.city), p.city, p.state
    HAVING count(*) >= 2
    ORDER BY count(*) DESC
  `;
  return rows as Array<{ city_key: string; city: string; state: string; count: number }>;
}
