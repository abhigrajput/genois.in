-- Pattern-based DSA roadmap: per-pattern problem tracking.
--
-- The roadmap's unit of progression moved from DAY to PATTERN (see
-- lib/dsaPatterns.js). Advancing out of a pattern requires two independent
-- signals:
--
--   1. ACCURACY  — already available with no schema at all, from the evidence
--                  bus (public.test_questions.skill_breakdown, 20260731). Each
--                  pattern is defined as a set of `dsa.*` skill tags, so
--                  "70% on Two Pointers" is a query we can already answer.
--
--   2. COVERAGE  — did they actually work the problem list. Nothing in the
--                  schema recorded this: `tasks` is per-DAY and per-task-type,
--                  and the problems live on LeetCode, not in our database. That
--                  is the one gap this migration fills.
--
-- ONE TABLE, ADDITIVE ONLY. No existing column is renamed, retyped or dropped.
-- Nothing else in the roadmap reads it, so /roadmap, /api/roadmap/daily, the
-- day cache and the Phase 3 gap targeting all keep working byte-for-byte.
--
-- DEGRADES GRACEFULLY UNTIL APPLIED. lib/dsaPatternProgress.js catches the
-- missing-table error from PostgREST and returns `coverageAvailable: false`;
-- the plan then falls back to an evidence-only mastery bar (a HIGHER one — see
-- MASTERY_RULES.DEGRADED_MIN_EVIDENCE), the UI hides the problem checkboxes,
-- and the page says per-problem tracking is unavailable rather than silently
-- showing 0/8 forever. Writes from POST /api/roadmap/patterns return
-- `saved: false` in that state instead of erroring.
--
-- Schema-qualified throughout: unqualified DDL has landed outside `public`
-- twice on this project (test_questions, coding_tests), and `public` is the
-- only schema PostgREST exposes.

CREATE TABLE IF NOT EXISTS public.dsa_pattern_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- A pattern id from the hand-authored list in lib/dsaPatterns.js
  -- ('arrays-hashing', 'two-pointers', 'sliding-window', ...). Deliberately
  -- TEXT and deliberately NOT a foreign key: the pattern taxonomy is code, not
  -- data, for the same reason the skill taxonomy is — it must be reviewable in
  -- a diff and identical across environments. The API validates the id against
  -- that list before writing, so an unknown value cannot get in this way.
  pattern_id  TEXT NOT NULL,

  -- Solved problem ids (LeetCode slugs), in the pattern's authored order.
  -- Rewritten as a whole set on every toggle rather than appended to, so a
  -- double-click cannot produce duplicates. Ids not in the authored list are
  -- filtered out at read time, so a later curriculum edit can't leave stale
  -- entries inflating a student's coverage.
  solved_problems JSONB NOT NULL DEFAULT '[]'::jsonb,

  started_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Stamped the FIRST time the pattern clears both bars, and never cleared
  -- afterwards. Mastery is a moment in the student's history; later evidence
  -- moving the accuracy around should not rewrite when it happened.
  mastered_at TIMESTAMPTZ,

  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- One row per (student, pattern) — the upsert target.
  UNIQUE (user_id, pattern_id)
);

-- The only access path: "this user's whole pattern board", read once per
-- roadmap page load.
CREATE INDEX IF NOT EXISTS dsa_pattern_progress_user_idx
  ON public.dsa_pattern_progress (user_id);

-- Every read and write goes through the service-role admin client
-- (lib/supabaseAdmin.js), same as the rest of the roadmap. RLS on with no
-- policy therefore denies anon/authenticated clients outright while the server
-- path is unaffected — a student cannot read or forge another student's
-- progress by hitting PostgREST directly with their own token.
ALTER TABLE public.dsa_pattern_progress ENABLE ROW LEVEL SECURITY;

-- Make PostgREST pick up the new table immediately.
NOTIFY pgrst, 'reload schema';
