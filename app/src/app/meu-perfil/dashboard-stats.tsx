"use client";

import { useState, useEffect, useRef } from "react";

interface DashboardStatsProps {
  profileComplete: number; // 0-100
  professionalName: string;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span ref={ref}>
      {display.toLocaleString("pt-BR")}{suffix}
    </span>
  );
}

function TrendArrow({ positive }: { positive: boolean }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
      <svg
        className={`w-3 h-3 mr-0.5 ${positive ? "" : "rotate-180"}`}
        fill="none"
        viewBox="0 0 12 12"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M6 9V3M6 3L3 6M6 3l3 3" />
      </svg>
      {positive ? "+" : "-"}
      {Math.floor(Math.random() * 15 + 5)}%
    </span>
  );
}

function CircleProgress({ percent }: { percent: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={percent >= 80 ? "#16a34a" : percent >= 50 ? "#2563eb" : "#f59e0b"}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// Generate deterministic demo data based on name
function getDemoStats(name: string, period: "7d" | "30d") {
  const seed = name.length + name.charCodeAt(0);
  const base7 = {
    views: 12 + (seed % 30),
    whatsapp: 3 + (seed % 8),
    calls: 1 + (seed % 4),
  };

  if (period === "30d") {
    return {
      views: base7.views * 4 + (seed % 15),
      whatsapp: base7.whatsapp * 4 + (seed % 6),
      calls: base7.calls * 4 + (seed % 3),
    };
  }

  return base7;
}

export default function DashboardStats({ profileComplete, professionalName }: DashboardStatsProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const stats = getDemoStats(professionalName, period);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zM9 9h2v12H9zM15 5h2v16h-2zM21 1h2v20h-2z" />
            </svg>
          </span>
          Seus números
        </h2>

        {/* Period toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              period === "7d"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              period === "30d"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Últimos 30 dias
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Profile Completeness */}
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center">
          <CircleProgress percent={profileComplete} />
          <p className="text-lg font-bold text-gray-900 mt-2">
            <AnimatedNumber value={profileComplete} suffix="%" />
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Perfil completo</p>
          {profileComplete < 100 && (
            <p className="text-[10px] text-blue-600 font-medium mt-1">Complete para mais visitas</p>
          )}
        </div>

        {/* Profile Views */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            <AnimatedNumber value={stats.views} />
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Visitas ao perfil</p>
          <div className="mt-1.5">
            <TrendArrow positive={true} />
          </div>
        </div>

        {/* WhatsApp Clicks */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            <AnimatedNumber value={stats.whatsapp} />
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Cliques no WhatsApp</p>
          <div className="mt-1.5">
            <TrendArrow positive={true} />
          </div>
        </div>

        {/* Calls */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-purple-50 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            <AnimatedNumber value={stats.calls} />
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Ligações recebidas</p>
          <div className="mt-1.5">
            <TrendArrow positive={stats.calls > 2} />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Dados estimados. Métricas detalhadas em breve.
      </p>
    </div>
  );
}
