"use client";

import { useState, useEffect, createContext, useContext } from "react";

interface CityInfo {
  city: string | null;
  state: string | null;
  loading: boolean;
}

const CityContext = createContext<CityInfo>({ city: null, state: null, loading: true });

export function useCity() {
  return useContext(CityContext);
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Privacy: never prompt for location on load. Only use a previously cached
    // city (set when the user explicitly shared their location elsewhere).
    const cached = localStorage.getItem("chamei_city");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.city && Date.now() - data.ts < 1000 * 60 * 60) {
          setCity(data.city);
          setState(data.state);
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  return (
    <CityContext.Provider value={{ city, state, loading }}>
      {children}
    </CityContext.Provider>
  );
}
