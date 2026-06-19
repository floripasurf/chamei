import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;

const BASE = "https://chamei.app";
// Sitemaps allow up to 50k URLs. We currently have ~13k professionals + ~2.5k
// category×city pages + categories + blog, comfortably under the limit, so a
// single sitemap is the reliable choice. When professionals approach ~45k
// (scraper growth), split into /sitemap/[id].xml via generateSitemaps.
const PRO_LIMIT = 45000;

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

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  { url: `${BASE}/para-profissionais`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE}/buscar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Build/CI without a DB: emit a minimal static sitemap instead of crashing.
  if (!process.env.DATABASE_URL) return STATIC_PAGES;
  const sql = neon(process.env.DATABASE_URL);

  const categories = await safeQuery<{ slug: string }>(
    () => sql`SELECT slug FROM categories ORDER BY name`,
    "categories"
  );
  const professionals = await safeQuery<{ slug: string; updated_at: string }>(
    () => sql`
      SELECT slug, updated_at FROM professionals
      WHERE is_active = true ORDER BY updated_at DESC LIMIT ${PRO_LIMIT}
    `,
    "professionals"
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
        AND p.city !~ '^[0-9]+$'   -- skip junk numeric cities (legacy scraper DDD codes)
      ORDER BY c.slug, p.city
    `,
    "city_combos"
  );

  const staticPages = STATIC_PAGES;

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

  const professionalPages: MetadataRoute.Sitemap = professionals.map((pro) => ({
    url: `${BASE}/profissional/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...cityCategoryPages, ...professionalPages, ...blogPages];
}
