import Link from "next/link";

export interface CityLinkItem {
  citySlug: string;
  city: string;
  state: string;
  count: number;
}

interface CityLinksProps {
  categorySlug: string;
  categoryName: string;
  cities: CityLinkItem[];
}

/**
 * Server component: renders a grid of internal links from a category page
 * to its city-specific pages (/{categorySlug}/{citySlug}).
 * Used to create crawl paths to the ~9k category×city money-pages.
 */
export default function CityLinks({ categorySlug, categoryName, cities }: CityLinksProps) {
  if (cities.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Encontre {categoryName.toLowerCase()} na sua cidade
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {cities.length} cidades com profissionais disponíveis
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {cities.map((c) => (
          <Link
            key={`${c.city}-${c.state}`}
            href={`/${categorySlug}/${c.citySlug}`}
            className="px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-colors leading-snug"
          >
            <span className="font-medium">{c.city}</span>
            {c.state ? <span className="text-gray-400">, {c.state}</span> : null}
            <span className="block text-gray-400 mt-0.5">{c.count} profissionais</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
