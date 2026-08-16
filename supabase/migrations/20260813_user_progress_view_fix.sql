-- ─── Close the user_progress view to the public anon key ────────────────────
--
-- Companion to 20260812_rls_enable_all.sql, which could not fix this.
--
-- WHAT WAS EXPOSED
-- ----------------
-- `user_progress` is a VIEW, not a table (defined in 20260510_complete_schema.sql):
--
--     CREATE OR REPLACE VIEW user_progress AS
--     SELECT u.id AS user_id, COALESCE(s.total_score,0), COALESCE(p.current_day,1),
--            COALESCE(p.streak,0)
--     FROM users u LEFT JOIN scores s ON ... LEFT JOIN progress p ON ...;
--
-- Its three base tables are correctly closed — reading them with the anon key
-- returns zero rows. The view was not: it returned EVERY row (50 of 50 when
-- this was found), leaking user_id, total_score, current_day and streak for
-- every account to anyone holding NEXT_PUBLIC_SUPABASE_ANON_KEY — a key that
-- ships to every browser by design.
--
-- The cause is standard Postgres view semantics: without `security_invoker`, a
-- view executes with its OWNER's privileges, so it reads straight through the
-- base tables' RLS.
--
-- WHY THE RLS MIGRATION CANNOT FIX IT
-- -----------------------------------
-- 20260812 loops over pg_tables. Views never appear in pg_tables, so its
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY never reaches user_progress. The
-- one object that was actually exposed is the one object that migration
-- structurally cannot touch. Hence this file.
--
-- WHY REVOKE AND NOT security_invoker
-- -----------------------------------
-- `ALTER VIEW ... SET (security_invoker = on)` is the tidier fix and needs
-- PG15+. REVOKE is what was actually applied to this database — confirmed by
-- probing the REST API with the anon key afterwards, which returns
-- `42501 permission denied for view user_progress` (security_invoker would
-- instead return 200 with zero rows). This file records what was run.
--
-- VERIFIED SAFE
-- -------------
-- The only consumer of this view is app/api/cron/weekly-digest/route.js, which
-- reads it through getAdminClient() (SUPABASE_SERVICE_ROLE_KEY). The service
-- role is unaffected by this REVOKE — verified after the change: the service
-- role still reads all 50 rows. No anon-key client exists anywhere in the
-- codebase, so nothing else can be reading it.

REVOKE SELECT ON public.user_progress FROM anon, authenticated;

-- Make PostgREST pick the change up immediately instead of on its next poll.
NOTIFY pgrst, 'reload schema';

-- Verification. `anon` and `authenticated` should have NO row here; the
-- service role's grant (and the owner's) should remain.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
ORDER BY grantee, privilege_type;
