-- #2: funnel tracking — impressions → profile views → contacts.
-- Lets us compute per-professional conversion and prove lead value
-- ("apareceu N vezes, X visitas, Y contatos").

-- A professional shown in a list (search/category/city/nearby/home). High volume,
-- so rows are lean and inserted in batches (one request per list render).
CREATE TABLE IF NOT EXISTS impression_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  position INTEGER,
  source TEXT,            -- 'search' | 'category' | 'city' | 'nearby' | 'home'
  visitor_id TEXT,
  pathname TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_impression_professional ON impression_events(professional_id);
CREATE INDEX IF NOT EXISTS idx_impression_created ON impression_events(created_at);

-- A visit to a professional's profile page.
CREATE TABLE IF NOT EXISTS profile_view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  visitor_id TEXT,
  pathname TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_view_professional ON profile_view_events(professional_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_created ON profile_view_events(created_at);

-- Per-professional funnel (sellable proof). deduped_contacts is the honest lead count.
CREATE OR REPLACE VIEW professional_funnel AS
SELECT
  p.id   AS professional_id,
  p.name AS professional_name,
  p.slug AS professional_slug,
  c.name AS category_name,
  p.city,
  COALESCE(imp.impressions, 0)              AS impressions,
  COALESCE(imp.avg_position, NULL)          AS avg_position,
  COALESCE(pv.profile_views, 0)             AS profile_views,
  COALESCE(ct.contacts, 0)                  AS contacts,
  ROUND(COALESCE(pv.profile_views, 0)::numeric / NULLIF(imp.impressions, 0), 3)  AS view_rate,
  ROUND(COALESCE(ct.contacts, 0)::numeric   / NULLIF(pv.profile_views, 0), 3)    AS contact_rate
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
  SELECT professional_id, count(*) contacts FROM deduped_contacts GROUP BY professional_id
) ct ON ct.professional_id = p.id
WHERE COALESCE(imp.impressions, 0) > 0 OR COALESCE(ct.contacts, 0) > 0
ORDER BY contacts DESC, impressions DESC;

-- Platform funnel totals (single row).
CREATE OR REPLACE VIEW funnel_metrics AS
SELECT
  (SELECT count(*) FROM impression_events)                                AS impressions,
  (SELECT count(*) FROM profile_view_events)                             AS profile_views,
  (SELECT count(*) FROM deduped_contacts)                                AS contacts,
  ROUND((SELECT count(*)::numeric FROM profile_view_events)
        / NULLIF((SELECT count(*) FROM impression_events), 0), 4)        AS impression_to_view,
  ROUND((SELECT count(*)::numeric FROM deduped_contacts)
        / NULLIF((SELECT count(*) FROM profile_view_events), 0), 4)      AS view_to_contact;
