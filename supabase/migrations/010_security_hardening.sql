-- Security hardening (Codex round 3).

-- 1) Limit SMS code-confirmation attempts (anti brute-force on /api/verify/confirm).
ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- 2) Give impression/profile_view events the same hashed fallback identity as
--    contact/search, so rate-limit and dedup still work when visitor_id is absent.
ALTER TABLE impression_events
  ADD COLUMN IF NOT EXISTS ua_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

ALTER TABLE profile_view_events
  ADD COLUMN IF NOT EXISTS ua_hash TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_impression_iphash ON impression_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_profile_view_iphash ON profile_view_events(ip_hash);
