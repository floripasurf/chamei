import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { Professional } from "@/lib/types";
import ProfessionalCard from "../components/professional-card";
import NearbyProfessionals from "../components/nearby-professionals";

export const metadata: Metadata = {
  title: "Eletricista em São Paulo | Chamei - Profissionais Avaliados",
  description:
    "Encontre os melhores eletricistas em São Paulo com avaliações reais. Compare preços, veja avaliações e chame pelo WhatsApp. Orçamento grátis.",
  keywords:
    "eletricista são paulo, eletricista sp, eletricista perto de mim, eletricista residencial, eletricista 24 horas, eletricista urgente, instalação elétrica sp",
};

const BAIRROS = [
  "Centro", "Moema", "Pinheiros", "Vila Mariana", "Itaim Bibi",
  "Consolação", "Liberdade", "Santana", "Tatuapé", "Perdizes",
  "Lapa", "Butantã", "Santo Amaro", "Ipiranga", "Penha",
  "Vila Madalena", "Brooklin", "Campo Belo", "Morumbi", "Jardins",
];

const SPECIALTIES = [
  "Instalação Elétrica", "Manutenção e Reparo", "Ar Condicionado",
  "Curto Circuito", "Chuveiro Elétrico", "Iluminação",
  "Tomadas", "Disjuntor",
];

export default async function EletricistaSP() {
  let pros: Professional[] = [];
  let total = 0;
  try {
    const sql = getDb();
    pros = (await sql`
      SELECT p.* FROM professionals p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = 'eletricista' AND p.is_active = true
      ORDER BY p.google_rating DESC NULLS LAST, p.google_review_count DESC NULLS LAST
      LIMIT 20
    `) as Professional[];

    const countResult = await sql`
      SELECT count(*) as total FROM professionals p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = 'eletricista' AND p.is_active = true
    `;
    total = countResult[0]?.total || 0;
  } catch (err) {
    console.error("[eletricista-sp] db failed", err);
  }

  const faqItems = [
    {
      q: "Quanto custa um eletricista em São Paulo?",
      a: "Serviços simples (tomadas, interruptores): R$100-R$300. Quadro de distribuição: R$500-R$1.500. Instalação de ar condicionado: R$300-R$800.",
    },
    {
      q: "Como encontrar um bom eletricista em SP?",
      a: "No Chamei, todos os eletricistas possuem avaliações reais de clientes. Compare nota, número de avaliações e localização antes de chamar.",
    },
    {
      q: "Tem eletricista 24 horas?",
      a: "Sim. Vários eletricistas no Chamei atendem emergências 24h. Envie mensagem pelo WhatsApp para atendimento imediato.",
    },
    {
      q: "O Chamei cobra alguma taxa?",
      a: "Não. O Chamei é gratuito para clientes e profissionais.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Eletricista em São Paulo
            </h1>
            <p className="text-gray-500 mt-3 leading-relaxed">
              Compare {total} eletricistas avaliados por clientes reais.
              Chame direto pelo WhatsApp. Grátis.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {SPECIALTIES.map((spec) => (
              <span
                key={spec}
                className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Nearby */}
        <section className="mb-10">
          <NearbyProfessionals />
        </section>

        {/* All */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Melhores avaliados
          </h2>
          <p className="text-xs text-gray-500 mb-5">Ordenados por avaliação no Google</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {pros.map((pro) => (
              <ProfessionalCard key={pro.id} pro={pro} />
            ))}
          </div>

          {pros.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-3xl mb-3">⚡</div>
              <p className="text-gray-900 font-medium">Carregando eletricistas...</p>
              <p className="text-sm text-gray-400 mt-1">
                Estamos adicionando novos profissionais todos os dias.
              </p>
            </div>
          )}
        </section>

        {/* Neighborhoods */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Por bairro</h2>
          <div className="flex flex-wrap gap-1.5">
            {BAIRROS.map((bairro) => (
              <span
                key={bairro}
                className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-gray-500"
              >
                Eletricista {bairro}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Perguntas frequentes</h2>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-100">
                <summary className="px-5 py-4 font-medium text-gray-900 cursor-pointer text-sm hover:text-blue-600 transition-colors">
                  {faq.q}
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-white">
              <h2 className="text-xl sm:text-2xl font-bold">Você é eletricista?</h2>
              <p className="text-blue-100 mt-2 text-sm leading-relaxed">
                Cadastre-se grátis e receba clientes pelo WhatsApp. Sem mensalidade.
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
    </>
  );
}
