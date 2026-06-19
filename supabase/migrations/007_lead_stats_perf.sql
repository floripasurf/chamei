-- Perf: professional_lead_stats used a correlated subquery against
-- deduped_contacts per professional (expensive at volume). Aggregate
-- deduped_contacts ONCE and LEFT JOIN. Same columns as before.

DROP VIEW IF EXISTS professional_lead_stats;
CREATE VIEW professional_lead_stats AS
WITH dedup AS (
  SELECT
    professional_id,
    count(*)                                                          AS deduped_contacts,
    count(*) FILTER (WHERE created_at > now() - interval '30 days')   AS deduped_30d
  FROM deduped_contacts
  GROUP BY professional_id
)
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
  MAX(COALESCE(d.deduped_contacts, 0))                              AS deduped_contacts,
  MAX(COALESCE(d.deduped_30d, 0))                                   AS deduped_30d,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'whatsapp')              AS whatsapp_clicks,
  COUNT(ce.id) FILTER (WHERE ce.channel = 'phone')                AS phone_clicks,
  ROUND(AVG(ce.result_position)::numeric, 1)                       AS avg_position,
  MAX(ce.created_at)                                              AS last_contact_at
FROM professionals p
JOIN contact_events ce ON ce.professional_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN dedup d ON d.professional_id = p.id
GROUP BY p.id, p.name, p.slug, c.name, p.city, p.tier, p.is_claimed
ORDER BY deduped_contacts DESC;
