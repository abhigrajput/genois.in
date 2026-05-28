CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'author' CHECK (role IN ('author','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS dsa_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  topic TEXT CHECK (topic IN ('arrays','strings','linkedlist','trees','graphs','dp','greedy','sorting','searching','backtracking','heap','trie','system-design','other')),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  views INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 5,
  cpp_code TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON dsa_posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON dsa_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON dsa_posts(topic);
