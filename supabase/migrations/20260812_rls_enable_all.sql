-- ─── Enable RLS on every public table ────────────────────────────────────────
--
-- Supersedes 20260531_rls_policies.sql (kept for history; do not run it).
--
-- WHY NO POLICIES
-- ---------------
-- This app does not use Supabase Auth. Authentication is a custom HS256 JWT in
-- the `genois_token` cookie, verified by getUserFromRequest (lib/auth.js).
-- `auth.uid()` is therefore always NULL for us and any policy written against
-- it would be dead weight at best and a lockout at worst.
--
-- Every server route reads and writes through getAdminClient()
-- (lib/supabaseAdmin.js), which uses SUPABASE_SERVICE_ROLE_KEY. The service
-- role BYPASSES RLS entirely — it does not need a policy to be granted access,
-- and a policy cannot restrict it.
--
-- So: RLS ON + zero policies == anon/authenticated keys see nothing, the
-- service role sees everything. That is exactly the desired end state, and it
-- is strictly simpler than the permissive "service role full" policies the
-- superseded migration created (those were no-ops that only looked meaningful).
--
-- VERIFIED SAFE (2026-08-11, against the working tree)
-- ----------------------------------------------------
-- The only anon-key client in the codebase was lib/supabase.js, which had zero
-- importers. It is deleted in the same change as this migration. No 'use
-- client' file constructs its own Supabase client. Nothing in the app reads a
-- table with the anon key, so turning RLS on cannot empty out a route.
--
-- EXCLUSIONS
-- ----------
-- Hard-coded list below, not a pattern match, so this can never skip a table
-- by accident:
--   schema_migrations — migration bookkeeping, not application data.
--   domains           — carried over from the superseded migration as the
--                       "public catalog" exception. NOTE: /api/roadmap/domains
--                       reads it via the SERVICE role, so this exclusion is not
--                       actually required by any code path today. It is kept as
--                       the conservative default; dropping it is a one-line
--                       follow-up if we decide the catalog should be closed too.

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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'RLS enabled: public.%', r.tablename;
  END LOOP;
END $$;

-- Make PostgREST pick the change up immediately instead of on its next poll.
NOTIFY pgrst, 'reload schema';

-- Verification. Every row should read rowsecurity = t except `domains`
-- (and `schema_migrations`, if it exists in this database).
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
