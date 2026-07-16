-- Roadmap depth: per-day metadata generated alongside the day's content.
--
-- `meta` holds the normalized object built by buildDayMeta() in
-- lib/curriculumGenerator.js:
--   { estimated_time: 90,            -- minutes (number)
--     difficulty: 'easy|medium|hard',-- AI-judged difficulty of TODAY
--     prerequisites: [...],          -- topics assumed known (may be empty)
--     learning_objectives: [...] }   -- 1-3 outcome bullets
--
-- Code degrades gracefully if this migration isn't applied: the roadmap
-- upsert retries without `meta` (still per-user), and the page simply skips
-- the metadata badges for rows that lack it. Old cached rows are never
-- regenerated for this — they render without badges.
--
-- Schema-qualified: an unqualified ALTER can resolve against a non-public
-- search_path schema (see 20260715 postmortem).
ALTER TABLE public.roadmap
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Make PostgREST pick up the new column immediately.
NOTIFY pgrst, 'reload schema';
