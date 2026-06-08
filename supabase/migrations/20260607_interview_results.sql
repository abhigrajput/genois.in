-- ─────────────────────────────────────────────────────────────────────────
-- Voice Interview Simulator — completed-session results
-- One row per finished voice mock interview (10 spoken answers, 3-metric scoring)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode                  TEXT NOT NULL,                 -- technical | hr | mixed
  domain                TEXT,
  target_company        TEXT,
  total_score           DECIMAL(5,2),
  technical_accuracy    DECIMAL(5,2),
  communication_clarity DECIMAL(5,2),
  confidence_score      DECIMAL(5,2),
  grade                 TEXT,
  questions_answered    INTEGER,
  duration_seconds      INTEGER,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interview_results_user_idx  ON interview_results(user_id);
CREATE INDEX IF NOT EXISTS interview_results_score_idx ON interview_results(total_score);
