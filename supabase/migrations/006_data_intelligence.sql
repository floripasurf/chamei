-- Phase 1 — Data & Intelligence: viewport-accurate impressions, conversion by
-- position, demand×supply map, and professional quality scoring.

-- #2: impressions get category (server-resolved) and page_type.
ALTER TABLE impression_events
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS page_type  TEXT;
CREATE INDEX IF NOT EXISTS idx_impression_category ON impression_events(category_id);

-- #3a: conversion by ranking position — proves the value of rank.
CREATE OR REPLACE VIEW conversion_by_position AS
WITH imp AS (
  SELECT position, count(*) impressions
  FROM impression_events WHERE position BETWEEN 1 AND 20 GROUP BY position
),
con AS (
  SELECT result_position AS position, count(*) contacts
  FROM contact_events WHERE result_position BETWEEN 1 AND 20 GROUP BY result_position
)
SELECT
  i.position,
  i.impressions,
  COALESCE(c.contacts, 0)                                                  AS contacts,
  ROUND(COALESCE(c.contacts, 0)::numeric / NULLIF(i.impressions, 0), 4)    AS contact_rate
FROM imp i LEFT JOIN con c ON c.position = i.position
ORDER BY i.position;

-- #3b: per-professional funnel + channel split (card→WhatsApp CTR).
-- DROP first: adding columns mid-list isn't allowed by CREATE OR REPLACE.
DROP VIEW IF EXISTS professional_funnel;
CREATE VIEW professional_funnel AS
SELECT
  p.id   AS professional_id,
  p.name AS professional_name,
  p.slug AS professional_slug,
  c.name AS category_name,
  p.city,
  COALESCE(imp.impressions, 0)              AS impressions,
  imp.avg_position                          AS avg_position,
  COALESCE(pv.profile_views, 0)             AS profile_views,
  COALESCE(ct.contacts, 0)                  AS contacts,
  COALESCE(ct.whatsapp, 0)                  AS whatsapp_contacts,
  ROUND(COALESCE(pv.profile_views, 0)::numeric / NULLIF(imp.impressions, 0), 3)  AS view_rate,
  ROUND(COALESCE(ct.contacts, 0)::numeric   / NULLIF(pv.profile_views, 0), 3)    AS contact_rate,
  ROUND(COALESCE(ct.whatsapp, 0)::numeric   / NULLIF(imp.impressions, 0), 4)     AS whatsapp_ctr
FROM professionals p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN (
  SELECT professional_id, count(*) impressions, ROUND(AVG(position)::numeric, 1) avg_position
  FROM impression_events GROUP BY professional_id
) imp ON imp.professional_id = p.id
LEFT JOIN (
  SELECT professional_id, count(*) profile_views FROM profile_view_events GROUP BY professional_id
) pv ON pv.professional_id = p.id
LEFT JOIN (
  SELECT professional_id, count(*) contacts,
         count(*) FILTER (WHERE channel = 'whatsapp') whatsapp
  FROM deduped_contacts GROUP BY professional_id
) ct ON ct.professional_id = p.id
WHERE COALESCE(imp.impressions, 0) > 0 OR COALESCE(ct.contacts, 0) > 0
ORDER BY contacts DESC, impressions DESC;

-- #4: demand × supply by category. Demand from searches, supply from active
-- professionals + their quality. demand_per_pro high = under-supplied = priority.
CREATE OR REPLACE VIEW demand_supply_map AS
WITH demand AS (
  SELECT category_id,
         count(*) searches,
         count(DISTINCT COALESCE(visitor_id, ip_hash)) unique_searchers
  FROM search_events WHERE category_id IS NOT NULL GROUP BY category_id
),
supply AS (
  SELECT category_id,
         count(*) active_pros,
         count(*) FILTER (WHERE phone IS NOT NULL) with_phone,
         count(*) FILTER (WHERE google_review_count > 0) with_reviews,
         ROUND(AVG(google_rating), 2) avg_rating
  FROM professionals WHERE is_active GROUP BY category_id
)
SELECT
  c.name AS category_name,
  c.slug AS category_slug,
  COALESCE(d.searches, 0)         AS searches,
  COALESCE(d.unique_searchers, 0) AS unique_searchers,
  COALESCE(s.active_pros, 0)      AS active_pros,
  COALESCE(s.with_phone, 0)       AS pros_with_phone,
  COALESCE(s.with_reviews, 0)     AS pros_with_reviews,
  s.avg_rating,
  ROUND(COALESCE(d.searches, 0)::numeric / NULLIF(s.active_pros, 0), 2) AS demand_per_pro
FROM categories c
LEFT JOIN demand d ON d.category_id = c.id
LEFT JOIN supply s ON s.category_id = c.id
ORDER BY demand_per_pro DESC NULLS LAST, searches DESC;

-- #5: professional quality score (0–100). Heuristic weights — tune later.
CREATE OR REPLACE VIEW professional_quality AS
SELECT
  id, name, slug, city,
  (phone IS NOT NULL)              AS has_phone,
  (profile_photo_url IS NOT NULL)  AS has_photo,
  (google_review_count > 0)        AS has_reviews,
  google_review_count,
  google_rating,
  is_claimed,
  (
    (phone IS NOT NULL)::int * 25
    + (profile_photo_url IS NOT NULL)::int * 10
    + (google_review_count > 0)::int * 15
    + ROUND(LEAST(COALESCE(google_review_count, 0), 50)::numeric / 50 * 15)
    + ROUND(COALESCE(google_rating, 0)::numeric / 5 * 15)
    + (city IS NOT NULL)::int * 5
    + (neighborhood IS NOT NULL)::int * 5
    + is_claimed::int * 10
  )::int AS quality_score
FROM professionals
WHERE is_active;
