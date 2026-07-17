-- Schema drift fix: columns the API writes but prod never got.
-- Found by the 2026-07-17 8-flow prod smoke (throwaway user, cleaned up).
--
-- 1) scores — tasks/complete, tests/submit, coding/submit, projects/[id]/submit
--    and auth/reset-progress all PATCH per-type breakdown columns alongside
--    total_score. PostgREST rejects the WHOLE update when any column is
--    missing (PGRST204), and none of those routes check the update's error —
--    so on prod the +points silently never landed: score_events got the event,
--    scores.total_score stayed 0 (dashboard/leaderboard show 0 while the new
--    /analytics — which derives from score_events — shows the points).
--
-- 2) aptitude_sessions — the session-based quiz flow (category/topic/questions
--    persisted per attempt) inserts columns that exist in no migration; prod
--    still has the original skeleton (score/completed only). The insert fails
--    → API returns session:null → submit has no sessionId → scoring 404s, so
--    the aptitude → result → /review chain is broken on prod.
--
-- 3) aptitude_progress — the submit path bumps `<category>_score`
--    (quant_score / logical_score / verbal_score per lib/aptitudeConfig.js);
--    none of the three exist in prod.
--
-- Additive-only; every ADD COLUMN is IF NOT EXISTS so this is safe to re-run.
-- Schema-qualified: an unqualified ALTER can resolve against a non-public
-- search_path schema (see 20260715 postmortem).

ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS task_score    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS test_score    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coding_score  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS project_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domain_score  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_score  INTEGER DEFAULT 0;

ALTER TABLE public.aptitude_sessions
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS topic           TEXT,
  ADD COLUMN IF NOT EXISTS questions       JSONB,
  ADD COLUMN IF NOT EXISTS answers         JSONB,
  ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;

ALTER TABLE public.aptitude_progress
  ADD COLUMN IF NOT EXISTS quant_score   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logical_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verbal_score  INTEGER DEFAULT 0;

-- Make PostgREST pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';
