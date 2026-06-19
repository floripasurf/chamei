-- Marketing attribution: first-touch UTM on contacts (which channels convert).

ALTER TABLE contact_events
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_events_utm ON contact_events(utm_source);

-- Contacts by acquisition source (direct = no UTM).
CREATE OR REPLACE VIEW utm_stats AS
SELECT
  COALESCE(utm_source, '(direto)')                            AS source,
  utm_medium                                                  AS medium,
  utm_campaign                                                AS campaign,
  count(*)                                                    AS contacts,
  count(*) FILTER (WHERE created_at > now() - interval '30 days') AS contacts_30d,
  count(DISTINCT COALESCE(visitor_id, ip_hash, id::text))     AS unique_visitors
FROM contact_events
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY contacts DESC;
