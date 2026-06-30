# Task 6 Review Fix Report

## Fixes Applied

### FIX 1 (Critical) — Accent-insensitive city matching

**Root cause:** DB stores accented city names ("São Paulo"). `parseCitySlug` strips accents ("Sao Paulo"). The old `lower(p.city) = lower($city)` comparison fails because `lower('São Paulo')` ≠ `lower('Sao Paulo')`.

**Files changed:** `src/lib/seo/city-stats.ts`, `src/app/[category]/[city]/page.tsx`

**city-stats.ts — before:**
```sql
AND lower(p.city) = lower(${city})
```
**after:**
```sql
AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') = translate(lower(${city}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
```

**page.tsx pros listing — before:**
```sql
AND (p.city ILIKE ${`%${cityName}%`} OR p.address ILIKE ${`%${cityName}%`})
```
**after:**
```sql
AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') = translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
```

**page.tsx otherCities exclusion — before:**
```sql
AND p.city NOT ILIKE ${`%${cityName}%`}
```
**after:**
```sql
AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') != translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
```

**page.tsx otherCategories — before:**
```sql
AND (p.city ILIKE ${`%${cityName}%`} OR p.address ILIKE ${`%${cityName}%`})
```
**after:**
```sql
AND translate(lower(p.city),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu') = translate(lower(${cityName}),'áàâãäçéèêëíìîïóòôõöúùûü','aaaaaceeeeiiiiooooouuuu')
```

---

### FIX 2 (Important) — UF-validated `extractState`

**Root cause:** Any trailing 2-lowercase-letter segment was treated as a UF code, causing false positives on city slugs ending in valid 2-char suffixes that aren't Brazilian states.

**File:** `src/lib/seo/slug-utils.ts`

**Before:**
```ts
if (last.length === 2 && last === last.toLowerCase()) {
  return last.toUpperCase();
}
```
**After:** Added `VALID_UFS` set of 26 real UF codes; only splits when `VALID_UFS.has(last.toLowerCase())`.

---

### FIX 3 (Important) — Shared `citySlug()` for related-city links

**Root cause:** Inline slug builder `${c.city.toLowerCase().replace(/\s+/g,'-')}...` didn't strip accents, producing `são-paulo-sp` instead of `sao-paulo-sp`.

**File:** `src/app/[category]/[city]/page.tsx` (~line 294)

**Before:**
```ts
const slug = `${c.city.toLowerCase().replace(/\s+/g, "-")}${c.state ? `-${c.state.toLowerCase()}` : ""}`;
```
**After:**
```ts
const slug = citySlug(c.city, c.state);
```
Also added `citySlug` to the import from `@/lib/seo/slug-utils`.

---

## Verification

### Build
```
✓ Compiled successfully in 1646ms
✓ Generating static pages using 9 workers (28/28)
```
No new errors.

### Lint
Baseline: 8 errors, 8 warnings. After fixes: **8 errors, 8 warnings** — no new issues.

### DB Sanity (accent-stripped match)
```
Sao Paulo accent-stripped count: 372
São Paulo exact match count: 372
Sao Paulo exact (no accent) count: 0
```
São Paulo returns 372 with the translate() query (was 0 before).

### Runtime curl tests
- `GET /diarista/sao-paulo-sp`: **noindex = false**, title = "Os melhores Diarista em Sao Paulo (2026) — avaliações reais | Chamei" ✓
- `GET /pedreiro/cidade-fake-zz`: **noindex = true** ✓
