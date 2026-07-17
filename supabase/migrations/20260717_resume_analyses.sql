-- Resume ATS Breakdown: optional per-user analysis history.
--
-- The /resume feature works fully WITHOUT this table — analyses are returned
-- straight to the client. When this migration is applied, each successful
-- analysis is additionally saved here (fire-and-forget insert) and the page
-- shows a "Past analyses" list. If the table is missing, the API reports
-- `available: false` and the insert failure is logged and ignored.
--
-- `analysis` holds the full normalized result:
--   { ats_score, score_explanation, missing_keywords, weak_bullets,
--     missing_impact, formatting_flags }

-- Schema-qualified throughout: an unqualified CREATE TABLE lands in the first
-- schema of the executing role's search_path, which is not always `public`
-- (this bit us with test_questions — PostgREST then never sees the table).
CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ats_score      INTEGER,         -- 0-100
  target_role    TEXT,
  target_company TEXT,
  analysis       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resume_analyses_user_created_idx
  ON public.resume_analyses(user_id, created_at DESC);

-- Make PostgREST pick up the new table immediately.
NOTIFY pgrst, 'reload schema';
