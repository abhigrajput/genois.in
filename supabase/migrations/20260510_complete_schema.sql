-- ── ENABLE EXTENSIONS ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. DOMAINS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS domains (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure domains exist so foreign keys don't fail
INSERT INTO domains (slug, label, description) 
VALUES 
  ('fullstack', 'Fullstack Development', 'Learn fullstack engineering'),
  ('dsa', 'Data Structures & Algorithms', 'Master DSA for interviews')
ON CONFLICT (slug) DO NOTHING;

-- ── 2. PROGRESS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  current_week INTEGER DEFAULT 1,
  current_month INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  progress_percent FLOAT DEFAULT 0,
  day_progress FLOAT DEFAULT 0,
  week_progress FLOAT DEFAULT 0,
  month_progress FLOAT DEFAULT 0,
  domain_progress FLOAT DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,
  diagnostic_score INTEGER DEFAULT 0,
  diagnostic_taken BOOLEAN DEFAULT FALSE,
  tasks_completed_today INTEGER DEFAULT 0,
  last_completed_date TIMESTAMPTZ,
  streak_tokens INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. SKILL IDENTITY ────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skill_level TEXT DEFAULT 'beginner',
  progress_percent FLOAT DEFAULT 0,
  job_ready_score FLOAT DEFAULT 0,
  domain_level TEXT DEFAULT 'beginner',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TRIALS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. SUBSCRIPTIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'premium',
  status TEXT DEFAULT 'active',
  payment_id TEXT,
  amount FLOAT,
  currency TEXT DEFAULT 'INR',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. ROADMAP ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_slug TEXT REFERENCES domains(slug) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  resource_url TEXT,
  article_url TEXT,
  doc_url TEXT,
  difficulty TEXT DEFAULT 'beginner',
  estimated_min INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_slug, day_number)
);

-- ── 7. TASKS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmap(id) ON DELETE CASCADE,
  domain_slug TEXT,
  topic TEXT,
  day_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number, type)
);

-- ── 8. TESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmap(id) ON DELETE CASCADE,
  domain_slug TEXT,
  topic TEXT,
  type TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  total_questions INTEGER DEFAULT 5,
  correct_answers INTEGER DEFAULT 0,
  score FLOAT DEFAULT 0,
  result TEXT DEFAULT 'pending',
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. ANALYTICS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  test_score FLOAT DEFAULT 0,
  coding_score INTEGER DEFAULT 0,
  projects_done INTEGER DEFAULT 0,
  daily_score INTEGER DEFAULT 0,
  streak_day INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── 10. CHAT HISTORY ─────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  mode TEXT DEFAULT 'chatbot',
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. MENTOR HISTORY ───────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  mode TEXT DEFAULT 'explain',
  domain TEXT,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 12. DIAGNOSTIC TESTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  domain_slug TEXT,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  skill_level TEXT DEFAULT 'beginner',
  completed BOOLEAN DEFAULT FALSE,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 13. SCORE EVENTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  points INTEGER NOT NULL,
  reason TEXT,
  challenge TEXT,
  event_type TEXT,
  description TEXT,
  project TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 14. CONFESSIONS & UPVOTES ────────────────────────
CREATE TABLE IF NOT EXISTS confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  domain_slug TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confession_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, confession_id)
);

-- ── 15. DUELS & ANSWERS ──────────────────────────────
CREATE TABLE IF NOT EXISTS duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  domain_slug TEXT,
  questions JSONB DEFAULT '[]',
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  challenger_finished BOOLEAN DEFAULT FALSE,
  opponent_finished BOOLEAN DEFAULT FALSE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS duel_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID REFERENCES duels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  time_taken INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 16. FEEDBACK ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'general',
  subject TEXT,
  message TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 17. NOTIFICATION PREFERENCES & LOGS ──────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  morning_time TEXT DEFAULT '07:00',
  evening_time TEXT DEFAULT '19:00',
  push_subscription JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT,
  title TEXT,
  message TEXT NOT NULL,
  icon TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 18. PREP PACKS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  payment_id TEXT,
  amount INTEGER DEFAULT 199,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company)
);

-- ── 19. PROJECTS & PROGRESS ──────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_slug TEXT REFERENCES domains(slug) ON DELETE CASCADE,
  week_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'beginner',
  steps JSONB DEFAULT '[]',
  tech_stack TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 4,
  status TEXT DEFAULT 'not_started',
  score INTEGER DEFAULT 0,
  step_notes JSONB DEFAULT '[]',
  ai_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- ── 20. OUTCOMES & PAYMENTS ──────────────────────────
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  got_job BOOLEAN DEFAULT FALSE,
  got_interview BOOLEAN DEFAULT FALSE,
  company_name TEXT,
  ctc_lpa FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 21. SKILL VERIFICATIONS & AUCTIONS ────────────────
CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_slug TEXT NOT NULL,
  level TEXT DEFAULT 'beginner',
  score INTEGER DEFAULT 0,
  badge TEXT,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  weak_areas TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_auction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_bid INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 22. STREAK REWARDS ───────────────────────────────
CREATE TABLE IF NOT EXISTS streak_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 23. USER EVENTS & PROGRESS VIEW ──────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page TEXT,
  feature TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 24. CRON & WEEKLY LOGS ───────────────────────────
CREATE TABLE IF NOT EXISTS weekly_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_of)
);

-- ── 25. CUSTOM ROADMAPS & TASKS ──────────────────────
CREATE TABLE IF NOT EXISTS custom_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_roadmap_id UUID REFERENCES custom_roadmaps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 26. APTITUDE SESSIONS & PROGRESS ─────────────────
CREATE TABLE IF NOT EXISTS aptitude_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aptitude_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_attempted INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_session_date DATE,
  weak_topics TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 27. AUCTION BIDS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES skill_auction(id) ON DELETE CASCADE,
  recruiter_name TEXT NOT NULL,
  recruiter_company TEXT NOT NULL,
  recruiter_email TEXT NOT NULL,
  bid_amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 28. ADMIN ACTIONS & AI CACHE ─────────────────────
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details TEXT,
  days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response TEXT NOT NULL,
  hits INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 29. ANXIETY CHAT & CHALLENGES ────────────────────
CREATE TABLE IF NOT EXISTS anxiety_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  status TEXT DEFAULT 'attempted',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 30. WEAK & STRONG TOPICS ─────────────────────────
CREATE TABLE IF NOT EXISTS weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain_slug TEXT REFERENCES domains(slug) ON DELETE CASCADE,
  test_count INTEGER DEFAULT 0,
  avg_score FLOAT DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE TABLE IF NOT EXISTS strong_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain_slug TEXT REFERENCES domains(slug) ON DELETE CASCADE,
  test_count INTEGER DEFAULT 0,
  avg_score FLOAT DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- ── 31. MOCK INTERVIEWS & INTERVIEW SESSIONS ──────────
CREATE TABLE IF NOT EXISTS mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT,
  score INTEGER DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rounds INTEGER DEFAULT 1,
  current_round INTEGER DEFAULT 1,
  length INTEGER DEFAULT 30,
  overall_score INTEGER DEFAULT 0,
  verdict TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 32. COMPANIES, CHALLENGES, DISCUSSIONS ───────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 33. DSA DAY TASKS & DSA DIAGNOSTIC TESTS ─────────
CREATE TABLE IF NOT EXISTS dsa_day_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  day_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

CREATE TABLE IF NOT EXISTS dsa_diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id REFERENCES users(id) ON DELETE CASCADE,
  theory_score INTEGER DEFAULT 0,
  coding_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  determined_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── 34. MENTOR PROFILES & BOOKINGS ────────────────────
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT,
  price INTEGER DEFAULT 299,
  rating FLOAT DEFAULT 5.0,
  total_sessions INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  scheduled_at TIMESTAMPTZ NOT NULL,
  amount INTEGER NOT NULL,
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 35. USER PROGRESS VIEW ───────────────────────────
CREATE OR REPLACE VIEW user_progress AS
SELECT 
  u.id AS user_id,
  COALESCE(s.total_score, 0) AS total_score,
  COALESCE(p.current_day, 1) AS current_day,
  COALESCE(p.streak, 0) AS streak
FROM users u
LEFT JOIN scores s ON s.user_id = u.id
LEFT JOIN progress p ON p.user_id = u.id;
