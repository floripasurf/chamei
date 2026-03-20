import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const articles = [
  {
    title: "Quanto custa um eletricista em 2026? Guia completo de preços",
    slug: "quanto-custa-eletricista",
    category_slug: "eletricista",
    tags: ["eletricista", "preços", "serviços elétricos", "guia"],
    excerpt:
      "Descubra quanto custa contratar um eletricista em 2026. Preços atualizados para instalações, reparos, troca de fiação e muito mais.",
    content: `
<h2>Quanto custa contratar um eletricista em 2026?</h2>
<p>Contratar um eletricista pode parecer complicado quando você não sabe quanto esperar pagar. Os preços variam bastante dependendo do tipo de serviço, da região e da experiência do profissional. Neste guia, reunimos os valores mais praticados no Brasil para ajudar você a planejar seu orçamento.</p>

<h3>Tabela de preços por tipo de serviço</h3>
<ul>
  <li><strong>Troca de tomada ou interruptor:</strong> R$ 50 a R$ 120 por ponto</li>
  <li><strong>Instalação de luminária:</strong> R$ 80 a R$ 200</li>
  <li><strong>Instalação de chuveiro elétrico:</strong> R$ 100 a R$ 250</li>
  <li><strong>Troca de disjuntor:</strong> R$ 80 a R$ 180</li>
  <li><strong>Instalação de ventilador de teto:</strong> R$ 120 a R$ 300</li>
  <li><strong>Troca de fiação (por ponto):</strong> R$ 150 a R$ 400</li>
  <li><strong>Instalação de quadro de distribuição:</strong> R$ 300 a R$ 800</li>
  <li><strong>Projeto elétrico completo (apartamento):</strong> R$ 1.500 a R$ 5.000</li>
  <li><strong>Visita técnica + diagnóstico:</strong> R$ 80 a R$ 200</li>
</ul>

<h3>O que influencia o preço do eletricista?</h3>
<p>Diversos fatores podem fazer o preço subir ou descer:</p>
<ul>
  <li><strong>Complexidade do serviço:</strong> Trocar uma tomada é simples; refazer toda a fiação de uma casa exige dias de trabalho.</li>
  <li><strong>Região:</strong> Profissionais em capitais como São Paulo e Rio de Janeiro costumam cobrar mais que em cidades menores.</li>
  <li><strong>Urgência:</strong> Chamados de emergência, especialmente à noite e fins de semana, podem custar até 50% a mais.</li>
  <li><strong>Material:</strong> Alguns eletricistas incluem o material no orçamento, outros cobram separadamente. Sempre pergunte.</li>
  <li><strong>Experiência e certificação:</strong> Profissionais com NR-10 e anos de experiência tendem a cobrar mais, mas entregam um serviço mais seguro.</li>
</ul>

<h3>Dicas para economizar</h3>
<p>Peça pelo menos 3 orçamentos antes de fechar. Compare não apenas o preço, mas também o que está incluído — material, garantia do serviço e prazo de execução. Agrupar vários serviços em uma única visita também costuma sair mais barato do que chamar o profissional várias vezes.</p>

<h3>Encontre um eletricista de confiança</h3>
<p>No <strong>Chamei</strong>, você encontra eletricistas avaliados por outros clientes, compara perfis e entra em contato direto pelo WhatsApp. É gratuito e rápido. <a href="https://chamei.app/categoria/eletricista">Encontre um eletricista agora</a>.</p>
`,
  },
  {
    title: "Como escolher um encanador de confiança",
    slug: "como-escolher-encanador",
    category_slug: "encanador",
    tags: ["encanador", "dicas", "como escolher", "confiança"],
    excerpt:
      "Saiba como identificar um bom encanador, quais perguntas fazer antes de contratar e os sinais de alerta para evitar dor de cabeça.",
    content: `
<h2>Como escolher um encanador de confiança</h2>
<p>Um vazamento pode parecer um problema pequeno, mas contratar o encanador errado pode transformá-lo em uma reforma cara. Saber como escolher um bom profissional é essencial para evitar retrabalho e prejuízos. Veja nossas dicas.</p>

<h3>Perguntas que você deve fazer antes de contratar</h3>
<ul>
  <li><strong>"Qual sua experiência com esse tipo de serviço?"</strong> — Um encanador que já fez dezenas de desentupimentos tem mais confiança do que alguém que faz isso raramente.</li>
  <li><strong>"O orçamento inclui material?"</strong> — Evite surpresas. Peça que o profissional detalhe o que está e o que não está incluído.</li>
  <li><strong>"Você dá garantia no serviço?"</strong> — Profissionais sérios oferecem pelo menos 90 dias de garantia.</li>
  <li><strong>"Pode me mostrar trabalhos anteriores ou avaliações?"</strong> — Bons profissionais têm histórico para mostrar.</li>
  <li><strong>"Qual o prazo de execução?"</strong> — Alinhe expectativas desde o início.</li>
</ul>

<h3>Sinais de alerta (red flags)</h3>
<p>Fique atento a esses sinais que podem indicar um profissional pouco confiável:</p>
<ul>
  <li><strong>Preço muito abaixo do mercado:</strong> Se o orçamento for absurdamente barato, desconfie. Pode significar material de baixa qualidade ou serviço mal feito.</li>
  <li><strong>Não quer formalizar o orçamento:</strong> Um profissional sério coloca o combinado por escrito, mesmo que seja uma mensagem no WhatsApp.</li>
  <li><strong>Pede pagamento total adiantado:</strong> O ideal é combinar um sinal e pagar o restante na conclusão do serviço.</li>
  <li><strong>Não tem avaliações:</strong> Hoje em dia, é difícil confiar em quem não tem nenhum histórico online.</li>
  <li><strong>Chega sem ferramentas adequadas:</strong> Um profissional preparado traz suas próprias ferramentas.</li>
</ul>

<h3>A importância das avaliações</h3>
<p>Avaliações de outros clientes são a forma mais confiável de saber se um encanador entrega o que promete. Leia os comentários com atenção — não apenas a nota, mas o que as pessoas escrevem sobre pontualidade, limpeza e qualidade do serviço.</p>

<h3>Encontre um encanador avaliado</h3>
<p>No <strong>Chamei</strong>, você compara encanadores com avaliações reais e entra em contato pelo WhatsApp. Sem intermediários, sem complicação. <a href="https://chamei.app/categoria/encanador">Buscar encanadores agora</a>.</p>
`,
  },
  {
    title: "Pintor residencial: guia completo para pintar sua casa",
    slug: "pintor-residencial-guia-completo",
    category_slug: "pintor",
    tags: ["pintor", "pintura residencial", "reforma", "guia"],
    excerpt:
      "Tudo o que você precisa saber para pintar sua casa: tipos de tinta, preparação de paredes, como calcular o orçamento e escolher o pintor certo.",
    content: `
<h2>Guia completo para pintar sua casa</h2>
<p>Pintar a casa é uma das formas mais acessíveis de renovar um ambiente. Mas para o resultado ficar profissional, é preciso planejar bem — desde a escolha da tinta até a contratação do pintor. Neste guia, explicamos tudo o que você precisa saber.</p>

<h3>Tipos de tinta: qual escolher?</h3>
<ul>
  <li><strong>Tinta látex PVA:</strong> Ideal para ambientes internos como quartos e salas. Tem bom rendimento e preço acessível. Acabamento fosco.</li>
  <li><strong>Tinta acrílica:</strong> Mais resistente à umidade e lavável. Indicada para cozinhas, banheiros e áreas externas.</li>
  <li><strong>Tinta esmalte:</strong> Usada em portas, janelas e superfícies de madeira ou metal. Disponível em acabamento brilhante ou acetinado.</li>
  <li><strong>Tinta epóxi:</strong> Alta resistência, ideal para pisos e áreas industriais.</li>
</ul>

<h3>Preparação: a etapa mais importante</h3>
<p>A preparação da parede é responsável por 70% do resultado final. Paredes mal preparadas resultam em tinta descascando em poucos meses. O processo inclui:</p>
<ul>
  <li><strong>Lixar</strong> a superfície para remover imperfeições</li>
  <li><strong>Aplicar massa corrida</strong> para nivelar (em paredes internas)</li>
  <li><strong>Aplicar selador</strong> para uniformizar a absorção da tinta</li>
  <li><strong>Limpar</strong> toda poeira antes de pintar</li>
</ul>

<h3>Como calcular o orçamento</h3>
<p>Para estimar o custo da pintura, considere:</p>
<ul>
  <li><strong>Mão de obra:</strong> Pintores cobram entre R$ 15 e R$ 40 por m², dependendo da região e do acabamento desejado.</li>
  <li><strong>Tinta:</strong> Um galão de 3,6L cobre aproximadamente 40m² (duas demãos). Preços variam de R$ 80 a R$ 300 por galão.</li>
  <li><strong>Materiais extras:</strong> Massa corrida, lixa, selador, fita crepe e lonas de proteção. Reserve cerca de R$ 200 a R$ 500.</li>
</ul>
<p>Para um apartamento de 70m², o custo total costuma ficar entre R$ 3.000 e R$ 7.000, incluindo material e mão de obra.</p>

<h3>Como escolher o pintor certo</h3>
<p>Peça para ver fotos de trabalhos anteriores. Um bom pintor cuida dos detalhes: protege móveis e pisos, faz acabamento reto nas quinas e limpa o ambiente ao final. Confira avaliações online e peça pelo menos 3 orçamentos.</p>

<h3>Encontre pintores avaliados</h3>
<p>No <strong>Chamei</strong>, você encontra pintores residenciais com avaliações de clientes reais. Compare perfis e chame pelo WhatsApp. <a href="https://chamei.app/categoria/pintor">Buscar pintores agora</a>.</p>
`,
  },
  {
    title: "Diarista ou empregada doméstica: qual a melhor opção?",
    slug: "diarista-ou-empregada-domestica",
    category_slug: "diarista",
    tags: ["diarista", "empregada doméstica", "limpeza", "comparação"],
    excerpt:
      "Entenda as diferenças entre diarista e empregada doméstica: custos, direitos trabalhistas, frequência e quando cada opção vale mais a pena.",
    content: `
<h2>Diarista ou empregada doméstica: qual escolher?</h2>
<p>Manter a casa limpa e organizada é prioridade para muitas famílias, mas a dúvida entre contratar uma diarista ou uma empregada doméstica é comum. Cada opção tem vantagens, custos e implicações legais diferentes. Vamos comparar.</p>

<h3>Qual a diferença legal?</h3>
<p>A principal diferença está na frequência:</p>
<ul>
  <li><strong>Diarista:</strong> Trabalha até 2 dias por semana na mesma residência. Não é considerada empregada doméstica pela lei e, portanto, não tem vínculo empregatício obrigatório.</li>
  <li><strong>Empregada doméstica:</strong> Trabalha 3 ou mais dias por semana na mesma residência. Tem direito a registro em carteira, FGTS, férias remuneradas, 13º salário e todos os benefícios da CLT doméstica (LC 150/2015).</li>
</ul>

<h3>Comparação de custos</h3>
<ul>
  <li><strong>Diarista:</strong> Cobra entre R$ 150 e R$ 300 por diária, dependendo da região e do tamanho da casa. Para 1x por semana, o custo mensal fica entre R$ 600 e R$ 1.200.</li>
  <li><strong>Empregada doméstica:</strong> O salário mínimo doméstico varia por estado (em SP, cerca de R$ 1.800 em 2026). Somando encargos (INSS, FGTS, férias, 13º), o custo total mensal fica entre R$ 2.500 e R$ 3.500.</li>
</ul>

<h3>Quando escolher uma diarista?</h3>
<ul>
  <li>Você mora sozinho ou em casal, sem filhos pequenos</li>
  <li>A casa é pequena ou média (até 100m²)</li>
  <li>Você precisa de limpeza 1 a 2 vezes por semana</li>
  <li>Quer flexibilidade e menor custo mensal</li>
</ul>

<h3>Quando escolher uma empregada doméstica?</h3>
<ul>
  <li>Família grande com crianças ou idosos</li>
  <li>Casa grande que precisa de manutenção diária</li>
  <li>Você precisa de alguém para cozinhar, lavar e passar</li>
  <li>Prefere ter alguém fixo e de confiança no dia a dia</li>
</ul>

<h3>Cuidados legais importantes</h3>
<p>Se a diarista trabalhar 3 ou mais dias por semana na sua casa, ela <strong>é legalmente uma empregada doméstica</strong>, mesmo sem registro. Nesse caso, ela pode entrar na Justiça do Trabalho e você terá que pagar todos os direitos retroativos. Por isso, formalize sempre a relação de trabalho.</p>

<h3>Encontre diaristas avaliadas</h3>
<p>No <strong>Chamei</strong>, você encontra diaristas com avaliações verificadas. Compare perfis, veja disponibilidade e entre em contato pelo WhatsApp. <a href="https://chamei.app/categoria/diarista">Buscar diaristas agora</a>.</p>
`,
  },
];

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    let inserted = 0;

    for (const article of articles) {
      const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${article.slug}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, category_slug, tags, author, published, published_at)
          VALUES (
            ${article.title},
            ${article.slug},
            ${article.excerpt},
            ${article.content},
            ${null},
            ${article.category_slug},
            ${article.tags},
            ${"Chamei"},
            ${true},
            ${new Date().toISOString()}
          )
        `;
        inserted++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed complete. ${inserted} new articles inserted, ${articles.length - inserted} already existed.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
