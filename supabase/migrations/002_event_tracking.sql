-- Event tracking for monetization insights
-- Captures two signals the platform was NOT persisting before:
--   1. contact_events  -> which professionals received messages (WhatsApp/phone)
--   2. search_events   -> what categories / terms visitors are searching for
-- Both are logged server-side so they don't depend on Google Analytics sampling.

-- Messages / contact attempts a visitor makes toward a professional.
-- A row is written every time someone clicks "WhatsApp" or "Ligar".
CREATE TABLE contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),     -- denormalized for fast grouping
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'phone')),
  source TEXT,                                     -- 'profile' | 'card' | 'search'
  neighborhood TEXT,                              -- professional neighborhood at time of contact
  city TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Searches / category browses performed by visitors.
-- source = 'search'          -> free-text query on /buscar
-- source = 'category_browse' -> visit to /categoria/[slug]
CREATE TABLE search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,                                     -- raw query (null for category browse)
  normalized_query TEXT,                          -- lowercased/trimmed for aggregation
  category_id UUID REFERENCES categories(id),     -- resolved/known category when available
  category_slug TEXT,
  source TEXT NOT NULL DEFAULT 'search' CHECK (source IN ('search', 'category_browse')),
  result_count INTEGER,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for the analytics queries below
CREATE INDEX idx_contact_events_professional ON contact_events(professional_id);
CREATE INDEX idx_contact_events_category ON contact_events(category_id);
CREATE INDEX idx_contact_events_created ON contact_events(created_at DESC);
CREATE INDEX idx_search_events_category ON search_events(category_id);
CREATE INDEX idx_search_events_normalized ON search_events(normalized_query);
CREATE INDEX idx_search_events_created ON search_events(created_at DESC);

-- ── Convenience views for the two monetization questions ──────────────────────

-- Q1: "Which professionals received messages?"
CREATE OR REPLACE VIEW professional_contact_stats AS
SELECT
  p.id            AS professional_id,
  p.name          AS professional_name,
  p.slug          AS professional_slug,
  c.name          AS category_name,
  p.city,
  p.neighborhood,
  p.is_claimed,
  p.tier,
  COUNT(ce.id)                                            AS total_contacts,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'whatsapp')     AS whatsapp_contacts,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'phone')        AS phone_contacts,
  COUNT(ce.id) FILTER (WHERE ce.created_at > now() - interval '30 days') AS contacts_30d,
  MAX(ce.created_at)                                      AS last_contact_at
FROM professionals p
JOIN contact_events ce ON ce.professional_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.name, p.slug, c.name, p.city, p.neighborhood, p.is_claimed, p.tier
ORDER BY total_contacts DESC;

-- Q2: "Which categories are searched the most?"
-- Combines explicit category browses with free-text searches that resolved to a category.
CREATE OR REPLACE VIEW category_search_stats AS
SELECT
  c.id            AS category_id,
  c.name          AS category_name,
  c.slug          AS category_slug,
  COUNT(se.id)                                                    AS total_searches,
  COUNT(se.id) FILTER (WHERE se.source = 'search')                AS text_searches,
  COUNT(se.id) FILTER (WHERE se.source = 'category_browse')       AS category_browses,
  COUNT(se.id) FILTER (WHERE se.created_at > now() - interval '30 days') AS searches_30d,
  AVG(se.result_count) FILTER (WHERE se.source = 'search')        AS avg_results
FROM categories c
JOIN search_events se ON se.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY total_searches DESC;

-- Free-text terms that did NOT resolve to a category (demand gaps / new categories to add).
CREATE OR REPLACE VIEW top_unmatched_search_terms AS
SELECT
  normalized_query,
  COUNT(*)               AS searches,
  AVG(result_count)      AS avg_results,
  MAX(created_at)        AS last_searched_at
FROM search_events
WHERE source = 'search'
  AND category_id IS NULL
  AND normalized_query IS NOT NULL
  AND normalized_query <> ''
GROUP BY normalized_query
ORDER BY searches DESC;
