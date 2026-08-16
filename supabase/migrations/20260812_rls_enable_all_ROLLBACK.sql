-- ─── ROLLBACK for 20260812_rls_enable_all.sql ────────────────────────────────
--
-- DO NOT RUN THIS AS PART OF A NORMAL DEPLOY.
--
-- This is the emergency parachute. Run it only if enabling RLS demonstrably
-- broke production reads — which, per the analysis in the forward migration,
-- should be impossible: every route uses the service-role client, and the
-- service role bypasses RLS. If something DOES break after the forward
-- migration, the far more likely cause is a code path that was never audited,
-- and the right first move is to find it, not to disable RLS globally.
--
-- Running this returns every public table to unrestricted access for anyone
-- holding the anon key — which is shipped in the browser bundle. Treat that as
-- a live data exposure for as long as this state persists.
--
-- `domains` is excluded here for symmetry with the forward migration: it was
-- never enabled, so there is nothing to disable.

DO $$
DECLARE
  r RECORD;
  excluded_tables text[] := ARRAY['schema_migrations', 'domains'];
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND NOT (tablename = ANY (excluded_tables))
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'RLS DISABLED: public.%', r.tablename;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- Verification. After a rollback every row should read rowsecurity = f.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
