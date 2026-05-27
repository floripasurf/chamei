import Link from "next/link";
import { getDb } from "@/lib/db";
import CityProfessionals from "./components/city-professionals";

// Force dynamic rendering so the count is always fresh
export const dynamic = "force-dynamic";

const CATEGORIES = {
  "Reformas e Reparos": [
    { name: "Eletricista", slug: "eletricista", icon: "⚡" },
    { name: "Encanador", slug: "encanador", icon: "🔧" },
    { name: "Pedreiro", slug: "pedreiro", icon: "🧱" },
    { name: "Pintor", slug: "pintor", icon: "🎨" },
    { name: "Ar Condicionado", slug: "ar-condicionado", icon: "❄️" },
    { name: "Serralheiro", slug: "serralheiro", icon: "🛡️" },
    { name: "Marceneiro", slug: "marceneiro", icon: "🪵" },
    { name: "Vidraceiro", slug: "vidraceiro", icon: "🪟" },
    { name: "Desentupidora", slug: "desentupidora", icon: "🔩" },
    { name: "Marido de Aluguel", slug: "marido-de-aluguel", icon: "🏠" },
    { name: "Gesseiro", slug: "gesseiro", icon: "🏗️" },
    { name: "Impermeabilização", slug: "impermeabilizacao", icon: "💧" },
  ],
  "Doméstico e Família": [
    { name: "Diarista", slug: "diarista", icon: "✨" },
    { name: "Babá", slug: "baba", icon: "👶" },
    { name: "Cuidador de Idosos", slug: "cuidador-de-idosos", icon: "❤️" },
    { name: "Jardineiro", slug: "jardineiro", icon: "🌿" },
    { name: "Limpeza Pós-Obra", slug: "limpeza-pos-obra", icon: "🧹" },
    { name: "Montador de Móveis", slug: "montador-de-moveis", icon: "🪑" },
    { name: "Mudanças e Carretos", slug: "mudancas-e-carretos", icon: "🚚" },
    { name: "Tapeceiro", slug: "tapeceiro", icon: "🛋️" },
  ],
};

export default async function Home() {
  let totalPros = 0;
  try {
    const sql = getDb();
    const stats = await sql`
      SELECT
        (SELECT count(*) FROM professionals WHERE is_active = true) as total_pros,
        (SELECT count(*) FROM categories) as total_cats
    `;
    totalPros = stats[0]?.total_pros || 0;
  } catch (err) {
    console.error("[home] db failed, rendering with totalPros=0", err);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Somente os melhores<br />profissionais
          </h1>
          <p className="text-gray-500 mt-4 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Link direto para o WhatsApp. Rápido, fácil e grátis!
          </p>

          {/* Search */}
          <form
            action="/buscar"
            method="GET"
            className="max-w-lg mx-auto mt-8 flex gap-2"
          >
            <input
              type="text"
              name="q"
              placeholder="O que você precisa? Ex: eletricista, encanador..."
              className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm"
            >
              Buscar
            </button>
          </form>

          {totalPros > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {totalPros} profissionais cadastrados no Brasil
            </p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Categories */}
        {Object.entries(CATEGORIES).map(([group, cats]) => (
          <section key={group} className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{group}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all group"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* City-based professionals */}
        <CityProfessionals />

        {/* How it works */}
        <section className="mb-12 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Escolha o profissional",
                desc: "Compare avaliações reais de clientes, localização e especialidades.",
              },
              {
                step: "2",
                title: "Chame pelo WhatsApp",
                desc: "Envie mensagem direto pro profissional. Sem cadastro, sem intermediário.",
              },
              {
                step: "3",
                title: "Resolvido",
                desc: "O profissional vai até você. Sem taxa, sem surpresas.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Value props */}
        <section className="mb-12">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Para quem precisa de um serviço</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Avaliações reais importadas do Google
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Profissionais ordenados por proximidade
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Contato direto pelo WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  100% gratuito, sem cadastro obrigatório
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Para profissionais</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Cadastro gratuito, sem mensalidade
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Receba clientes direto no WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Suas avaliações do Google aparecem no perfil
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Sem concorrência por lead — o cliente escolhe você
                </li>
              </ul>
              <a
                href="/para-profissionais"
                className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Cadastre-se grátis →
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-white">
              <h2 className="text-xl sm:text-2xl font-bold">
                Você é profissional?
              </h2>
              <p className="text-blue-100 mt-2 text-sm leading-relaxed">
                Eletricista, encanador, pedreiro, diarista ou qualquer outro serviço.
                Cadastre-se grátis e receba clientes pelo WhatsApp.
              </p>
            </div>
            <a
              href="/para-profissionais"
              className="shrink-0 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
            >
              Quero receber clientes
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
