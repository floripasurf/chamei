#!/usr/bin/env node
/*
 * seed-places.mjs — Pre-populate professionals from Google Places API (New).
 *
 * Solves the cold-start problem for small/medium cities: searches each
 * target city × category on Google Places and upserts the businesses into
 * the `professionals` table (source = 'google_maps'), idempotently keyed on
 * google_place_id.
 *
 * Usage (run from app/):
 *   GOOGLE_PLACES_API_KEY=... DATABASE_URL=... node scripts/seed-places.mjs [options]
 *
 * Options:
 *   --cities "Pomerode,SC; Timbó,SC"   Inline target cities (Name,UF; ...)
 *   --cities-file path.json            JSON: [{ "city": "Pomerode", "state": "SC" }, ...]
 *   --category slug                    Only this category (repeatable). Default: all.
 *   --max N                            Max results per city×category (default 60).
 *   --commit                           Actually write to the DB. Without it, dry-run.
 *   --radius-km N                      service_radius_km for inserted pros (default 20).
 *
 * Cost note: Places Text Search (New) bills ~ $32 / 1,000 requests with the
 * Pro field mask used here. Each city×category is 1 request + 1 per extra page
 * (up to 3 pages = 60 results). The script prints a request count at the end.
 */

import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

// ── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { categories: [], max: 60, commit: false, radiusKm: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cities") out.cities = argv[++i];
    else if (a === "--cities-file") out.citiesFile = argv[++i];
    else if (a === "--category") out.categories.push(argv[++i]);
    else if (a === "--max") out.max = parseInt(argv[++i], 10);
    else if (a === "--radius-km") out.radiusKm = parseInt(argv[++i], 10);
    else if (a === "--commit") out.commit = true;
  }
  return out;
}

function loadCities(opts) {
  if (opts.citiesFile) {
    const raw = JSON.parse(readFileSync(opts.citiesFile, "utf8"));
    return raw.map((c) => ({ city: c.city.trim(), state: (c.state || "").trim() }));
  }
  if (opts.cities) {
    return opts.cities
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [city, state] = s.split(",").map((x) => x.trim());
        return { city, state: state || "" };
      });
  }
  return [];
}

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// ── Google Places (New) Text Search ───────────────────────────────────────────
const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.regularOpeningHours.weekdayDescriptions",
  "nextPageToken",
].join(",");

async function searchPlaces({ apiKey, textQuery, max }) {
  const results = [];
  let pageToken = null;
  let requests = 0;
  do {
    const body = { textQuery, languageCode: "pt-BR", regionCode: "BR" };
    if (pageToken) body.pageToken = pageToken;
    const res = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    requests++;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Places API ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    if (Array.isArray(data.places)) results.push(...data.places);
    pageToken = data.nextPageToken || null;
    if (pageToken) await new Promise((r) => setTimeout(r, 2000)); // token needs a moment
  } while (pageToken && results.length < max);
  return { places: results.slice(0, max), requests };
}

function neighborhoodFrom(addressComponents) {
  if (!Array.isArray(addressComponents)) return null;
  const hit = addressComponents.find(
    (c) =>
      c.types?.includes("sublocality") ||
      c.types?.includes("sublocality_level_1") ||
      c.types?.includes("neighborhood")
  );
  return hit?.longText || null;
}

// ── upsert ────────────────────────────────────────────────────────────────────
async function upsertProfessional(pool, p, ctx) {
  const placeId = p.id;
  const name = p.displayName?.text?.trim();
  if (!placeId || !name) return { skipped: true };

  const phoneDigits = (p.nationalPhoneNumber || "").replace(/\D/g, "");
  const lat = p.location?.latitude ?? null;
  const lng = p.location?.longitude ?? null;
  const rating = typeof p.rating === "number" ? p.rating : null;
  const reviews = typeof p.userRatingCount === "number" ? p.userRatingCount : 0;
  const hours = p.regularOpeningHours?.weekdayDescriptions?.join("\n") || null;
  const neighborhood = neighborhoodFrom(p.addressComponents);

  // Unique slug: name-city, with a place_id fragment as tiebreaker.
  const base = slugify(`${name}-${ctx.city}`);
  const slug = `${base}-${placeId.slice(-6).toLowerCase()}`;

  if (!ctx.commit) return { wouldInsert: true, name, slug };

  const r = await pool.query(
    `INSERT INTO professionals
       (name, slug, category_id, phone, whatsapp, website, address, city, state,
        neighborhood, latitude, longitude, service_radius_km,
        google_place_id, google_place_name, google_rating, google_review_count,
        google_url, hours, source, is_active)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'google_maps',true)
     ON CONFLICT (google_place_id) DO UPDATE SET
        google_rating = EXCLUDED.google_rating,
        google_review_count = EXCLUDED.google_review_count,
        phone = COALESCE(professionals.phone, EXCLUDED.phone),
        website = COALESCE(professionals.website, EXCLUDED.website),
        hours = COALESCE(professionals.hours, EXCLUDED.hours),
        updated_at = now()
     RETURNING (xmax = 0) AS inserted`,
    [
      name, slug, ctx.categoryId, phoneDigits || null, phoneDigits || null,
      p.websiteUri || null, p.formattedAddress || null, ctx.city, ctx.state || null,
      neighborhood, lat, lng, ctx.radiusKm,
      placeId, name, rating, reviews, p.googleMapsUri || null, hours,
    ]
  );
  return { inserted: r.rows[0]?.inserted === true, updated: r.rows[0]?.inserted === false };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is required");

  const cities = loadCities(opts);
  if (cities.length === 0) {
    throw new Error(
      'No target cities. Use --cities "Pomerode,SC; Timbó,SC" or --cities-file scripts/target-cities.json'
    );
  }

  const pool = new Pool({ connectionString: dbUrl });
  const allCats = await pool.query(`SELECT id, name, slug FROM categories ORDER BY name`);
  let categories = allCats.rows;
  if (opts.categories.length) {
    categories = categories.filter((c) => opts.categories.includes(c.slug));
    if (!categories.length) throw new Error(`No matching categories for: ${opts.categories.join(", ")}`);
  }

  console.log(`Mode: ${opts.commit ? "COMMIT (writing to DB)" : "DRY-RUN (no writes)"}`);
  console.log(`Cities: ${cities.length} | Categories: ${categories.length} | max/combo: ${opts.max}\n`);

  let totalRequests = 0, inserted = 0, updated = 0, found = 0;

  for (const { city, state } of cities) {
    for (const cat of categories) {
      const textQuery = `${cat.name} em ${city}${state ? ", " + state : ""}, Brasil`;
      try {
        const { places, requests } = await searchPlaces({ apiKey, textQuery, max: opts.max });
        totalRequests += requests;
        found += places.length;
        let ci = 0, cu = 0;
        for (const place of places) {
          const r = await upsertProfessional(pool, place, {
            city, state, categoryId: cat.id, radiusKm: opts.radiusKm, commit: opts.commit,
          });
          if (r.inserted) { inserted++; ci++; }
          else if (r.updated) { updated++; cu++; }
        }
        console.log(
          `  ${city}/${state} · ${cat.name}: ${places.length} found` +
          (opts.commit ? ` (+${ci} new, ~${cu} updated)` : " (dry-run)")
        );
      } catch (e) {
        console.error(`  ! ${city}/${state} · ${cat.name}: ${e.message}`);
      }
    }
  }

  await pool.end();
  console.log(`\nDone. Places API requests: ${totalRequests} (~$${(totalRequests * 0.032).toFixed(2)})`);
  console.log(`Listings found: ${found} | inserted: ${inserted} | updated: ${updated}`);
  if (!opts.commit) console.log("Dry-run only — re-run with --commit to persist.");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
