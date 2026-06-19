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

export const dynamic = "force-dynamic";

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

  // Monetization insights (event tracking — migration 002).
  // Guarded so the panel still renders if the migration hasn't run yet.
  type ContactedPro = {
    professional_name: string;
    professional_slug: string;
    category_name: string | null;
    city: string | null;
    total_contacts: number;
    whatsapp_contacts: number;
    phone_contacts: number;
    contacts_30d: number;
    last_contact_at: string | null;
  };
  type SearchedCategory = {
    category_name: string;
    total_searches: number;
    text_searches: number;
    category_browses: number;
    searches_30d: number;
  };
  type UnmatchedTerm = { normalized_query: string; searches: number };

  let contactedPros: ContactedPro[] = [];
  let searchedCategories: SearchedCategory[] = [];
  let unmatchedTerms: UnmatchedTerm[] = [];
  let totalContacts = 0;
  let totalSearches = 0;
  let eventsReady = true;

  try {
    contactedPros = (await sql`
      SELECT professional_name, professional_slug, category_name, city,
             total_contacts, whatsapp_contacts, phone_contacts, contacts_30d, last_contact_at
      FROM professional_contact_stats
      LIMIT 20
    `) as unknown as ContactedPro[];

    searchedCategories = (await sql`
      SELECT category_name, total_searches, text_searches, category_browses, searches_30d
      FROM category_search_stats
      LIMIT 20
    `) as unknown as SearchedCategory[];

    unmatchedTerms = (await sql`
      SELECT normalized_query, searches FROM top_unmatched_search_terms LIMIT 10
    `) as unknown as UnmatchedTerm[];

    const totals = await sql`
      SELECT
        (SELECT count(*) FROM contact_events) as contacts,
        (SELECT count(*) FROM search_events) as searches
    `;
    totalContacts = Number(totals[0]?.contacts ?? 0);
    totalSearches = Number(totals[0]?.searches ?? 0);
  } catch {
    // Tables/views from migration 002 not present yet.
    eventsReady = false;
  }

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

        {/* Monetization insights */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">📊 Insights de monetização</h2>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {totalContacts} mensagens
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {totalSearches} buscas
              </span>
            </div>
          </div>

          {!eventsReady ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              O rastreamento de eventos ainda não foi ativado. Aplique a migration{" "}
              <code className="font-mono">002_event_tracking.sql</code> no banco para começar a
              coletar mensagens e buscas.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Professionals that received messages */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Prestadores que mais receberam mensagens
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Quem recebe contato é candidato a plano pago / destaque.
                </p>
                {contactedPros.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Nenhuma mensagem registrada ainda.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                      <span className="flex-1">Prestador</span>
                      <span className="w-12 text-right">30d</span>
                      <span className="w-14 text-right">Total</span>
                    </div>
                    {contactedPros.map((p) => (
                      <Link
                        key={p.professional_slug}
                        href={`/profissional/${p.professional_slug}`}
                        className="flex items-center py-1.5 hover:bg-gray-50 rounded-md px-1 -mx-1"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-gray-700 truncate">{p.professional_name}</span>
                          <span className="block text-xs text-gray-400 truncate">
                            {p.category_name || "—"}{p.city ? ` · ${p.city}` : ""}
                          </span>
                        </span>
                        <span className="w-12 text-right text-sm text-gray-500">{p.contacts_30d}</span>
                        <span className="w-14 text-right text-sm font-semibold text-gray-900">
                          {p.total_contacts}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Most searched categories */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Categorias mais buscadas
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Demanda real dos visitantes (busca em texto + navegação por categoria).
                </p>
                {searchedCategories.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Nenhuma busca registrada ainda.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                      <span className="flex-1">Categoria</span>
                      <span className="w-16 text-right">Busca/Nav</span>
                      <span className="w-14 text-right">Total</span>
                    </div>
                    {searchedCategories.map((c) => (
                      <div key={c.category_name} className="flex items-center py-1.5 px-1">
                        <span className="flex-1 text-sm text-gray-700 truncate">{c.category_name}</span>
                        <span className="w-16 text-right text-xs text-gray-400">
                          {c.text_searches}/{c.category_browses}
                        </span>
                        <span className="w-14 text-right text-sm font-semibold text-gray-900">
                          {c.total_searches}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {unmatchedTerms.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Buscas sem categoria (oportunidades de novas categorias)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unmatchedTerms.map((t) => (
                        <span
                          key={t.normalized_query}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {t.normalized_query} <span className="text-gray-400">×{t.searches}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
