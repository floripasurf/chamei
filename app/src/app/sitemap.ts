import { MetadataRoute } from "next";
import { neon } from "@neondatabase/serverless";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sql = neon(process.env.DATABASE_URL!);

  const categories = await sql`SELECT slug FROM categories ORDER BY name`;
  const professionals = await sql`SELECT slug, updated_at FROM professionals WHERE is_active = true ORDER BY updated_at DESC LIMIT 5000`;
  let blogPosts: { slug: string; updated_at: string }[] = [];
  try {
    blogPosts = await sql`SELECT slug, updated_at FROM blog_posts WHERE published = true ORDER BY published_at DESC` as { slug: string; updated_at: string }[];
  } catch {
    // Table may not exist yet
  }

  // Get all city+category combinations for landing pages
  const cityCombos = await sql`
    SELECT DISTINCT c.slug as cat_slug, p.city, p.state
    FROM professionals p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true AND p.city IS NOT NULL
    ORDER BY c.slug, p.city
  `;

  const base = "https://chamei.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/para-profissionais`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/eletricista-sp`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/buscar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${base}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // City + Category landing pages (highest SEO value)
  const citySlugify = (city: string, state: string | null) => {
    const slug = city.toLowerCase().replace(/\s+/g, "-")
      .replace(/[àáâãä]/g, "a").replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
      .replace(/[ùúûü]/g, "u").replace(/[ç]/g, "c")
      .replace(/[^a-z0-9-]/g, "");
    return state ? `${slug}-${state.toLowerCase()}` : slug;
  };

  const seen = new Set<string>();
  const cityCategoryPages: MetadataRoute.Sitemap = cityCombos
    .map((combo) => {
      const citySlug = citySlugify(combo.city, combo.state);
      const key = `${combo.cat_slug}/${citySlug}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        url: `${base}/${combo.cat_slug}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      };
    })
    .filter(Boolean) as MetadataRoute.Sitemap;

  const professionalPages: MetadataRoute.Sitemap = professionals.map((pro) => ({
    url: `${base}/profissional/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticPages, ...categoryPages, ...cityCategoryPages, ...professionalPages, ...blogPages];
}
