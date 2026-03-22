import { getDb } from "@/lib/db";
import Link from "next/link";
import LeadsTable from "./leads-table";
import ClaimsTable from "./claims-table";
import AdminGuard from "./admin-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Chamei",
  robots: "noindex, nofollow",
};

export default async function AdminPage() {
  const sql = getDb();

  const stats = await sql`
    SELECT
      (SELECT count(*) FROM professionals WHERE is_active = true) as total_pros,
      (SELECT count(*) FROM professional_leads) as total_leads,
      (SELECT count(*) FROM professional_leads WHERE status = 'new') as new_leads,
      (SELECT count(*) FROM professional_leads WHERE status = 'contacted') as contacted_leads,
      (SELECT count(*) FROM professional_leads WHERE status = 'claimed') as claimed_leads,
      (SELECT count(*) FROM reviews_imported) as total_reviews,
      (SELECT count(*) FROM categories) as total_categories
  `;
  const s = stats[0];

  const topCategories = await sql`
    SELECT c.name, count(p.id) as total
    FROM categories c
    LEFT JOIN professionals p ON p.category_id = c.id AND p.is_active = true
    GROUP BY c.id, c.name
    ORDER BY total DESC
    LIMIT 10
  `;

  const topCities = await sql`
    SELECT city, state, count(*) as total
    FROM professionals
    WHERE is_active = true AND city IS NOT NULL
    GROUP BY city, state
    ORDER BY total DESC
    LIMIT 10
  `;

  const leads = await sql`
    SELECT pl.*, c.name as category_name
    FROM professional_leads pl
    LEFT JOIN categories c ON pl.category_id = c.id
    ORDER BY pl.created_at DESC
    LIMIT 50
  `;

  const claims = await sql`
    SELECT pc.*, p.name as professional_name, p.phone as professional_phone, p.slug as professional_slug
    FROM profile_claims pc
    JOIN professionals p ON pc.professional_id = p.id
    ORDER BY pc.created_at DESC
    LIMIT 50
  `;

  const pendingClaims = claims.filter((c: any) => c.status === "pending").length;

  return (
    <AdminGuard>
    <div>
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Admin</h1>
              <p className="text-xs text-gray-400 mt-0.5">chamei.app</p>
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Profissionais", value: s.total_pros, color: "blue" },
            { label: "Leads (novos)", value: s.new_leads, color: "green" },
            { label: "Leads (total)", value: s.total_leads, color: "gray" },
            { label: "Reviews importadas", value: s.total_reviews, color: "yellow" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Top categories */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Profissionais por categoria</h2>
            <div className="space-y-2">
              {topCategories.map((cat: Record<string, string | number>) => (
                <div key={String(cat.name)} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{String(cat.name)}</span>
                  <span className="text-sm font-medium text-gray-900">{String(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top cities */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Profissionais por cidade</h2>
            <div className="space-y-2">
              {topCities.map((city: Record<string, string | number>) => (
                <div key={`${city.city}-${city.state}`} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {String(city.city || "Sem cidade")}{city.state ? `, ${city.state}` : ""}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{String(city.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Leads de profissionais ({s.total_leads})
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{s.new_leads} novos</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{s.contacted_leads} contactados</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{s.claimed_leads} reivindicados</span>
            </div>
          </div>

          <LeadsTable leads={leads as any} />
        </div>

        {/* Profile Claims */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Reivindicacoes de perfil ({claims.length})
            </h2>
            {pendingClaims > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {pendingClaims} pendentes
              </span>
            )}
          </div>

          <ClaimsTable claims={claims as any} />
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
