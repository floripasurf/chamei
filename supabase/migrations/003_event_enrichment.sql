-- P1: enrich events so contacts/searches are sellable and provable.
-- Adds visitor identity (first-party id + hashed UA/IP), ranking position at
-- click time, and request context. Hashes are HMACs (non-reversible) — we never
-- store raw IPs or user agents (LGPD).

ALTER TABLE contact_events
  ADD COLUMN IF NOT EXISTS visitor_id      TEXT,
  ADD COLUMN IF NOT EXISTS result_position INTEGER,
  ADD COLUMN IF NOT EXISTS pathname        TEXT,
  ADD COLUMN IF NOT EXISTS ua_hash         TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash         TEXT;

ALTER TABLE search_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT,
  ADD COLUMN IF NOT EXISTS pathname   TEXT,
  ADD COLUMN IF NOT EXISTS ua_hash    TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash    TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_events_visitor ON contact_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_search_events_visitor  ON search_events(visitor_id);

-- A "deduped" contact = one valid contact per (professional, channel, visitor)
-- inside a 12h window. raw_clicks keep everything; this view is the honest
-- lead count used for billing/ranking proof.
CREATE OR REPLACE VIEW deduped_contacts AS
SELECT DISTINCT ON (professional_id, channel, coalesce(visitor_id, ip_hash, id::text), bucket)
  id, professional_id, category_id, channel, source, visitor_id,
  result_position, city, neighborhood, created_at
FROM (
  SELECT *, date_trunc('hour', created_at)
            - (extract(hour from created_at)::int % 12) * interval '1 hour' AS bucket
  FROM contact_events
) c
ORDER BY professional_id, channel, coalesce(visitor_id, ip_hash, id::text), bucket, created_at;
