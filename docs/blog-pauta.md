# Pauta de Blog — Chamei

Objetivo: capturar tráfego orgânico informacional (topo de funil) e direcionar
para as páginas de categoria/cidade. Cada artigo mira uma consulta de alta
intenção e linka internamente para `/categoria/[slug]` e busca local.

## Como esta pauta foi priorizada

A demanda de busca interna ainda é baixa (pouco tráfego). Então priorizamos por:
1. **Oferta existente** — categorias com mais prestadores ativos = mais páginas
   de categoria/cidade para sustentar com conteúdo (e mais a ganhar com tráfego).
2. **Intenção de busca conhecida** — para serviços locais, os padrões de maior
   volume são: `quanto custa {serviço}`, `como escolher {profissional}`,
   `{serviço} preço`, e ângulos de urgência/sazonais.
3. **Lacunas** — categorias grandes sem nenhum post ainda.

Reavaliar a cada 4 semanas com `top_unmatched_search_terms` e `demand_supply_map`
conforme o tráfego cresce (a demanda real deve passar a guiar a pauta).

## Já publicado (4)

- Quanto custa um eletricista (eletricista)
- Como escolher um encanador (encanador)
- Pintor residencial — guia completo (pintor)
- Diarista ou empregada doméstica (diarista)

## Prioridade 1 — categorias grandes sem post (publicar primeiro)

| Artigo | Categoria | Prestadores | Keyword-alvo |
|---|---|---|---|
| Quanto custa instalar ar condicionado em 2026 | ar-condicionado | 1.201 | "quanto custa instalar ar condicionado" |
| Quanto custa um pedreiro? Tabela de preços | pedreiro | 862 | "quanto custa pedreiro por dia" |
| Móveis planejados: quanto custa um marceneiro | marceneiro | 849 | "quanto custa móveis planejados" |
| Portões e grades: quanto custa um serralheiro | serralheiro | 830 | "quanto custa portão de ferro" |
| Desentupidora: quanto custa e quando chamar | desentupidora | 479 | "quanto custa desentupir" (urgência) |

## Prioridade 2 — completar "quanto custa" + "como escolher"

| Artigo | Categoria | Ângulo |
|---|---|---|
| Quanto custa limpeza de ar condicionado | ar-condicionado | manutenção/saúde (sazonal verão) |
| Quanto custa um vidraceiro (box, janelas) | vidraceiro | preço por m² |
| Quanto custa um jardineiro / manutenção | jardineiro | recorrente/mensal |
| Quanto custa montar móveis | montador-de-moveis | por item/hora |
| Quanto custa uma mudança | mudancas-e-carretos | por cômodos/distância |
| Marido de aluguel: o que faz e quanto custa | marido-de-aluguel | pequenos reparos |
| Quanto custa impermeabilizar laje/banheiro | impermeabilizacao | preço por m² |
| Quanto custa forro/parede de gesso | gesseiro | por m² |
| Quanto custa um tapeceiro (estofados) | tapeceiro | reforma de sofá |
| Limpeza pós-obra: quanto custa | limpeza-pos-obra | por m² |

## Prioridade 3 — confiança, cuidado e topo de funil amplo

| Artigo | Categoria | Ângulo |
|---|---|---|
| Como escolher uma babá de confiança | baba | segurança/verificação |
| Como escolher um cuidador de idosos | cuidador-de-idosos | confiança/qualificação |
| Como contratar diarista com segurança | diarista | direitos/combinar valores |
| Sinais de um bom profissional (geral) | — | avaliações, garantia, orçamento |
| Quanto custa cada serviço para a casa (guia-índice) | — | hub que linka todos os acima |

## Padrão de cada post (SEO)

- **Formato:** HTML (`<h2>/<h3>/<p>/<ul>/<strong>`), ~600–900 palavras, renderizado com `prose`.
- **Estrutura:** intro → tabela de preços/itens → "o que influencia o preço" →
  dicas para economizar/escolher → CTA "Encontre um {categoria} de confiança"
  com link para `/categoria/{slug}`.
- **Título:** começa com a keyword; inclui o ano para freshness ("em 2026").
- **Links internos:** 1–2 para a categoria e 1 para busca; entre posts relacionados.
- **Publicação:** `blog_posts` (published=true), aparece no sitemap; disparar IndexNow após publicar.
