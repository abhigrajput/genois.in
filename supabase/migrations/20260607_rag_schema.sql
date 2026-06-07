CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  category TEXT NOT NULL,
  company TEXT,
  domain TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kb_content_search ON knowledge_base USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS kb_company_idx ON knowledge_base (company);
CREATE INDEX IF NOT EXISTS kb_domain_idx ON knowledge_base (domain);
