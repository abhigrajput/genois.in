-- ─── ROLLBACK for 20260813_user_progress_view_fix.sql ───────────────────────
--
-- Restores anon/authenticated SELECT on the user_progress view.
--
-- READ THIS BEFORE RUNNING IT. This re-opens a real data leak: because the
-- view is not security_invoker, granting SELECT back to `anon` makes every
-- row — user_id, total_score, current_day, streak, for every account —
-- readable by anyone holding the public NEXT_PUBLIC_SUPABASE_ANON_KEY, which
-- ships in the browser bundle. Enabling RLS on the base tables does NOT
-- contain it; that is the whole reason the forward migration exists.
--
-- Only run this if the REVOKE is proven to have broken something. It should
-- not have: the sole consumer, app/api/cron/weekly-digest/route.js, reads the
-- view with the service role, which the REVOKE never touched.
--
-- If you need the view readable by a non-service role, prefer the tighter fix
-- over this rollback (PG15+):
--
--     ALTER VIEW public.user_progress SET (security_invoker = on);
--     GRANT SELECT ON public.user_progress TO anon, authenticated;
--
-- which lets the caller's own RLS apply, so anon gets zero rows instead of
-- everyone's.

GRANT SELECT ON public.user_progress TO anon, authenticated;

-- Make PostgREST pick the change up immediately instead of on its next poll.
NOTIFY pgrst, 'reload schema';

-- Verification. `anon` and `authenticated` should now each have a SELECT row.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_progress'
ORDER BY grantee, privilege_type;
