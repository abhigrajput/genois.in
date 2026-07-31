-- Evidence Bus (Phase 1): make `public.test_questions` the single evidence
-- table every assessment type writes to, and give it a controlled skill tag.
--
-- Before: the 20260715 review table already stored per-question rows, but only
-- 4 of 9 assessment flows wrote to it (aptitude, tests, dsa_diagnostic,
-- voice_interview), and the only classification was a free-text `topic` copied
-- straight from whatever the AI generator emitted — "Arrays Introduction &
-- Basics", "PostgreSQL indexing", "Floyd-Warshall". Two attempts about the same
-- skill got two different topic strings, so `topic_breakdown` could never be
-- summed across assessments.
--
-- After: every flow writes here, and every question entry additionally carries
-- a canonical skill id from the hand-authored vocabulary in
-- lib/skillTaxonomy.js (`dsa.binary-search`, `cs.db-indexing`,
-- `apt.percentages`, `comm.star-method`, ...). One query per user now answers
-- "what does this student actually know", regardless of which assessment
-- produced the evidence.
--
-- ADDITIVE ONLY. No existing column is renamed, retyped or dropped, so /review
-- and every current read keeps working byte-for-byte. Until this file is
-- applied, lib/attemptReview.js detects the missing columns (PostgREST PGRST204
-- / Postgres 42703) and retries the insert without them — writes keep landing,
-- just without skill tags.
--
-- Schema-qualified throughout: unqualified DDL has landed outside `public`
-- twice on this project (test_questions, coding_tests), and `public` is the
-- only schema PostgREST exposes.

-- ── 1. Canonical skill evidence ─────────────────────────────────────────────
-- { "dsa.binary-search": { "correct": 3, "total": 5 }, ... }
-- Mirrors the shape of the existing `topic_breakdown` so readers that already
-- understand that column need no new parsing logic.
ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS skill_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Flat, de-duplicated list of the skill ids present in this attempt. Redundant
-- with the keys of `skill_breakdown`, and deliberately so: a scalar array is
-- what a GIN index can answer "which attempts touched skill X" from, without
-- unnesting JSONB on every row.
ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS skill_tags TEXT[] NOT NULL DEFAULT '{}'::text[];

-- ── 2. Normalized attempt family ────────────────────────────────────────────
-- `attempt_type` stays exactly as-is (daily | weekly | monthly | revision |
-- aptitude | dsa_diagnostic | voice_interview | diagnostic | coding |
-- mock_interview | interview_round) — existing rows and existing reads depend
-- on those literals. This is the coarse grouping on top of it, so readiness
-- can weigh "proved it under interview pressure" differently from "picked the
-- right MCQ option":
--   mcq       — multiple choice, objectively graded (tests, aptitude, diagnostics)
--   coding    — wrote and submitted code, AI-reviewed
--   interview — spoken/typed answers, AI-scored against a rubric
--   resume    — document audit checks, pass/fail per check
-- Nullable and unconstrained on purpose: old rows keep NULL, and a new family
-- must not require a migration to start writing.
ALTER TABLE public.test_questions
  ADD COLUMN IF NOT EXISTS attempt_category TEXT;

-- ── 3. Indexes ──────────────────────────────────────────────────────────────
-- The readiness aggregate is always "this user, these skills" — GIN over the
-- tag array is what makes the skill filter cheap.
CREATE INDEX IF NOT EXISTS test_questions_skill_tags_idx
  ON public.test_questions USING GIN (skill_tags);

-- Category-sliced history ("all this user's interview evidence, newest first").
CREATE INDEX IF NOT EXISTS test_questions_user_category_idx
  ON public.test_questions (user_id, attempt_category, taken_at DESC);

-- ── 4. Backfill the category for rows already in the table ──────────────────
-- Best-effort, derived from the attempt_type that wrote them. Rows whose type
-- we don't recognise are left NULL rather than guessed at.
UPDATE public.test_questions
SET attempt_category = CASE
  WHEN attempt_type IN ('daily', 'weekly', 'monthly', 'revision', 'aptitude', 'dsa_diagnostic', 'diagnostic') THEN 'mcq'
  WHEN attempt_type IN ('coding') THEN 'coding'
  WHEN attempt_type IN ('voice_interview', 'mock_interview', 'interview_round') THEN 'interview'
  WHEN attempt_type IN ('resume') THEN 'resume'
  ELSE NULL
END
WHERE attempt_category IS NULL;

-- NOTE: skill_breakdown / skill_tags are intentionally NOT backfilled. Deriving
-- tags for historic rows means re-running the resolver over their `questions`
-- JSONB, which is application logic, not SQL — and mis-tagged history is worse
-- than absent history for a readiness score. Old rows simply carry no skill
-- evidence; everything written after this migration does.

-- Make PostgREST pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';
