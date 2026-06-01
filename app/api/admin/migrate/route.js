import { getAdminFromRequest } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/response';
import { getAdminClient } from '@/lib/supabaseAdmin';
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
      CREATE INDEX IF NOT EXISTS idx_sec_events_ip         ON security_events(ip);
      CREATE INDEX IF NOT EXISTS idx_sec_events_user       ON security_events(user_id);

      ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "security_events service role" ON security_events;
      CREATE POLICY "security_events service role" ON security_events
        FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
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

      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        LOOP
          EXECUTE format(
            'DROP POLICY IF EXISTS "service role full" ON public.%I;', r.tablename
          );
          EXECUTE format(
            'CREATE POLICY "service role full" ON public.%I
               FOR ALL USING (auth.role() = ''service_role'')
                       WITH CHECK (auth.role() = ''service_role'');',
            r.tablename
          );
        END LOOP;
      END $$;
    `,
  },
];

export async function POST(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse('Forbidden', 403);

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) {
    return errorResponse(
      'DATABASE_URL not set. Add it from Supabase dashboard → Settings → Database → Connection string.',
      400,
    );
  }

  const { Client } = pg;
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  const results = [];
  try {
    await client.connect();

    for (const migration of MIGRATIONS) {
      try {
        await client.query(migration.sql);
        results.push({ name: migration.name, status: 'applied' });
      } catch (err) {
        results.push({ name: migration.name, status: 'error', error: err.message });
      }
    }

    // Post-run: verify roadmap columns
    const rmCheck = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'roadmap'
         AND column_name IN ('objectives','key_concepts','is_project_day','project','generated_by','cached_at')`,
    );
    const secCheck = await client.query(
      `SELECT to_regclass('public.security_events') IS NOT NULL AS exists`,
    );

    return successResponse({
      migrations: results,
      roadmapColumns: rmCheck.rows.map(r => r.column_name),
      securityEventsExists: secCheck.rows[0]?.exists ?? false,
    });
  } catch (err) {
    return errorResponse(`DB connection failed: ${err.message}`, 500);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return errorResponse('Forbidden', 403);

  const supabase = getAdminClient();

  // Check current migration state via REST API
  const [secEvt, rmCols] = await Promise.all([
    supabase.from('security_events').select('id').limit(0),
    supabase.from('roadmap').select('id,objectives,key_concepts,is_project_day').limit(0),
  ]);

  return successResponse({
    security_events_exists: !secEvt.error,
    roadmap_enriched_columns: !rmCols.error,
    instructions: secEvt.error || rmCols.error
      ? 'Migrations needed. Either: (1) Set DATABASE_URL in Vercel env vars and POST to this endpoint, or (2) Run each file in supabase/migrations/20260531_*.sql in the Supabase Dashboard SQL editor.'
      : 'All migrations applied.',
  });
}
