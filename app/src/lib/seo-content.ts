// SEO content helpers: FAQ copy + FAQPage structured data for category and
// category×city pages. Generated per page so each has unique, useful text.

export type FaqItem = { q: string; a: string };

function lower(s: string) {
  return s.toLowerCase();
}

/** FAQ for a category × city page (e.g. "Eletricista em Campinas, SP"). */
export function categoryCityFaq(catName: string, cityLabel: string, count: number): FaqItem[] {
  const c = lower(catName);
  return [
    {
      q: `Quanto custa um ${c} em ${cityLabel}?`,
      a: `O preço varia conforme o serviço, a urgência e o profissional. No Chamei você pede orçamento a vários ${c}s em ${cityLabel} pelo WhatsApp, de graça, e compara antes de decidir.`,
    },
    {
      q: `Como contratar um ${c} em ${cityLabel}?`,
      a: `Veja a lista de ${c} em ${cityLabel}, compare a nota e o número de avaliações no Google de cada um e chame direto pelo WhatsApp. Não há custo nem cadastro.`,
    },
    {
      q: `Os ${c}s de ${cityLabel} são avaliados?`,
      a: `Sim. Cada profissional mostra a nota e a quantidade de avaliações do Google${count > 0 ? `, e há ${count} ${c}${count > 1 ? "s" : ""} listados em ${cityLabel} e região` : ""}, para você escolher com segurança.`,
    },
    {
      q: `O Chamei cobra alguma taxa?`,
      a: `Não. O Chamei é gratuito para quem procura um ${c} — você fala direto com o profissional pelo WhatsApp, sem intermediário.`,
    },
  ];
}

/** FAQ for a category page (no city). */
export function categoryFaq(catName: string): FaqItem[] {
  const c = lower(catName);
  return [
    {
      q: `Quanto custa um ${c}?`,
      a: `Depende do serviço e da região. O melhor caminho é pedir orçamento a alguns ${c}s e comparar — no Chamei você faz isso pelo WhatsApp, de graça.`,
    },
    {
      q: `Como escolher um bom ${c}?`,
      a: `Compare a nota e o número de avaliações no Google, veja a localização e peça orçamento a mais de um profissional antes de fechar. Todos os ${c}s no Chamei mostram essas informações.`,
    },
    {
      q: `O Chamei cobra para falar com um ${c}?`,
      a: `Não. Buscar e chamar um ${c} no Chamei é gratuito — você fala direto com o profissional pelo WhatsApp.`,
    },
  ];
}

/** FAQPage node for embedding inside a JSON-LD @graph (no @context). */
export function faqNode(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
