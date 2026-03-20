import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { Professional } from "@/lib/types";
import ProfessionalCard from "@/app/components/professional-card";
import Link from "next/link";

function formatCityName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractState(citySlug: string): string | null {
  // Last 2 chars if they look like a state code (after last dash)
  const parts = citySlug.split("-");
  const last = parts[parts.length - 1];
  if (last.length === 2 && last === last.toLowerCase()) {
    return last.toUpperCase();
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}): Promise<Metadata> {
  const { category, city } = await params;
  const sql = getDb();

  const cats = await sql`SELECT name FROM categories WHERE slug = ${category} LIMIT 1`;
  const catName = cats[0]?.name || formatCityName(category);

  const state = extractState(city);
  const cityName = state
    ? formatCityName(city.replace(`-${state.toLowerCase()}`, ""))
    : formatCityName(city);

  const countRows = await sql`
    SELECT count(*)::int as total FROM professionals p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = ${category} AND p.is_active = true
      AND (p.city ILIKE ${`%${cityName}%`} OR p.address ILIKE ${`%${cityName}%`})
  `;
  const total = countRows[0]?.total || 0;

  const title = `${catName} em ${cityName}${state ? `, ${state}` : ""} | Chamei`;
  const description = `Encontre os melhores profissionais de ${catName.toLowerCase()} em ${cityName}. ${total} profissionais avaliados com nota no Google. Compare e chame pelo WhatsApp. Grátis.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://chamei.app/${category}/${city}`,
    },
  };
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}) {
  const { category, city } = await params;
  const sql = getDb();

  const cats = await sql`SELECT * FROM categories WHERE slug = ${category} LIMIT 1`;
  const cat = cats[0];

  if (!cat) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Categoria não encontrada</h1>
        <Link href="/" className="text-blue-600 mt-4 inline-block">Voltar ao início</Link>
      </div>
    );
  }

  const state = extractState(city);
  const cityName = state
    ? formatCityName(city.replace(`-${state.toLowerCase()}`, ""))
    : formatCityName(city);

  const pros = (await sql`
    SELECT p.*,
      (SELECT row_to_json(r) FROM (
        SELECT author_name, text, rating FROM reviews_imported
        WHERE professional_id = p.id AND text IS NOT NULL
        ORDER BY rating DESC LIMIT 1
      ) r) as top_review
    FROM professionals p
    WHERE p.category_id = ${cat.id} AND p.is_active = true
      AND (p.city ILIKE ${`%${cityName}%`} OR p.address ILIKE ${`%${cityName}%`})
    ORDER BY p.google_rating DESC NULLS LAST, p.google_review_count DESC NULLS LAST
    LIMIT 50
  `) as (Professional & { top_review?: any })[];

  // Get other cities with this category for internal linking
  const otherCities = await sql`
    SELECT p.city, p.state, count(*) as total
    FROM professionals p
    WHERE p.category_id = ${cat.id} AND p.is_active = true AND p.city IS NOT NULL
      AND p.city NOT ILIKE ${`%${cityName}%`}
    GROUP BY p.city, p.state
    ORDER BY total DESC
    LIMIT 12
  `;

  // Get other categories in this city for internal linking
  const otherCategories = await sql`
    SELECT c.name, c.slug, count(*) as total
    FROM professionals p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true AND c.slug != ${category}
      AND (p.city ILIKE ${`%${cityName}%`} OR p.address ILIKE ${`%${cityName}%`})
    GROUP BY c.id, c.name, c.slug
    ORDER BY total DESC
    LIMIT 10
  `;

  const cityDisplay = `${cityName}${state ? `, ${state}` : ""}`;

  // Schema.org
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name} em ${cityDisplay}`,
    numberOfItems: pros.length,
    itemListElement: pros.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://chamei.app/profissional/${p.slug}`,
      name: p.name,
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
              <Link href={`/categoria/${category}`} className="hover:text-gray-600">{cat.name}</Link>
              <span className="mx-1.5">/</span>
              <span className="text-gray-600">{cityDisplay}</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {cat.name} em {cityDisplay}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {pros.length} profissionais encontrados
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Listing */}
          <div className="grid gap-3 sm:grid-cols-2 mb-12">
            {pros.map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} topReview={pro.top_review} />
            ))}
          </div>

          {pros.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mb-12">
              <p className="text-gray-900 font-medium">
                Nenhum {cat.name.toLowerCase()} encontrado em {cityName} ainda
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Estamos adicionando novos profissionais todos os dias.
              </p>
              <Link href={`/categoria/${category}`} className="text-blue-600 text-sm mt-3 inline-block">
                Ver todos os {cat.name.toLowerCase()}s
              </Link>
            </div>
          )}

          {/* Other categories in this city */}
          {otherCategories.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Outros serviços em {cityName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCategories.map((c: any) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}/${city}`}
                    className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    {c.name} ({c.total})
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Same category in other cities */}
          {otherCities.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {cat.name} em outras cidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c: any) => {
                  const slug = `${c.city.toLowerCase().replace(/\s+/g, "-")}${c.state ? `-${c.state.toLowerCase()}` : ""}`;
                  return (
                    <Link
                      key={slug}
                      href={`/${category}/${slug}`}
                      className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-gray-600 hover:border-blue-200 hover:text-blue-600 transition-colors"
                    >
                      {c.city}{c.state ? `, ${c.state}` : ""} ({c.total})
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 text-white">
                <h2 className="text-xl font-bold">
                  Você é {cat.name.toLowerCase()} em {cityName}?
                </h2>
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
