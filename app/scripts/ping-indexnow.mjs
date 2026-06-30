#!/usr/bin/env node
/**
 * ping-indexnow.mjs
 *
 * Submits Chamei money-page (category × city) URLs to IndexNow in batches of ≤10,000.
 *
 * URL source: production sitemap at https://chamei.app/sitemap-citycat.xml
 *
 * Usage:
 *   node scripts/ping-indexnow.mjs            # live submission
 *   node scripts/ping-indexnow.mjs --dry-run  # count URLs, do NOT submit
 */

const DRY_RUN = process.argv.includes("--dry-run");

const SITEMAP_URL = "https://chamei.app/sitemap-citycat.xml";
const INDEXNOW_API = "https://api.indexnow.org/indexnow";
const HOST = "chamei.app";
const KEY = "chamei-indexnow-key-2026";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH_SIZE = 10_000;

/** Fetch the production sitemap and extract all <loc> URLs. */
async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl, {
    headers: { "User-Agent": "Chamei-IndexNow-Pinger/1.0" },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch sitemap ${sitemapUrl}: HTTP ${res.status}`
    );
  }
  const xml = await res.text();

  // Extract <loc> values — works for both sitemap index and urlset
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

/**
 * If the sitemap is a sitemap index (contains <sitemap> entries), recurse into
 * each child sitemap to collect the actual page URLs.
 */
async function resolveUrls(sitemapUrl) {
  const items = await fetchSitemapUrls(sitemapUrl);
  if (items.length === 0) return [];

  // Detect sitemap index: child URLs end with .xml
  const isSitemapIndex = items.every((u) => u.endsWith(".xml"));
  if (isSitemapIndex) {
    const nested = await Promise.all(items.map((u) => fetchSitemapUrls(u)));
    return nested.flat();
  }
  return items;
}

/** POST a batch of URLs to IndexNow. */
async function submitBatch(urlList) {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList });
  const res = await fetch(INDEXNOW_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return res.status;
}

async function main() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);

  let urls = [];
  try {
    urls = await resolveUrls(SITEMAP_URL);
  } catch (err) {
    console.warn(`Warning: could not fetch sitemap — ${err.message}`);
    console.log("URL count: 0 (sitemap unreachable)");
    if (DRY_RUN) process.exit(0);
    process.exit(1);
  }

  console.log(`URLs found: ${urls.length}`);

  if (DRY_RUN) {
    console.log("--dry-run: no submission performed.");
    process.exit(0);
  }

  if (urls.length === 0) {
    console.log("No URLs to submit.");
    process.exit(0);
  }

  // Split into batches of BATCH_SIZE
  let submitted = 0;
  let batchNum = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`Submitting batch ${batchNum} (${batch.length} URLs)…`);
    const status = await submitBatch(batch);
    console.log(`  → HTTP ${status}`);
    submitted += batch.length;
  }

  console.log(`Done. Total URLs submitted: ${submitted}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
