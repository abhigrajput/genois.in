-- Enrich roadmap cache so AI-generated content can be reused across requests.
ALTER TABLE roadmap
  ADD COLUMN IF NOT EXISTS objectives JSONB,
  ADD COLUMN IF NOT EXISTS key_concepts JSONB,
  ADD COLUMN IF NOT EXISTS coding_problem TEXT,
  ADD COLUMN IF NOT EXISTS coding_problem_url TEXT,
  ADD COLUMN IF NOT EXISTS is_project_day BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS project JSONB,
  ADD COLUMN IF NOT EXISTS generated_by TEXT,
  ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_roadmap_lookup
  ON roadmap(domain_slug, day_number);
