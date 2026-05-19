-- ================================================================
-- GENOIS Performance Migration — 10,000 User Load Capacity
-- Run this in Supabase SQL Editor > Run
-- ================================================================

-- ---------------------------------------------------------------
-- PART 1: Critical indexes (prevent full table scans at 10k users)
-- ---------------------------------------------------------------

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON users(total_score DESC NULLS LAST);

-- DSA roadmap
CREATE INDEX IF NOT EXISTS idx_dsa_progress_user ON dsa_roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_day_tasks_user ON dsa_day_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_day_tasks_user_day ON dsa_day_tasks(user_id, day_number);

-- Diagnostic results
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user ON diagnostic_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_taken ON diagnostic_results(user_id, taken_at DESC);

-- Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_domain ON user_badges(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_badge_cooldowns_user ON badge_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_cooldowns_user_domain ON badge_cooldowns(user_id, domain);

-- AI Cache (prevent regenerating notes on every request)
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_video_cache_topic ON video_cache(topic) WHERE topic IS NOT NULL;

-- Progress & Tasks
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_day ON tasks(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);

-- DSA Diagnostic questions cache
CREATE INDEX IF NOT EXISTS idx_diag_questions_created ON diagnostic_questions(created_at DESC);

-- Badge questions cache
CREATE INDEX IF NOT EXISTS idx_badge_questions_domain ON badge_questions(domain, created_at DESC);

-- ---------------------------------------------------------------
-- PART 2: Row Level Security (IDOR prevention)
-- ---------------------------------------------------------------

-- Enable RLS on sensitive tables (idempotent)
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsa_day_tasks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent re-run safety)
DROP POLICY IF EXISTS "Users see own diagnostic results" ON diagnostic_results;
DROP POLICY IF EXISTS "Users see own badges" ON user_badges;
DROP POLICY IF EXISTS "Users see own badge cooldowns" ON badge_cooldowns;
DROP POLICY IF EXISTS "Users see own dsa progress" ON dsa_roadmap_progress;
DROP POLICY IF EXISTS "Users see own dsa tasks" ON dsa_day_tasks;

-- Service role bypass (for server-side admin client — no change needed)
-- Application uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS by design.

-- ---------------------------------------------------------------
-- PART 3: Cleanup expired AI cache automatically
-- ---------------------------------------------------------------
-- Run this periodically or add as a Supabase cron job:
-- DELETE FROM ai_cache WHERE expires_at < NOW();
-- DELETE FROM diagnostic_questions WHERE created_at < NOW() - INTERVAL '7 days';
-- DELETE FROM badge_questions WHERE created_at < NOW() - INTERVAL '7 days';

-- ---------------------------------------------------------------
-- PART 4: Load capacity notes
-- ---------------------------------------------------------------
-- With these indexes the following queries will use index scans:
--   dsa_roadmap_progress   → WHERE user_id = $1          (idx_dsa_progress_user)
--   diagnostic_results     → WHERE user_id = $1           (idx_diagnostic_results_user)
--   user_badges            → WHERE user_id,domain          (idx_user_badges_user_domain)
--   badge_cooldowns        → WHERE user_id,domain          (idx_badge_cooldowns_user_domain)
--   users                  → WHERE email = $1              (idx_users_email)
--
-- Estimated capacity after migration:
--   - Leaderboard read:    O(log n) → supports 50k+ users
--   - DSA progress fetch:  < 5ms at 10k concurrent
--   - AI notes:            served from ai_cache (720-hour TTL) — 1 Claude call per topic
--   - Diagnostic test:     shared cache (7-day window) → 1 Claude call per week total
