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
    // Check localStorage first
    const cached = localStorage.getItem("chamei_city");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.city && Date.now() - data.ts < 1000 * 60 * 60) {
          // Cache valid for 1 hour
          setCity(data.city);
          setState(data.state);
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/location?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (data.city) {
            setCity(data.city);
            setState(data.state);
            localStorage.setItem(
              "chamei_city",
              JSON.stringify({ city: data.city, state: data.state, ts: Date.now() })
            );
          }
        } catch {}
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return (
    <CityContext.Provider value={{ city, state, loading }}>
      {children}
    </CityContext.Provider>
  );
}
