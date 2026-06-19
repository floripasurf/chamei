"use client";

import { useState } from "react";
import ProfessionalCard from "./professional-card";

interface ProfessionalWithDistance {
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
  distance_km: number;
}

export default function NearbyProfessionals() {
  const [pros, setPros] = useState<ProfessionalWithDistance[]>([]);
  const [status, setStatus] = useState<"idle" | "asking" | "loading" | "done" | "denied">("idle");

  // Geolocation is requested ONLY on explicit user action (privacy: no prompt on load).
  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStatus("loading");
        fetch(`/api/professionals/nearby?lat=${latitude}&lng=${longitude}&radius=15&limit=20`)
          .then((res) => res.json())
          .then((data) => {
            setPros(data.professionals || []);
            setStatus("done");
          })
          .catch(() => setStatus("denied"));
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  if (status === "idle" || status === "asking") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center">
        <div className="text-2xl mb-2">📍</div>
        <p className="text-blue-900 font-medium">
          Quer ver os profissionais mais perto de você?
        </p>
        <button
          onClick={requestLocation}
          disabled={status === "asking"}
          className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {status === "asking" ? "Buscando localização..." : "Usar minha localização"}
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Buscando eletricistas perto de você...</p>
      </div>
    );
  }

  if (status === "denied" || pros.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-sm">📍</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Perto de você</h2>
          <p className="text-xs text-gray-500">Ordenados por distância</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {pros.map((pro, i) => (
          <ProfessionalCard key={pro.id} pro={pro} position={i + 1} pageType="nearby" />
        ))}
      </div>
    </div>
  );
}
