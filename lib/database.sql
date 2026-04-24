-- ── ENABLE UUID EXTENSION ─────────────────────────
create extension if not exists "uuid-ossp";

-- ── DOMAINS ───────────────────────────────────────
create table if not exists domains (
  slug text primary key,
  label text not null,
  icon text,
  color text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── USERS ─────────────────────────────────────────
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  college text,
  year text default '1st Year',
  domain_slug text references domains(slug) default 'fullstack',
  level text default 'beginner',
  learning_speed text default 'normal',
  plan text default 'trial',
  trial_start timestamptz,
  trial_end timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── SCORES ────────────────────────────────────────
create table if not exists scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  total_score integer default 0,
  domain_score integer default 0,
  task_score integer default 0,
  test_score integer default 0,
  coding_score integer default 0,
  project_score integer default 0,
  streak_score integer default 0,
  updated_at timestamptz default now()
);

-- ── SCORE EVENTS ──────────────────────────────────
create table if not exists score_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  points integer not null,
  reason text,
  created_at timestamptz default now()
);

-- ── PROGRESS ──────────────────────────────────────
create table if not exists progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  current_day integer default 1,
  current_week integer default 1,
  current_month integer default 1,
  streak integer default 0,
  last_active_date timestamptz,
  progress_percent float default 0,
  day_progress float default 0,
  week_progress float default 0,
  month_progress float default 0,
  domain_progress float default 0,
  weekly_score integer default 0,
  monthly_score integer default 0,
  updated_at timestamptz default now()
);

-- ── SKILL IDENTITY ────────────────────────────────
create table if not exists skill_identity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  skill_level text default 'beginner',
  progress_percent float default 0,
  job_ready_score float default 0,
  domain_level text default 'beginner',
  updated_at timestamptz default now()
);

-- ── ROADMAP ───────────────────────────────────────
create table if not exists roadmap (
  id uuid primary key default uuid_generate_v4(),
  domain_slug text references domains(slug),
  week_number integer not null,
  day_number integer not null,
  topic text not null,
  description text,
  video_url text,
  resource_url text,
  article_url text,
  doc_url text,
  difficulty text default 'beginner',
  estimated_min integer default 90,
  created_at timestamptz default now(),
  unique(domain_slug, day_number)
);

-- ── RESOURCES ─────────────────────────────────────
create table if not exists resources (
  id uuid primary key default uuid_generate_v4(),
  domain_slug text references domains(slug),
  roadmap_id uuid references roadmap(id),
  type text not null,
  title text,
  url text not null,
  description text,
  created_at timestamptz default now()
);

-- ── TASKS ─────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  roadmap_id uuid references roadmap(id),
  domain_slug text,
  topic text,
  day_number integer not null,
  type text not null,
  status text default 'pending',
  score integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, day_number, type)
);

-- ── TESTS ─────────────────────────────────────────
create table if not exists tests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  roadmap_id uuid references roadmap(id),
  domain_slug text,
  topic text,
  type text not null,
  difficulty text default 'beginner',
  questions jsonb,
  answers jsonb,
  total_questions integer default 5,
  correct_answers integer default 0,
  score float default 0,
  result text default 'pending',
  taken_at timestamptz default now()
);

-- ── CODING TESTS ──────────────────────────────────
create table if not exists coding_tests (
  id uuid primary key default uuid_generate_v4(),
  domain_slug text references domains(slug),
  topic text,
  title text not null,
  problem text not null,
  input_desc text,
  output_desc text,
  example_input text,
  example_output text,
  hints text[],
  difficulty text default 'beginner',
  created_at timestamptz default now()
);

-- ── CODING SUBMISSIONS ────────────────────────────
create table if not exists coding_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  coding_test_id uuid references coding_tests(id),
  code text not null,
  language text default 'javascript',
  status text default 'submitted',
  score integer default 0,
  ai_feedback text,
  submitted_at timestamptz default now()
);

-- ── PROJECTS ──────────────────────────────────────
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  domain_slug text references domains(slug),
  week_number integer,
  title text not null,
  description text,
  difficulty text default 'beginner',
  steps jsonb,
  tech_stack text[],
  resources text[],
  created_at timestamptz default now()
);

-- ── PROJECT PROGRESS ──────────────────────────────
create table if not exists project_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  project_id uuid references projects(id),
  current_step integer default 0,
  total_steps integer default 4,
  status text default 'not_started',
  score integer default 0,
  step_notes jsonb,
  ai_feedback text,
  submitted_at timestamptz,
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, project_id)
);

-- ── NOTES ─────────────────────────────────────────
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  roadmap_id uuid references roadmap(id),
  domain_slug text,
  topic text,
  type text default 'theory',
  content text not null,
  ai_generated boolean default true,
  created_at timestamptz default now(),
  unique(user_id, roadmap_id, type)
);

-- ── ANALYTICS ─────────────────────────────────────
create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  tasks_completed integer default 0,
  test_score float default 0,
  coding_score integer default 0,
  projects_done integer default 0,
  daily_score integer default 0,
  streak_day integer default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- ── WEAK TOPICS ───────────────────────────────────
create table if not exists weak_topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  topic text not null,
  domain_slug text,
  test_count integer default 0,
  avg_score float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, topic)
);

-- ── STRONG TOPICS ─────────────────────────────────
create table if not exists strong_topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  topic text not null,
  domain_slug text,
  test_count integer default 0,
  avg_score float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, topic)
);

-- ── TRIALS ────────────────────────────────────────
create table if not exists trials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  start_date timestamptz default now(),
  end_date timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── SUBSCRIPTIONS ─────────────────────────────────
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references users(id) on delete cascade,
  plan text default 'premium',
  status text default 'active',
  payment_id text,
  amount float,
  currency text default 'INR',
  start_date timestamptz default now(),
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── CHAT HISTORY ──────────────────────────────────
create table if not exists chat_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  message text not null,
  response text not null,
  mode text default 'chatbot',
  domain text,
  created_at timestamptz default now()
);

-- ── MENTOR HISTORY ────────────────────────────────
create table if not exists mentor_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  message text not null,
  response text not null,
  mode text default 'explain',
  domain text,
  topic text,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────
alter table users enable row level security;
alter table scores enable row level security;
alter table progress enable row level security;
alter table skill_identity enable row level security;
alter table tasks enable row level security;
alter table tests enable row level security;
alter table coding_submissions enable row level security;
alter table project_progress enable row level security;
alter table notes enable row level security;
alter table analytics enable row level security;
alter table weak_topics enable row level security;
alter table strong_topics enable row level security;
alter table trials enable row level security;
alter table subscriptions enable row level security;
alter table chat_history enable row level security;
alter table mentor_history enable row level security;
alter table score_events enable row level security;

-- ── INDEXES FOR PERFORMANCE ───────────────────────
create index if not exists idx_tasks_user_day
  on tasks(user_id, day_number);
create index if not exists idx_tests_user
  on tests(user_id);
create index if not exists idx_roadmap_domain_day
  on roadmap(domain_slug, day_number);
create index if not exists idx_analytics_user_date
  on analytics(user_id, date);
create index if not exists idx_score_events_user
  on score_events(user_id);
create index if not exists idx_chat_history_user
  on chat_history(user_id);
create index if not exists idx_mentor_history_user
  on mentor_history(user_id);

CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) UNIQUE,
  domain_slug text,
  questions jsonb DEFAULT '[]',
  answers jsonb DEFAULT '[]',
  score integer DEFAULT 0,
  skill_level text DEFAULT 'beginner',
  completed boolean DEFAULT false,
  taken_at timestamptz DEFAULT now()
);

ALTER TABLE progress ADD COLUMN IF NOT EXISTS diagnostic_score integer DEFAULT 0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS diagnostic_taken boolean DEFAULT false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username text DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url text DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_connected boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_repos integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_stars integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_commits integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_languages text[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_last_synced timestamptz DEFAULT NULL;
