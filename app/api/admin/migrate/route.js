import { errorResponse, successResponse } from '@/lib/response';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { timingSafeEqualStr } from '@/lib/security';
import pg from 'pg';

export const dynamic = 'force-dynamic';

const MIGRATIONS = [
  {
    name: '20260531_roadmap_cache_enrich',
    sql: `
ALTER TABLE roadmap
  ADD COLUMN IF NOT EXISTS objectives JSONB,
  ADD COLUMN IF NOT EXISTS key_concepts JSONB,
  ADD COLUMN IF NOT EXISTS coding_problem TEXT,
  ADD COLUMN IF NOT EXISTS coding_problem_url TEXT,
  ADD COLUMN IF NOT EXISTS is_project_day BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS project JSONB,
  ADD COLUMN IF NOT EXISTS generated_by TEXT,
  ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_roadmap_lookup ON roadmap(domain_slug, day_number);
    `,
  },
  {
    name: '20260531_security_events',
    sql: `
CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  user_id     UUID,
  user_email  TEXT,
  ip          TEXT,
  user_agent  TEXT,
  path        TEXT,
  details     JSONB,
  severity    TEXT DEFAULT 'info',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_events_ip ON security_events(ip);
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON security_events(user_id);
    `,
  },
  {
    name: '20260531_rls_policies',
    sql: `
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
    `,
  },
  {
    name: '20260605_v3_context_schema',
    sql: `
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_companies TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS months_to_placement INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weak_subjects TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'campus';
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_tier TEXT DEFAULT 'tier3';
    `,
  },
  {
    name: '20260607_rag_schema',
    sql: `
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
    `,
  },
];

// Auth: accepts either the Supabase service role key (X-Service-Key header)
// or the standard admin JWT (Authorization header via getAdminFromRequest).
async function isAuthorized(request) {
  // FIX P7: constant-time compare so the service key can't be recovered byte-by-
  // byte from response timing.
  const serviceKey = request.headers.get('x-service-key');
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && expectedKey && timingSafeEqualStr(serviceKey, expectedKey)) return true;

  // Fall back to JWT admin check
  try {
    const { getAdminFromRequest } = await import('@/lib/auth');
    const admin = await getAdminFromRequest(request);
    return !!admin;
  } catch {
    return false;
  }
}

async function tryPgConnect(connectionString) {
  const { Client } = pg;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

async function runMigrationsViaPg(dbUrl) {
  const client = await tryPgConnect(dbUrl);
  const results = [];
  try {
    for (const migration of MIGRATIONS) {
      try {
        await client.query(migration.sql);
        results.push({ name: migration.name, status: 'applied' });
      } catch (err) {
        // Which migration failed is the useful signal and is safe to return.
        // The Postgres error text (schema names, constraints) stays in the log.
        console.error(`ADMIN_MIGRATE[${migration.name}]:`, err?.message || err);
        results.push({ name: migration.name, status: 'error' });
      }
    }
    const rmCheck = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'roadmap'
         AND column_name IN ('objectives','key_concepts','is_project_day','project','generated_by','cached_at')`,
    );
    const secCheck = await client.query(
      `SELECT to_regclass('public.security_events') IS NOT NULL AS ok`,
    );
    return {
      ok: true,
      migrations: results,
      roadmapColumns: rmCheck.rows.map(r => r.column_name),
      securityEventsExists: secCheck.rows[0]?.ok ?? false,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

// Try Supabase Management API (needs SUPABASE_ACCESS_TOKEN)
async function tryManagementApi(sql) {
  const pat = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
  if (!pat) return null;
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) return null;
  return await r.json();
}

export async function POST(request) {
  const ok = await isAuthorized(request);
  if (!ok) return errorResponse('Forbidden', 403);

  // Strategy 1: explicit DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl) {
    try {
      const result = await runMigrationsViaPg(dbUrl);
      return successResponse({ via: 'DATABASE_URL', ...result });
    } catch (err) {
      // A pg connect failure echoes the host, port and user from DATABASE_URL.
      console.error('ADMIN_MIGRATE_CONNECT:', err?.message || err);
      return errorResponse('Something went wrong, please retry.', 500);
    }
  }

  // Strategy 2: Supabase Management API (needs SUPABASE_ACCESS_TOKEN env var)
  const pat = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
  if (pat) {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const results = [];
    for (const migration of MIGRATIONS) {
      const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: migration.sql }),
      });
      if (r.ok) {
        results.push({ name: migration.name, status: 'applied' });
      } else {
        const body = await r.text();
        results.push({ name: migration.name, status: 'error', error: body });
      }
    }
    return successResponse({ via: 'management-api', migrations: results });
  }

  // No execution method available
  return errorResponse(
    'No database connection available. Add one of: ' +
    '(1) DATABASE_URL = your Supabase connection string (from Dashboard → Settings → Database → URI), ' +
    '(2) SUPABASE_ACCESS_TOKEN = a Supabase PAT (dashboard.supabase.com/account/tokens). ' +
    'Set either env var in Vercel, then retry.',
    400,
  );
}

export async function GET(request) {
  const ok = await isAuthorized(request);
  if (!ok) return errorResponse('Forbidden', 403);

  const supabase = getAdminClient();

  const [secEvt, rmCols, kb] = await Promise.all([
    supabase.from('security_events').select('id').limit(0),
    supabase.from('roadmap').select('id,objectives,key_concepts,is_project_day').limit(0),
    supabase.from('knowledge_base').select('id').limit(0),
  ]);

  const needsMigration = !!(secEvt.error || rmCols.error || kb.error);

  return successResponse({
    security_events_exists: !secEvt.error,
    roadmap_enriched_columns: !rmCols.error,
    knowledge_base_exists: !kb.error,
    needs_migration: needsMigration,
    instructions: needsMigration
      ? 'POST to this endpoint with X-Service-Key header. Needs DATABASE_URL or SUPABASE_ACCESS_TOKEN env var.'
      : 'All migrations already applied.',
  });
}
