# SEO Growth — Indexação, Qualidade e CTR

**Data:** 2026-06-30
**Projeto:** Chamei (chamei.app) — `app/` (Next.js App Router, TS, Tailwind, Neon)
**Status:** Aprovado para implementação

## Objetivo

Aumentar visitas orgânicas ao Chamei destravando o ativo já construído: ~6.000
páginas categoria×cidade que existem mas **não rankeiam** porque o Google mal as
descobriu. Atacar os 3 gargalos confirmados pelo Google Search Console (GSC),
sem aumentar custo de compute do Neon.

## Evidência (GSC, 30/jun/2026)

- **~840 páginas indexadas de 26.296 no sitemap (~3%).** ~25 mil URLs nem foram
  crawleadas. Curva de indexação subindo rápido (40→840 em ~2 meses).
- **Tráfego concentra em perfis** (`/profissional/*`): 15.577 impressões / 217
  cliques. **Categoria×cidade**: só 63 páginas com impressão, 546 impr / 8 cliques.
  **Categoria** (`/categoria/x`): 3.278 impr / 6 cliques (CTR 0,2%).
- **CTR geral ~1–2%**; desktop 0,22% (12k impr), mobile 2,5% (8k impr) → mobile é
  o jogo.
- **Critical issues:** Soft 404 = 83; Crawled-currently-not-indexed = 236;
  Duplicate/redirect/404 = 13.
- **Queries reais de alta intenção já aparecendo:** "encanador", "eletricista
  perto de mim", "faxineira perto de mim", "pedreiro rio de janeiro",
  "desentupidora teresina", "cuidadores de idosos florianópolis".

## Diagnóstico → 3 pilares

1. **Descoberta** — ~25k URLs no limbo; crawl gasto em perfis. Link interno raso
   + sitemap monolítico não prioriza as money-pages.
2. **Qualidade** — Soft 404 (cidades com poucos/zero prestadores geram página
   "vazia") e "crawled-not-indexed" (conteúdo templado, parecido demais entre
   cidades) penalizam o site e queimam crawl budget.
3. **CTR** — impressões existem, mas títulos/snippets fracos e sem estrelas.

## Escopo (YAGNI) — só SEO técnico/on-page

**Nesta iteração:**
- Pilar 1: link interno (categoria→cidades, perfil→categoria×cidade, home→cidades
  top); sitemap em índice com sitemap dedicado de categoria×cidade; IndexNow em
  lote para as money-pages.
- Pilar 2: gate de qualidade — `noindex` (ou redirect) para páginas
  categoria×cidade com `<2` prestadores ativos (alinha à regra do scraper);
  diferenciação de conteúdo local (faixa de preço da cidade, bairros, nº de
  prestadores, nomes reais).
- Pilar 3: títulos/meta description dinâmicos + `aggregateRating` JSON-LD nas páginas
  categoria×cidade e perfil.

**Fora de escopo:** redesign visual da home (spec separado de 2026-06-28), blog,
mídia paga, backlinks/PR (são canais, não código). Priorização por cidade fica
guiada pelos dados do GSC.

## Não-objetivos

- Não aumentar compute do Neon: páginas categoria×cidade já usam ISR (`revalidate`)
  ou estático; manter. Sitemap e IndexNow devem ser eficientes (queries
  agregadas, cacheadas). Nada de N+1 por request.
- Não trabalhar do working tree local (git inconsistente) — via `main` do GitHub
  `floripasurf/chamei` (app em `app/`); deploy = merge no `main`.
- Não gerar mais URLs magras: menos páginas e melhores > mais páginas.

## Arquitetura / componentes

| Unidade | Responsabilidade | Novo/Editar |
|---|---|---|
| `app/src/app/sitemap.ts` | Virar **índice de sitemaps** (estáticas, categorias, categoria×cidade, perfis) com limite ~45k/arquivo | Editar |
| `app/src/app/sitemap/[shard]/route.ts` (ou `sitemap-*.ts`) | Gera cada shard; o de categoria×cidade só inclui combos com `≥2` prestadores | Novo |
| `app/src/app/[category]/[city]/page.tsx` | Gate `noindex` quando `<2` pros; conteúdo local diferenciado (preço/bairros/contagem); título+meta dinâmicos; `aggregateRating` | Editar |
| `app/src/lib/seo/city-stats.ts` | Query agregada por categoria×cidade (contagem, nota média, faixa de preço, bairros) — cacheável | Novo |
| `app/src/lib/seo/titles.ts` | Geração de `<title>`/meta/og padronizados por tipo de página | Novo |
| `app/src/app/categoria/[slug]/page.tsx` | Listar e **linkar todas as cidades** daquela categoria (descoberta) | Editar |
| `app/src/app/profissional/[slug]/page.tsx` | Link para `/{categoria}/{cidade}` do prestador (descoberta + relevância) | Editar |
| `app/src/app/components/internal-links.tsx` | Bloco reutilizável "cidades populares" / "categorias relacionadas nesta cidade" | Novo |
| `app/src/app/api/indexnow/route.ts` | Suportar submissão em lote (lista de URLs) | Editar |
| `scripts/seo/ping-indexnow.ts` (ou rota admin) | Enviar as money-pages ao IndexNow em lotes | Novo |

## Detalhes-chave

**Gate de qualidade (Pilar 2):** a página `/{categoria}/{cidade}` consulta a
contagem de prestadores ativos naquela categoria+cidade. Se `<2`:
`export const metadata` (ou `generateMetadata`) inclui `robots: { index: false,
follow: true }` e a página mostra fallback ("poucos prestadores aqui — veja no
estado/categoria"). Mesma regra (≥2) que o scraper persegue → o flywheel
transforma `noindex` em `index` conforme a base enche. As páginas `<2` **saem do
sitemap de categoria×cidade** (o shard filtra por contagem).

**Conteúdo local diferenciado (Pilar 2):** `city-stats.ts` devolve, por
categoria×cidade: nº de prestadores, nota média, faixa de preço (derivável dos
artigos "quanto custa" / dados do scraper), bairros mais comuns. A página
renderiza isso em texto + FAQ específico da cidade → reduz "crawled-not-indexed"
por similaridade.

**Sitemap índice (Pilar 1):** `sitemap.ts` retorna um índice apontando para
shards. Shard de categoria×cidade lista só combos `≥2`. Isso prioriza as
money-pages e respeita limites do protocolo.

**Link interno (Pilar 1):** categoria→todas as suas cidades; perfil→sua
categoria×cidade; home→cidades top (reaproveita `city-detector`). Resolve a causa
raiz dos ~25k não-crawleados.

**Títulos + estrelas (Pilar 3):** `titles.ts` gera p.ex.
`"Os melhores {Categoria} em {Cidade} ({ano}) — avaliações reais | Chamei"` e meta
description com contagem/nota. `aggregateRating` JSON-LD (nota média + nº de
avaliações) nas páginas categoria×cidade e perfil → rich snippet com estrelas.

**Priorização:** primeiro as cidades/categorias com impressão no GSC (Rio/pedreiro,
Teresina/desentupidora, Florianópolis/cuidador, "perto de mim") — clique mais
rápido. Depois, em escala, todas as `≥2`.

## Verificação (sem framework de teste)

- `npm run build && npm run lint` verdes.
- `/sitemap.xml` retorna índice; shard de categoria×cidade só com combos `≥2`;
  contagem de URLs bate com a query de contagem.
- Página categoria×cidade com `<2` pros responde com `<meta name="robots"
  content="noindex">`; com `≥2` é indexável, tem título dinâmico, FAQ local e
  `aggregateRating` no JSON-LD (validar no Rich Results Test).
- Categoria lista links para suas cidades; perfil linka sua categoria×cidade.
- IndexNow em lote retorna 200 e aparece submissão.
- Sanity de Neon: páginas continuam ISR/cacheadas; sem query nova por request não
  cacheada.

## Deploy

Branch a partir do `main` do GitHub; PR → merge → deploy Vercel (projeto `app`).
Após deploy: submeter novo sitemap-índice no GSC, pingar IndexNow em lote, e
acompanhar no GSC indexação subindo + "Crawled-not-indexed"/Soft-404 caindo.

## Riscos

- **Soft 404 residual:** se o gate `noindex` não cobrir todos os casos vazios,
  Google segue penalizando — garantir cobertura no `generateMetadata`.
- **Compute Neon:** `city-stats` por request derrubaria a cota — precisa ser
  cacheável/agregado. Mitigação no plano.
- **Git local inconsistente:** trabalhar via `main` (mesma estratégia do redesign).
- **Canibalização:** página `/categoria/x` (nacional) vs `/{cat}/{cidade}` — usar
  canonical corretos para não competirem.
