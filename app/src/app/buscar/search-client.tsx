"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProfessionalCard from "@/app/components/professional-card";

interface Pro {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  google_rating: number | null;
  google_review_count: number;
  is_verified: boolean;
  photo_url: string | null;
  hours: string | null;
  category_name: string | null;
  distance_km?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const RATING_OPTIONS = [
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "4.5+", value: 4.5 },
] as const;

function FilterBar({
  ratingFilter,
  setRatingFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  activeCount,
  onClear,
}: {
  ratingFilter: number | null;
  setRatingFilter: (v: number | null) => void;
  categoryFilter: string | null;
  setCategoryFilter: (v: string | null) => void;
  categories: Category[];
  activeCount: number;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Mobile toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="sm:hidden flex items-center gap-2 text-sm text-gray-600 font-medium w-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {activeCount} filtro{activeCount > 1 ? "s" : ""} ativo{activeCount > 1 ? "s" : ""}
            </span>
          )}
          <svg
            className={`w-4 h-4 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filters - always visible on desktop, collapsible on mobile */}
        <div className={`${expanded ? "block mt-3" : "hidden"} sm:flex sm:items-center sm:gap-4`}>
          {/* Rating filter */}
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
            <span className="text-xs text-gray-500 whitespace-nowrap">Avaliação mínima:</span>
            <div className="flex gap-1">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRatingFilter(ratingFilter === opt.value ? null : opt.value)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    ratingFilter === opt.value
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mb-3 sm:mb-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">Categoria:</span>
              <select
                value={categoryFilter || ""}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active filters badge + clear */}
          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const activeFilterCount = [ratingFilter, categoryFilter].filter(Boolean).length;

  // Fetch categories for dropdown
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/professionals/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      setResults(data.professionals || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Search on initial load if there's a query param
  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery, search]);

  // Client-side filtered results
  const filteredResults = useMemo(() => {
    let filtered = results;

    if (ratingFilter) {
      filtered = filtered.filter((p) => p.google_rating !== null && p.google_rating >= ratingFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category_name === categoryFilter);
    }

    return filtered;
  }, [results, ratingFilter, categoryFilter]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
      window.history.replaceState(null, "", `/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function clearFilters() {
    setRatingFilter(null);
    setCategoryFilter(null);
  }

  return (
    <div>
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por serviço, profissional ou bairro..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      {searched && !loading && results.length > 0 && (
        <FilterBar
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          activeCount={activeFilterCount}
          onClear={clearFilters}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Buscando...</p>
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} para &quot;{initialQuery || query}&quot;
              {activeFilterCount > 0 && (
                <span className="text-blue-600 ml-1">
                  ({activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""})
                </span>
              )}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {filteredResults.map((pro) => (
                <ProfessionalCard key={pro.id} pro={pro} />
              ))}
            </div>

            {filteredResults.length === 0 && results.length > 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-900 font-medium">Nenhum resultado com esses filtros</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tente ajustar os filtros para ver mais resultados
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {filteredResults.length === 0 && results.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-900 font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Tente buscar por outro termo, como &quot;eletricista&quot; ou &quot;encanador&quot;
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !searched && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Digite o que você procura acima</p>
          </div>
        )}
      </div>
    </div>
  );
}
