"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ProfessionalCard from "@/app/components/professional-card";
import { getVisitorId } from "@/lib/track";
import ImpressionTracker from "@/app/components/impression-tracker";

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

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      // The search itself logs the event server-side (reliable category from the
      // actual results); we just pass the visitor id for honest dedup.
      const res = await fetch(
        `/api/professionals/search?q=${encodeURIComponent(q)}&limit=30&vid=${encodeURIComponent(getVisitorId())}`
      );
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
      window.history.replaceState(null, "", `/buscar?q=${encodeURIComponent(query.trim())}`);
    }
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
              {results.length} resultado{results.length !== 1 ? "s" : ""} para &quot;{initialQuery || query}&quot;
            </p>

            <ImpressionTracker
              items={results.map((pro, i) => ({ professional_id: pro.id, position: i + 1 }))}
              source="search"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((pro, i) => (
                <ProfessionalCard key={pro.id} pro={pro} position={i + 1} />
              ))}
            </div>

            {results.length === 0 && (
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
