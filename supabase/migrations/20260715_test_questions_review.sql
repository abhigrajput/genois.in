-- Assessment review: persist the FULL question set of every attempt.
--
-- Before: each assessment stored only aggregates — `diagnostic_results` keeps
-- level/score/breakdown, `interview_results` keeps 3 metric averages, and
-- `tests` drops the user's picks at submit time. After a test the student
-- could never see WHICH answers were wrong or why.
--
-- After: one append-only row per finished attempt, for every assessment type.
-- `questions` holds normalized entries:
--   [{ question, code, options, correct_answer, user_answer, is_correct,
--      explanation, topic }]
-- The review page renders straight from this; the generators also read the
-- user's recent rows to EXCLUDE already-seen questions on retakes.
--
-- Code degrades gracefully if this migration isn't applied: writes are
-- fire-and-forget, and the review page shows a "review data not available"
-- state instead of erroring.

CREATE TABLE IF NOT EXISTS test_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_type    TEXT NOT NULL,   -- dsa_diagnostic | aptitude | daily | weekly | monthly | revision | voice_interview | mock_interview
  source_id       UUID,            -- id of the row in the source table (tests / aptitude_sessions / ...), when one exists
  topic           TEXT,
  score           INTEGER,         -- 0-100
  total_questions INTEGER,
  correct_count   INTEGER,
  topic_breakdown JSONB DEFAULT '{}'::jsonb,  -- { topic: { correct, total } }
  questions       JSONB NOT NULL DEFAULT '[]'::jsonb,
  taken_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS test_questions_user_taken_idx
  ON test_questions(user_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS test_questions_user_type_idx
  ON test_questions(user_id, attempt_type, taken_at DESC);
