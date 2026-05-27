import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { Professional } from "@/lib/types";
import ProfessionalsList from "./professionals-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const sql = getDb();
    const categories = await sql`SELECT * FROM categories WHERE slug = ${slug} LIMIT 1`;
    const category = categories[0];

    if (!category) {
      return { title: "Categoria não encontrada | Chamei" };
    }

    const countRows = await sql`
      SELECT COUNT(*)::int as total FROM professionals
      WHERE category_id = ${category.id} AND is_active = true
    `;
    const total = countRows[0]?.total ?? 0;

    const title = `${category.name} | Chamei - Profissionais avaliados`;
    const description = `Encontre os melhores profissionais de ${category.name.toLowerCase()} no Chamei. ${total} profissionais avaliados prontos para atender você.`;

    return { title, description };
  } catch (err) {
    console.error("[categoria] generateMetadata db failed", err);
    return { title: "Chamei" };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  type ProWithReview = Professional & {
    top_review?: { author_name: string | null; text: string | null; rating: number | null } | null;
  };

  type Cat = { id: string; name: string; slug: string };
  let category: Cat | null = null;
  let pros: ProWithReview[] = [];
  let dbDown = false;
  try {
    const sql = getDb();
    const categories = (await sql`SELECT * FROM categories WHERE slug = ${slug} LIMIT 1`) as Cat[];
    const first = categories[0];
    if (first) {
      category = first;
      pros = (await sql`
        SELECT p.*,
          (SELECT row_to_json(r) FROM (
            SELECT author_name, text, rating FROM reviews_imported
            WHERE professional_id = p.id AND text IS NOT NULL
            ORDER BY rating DESC LIMIT 1
          ) r) as top_review
        FROM professionals p
        WHERE p.category_id = ${first.id} AND p.is_active = true
        ORDER BY p.google_rating DESC NULLS LAST
        LIMIT 100
      `) as ProWithReview[];
    }
  } catch (err) {
    console.error("[categoria] db failed", err);
    dbDown = true;
  }

  if (!category) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {dbDown ? "Temporariamente indisponível" : "Categoria não encontrada"}
        </h1>
        {dbDown && (
          <p className="text-sm text-gray-500 mt-2">
            Estamos com instabilidade. Tente novamente em instantes.
          </p>
        )}
        <Link href="/" className="text-blue-600 mt-4 inline-block">Voltar ao início</Link>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: pros.length,
    itemListElement: pros.map((pro, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://chamei.com.br/profissional/${pro.slug}`,
      name: pro.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div>
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <nav className="text-xs text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-600">Início</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600">{category.name}</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {category.name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {pros.length} profissionais encontrados
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <ProfessionalsList professionals={pros} />

        {/* CTA */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-white">
              <h2 className="text-xl font-bold">Você é {category.name.toLowerCase()}?</h2>
              <p className="text-blue-100 mt-1 text-sm">
                Cadastre-se grátis e receba clientes pelo WhatsApp.
              </p>
            </div>
            <a
              href="/para-profissionais"
              className="shrink-0 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Quero receber clientes
            </a>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
