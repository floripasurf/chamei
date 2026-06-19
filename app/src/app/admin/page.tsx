import { getDb } from "@/lib/db";
import Link from "next/link";
import LeadsTable from "./leads-table";
import ClaimsTable from "./claims-table";
import AdminLogin from "./admin-login";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminValue } from "@/lib/admin-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Chamei",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Server-side gate: never run queries or emit data unless authenticated.
  const authed = await isValidAdminValue((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!authed) return <AdminLogin />;

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

  // Monetization insights (event tracking — migrations 002/003/004).
  // Guarded so the panel still renders if the migrations haven't run yet.
  type ContactedPro = {
    professional_name: string;
    professional_slug: string;
    category_name: string | null;
    city: string | null;
    raw_clicks: number;
    deduped_contacts: number;
    deduped_30d: number;
    unique_visitors: number;
    avg_position: number | null;
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
  type Metrics = {
    raw_clicks: number;
    deduped_contacts: number;
    deduped_30d: number;
    unique_contact_visitors: number;
    searches: number;
    unique_search_visitors: number;
    contact_rate: number | null;
  };

  type Funnel = {
    impressions: number;
    profile_views: number;
    contacts: number;
    impression_to_view: number | null;
    view_to_contact: number | null;
  };

  type PositionRow = { position: number; impressions: number; contacts: number; contact_rate: number | null };
  type DemandSupplyRow = {
    category_name: string;
    searches: number;
    active_pros: number;
    demand_per_pro: number | null;
    avg_rating: number | null;
  };
  type DemandSupplyCityRow = {
    category_name: string;
    city: string;
    searches: number;
    active_pros: number;
    demand_per_pro: number | null;
  };
  type QualitySummary = {
    avg_score: number | null;
    no_phone: number;
    no_photo: number;
    no_reviews: number;
    total: number;
  };

  let contactedPros: ContactedPro[] = [];
  let searchedCategories: SearchedCategory[] = [];
  let unmatchedTerms: UnmatchedTerm[] = [];
  let metrics: Metrics | null = null;
  let funnel: Funnel | null = null;
  let byPosition: PositionRow[] = [];
  let demandSupply: DemandSupplyRow[] = [];
  let demandSupplyCity: DemandSupplyCityRow[] = [];
  let qualitySummary: QualitySummary | null = null;
  type UtmRow = { source: string; medium: string | null; contacts: number; unique_visitors: number };
  let utmStats: UtmRow[] = [];
  let eventsReady = true;

  try {
    contactedPros = (await sql`
      SELECT professional_name, professional_slug, category_name, city,
             raw_clicks, deduped_contacts, deduped_30d, unique_visitors,
             avg_position, last_contact_at
      FROM professional_lead_stats
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

    metrics = (await sql`SELECT * FROM event_metrics`)[0] as unknown as Metrics;
    funnel = (await sql`SELECT * FROM funnel_metrics`)[0] as unknown as Funnel;

    byPosition = (await sql`
      SELECT position, impressions, contacts, contact_rate
      FROM conversion_by_position LIMIT 10
    `) as unknown as PositionRow[];

    demandSupplyCity = (await sql`
      SELECT category_name, city, searches, active_pros, demand_per_pro
      FROM demand_supply_city LIMIT 12
    `) as unknown as DemandSupplyCityRow[];

    utmStats = (await sql`
      SELECT source, medium, contacts, unique_visitors FROM utm_stats LIMIT 10
    `) as unknown as UtmRow[];

    demandSupply = (await sql`
      SELECT category_name, searches, active_pros, demand_per_pro, avg_rating
      FROM demand_supply_map WHERE searches > 0 LIMIT 10
    `) as unknown as DemandSupplyRow[];

    qualitySummary = (await sql`
      SELECT
        ROUND(AVG(quality_score), 1) avg_score,
        count(*) FILTER (WHERE NOT has_phone) no_phone,
        count(*) FILTER (WHERE NOT has_photo) no_photo,
        count(*) FILTER (WHERE NOT has_reviews) no_reviews,
        count(*) total
      FROM professional_quality
    `)[0] as unknown as QualitySummary;
  } catch {
    // Views from migrations 002–006 not present yet.
    eventsReady = false;
  }

  return (
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
          </div>

          {eventsReady && metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {[
                { label: "Cliques (raw)", value: metrics.raw_clicks, hint: "todos os cliques" },
                { label: "Contatos (dedup)", value: metrics.deduped_contacts, hint: "1/prestador/canal/visitante por 12h" },
                { label: "Leads 30d", value: metrics.deduped_30d, hint: "contatos deduplicados, 30 dias" },
                { label: "Visitantes únicos", value: metrics.unique_contact_visitors, hint: "que contataram" },
                { label: "Taxa de contato", value: metrics.contact_rate ?? "—", hint: "contatos ÷ visitantes que buscaram" },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-3" title={m.hint}>
                  <p className="text-[11px] text-gray-400">{m.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{String(m.value)}</p>
                </div>
              ))}
            </div>
          )}

          {eventsReady && funnel && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Funil de conversão</p>
              <div className="flex items-center gap-2 text-center">
                {[
                  { label: "Impressões", value: funnel.impressions },
                  { label: "Visitas ao perfil", value: funnel.profile_views, rate: funnel.impression_to_view },
                  { label: "Contatos", value: funnel.contacts, rate: funnel.view_to_contact },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2 flex-1">
                    {i > 0 && (
                      <div className="text-[11px] text-gray-400 whitespace-nowrap">
                        →{" "}
                        {s.rate != null
                          ? `${(s.rate * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                    )}
                    <div className="flex-1 bg-gray-50 rounded-lg py-2">
                      <p className="text-lg font-bold text-gray-900">{String(s.value)}</p>
                      <p className="text-[11px] text-gray-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventsReady && (byPosition.length > 0 || demandSupply.length > 0 || qualitySummary) && (
            <div className="grid lg:grid-cols-3 gap-6 mb-4">
              {/* Conversion by position */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Conversão por posição</h3>
                <p className="text-xs text-gray-400 mb-3">Prova do valor do ranking.</p>
                {byPosition.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Sem dados ainda.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                      <span className="w-10">Pos</span>
                      <span className="flex-1 text-right">Impr</span>
                      <span className="flex-1 text-right">Contatos</span>
                      <span className="flex-1 text-right">Taxa</span>
                    </div>
                    {byPosition.map((r) => (
                      <div key={r.position} className="flex items-center text-sm py-0.5">
                        <span className="w-10 text-gray-700">{r.position}º</span>
                        <span className="flex-1 text-right text-gray-500">{r.impressions}</span>
                        <span className="flex-1 text-right text-gray-500">{r.contacts}</span>
                        <span className="flex-1 text-right font-medium text-gray-900">
                          {r.contact_rate != null ? `${(r.contact_rate * 100).toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Demand × supply */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Demanda × oferta</h3>
                <p className="text-xs text-gray-400 mb-3">Mais buscas por prestador = prioridade.</p>
                {demandSupply.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Sem buscas categorizadas ainda.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                      <span className="flex-1">Categoria</span>
                      <span className="w-14 text-right">Buscas</span>
                      <span className="w-12 text-right">Prest</span>
                      <span className="w-14 text-right">B/Prest</span>
                    </div>
                    {demandSupply.map((r) => (
                      <div key={r.category_name} className="flex items-center text-sm py-0.5">
                        <span className="flex-1 text-gray-700 truncate">{r.category_name}</span>
                        <span className="w-14 text-right text-gray-500">{r.searches}</span>
                        <span className="w-12 text-right text-gray-500">{r.active_pros}</span>
                        <span className="w-14 text-right font-medium text-gray-900">
                          {r.demand_per_pro ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Qualidade dos prestadores</h3>
                <p className="text-xs text-gray-400 mb-3">Score 0–100 (alimenta confiança/ranking).</p>
                {qualitySummary && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{qualitySummary.avg_score ?? "—"}</p>
                      <p className="text-xs text-gray-400">score médio ({qualitySummary.total} prestadores)</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sem telefone</span>
                        <span className="font-medium text-gray-900">{qualitySummary.no_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sem foto</span>
                        <span className="font-medium text-gray-900">{qualitySummary.no_photo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sem avaliações</span>
                        <span className="font-medium text-gray-900">{qualitySummary.no_reviews}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {eventsReady && demandSupplyCity.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Demanda × oferta por cidade</h3>
              <p className="text-xs text-gray-400 mb-3">
                Onde há busca e pouca (ou nenhuma) oferta — fila de prioridade para scraper, conteúdo e expansão.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                  <span className="flex-1">Categoria · Cidade</span>
                  <span className="w-16 text-right">Buscas</span>
                  <span className="w-16 text-right">Prest.</span>
                  <span className="w-16 text-right">B/Prest</span>
                </div>
                {demandSupplyCity.map((r, i) => (
                  <div key={`${r.category_name}-${r.city}-${i}`} className="flex items-center text-sm py-0.5">
                    <span className="flex-1 text-gray-700 truncate">
                      {r.category_name} · {r.city}
                    </span>
                    <span className="w-16 text-right text-gray-500">{r.searches}</span>
                    <span
                      className={`w-16 text-right ${r.active_pros === 0 ? "text-red-600 font-semibold" : "text-gray-500"}`}
                    >
                      {r.active_pros}
                    </span>
                    <span className="w-16 text-right font-medium text-gray-900">
                      {r.active_pros === 0 ? "∞" : (r.demand_per_pro ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventsReady && utmStats.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Origem dos contatos (UTM)</h3>
              <p className="text-xs text-gray-400 mb-3">
                Quais canais trazem contato. Use links com <code className="font-mono">?utm_source=...</code> nas campanhas.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                  <span className="flex-1">Origem / Mídia</span>
                  <span className="w-20 text-right">Visitantes</span>
                  <span className="w-20 text-right">Contatos</span>
                </div>
                {utmStats.map((r, i) => (
                  <div key={`${r.source}-${r.medium}-${i}`} className="flex items-center text-sm py-0.5">
                    <span className="flex-1 text-gray-700 truncate">
                      {r.source}
                      {r.medium ? <span className="text-gray-400"> · {r.medium}</span> : null}
                    </span>
                    <span className="w-20 text-right text-gray-500">{r.unique_visitors}</span>
                    <span className="w-20 text-right font-medium text-gray-900">{r.contacts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!eventsReady ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              O rastreamento de eventos ainda não foi ativado. Aplique as migrations{" "}
              <code className="font-mono">002–004</code> no banco para coletar e medir
              mensagens e buscas.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Professionals that received messages */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Prestadores que mais receberam mensagens
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Leads deduplicados + posição média no ranking — a prova de venda
                  (&ldquo;apareceu em Nº, recebeu X leads&rdquo;).
                </p>
                {contactedPros.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">Nenhuma mensagem registrada ainda.</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-[11px] uppercase tracking-wider text-gray-400 pb-1 border-b border-gray-100">
                      <span className="flex-1">Prestador</span>
                      <span className="w-12 text-right" title="Posição média no ranking ao receber contato">Pos</span>
                      <span className="w-12 text-right" title="Visitantes únicos">Únic</span>
                      <span className="w-14 text-right" title="Contatos deduplicados (leads)">Leads</span>
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
                        <span className="w-12 text-right text-sm text-gray-500">
                          {p.avg_position != null ? `${p.avg_position}º` : "—"}
                        </span>
                        <span className="w-12 text-right text-sm text-gray-500">{p.unique_visitors}</span>
                        <span className="w-14 text-right text-sm font-semibold text-gray-900">
                          {p.deduped_contacts}
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
  );
}
