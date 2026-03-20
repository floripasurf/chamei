"use client";

import { useState, useEffect } from "react";
import { useCity } from "./city-detector";
import ProfessionalCard from "./professional-card";

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
  category_name?: string | null;
  distance_km?: number;
}

interface CityOption {
  city: string;
  state: string | null;
  total: number;
}

export default function CityProfessionals() {
  const { city: detectedCity, state: detectedState, loading: cityLoading } = useCity();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [citiesLoaded, setCitiesLoaded] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  // Fetch available cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch("/api/cities");
        const data = await res.json();
        setCities(data.cities || []);
      } catch {}
      setCitiesLoaded(true);
    }
    loadCities();
  }, []);

  // Sync auto-detected city as default selection
  useEffect(() => {
    if (!manualOverride && detectedCity) {
      setSelectedCity(detectedCity);
      setSelectedState(detectedState || "");
    }
  }, [detectedCity, detectedState, manualOverride]);

  // Load professionals when selected city changes
  useEffect(() => {
    if (cityLoading && !manualOverride) return;

    async function load() {
      setLoading(true);
      try {
        const cityParam = selectedCity || detectedCity;
        const params = cityParam
          ? `city=${encodeURIComponent(cityParam)}&limit=8`
          : `limit=8`;
        const res = await fetch(`/api/professionals/search?${params}`);
        const data = await res.json();
        setPros(data.professionals || []);
      } catch {}
      setLoading(false);
    }

    load();
  }, [selectedCity, detectedCity, cityLoading, manualOverride]);

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "") {
      // Reset to auto-detected
      setManualOverride(false);
      setSelectedCity(detectedCity || "");
      setSelectedState(detectedState || "");
    } else {
      const match = cities.find(
        (c) => `${c.city}|${c.state}` === value
      );
      if (match) {
        setManualOverride(true);
        setSelectedCity(match.city);
        setSelectedState(match.state || "");
      }
    }
  }

  if (cityLoading && !citiesLoaded) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Detectando sua cidade...</p>
      </div>
    );
  }

  const activeCity = selectedCity || detectedCity;
  const activeState = selectedState || detectedState;
  const selectValue = activeCity ? `${activeCity}|${activeState || ""}` : "";

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-sm">📍</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeCity ? `Profissionais em ${activeCity}` : "Destaques"}
              {activeState && activeCity ? `, ${activeState}` : ""}
            </h2>
            <p className="text-xs text-gray-400">
              {manualOverride
                ? "Cidade selecionada manualmente"
                : activeCity
                  ? "Detectamos sua cidade automaticamente"
                  : "Melhores avaliados"}
            </p>
          </div>
        </div>

        {cities.length > 0 && (
          <select
            value={selectValue}
            onChange={handleCityChange}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[200px] truncate"
          >
            <option value="">
              {detectedCity ? `${detectedCity} (auto)` : "Selecionar cidade"}
            </option>
            {cities.map((c) => (
              <option key={`${c.city}|${c.state}`} value={`${c.city}|${c.state}`}>
                {c.city}{c.state ? `, ${c.state}` : ""} ({c.total})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando profissionais...</p>
        </div>
      ) : pros.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          Nenhum profissional encontrado nesta cidade.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pros.map((pro) => (
            <ProfessionalCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </section>
  );
}
