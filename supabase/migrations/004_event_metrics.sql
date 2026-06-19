-- P2: honest, sellable metrics. Separates raw clicks from deduped contacts and
-- exposes the per-professional "lead" view (with average ranking position) used
-- by the admin panel and, later, the paid leads panel.

-- Per-professional lead stats — the sellable numbers.
CREATE OR REPLACE VIEW professional_lead_stats AS
SELECT
  p.id   AS professional_id,
  p.name AS professional_name,
  p.slug AS professional_slug,
  c.name AS category_name,
  p.city,
  p.tier,
  p.is_claimed,
  COUNT(ce.id)                                                      AS raw_clicks,
  COUNT(DISTINCT COALESCE(ce.visitor_id, ce.ip_hash, ce.id::text))  AS unique_visitors,
  (SELECT COUNT(*) FROM deduped_contacts d WHERE d.professional_id = p.id)            AS deduped_contacts,
  (SELECT COUNT(*) FROM deduped_contacts d WHERE d.professional_id = p.id
     AND d.created_at > now() - interval '30 days')                                   AS deduped_30d,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'whatsapp')              AS whatsapp_clicks,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'phone')                AS phone_clicks,
  ROUND(AVG(ce.result_position)::numeric, 1)                       AS avg_position,
  MAX(ce.created_at)                                              AS last_contact_at
FROM professionals p
JOIN contact_events ce ON ce.professional_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.name, p.slug, c.name, p.city, p.tier, p.is_claimed
ORDER BY deduped_contacts DESC;

-- Platform-level event metrics (single row).
CREATE OR REPLACE VIEW event_metrics AS
SELECT
  (SELECT COUNT(*) FROM contact_events)                                                   AS raw_clicks,
  (SELECT COUNT(*) FROM deduped_contacts)                                                 AS deduped_contacts,
  (SELECT COUNT(*) FROM deduped_contacts WHERE created_at > now() - interval '30 days')   AS deduped_30d,
  (SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_hash, id::text)) FROM contact_events)    AS unique_contact_visitors,
  (SELECT COUNT(*) FROM search_events)                                                    AS searches,
  (SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_hash, id::text)) FROM search_events)     AS unique_search_visitors,
  -- contact_rate = deduped contacts per unique visitor who searched (conversion proxy)
  ROUND(
    (SELECT COUNT(*)::numeric FROM deduped_contacts)
    / NULLIF((SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_hash, id::text)) FROM search_events), 0),
    3
  )                                                                                       AS contact_rate;
