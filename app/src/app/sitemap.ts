import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;

const BASE = "https://chamei.app";
const CHUNK = 10000; // professionals per sitemap file (well under the 50k limit)

// Refresh daily so cities the scraper adds show up without a redeploy.
export const revalidate = 86400;

async function safeQuery<T = Row>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: () => Promise<any>,
  label: string
): Promise<T[]> {
  try {
    return (await fn()) as T[];
  } catch (err) {
    console.error(`[sitemap] ${label} failed`, err);
    return [];
  }
}

// id 0 holds pages/categories/city-combos/blog; ids 1..N hold professional chunks.
export async function generateSitemaps() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await safeQuery<{ n: number }>(
    () => sql`SELECT count(*)::int n FROM professionals WHERE is_active = true`,
    "count"
  );
  const proChunks = Math.ceil((rows[0]?.n ?? 0) / CHUNK);
  return Array.from({ length: proChunks + 1 }, (_, i) => ({ id: i }));
}

function citySlugify(city: string, state: string | null) {
  const slug = city
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[àáâãä]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u").replace(/[ç]/g, "c")
    .replace(/[^a-z0-9-]/g, "");
  return state ? `${slug}-${state.toLowerCase()}` : slug;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const sql = neon(process.env.DATABASE_URL!);

  // Professional chunks.
  if (id > 0) {
    const offset = (id - 1) * CHUNK;
    const professionals = await safeQuery<{ slug: string; updated_at: string }>(
      () => sql`
        SELECT slug, updated_at FROM professionals
        WHERE is_active = true
        ORDER BY updated_at DESC
        LIMIT ${CHUNK} OFFSET ${offset}
      `,
      `professionals[${id}]`
    );
    return professionals.map((pro) => ({
      url: `${BASE}/profissional/${pro.slug}`,
      lastModified: new Date(pro.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  // id 0: everything else.
  const categories = await safeQuery<{ slug: string }>(
    () => sql`SELECT slug FROM categories ORDER BY name`,
    "categories"
  );
  const blogPosts = await safeQuery<{ slug: string; updated_at: string }>(
    () => sql`SELECT slug, updated_at FROM blog_posts WHERE published = true ORDER BY published_at DESC`,
    "blog_posts"
  );
  const cityCombos = await safeQuery<{ cat_slug: string; city: string; state: string | null }>(
    () => sql`
      SELECT DISTINCT c.slug as cat_slug, p.city, p.state
      FROM professionals p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.city IS NOT NULL
      ORDER BY c.slug, p.city
    `,
    "city_combos"
  );

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/para-profissionais`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/buscar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const seen = new Set<string>();
  const cityCategoryPages: MetadataRoute.Sitemap = cityCombos
    .map((combo) => {
      const citySlug = citySlugify(combo.city, combo.state);
      const key = `${combo.cat_slug}/${citySlug}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        url: `${BASE}/${combo.cat_slug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      };
    })
    .filter(Boolean) as MetadataRoute.Sitemap;

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...cityCategoryPages, ...blogPages];
}
