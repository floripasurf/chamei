import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { Professional } from "@/lib/types";
import ProfessionalCard from "@/app/components/professional-card";
import CityBrowseTracker from "./city-browse-tracker";
import FaqSection from "@/app/components/faq-section";
import { categoryCityFaq, faqNode } from "@/lib/seo-content";
import Link from "next/link";
import { parseCitySlug, citySlug } from "@/lib/seo/slug-utils";
import { getCityCategoryStats } from "@/lib/seo/city-stats";

// ISR: páginas categoria×cidade são long-tail e mudam pouco; cacheia por 24h.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}): Promise<Metadata> {
  const { category, city } = await params;
  const { cityName, stateUf } = parseCitySlug(city);

  // Slug-derived fallback label (Title Case).
  const slugLabel = category.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Prefer DB category name; fall back to slug-derived label.
  let catLabelFinal = slugLabel;
  try {
    const sql = getDb();
    const cats = await sql`SELECT name FROM categories WHERE slug = ${category} LIMIT 1`;
    catLabelFinal = cats[0]?.name || slugLabel;
  } catch {
    // catLabelFinal stays as slugLabel
  }

  const stats = await getCityCategoryStats(category, cityName, stateUf).catch(() => null);

  const year = 2026;

  if (!stats || stats.count < 2) {
    return {
      robots: { index: false, follow: true },
      title: `${catLabelFinal} em ${cityName} | Chamei`,
    };
  }

  const title = `Os melhores ${catLabelFinal} em ${cityName} (${year}) — avaliações reais | Chamei`;
  const desc = `${stats.count} ${catLabelFinal} em ${cityName}${stats.avgRating ? `, nota média ${stats.avgRating}★` : ""}. Contato direto no WhatsApp, grátis.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `https://chamei.app/${category}/${city}` },
    openGraph: { title, description: desc },
  };
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}) {
  const { category, city } = await params;

  const { cityName, stateUf } = parseCitySlug(city);
  // stateUf may be empty string — keep the original extractState logic for display
  const state = stateUf || null;

  type Cat = { id: string; name: string; slug: string };
  type ProWithReview = Professional & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    top_review?: any;
  };

  let cat: Cat | null = null;
  let pros: ProWithReview[] = [];
  let otherCities: { city: string; state: string | null; total: number }[] = [];
  let otherCategories: { name: string; slug: string; total: number }[] = [];
  let dbDown = false;

  try {
    const sql = getDb();
    const cats = await sql`SELECT * FROM categories WHERE slug = ${category} LIMIT 1`;
    cat = (cats[0] as Cat) ?? null;

    if (cat) {
      pros = (await sql`
        SELECT p.*,
          (SELECT row_to_json(r) FROM (
            SELECT author_name, text, rating FROM reviews_imported
            WHERE professional_id = p.id AND text IS NOT NULL
            ORDER BY rating DESC LIMIT 1
          ) r) as top_review
        FROM professionals p
        WHERE p.category_id = ${cat.id} AND p.is_active = true
          AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') = translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
        ORDER BY p.google_rating DESC NULLS LAST, p.google_review_count DESC NULLS LAST
        LIMIT 50
      `) as ProWithReview[];

      otherCities = (await sql`
        SELECT p.city, p.state, count(*) as total
        FROM professionals p
        WHERE p.category_id = ${cat.id} AND p.is_active = true AND p.city IS NOT NULL
          AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') != translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
        GROUP BY p.city, p.state
        ORDER BY total DESC
        LIMIT 12
      `) as typeof otherCities;

      otherCategories = (await sql`
        SELECT c.name, c.slug, count(*) as total
        FROM professionals p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true AND c.slug != ${category}
          AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') = translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
        GROUP BY c.id, c.name, c.slug
        ORDER BY total DESC
        LIMIT 10
      `) as typeof otherCategories;
    }
  } catch (err) {
    console.error("[city-cat] db failed", err);
    dbDown = true;
  }

  if (!cat) {
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

  const cityDisplay = `${cityName}${state ? `, ${state}` : ""}`;
  const faq = categoryCityFaq(cat.name, cityDisplay, pros.length);

  // Fetch city-category stats for AggregateRating JSON-LD.
  // Uses the same ISR cache window — no extra per-request load.
  const stats = await getCityCategoryStats(category, cityName, stateUf).catch(() => null);

  // Schema.org — merge AggregateRating into existing @graph when data is available.
  const graphNodes: object[] = [
    {
      "@type": "ItemList",
      name: `${cat.name} em ${cityDisplay}`,
      numberOfItems: pros.length,
      itemListElement: pros.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://chamei.app/profissional/${p.slug}`,
        name: p.name,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: "https://chamei.app" },
        { "@type": "ListItem", position: 2, name: cat.name, item: `https://chamei.app/categoria/${category}` },
        { "@type": "ListItem", position: 3, name: `${cat.name} em ${cityDisplay}`, item: `https://chamei.app/${category}/${city}` },
      ],
    },
    faqNode(faq),
  ];

  if (stats && stats.avgRating && stats.reviewCount > 0) {
    graphNodes.push({
      "@type": "AggregateRating",
      itemReviewed: { "@type": "Service", name: `${cat.name} em ${cityName}` },
      ratingValue: stats.avgRating,
      reviewCount: stats.reviewCount,
      bestRating: 5,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graphNodes,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityBrowseTracker categorySlug={category} city={cityName} resultCount={pros.length} />
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

            {/* Local stats block: shown when we have >= 2 providers */}
            {stats && stats.count >= 2 && (
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                {stats.avgRating && (
                  <p>
                    Nota média:{" "}
                    <span className="font-semibold text-gray-800">{stats.avgRating}★</span>
                    {stats.reviewCount > 0 && (
                      <span className="text-gray-400"> ({stats.reviewCount} avaliações)</span>
                    )}
                  </p>
                )}
                {stats.neighborhoods.length > 0 && (
                  <p>
                    Bairros atendidos:{" "}
                    <span className="text-gray-500">{stats.neighborhoods.join(", ")}</span>
                  </p>
                )}
              </div>
            )}

            <p className="text-gray-600 mt-4 text-sm leading-relaxed max-w-2xl">
              Precisa de {cat.name.toLowerCase()} em {cityDisplay}? No Chamei você compara
              {pros.length > 0 ? ` ${pros.length}` : ""} profissionais de {cat.name.toLowerCase()} avaliados
              em {cityDisplay} e região — veja a nota e as avaliações no Google de cada um e chame
              direto pelo WhatsApp, de graça e sem cadastro.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Listing */}
          <div className="grid gap-3 sm:grid-cols-2 mb-12">
            {pros.map((pro, i) => (
              <ProfessionalCard key={pro.id} pro={pro} topReview={pro.top_review} position={i + 1} pageType="city" />
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
                  const slug = citySlug(c.city, c.state);
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

          <FaqSection items={faq} title={`Perguntas frequentes — ${cat.name.toLowerCase()} em ${cityDisplay}`} />

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
              <Link
                href="/para-profissionais"
                className="shrink-0 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
              >
                Quero receber clientes
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
