-- Local intelligence: demand × supply by category × city.
-- Demand comes from category_browse events that carry a city (the
-- /[category]/[city] pages); supply from active professionals in that city.
-- High demand_per_pro (or zero supply) = priority for scraper/content/expansion.

CREATE OR REPLACE VIEW demand_supply_city AS
WITH demand AS (
  SELECT
    category_id,
    lower(city)                                           AS city_key,
    max(city)                                             AS city,
    count(*)                                              AS searches,
    count(DISTINCT COALESCE(visitor_id, ip_hash))         AS unique_searchers,
    count(*) FILTER (WHERE created_at > now() - interval '30 days') AS searches_30d
  FROM search_events
  WHERE source = 'category_browse'
    AND category_id IS NOT NULL
    AND city IS NOT NULL AND city <> ''
  GROUP BY category_id, lower(city)
),
supply AS (
  SELECT
    category_id,
    lower(city)                                           AS city_key,
    count(*)                                              AS active_pros,
    count(*) FILTER (WHERE phone IS NOT NULL)             AS with_phone,
    count(*) FILTER (WHERE google_review_count > 0)       AS with_reviews,
    ROUND(AVG(google_rating), 2)                          AS avg_rating
  FROM professionals
  WHERE is_active AND city IS NOT NULL
  GROUP BY category_id, lower(city)
)
SELECT
  cat.name  AS category_name,
  cat.slug  AS category_slug,
  d.city,
  d.searches,
  d.searches_30d,
  d.unique_searchers,
  COALESCE(s.active_pros, 0)  AS active_pros,
  COALESCE(s.with_phone, 0)   AS with_phone,
  COALESCE(s.with_reviews, 0) AS with_reviews,
  s.avg_rating,
  ROUND(d.searches::numeric / NULLIF(s.active_pros, 0), 2) AS demand_per_pro
FROM demand d
JOIN categories cat ON cat.id = d.category_id
LEFT JOIN supply s ON s.category_id = d.category_id AND s.city_key = d.city_key
-- under-supplied first: zero supply, then highest demand-per-pro
ORDER BY (COALESCE(s.active_pros, 0) = 0) DESC, demand_per_pro DESC NULLS LAST, d.searches DESC;
