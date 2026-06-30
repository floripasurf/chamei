import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;

const BASE = "https://chamei.app";
// Sitemaps allow up to 50k URLs. We currently have ~13k professionals +
// categories + blog, comfortably under the limit. Category×city URLs now live
// in the dedicated /sitemap-citycat.xml shard (≥2 pros only, no Soft-404s).
// When professionals approach ~45k (scraper growth), split into
// /sitemap/[id].xml via generateSitemaps.
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

  const staticPages = STATIC_PAGES;

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

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

  return [...staticPages, ...categoryPages, ...professionalPages, ...blogPages];
}
