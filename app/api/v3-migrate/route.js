import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

const V3_SQL = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS target_companies TEXT[] DEFAULT '{}'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,1)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS months_to_placement INTEGER`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS weak_subjects TEXT[] DEFAULT '{}'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'campus'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS college_tier TEXT DEFAULT 'tier3'`,
  `CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    category TEXT NOT NULL,
    company TEXT,
    domain TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS kb_content_search ON knowledge_base USING gin(to_tsvector('english', content))`,
  `CREATE INDEX IF NOT EXISTS kb_company_idx ON knowledge_base (company)`,
  `CREATE INDEX IF NOT EXISTS kb_domain_idx ON knowledge_base (domain)`,
  // Voice Interview Simulator results
  `CREATE TABLE IF NOT EXISTS interview_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    domain TEXT,
    target_company TEXT,
    total_score DECIMAL(5,2),
    technical_accuracy DECIMAL(5,2),
    communication_clarity DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    grade TEXT,
    questions_answered INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS interview_results_user_idx ON interview_results(user_id)`,
  `CREATE INDEX IF NOT EXISTS interview_results_score_idx ON interview_results(total_score)`,
];

export async function POST(request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return errorResponse('Forbidden', 403);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pat = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;

  // Try management API (needs PAT)
  if (pat) {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const results = [];
    for (const sql of V3_SQL) {
      const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      });
      results.push({ sql: sql.slice(0, 60), ok: r.ok, status: r.status });
    }
    return successResponse({ via: 'management-api', results });
  }

  // Try exec_sql RPC
  const results = [];
  for (const sql of V3_SQL) {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }),
    });
    results.push({ sql: sql.slice(0, 60), ok: r.ok, status: r.status, body: await r.text() });
    if (!r.ok) break;
  }

  const allOk = results.every(r => r.ok);
  if (allOk) return successResponse({ via: 'exec_sql', results });

  return errorResponse(
    'No execution method available. Add SUPABASE_ACCESS_TOKEN (PAT from supabase.com/dashboard/account/tokens) to Vercel env vars and retry, OR paste the SQL below into Supabase Dashboard → SQL editor:\n\n' +
    V3_SQL.join(';\n') + ';',
    400,
    { results }
  );
}
