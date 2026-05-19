-- Migration: Skill Verification Badge system
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS badge_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain     TEXT NOT NULL,
  questions  JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(domain)
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL,
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  level      TEXT NOT NULL DEFAULT 'proficient' CHECK (level IN ('proficient','expert','master')),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, domain)
);

CREATE TABLE IF NOT EXISTS badge_cooldowns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL,
  failed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlocks_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id    ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_expires_at ON user_badges (expires_at);
CREATE INDEX IF NOT EXISTS idx_badge_cooldowns_user   ON badge_cooldowns (user_id, domain);
CREATE INDEX IF NOT EXISTS idx_badge_questions_domain ON badge_questions (domain);
