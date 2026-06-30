# SEO Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o Google descobrir, indexar e rankear as ~6.000 páginas categoria×cidade do Chamei, eliminando os Soft-404/thin pages e ganhando CTR — sem aumentar compute do Neon.

**Architecture:** Três pilares — Descoberta (sitemap-índice + link interno + IndexNow em lote), Qualidade (`noindex` para cidade×categoria com <2 prestadores + conteúdo local diferenciado), CTR (títulos dinâmicos + `aggregateRating`). Dados agregados por uma função cacheável para não onerar o Neon.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, Neon (`@neondatabase/serverless`).

## Global Constraints

- Trabalhar a partir do **`main` do GitHub `floripasurf/chamei`** (app em `app/`). NÃO usar o working tree local. Deploy = merge no `main` (Vercel projeto `app`, alias chamei.app).
- NÃO aumentar compute do Neon: a stats por categoria×cidade deve ser **cacheada/ISR**, nunca query nova não-cacheada por request. Manter `revalidate` existente.
- Sem framework de teste: ciclo = `npm run build` + `npm run lint` + verificação em runtime (curl no dev server / query no banco / Rich Results Test).
- Regra de qualidade alinhada ao scraper: **uma página categoria×cidade só é indexável e entra no sitemap quando há ≥2 prestadores ativos** naquela categoria+cidade.
- Português no conteúdo voltado ao usuário. `DATABASE_URL` sempre de env.
- Commits frequentes, conventional commits. Priorizar cidades/categorias com impressão no GSC.

---

### Task 0: Ambiente limpo a partir do main

**Files:**
- Create (dir): `~/projects/chamei-seo/` (clone limpo)

**Interfaces:**
- Produces: `~/projects/chamei-seo/app` na branch `feat/seo-growth`, deps instaladas, build baseline verde.

- [ ] **Step 1: Clonar o main**

```bash
git clone https://github.com/floripasurf/chamei.git ~/projects/chamei-seo
cd ~/projects/chamei-seo && git checkout main && git pull && git checkout -b feat/seo-growth
```

- [ ] **Step 2: Deps + env + build baseline**

```bash
cd ~/projects/chamei-seo/app && npm install
cp ~/projects/services-marketplace/app/.env.local .env.local
npm run build
```
Expected: build conclui sem erro.

- [ ] **Step 3: Copiar spec/plano e commit**

```bash
mkdir -p ~/projects/chamei-seo/docs/superpowers/{specs,plans}
cp ~/projects/services-marketplace/docs/superpowers/specs/2026-06-30-seo-growth-design.md ~/projects/chamei-seo/docs/superpowers/specs/
cp ~/projects/services-marketplace/docs/superpowers/plans/2026-06-30-seo-growth.md ~/projects/chamei-seo/docs/superpowers/plans/
cd ~/projects/chamei-seo && git add docs && git commit -m "docs: seo growth spec + plan"
```

---

### Task 1: Função de stats por categoria×cidade (cacheável)

**Files:**
- Create: `app/src/lib/seo/city-stats.ts`

**Interfaces:**
- Produces:
  - `getCityCategoryStats(categorySlug: string, citySlug: string): Promise<CityCatStats | null>`
  - `type CityCatStats = { count: number; avgRating: number | null; reviewCount: number; neighborhoods: string[]; topNames: string[] }`
  - `getCitiesForCategory(categorySlug: string): Promise<Array<{ citySlug: string; city: string; state: string; count: number }>>` — só combos com `count >= 2`.

- [ ] **Step 1: Confirmar slug↔cidade**

Verificar como `[category]/[city]/page.tsx` (no main) resolve `citySlug` → `city` real (provavelmente slugify de `"Cidade-UF"`). Reusar exatamente a mesma normalização. Rodar:
```bash
cd ~/projects/chamei-seo/app && grep -nE "slug|city|state|replace|normaliz" "src/app/[category]/[city]/page.tsx" | head -30
```
Expected: identificar a função de slug usada (replicar, não reinventar).

- [ ] **Step 2: Escrever city-stats.ts**

```typescript
import { neon } from "@neondatabase/serverless";

export type CityCatStats = {
  count: number; avgRating: number | null; reviewCount: number;
  neighborhoods: string[]; topNames: string[];
};

const sql = () => neon(process.env.DATABASE_URL!);

export async function getCityCategoryStats(categorySlug: string, city: string, state: string): Promise<CityCatStats | null> {
  const db = sql();
  const rows = await db`
    SELECT count(*)::int AS count,
           round(avg(p.google_rating)::numeric, 1)::float AS avg_rating,
           coalesce(sum(p.google_review_count),0)::int AS review_count,
           (array_remove(array_agg(DISTINCT p.neighborhood), NULL))[1:6] AS neighborhoods,
           (array_agg(p.name ORDER BY p.is_verified DESC, p.google_rating DESC NULLS LAST, p.google_review_count DESC))[1:3] AS top_names
    FROM professionals p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active AND c.slug = ${categorySlug}
      AND lower(p.city) = lower(${city})
      AND upper(coalesce(p.state,'')) = upper(${state})
  `;
  const r = rows[0];
  if (!r || r.count === 0) return null;
  return { count: r.count, avgRating: r.avg_rating, reviewCount: r.review_count,
           neighborhoods: r.neighborhoods || [], topNames: r.top_names || [] };
}

export async function getCitiesForCategory(categorySlug: string) {
  const db = sql();
  return db`
    SELECT lower(p.city) AS city_key, p.city, coalesce(p.state,'') AS state, count(*)::int AS count
    FROM professionals p JOIN categories c ON c.id = p.category_id
    WHERE p.is_active AND c.slug = ${categorySlug}
    GROUP BY lower(p.city), p.city, p.state
    HAVING count(*) >= 2
    ORDER BY count(*) DESC
  ` as Promise<Array<{ city_key: string; city: string; state: string; count: number }>>;
}
```

- [ ] **Step 3: Build/lint**

Run: `npm run build && npm run lint`
Expected: passa.

- [ ] **Step 4: Verificar a query no banco (cidade com base)**

```bash
cd ~/projects/services-marketplace/scraper && set -a; . ../app/.env.local; set +a
.venv/bin/python -c "import os,psycopg2;c=psycopg2.connect(os.environ['DATABASE_URL']);cur=c.cursor();cur.execute(\"SELECT count(*) FROM professionals p JOIN categories c ON c.id=p.category_id WHERE p.is_active AND c.slug='pedreiro' AND lower(p.city)=lower('Rio de Janeiro')\");print('pedreiro RJ:',cur.fetchone()[0])"
```
Expected: retorna um número >0 (sanidade da query).

- [ ] **Step 5: Commit**

```bash
cd ~/projects/chamei-seo && git add app/src/lib/seo/city-stats.ts && git commit -m "feat(seo): cacheable city×category stats helper"
```

---

### Task 2: Gate de qualidade + conteúdo local + título/estrelas na página categoria×cidade

**Files:**
- Modify: `app/src/app/[category]/[city]/page.tsx`

**Interfaces:**
- Consumes: `getCityCategoryStats` (Task 1).

- [ ] **Step 1: noindex quando <2 via generateMetadata**

No `generateMetadata` da página, chamar `getCityCategoryStats`. Se `null` ou `count < 2`: retornar metadata com `robots: { index: false, follow: true }` e título genérico; caso contrário título dinâmico:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { category, city } = await params;
  const { cityName, stateUf } = parseCitySlug(city); // reusar normalização existente
  const stats = await getCityCategoryStats(category, cityName, stateUf);
  const year = 2026; // ano fixo; atualizar por release (Date.now indisponível em build determinístico)
  if (!stats || stats.count < 2) {
    return { robots: { index: false, follow: true }, title: `${catLabel(category)} em ${cityName} | Chamei` };
  }
  const title = `Os melhores ${catLabel(category)} em ${cityName} (${year}) — avaliações reais | Chamei`;
  const desc = `${stats.count} ${catLabel(category)} em ${cityName}${stats.avgRating ? `, nota média ${stats.avgRating}★` : ""}. Contato direto no WhatsApp, grátis.`;
  return { title, description: desc, alternates: { canonical: `https://chamei.app/${category}/${city}` },
           openGraph: { title, description: desc } };
}
```

- [ ] **Step 2: Conteúdo local diferenciado + aggregateRating JSON-LD**

No corpo da página (quando `count >= 2`), renderizar bloco com: nº de prestadores, nota média, bairros (`stats.neighborhoods`), e um FAQ específico da cidade. Injetar JSON-LD:

```tsx
{stats.avgRating && stats.reviewCount > 0 && (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org", "@type": "AggregateRating",
    itemReviewed: { "@type": "Service", name: `${catLabel(category)} em ${cityName}` },
    ratingValue: stats.avgRating, reviewCount: stats.reviewCount, bestRating: 5
  }) }} />
)}
```
> Nota: confirmar que a página já não tem outro JSON-LD conflitante; se tiver, mesclar.

- [ ] **Step 3: Build/lint**

Run: `npm run build && npm run lint`
Expected: passa.

- [ ] **Step 4: Verificar runtime (cidade cheia vs vazia)**

```bash
npm run dev &  sleep 6
# cidade com base: deve ser indexável, título dinâmico, JSON-LD AggregateRating
curl -s "http://localhost:3000/pedreiro/rio-de-janeiro-rj" | grep -oE "<title>[^<]+|AggregateRating|noindex" | head
# cidade sem base (<2): deve conter noindex
curl -s "http://localhost:3000/pedreiro/cidade-fake-zz" | grep -c "noindex"
```
Expected: 1º tem título dinâmico + AggregateRating e NÃO tem noindex; 2º tem noindex.

- [ ] **Step 5: Commit**

```bash
git add "app/src/app/[category]/[city]/page.tsx" && git commit -m "feat(seo): noindex thin city pages, local content, dynamic title + aggregateRating"
```

---

### Task 3: Sitemap em índice com shard categoria×cidade ≥2

**Files:**
- Modify: `app/src/app/sitemap.ts` (virar índice)
- Create: `app/src/app/sitemap-citycat.xml/route.ts` (shard das money-pages)

**Interfaces:**
- Consumes: `getCitiesForCategory` (Task 1) e a lista de categorias.

- [ ] **Step 1: Inspecionar sitemap.ts atual**

```bash
sed -n '1,80p' app/src/app/sitemap.ts
```
Expected: entender como gera hoje (perfis/categorias) para preservar.

- [ ] **Step 2: Criar shard de categoria×cidade (só ≥2)**

Criar `app/src/app/sitemap-citycat.xml/route.ts` que, para cada categoria, chama `getCitiesForCategory` (já filtra ≥2) e emite `<url>` para `/{categoria}/{citySlug}`. Cache-Control `s-maxage=86400`. Formato XML padrão de urlset.

- [ ] **Step 3: Converter sitemap.ts em índice**

`sitemap.ts` passa a referenciar shards: estáticas+categorias (mantém), perfis (mantém/sharda se >45k), e o novo `/sitemap-citycat.xml`. Garantir que nenhuma página `<2` apareça (elas saem do shard pois a query filtra).

- [ ] **Step 4: Build + verificar contagem**

```bash
npm run build && npm run dev & sleep 6
curl -s "http://localhost:3000/sitemap-citycat.xml" | grep -c "<loc>"
```
Expected: número ≈ total de combos categoria×cidade com ≥2 (bate com a soma de `getCitiesForCategory` por categoria).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/sitemap.ts "app/src/app/sitemap-citycat.xml/route.ts" && git commit -m "feat(seo): sitemap index + dedicated city×category shard (>=2 only)"
```

---

### Task 4: Link interno (descoberta)

**Files:**
- Create: `app/src/app/components/internal-links.tsx`
- Modify: `app/src/app/categoria/[slug]/page.tsx`
- Modify: `app/src/app/profissional/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getCitiesForCategory` (Task 1).
- Produces: `<CityLinks categorySlug citySlugify />` e `<RelatedInCity .../>` (server components).

- [ ] **Step 1: Componente de links de cidades**

Criar `internal-links.tsx` com um server component que recebe uma lista `{citySlug, city, count}` e renderiza uma grade de links `/{categoria}/{citySlug}` ("Encontre {categoria} na sua cidade"). Reusar a mesma slugify.

- [ ] **Step 2: Categoria → todas as cidades**

Em `categoria/[slug]/page.tsx`, no fim da página, chamar `getCitiesForCategory(slug)` e renderizar `<CityLinks>` (top N + "ver todas"). Isso cria o caminho de crawl para as money-pages.

- [ ] **Step 3: Perfil → sua categoria×cidade**

Em `profissional/[slug]/page.tsx`, adicionar um link contextual para `/{categoriaDoPrestador}/{cidadeDoPrestador}` ("Veja todos os {categoria} em {cidade}").

- [ ] **Step 4: Build/lint + verificar links no HTML**

```bash
npm run build && npm run dev & sleep 6
curl -s "http://localhost:3000/categoria/pedreiro" | grep -oE 'href="/pedreiro/[a-z0-9-]+"' | head
curl -s "http://localhost:3000/profissional/<um-slug-real>" | grep -oE 'href="/[a-z-]+/[a-z0-9-]+"' | head
```
Expected: categoria lista vários links `/pedreiro/<cidade>`; perfil tem o link da sua categoria×cidade.

- [ ] **Step 5: Commit**

```bash
git add app/src/app/components/internal-links.tsx app/src/app/categoria/ app/src/app/profissional/ && git commit -m "feat(seo): internal linking category→cities, profile→city×category"
```

---

### Task 5: IndexNow em lote

**Files:**
- Modify: `app/src/app/api/indexnow/route.ts`
- Create: `app/scripts/ping-indexnow.mjs`

**Interfaces:**
- Consumes: chave em `public/chamei-indexnow-key-2026.txt`.

- [ ] **Step 1: Inspecionar rota indexnow atual**

```bash
cat app/src/app/api/indexnow/route.ts
```
Expected: ver se aceita 1 URL ou lista; ajustar para aceitar `urlList` (array, máx 10k por request conforme protocolo).

- [ ] **Step 2: Script de ping em lote das money-pages**

Criar `app/scripts/ping-indexnow.mjs` que: lê `getCitiesForCategory` por categoria (via fetch ao próprio `/sitemap-citycat.xml` em produção, ou querya o banco), monta a lista de URLs `/{cat}/{cidade}` e envia ao endpoint IndexNow (`https://api.indexnow.org/indexnow`) em lotes de até 10k com a chave. Priorizar primeiro as cidades com impressão no GSC.

- [ ] **Step 3: Verificar (dry-run conta URLs)**

```bash
node app/scripts/ping-indexnow.mjs --dry-run
```
Expected: imprime quantas URLs seriam enviadas (≈ total de combos ≥2) sem enviar.

- [ ] **Step 4: Commit**

```bash
git add app/src/app/api/indexnow/route.ts app/scripts/ping-indexnow.mjs && git commit -m "feat(seo): batch IndexNow submission for money-pages"
```

---

### Task 6: Verificação final + deploy + submissão

**Files:** —

- [ ] **Step 1: Build + lint limpos**

Run: `cd ~/projects/chamei-seo/app && npm run build && npm run lint`
Expected: verdes.

- [ ] **Step 2: Checklist de verificação on-page**

- Página `≥2`: título dinâmico + AggregateRating (validar uma URL no Rich Results Test: https://search.google.com/test/rich-results).
- Página `<2`: `noindex` presente.
- `/sitemap.xml` é índice e aponta para `/sitemap-citycat.xml`; shard só com `≥2`.
- categoria linka cidades; perfil linka categoria×cidade.

- [ ] **Step 3: PR → merge → deploy**

```bash
cd ~/projects/chamei-seo && git push -u origin feat/seo-growth
gh pr create --base main --head feat/seo-growth --title "SEO: indexação, qualidade e CTR das páginas categoria×cidade" --body "Sitemap-índice + shard ≥2, noindex de páginas magras, conteúdo local + aggregateRating, link interno, IndexNow em lote. Spec/plano em docs/superpowers/."
```
Após merge, confirmar deploy do projeto `app` e alias chamei.app.

- [ ] **Step 4: Submeter no Google + IndexNow (pós-deploy)**

- No GSC: submeter `https://chamei.app/sitemap.xml` (índice) novamente.
- Rodar `node app/scripts/ping-indexnow.mjs` (sem dry-run) contra produção.
- Acompanhar no GSC nas semanas seguintes: indexadas subindo; Soft-404 e "crawled-not-indexed" caindo; impressões/cliques em categoria×cidade subindo.

- [ ] **Step 5: Atualizar grafo**

```bash
cd ~/projects/chamei-seo && graphify update . 2>/dev/null || true
```

---

## Self-Review

**Spec coverage:**
- Descoberta: sitemap-índice + shard (Task 3), link interno (Task 4), IndexNow lote (Task 5) ✓
- Qualidade: noindex <2 (Task 2), conteúdo local (Task 2), shard só ≥2 (Task 3) ✓
- CTR: título dinâmico + aggregateRating (Task 2) ✓
- Neon-safe: stats cacheável/ISR; sem query nova não-cacheada por request (Task 1 helper + páginas mantêm ISR) ✓
- Via main / deploy (Task 0 + Task 6) ✓; priorização por GSC (Task 5) ✓
- Escopo só SEO técnico; não toca redesign/blog/pago ✓

**Placeholder scan:** as notas "reusar slugify existente", "confirmar JSON-LD conflitante", "um-slug-real" são instruções concretas de execução, não TODOs vagos. Sem framework de teste → verificação por build/lint/runtime declarada (Global Constraints). `parseCitySlug`/`catLabel`/`citySlugify` devem reaproveitar utilitários já existentes na página atual (Task 2 Step 1 / Task 1 Step 1 mandam identificá-los).

**Type consistency:** `CityCatStats` e as assinaturas de `getCityCategoryStats`/`getCitiesForCategory` definidas na Task 1 e consumidas nas Tasks 2, 3, 4 com os mesmos nomes/campos. Filtro `≥2` consistente entre sitemap (Task 3), noindex (Task 2) e link interno (Task 4).

**Nota:** ano no título está fixo (2026) porque `Date.now()` é indisponível em contexto determinístico de build; atualizar por release ou derivar de env no futuro.
