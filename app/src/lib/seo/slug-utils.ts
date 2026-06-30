/**
 * Slug utilities shared by category×city pages.
 * Extracted from `app/src/app/[category]/[city]/page.tsx` (Task 2).
 */

/** Convert a hyphenated slug segment to Title Case. */
export function formatCityName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Extract the two-letter state code from the end of a city slug.
 * e.g. "rio-de-janeiro-rj" → "RJ", "sao-paulo" → null
 */
export function extractState(citySlug: string): string | null {
  const parts = citySlug.split("-");
  const last = parts[parts.length - 1];
  if (last.length === 2 && last === last.toLowerCase()) {
    return last.toUpperCase();
  }
  return null;
}

/**
 * Parse a city route param slug into { cityName, stateUf }.
 * stateUf is an empty string when no state suffix is present.
 */
export function parseCitySlug(citySlug: string): { cityName: string; stateUf: string } {
  const stateUf = extractState(citySlug);
  const cityName = stateUf
    ? formatCityName(citySlug.replace(`-${stateUf.toLowerCase()}`, ""))
    : formatCityName(citySlug);
  return { cityName, stateUf: stateUf ?? "" };
}

/**
 * Derive a human-readable category label from its slug.
 * Prefer the DB name when available; this is the fallback.
 */
export function catLabelFromSlug(slug: string): string {
  return formatCityName(slug);
}
