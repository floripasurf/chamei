"use client";

import { useState, useEffect } from "react";
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
  latitude: number | null;
  longitude: number | null;
  distance_km?: number;
  top_review?: { author_name: string | null; text: string | null; rating: number | null } | null;
}

type SortMode = "rating" | "reviews" | "nearby";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ProfessionalsList({ professionals }: { professionals: Pro[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("rating");
  const [sorted, setSorted] = useState<Pro[]>(professionals);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Sort by rating on initial load
  useEffect(() => {
    setSorted(sortByRating(professionals));
  }, [professionals]);

  function sortByRating(list: Pro[]) {
    return [...list].sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0));
  }

  function sortByReviews(list: Pro[]) {
    return [...list].sort((a, b) => (b.google_review_count || 0) - (a.google_review_count || 0));
  }

  function sortByDistance(list: Pro[], lat: number, lng: number) {
    return [...list]
      .map((p) => ({
        ...p,
        distance_km:
          p.latitude && p.longitude
            ? haversine(lat, lng, p.latitude, p.longitude)
            : 9999,
      }))
      .sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
  }

  function handleSort(mode: SortMode) {
    setSortMode(mode);

    if (mode === "rating") {
      setSorted(sortByRating(professionals));
    } else if (mode === "reviews") {
      setSorted(sortByReviews(professionals));
    } else if (mode === "nearby") {
      if (userLoc) {
        setSorted(sortByDistance(professionals, userLoc.lat, userLoc.lng));
      } else {
        setGeoStatus("loading");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLoc(loc);
            setGeoStatus("done");
            setSorted(sortByDistance(professionals, loc.lat, loc.lng));
          },
          () => {
            setGeoStatus("denied");
            setSortMode("rating");
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    }
  }

  return (
    <div>
      {/* Sort buttons */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-gray-400 mr-1">Ordenar:</span>
        {[
          { mode: "rating" as SortMode, label: "Melhor avaliados" },
          { mode: "reviews" as SortMode, label: "Mais avaliações" },
          { mode: "nearby" as SortMode, label: "📍 Mais perto" },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => handleSort(mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sortMode === mode
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            {mode === "nearby" && geoStatus === "loading" ? "Localizando..." : label}
          </button>
        ))}
      </div>

      {geoStatus === "denied" && (
        <p className="text-xs text-red-500 mb-4">
          Não foi possível acessar sua localização. Permita o acesso e tente novamente.
        </p>
      )}

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((pro) => (
          <ProfessionalCard key={pro.id} pro={pro} topReview={pro.top_review} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500">Nenhum profissional encontrado nesta categoria ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Estamos adicionando novos profissionais todos os dias.</p>
        </div>
      )}
    </div>
  );
}
