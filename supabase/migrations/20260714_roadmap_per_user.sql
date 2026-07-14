-- Personalize the roadmap cache PER USER.
--
-- Before: roadmap was keyed only by (domain_slug, day_number) — a domain-GLOBAL
-- cache. The first student to generate a given day "won", and every other
-- student in that domain inherited their target-company / weak-subject
-- personalization. Saving a placement profile could never change the roadmap
-- because there were no per-user rows to regenerate.
--
-- After: each user owns a row per day. The daily route reads/writes/invalidates
-- keyed on user_id, so target companies, weak subjects and the months-to-
-- placement timeline actually reshape the content.

ALTER TABLE roadmap
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Drop the old domain-global uniqueness so each user can own a row per day.
-- (Inline `unique(domain_slug, day_number)` was auto-named *_key by Postgres.)
ALTER TABLE roadmap DROP CONSTRAINT IF EXISTS roadmap_domain_slug_day_number_key;

-- New per-user uniqueness — the ON CONFLICT target for the daily upsert.
-- NULL user_id rows (legacy domain-global cache) are treated as distinct by
-- Postgres, so they coexist harmlessly and are simply ignored by per-user reads.
CREATE UNIQUE INDEX IF NOT EXISTS roadmap_user_day_key ON roadmap(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_roadmap_user_day ON roadmap(user_id, day_number);
