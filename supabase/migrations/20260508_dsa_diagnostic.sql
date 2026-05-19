-- Migration: DSA Diagnostic system tables
-- Run in Supabase SQL Editor

-- Stores AI-generated question sets (shared, refreshed every 7 days)
CREATE TABLE IF NOT EXISTS diagnostic_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questions  JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores per-user diagnostic results
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level      TEXT NOT NULL CHECK (level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  breakdown  JSONB,
  taken_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user_id  ON diagnostic_results (user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_taken_at ON diagnostic_results (taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_questions_created ON diagnostic_questions (created_at DESC);
