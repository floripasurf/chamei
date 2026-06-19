import Link from "next/link";
import { Metadata } from "next";
import { getDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog | Chamei - Dicas e Guias",
  description:
    "Dicas práticas para contratar profissionais de serviços no Brasil. Preços, como escolher, o que perguntar.",
  openGraph: {
    title: "Blog | Chamei - Dicas e Guias",
    description:
      "Dicas práticas para contratar profissionais de serviços no Brasil.",
    url: "https://chamei.app/blog",
    siteName: "Chamei",
    locale: "pt_BR",
    type: "website",
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const categoryLabels: Record<string, string> = {
  eletricista: "Eletricista",
  encanador: "Encanador",
  pintor: "Pintor",
  diarista: "Diarista",
  pedreiro: "Pedreiro",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts: Record<string, any>[] = [];
  try {
    const sql = getDb();
    posts = await sql`
      SELECT id, title, slug, excerpt, cover_image_url, category_slug, published_at
      FROM blog_posts
      WHERE published = true
      ORDER BY published_at DESC
    `;
  } catch {
    // DB down or table missing — show empty state
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <nav className="text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600">
            Início
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-600">Blog</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-8 pb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display tracking-tight">
          Blog Chamei
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-2xl">
          Dicas e guias para encontrar o profissional ideal
        </p>
      </section>

      {/* Posts grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            Nenhum artigo publicado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover image or gradient placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-blue-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Category tag */}
                  {post.category_slug && (
                    <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-2">
                      {categoryLabels[post.category_slug] || post.category_slug}
                    </span>
                  )}

                  <h2 className="text-lg font-semibold text-gray-900 font-display group-hover:text-blue-600 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <time className="text-xs text-gray-400">
                      {post.published_at ? formatDate(post.published_at) : ""}
                    </time>
                    <span className="text-sm text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      Ler mais &rarr;
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
