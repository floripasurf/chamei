import { Metadata } from "next";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT title, excerpt FROM blog_posts WHERE slug = ${slug} AND published = true
    `;

    if (rows.length === 0) return { title: "Artigo não encontrado | Chamei" };

    const post = rows[0];
    return {
      title: `${post.title} | Blog Chamei`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        url: `https://chamei.app/blog/${slug}`,
        siteName: "Chamei",
        locale: "pt_BR",
        type: "article",
      },
    };
  } catch {
    return { title: "Blog | Chamei" };
  }
}

const categoryLabels: Record<string, string> = {
  eletricista: "Eletricista",
  encanador: "Encanador",
  pintor: "Pintor",
  diarista: "Diarista",
  pedreiro: "Pedreiro",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const sql = getDb();

  let rows;
  try {
    rows = await sql`
      SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true
    `;
  } catch {
    notFound();
  }

  if (!rows || rows.length === 0) notFound();

  const post = rows[0];

  // Related posts: same category, excluding current, max 3
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let related: Record<string, any>[] = [];
  try {
    related = post.category_slug
      ? await sql`
          SELECT id, title, slug, excerpt, cover_image_url, category_slug, published_at
          FROM blog_posts
          WHERE published = true
            AND category_slug = ${post.category_slug}
            AND slug != ${slug}
          ORDER BY published_at DESC
          LIMIT 3
        `
      : [];
  } catch {
    // ignore
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Organization",
      name: post.author || "Chamei",
      url: "https://chamei.app",
    },
    publisher: {
      "@type": "Organization",
      name: "Chamei",
      url: "https://chamei.app",
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `https://chamei.app/blog/${slug}`,
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="max-w-3xl mx-auto px-4 pt-6 pb-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-8">
          <a href="/" className="hover:text-gray-600">
            Início
          </a>
          <span className="mx-1.5">/</span>
          <a href="/blog" className="hover:text-gray-600">
            Blog
          </a>
          <span className="mx-1.5">/</span>
          <span className="text-gray-600">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          {post.category_slug && (
            <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-3">
              {categoryLabels[post.category_slug] || post.category_slug}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
            <span>{post.author || "Chamei"}</span>
            <span>&middot;</span>
            <time>{post.published_at ? formatDate(post.published_at) : ""}</time>
          </div>
        </header>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Article content */}
        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 font-display">
            Precisa de um profissional?
          </h3>
          <p className="mt-2 text-gray-600 text-sm">
            Encontre profissionais avaliados e entre em contato pelo WhatsApp.
            Grátis.
          </p>
          <a
            href="/"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Encontrar profissional
          </a>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 font-display mb-6">
              Artigos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100">
                    {r.cover_image_url && (
                      <img
                        src={r.cover_image_url}
                        alt={r.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 font-display group-hover:text-blue-600 transition-colors leading-snug">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                      {r.excerpt}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
