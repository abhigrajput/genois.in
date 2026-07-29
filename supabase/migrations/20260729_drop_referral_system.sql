-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ STATUS: NOT APPLIED — written 2026-07-29, never run. Do not assume it     │
-- │ ran. There is no DATABASE_URL, POSTGRES_URL or Supabase PAT available     │
-- │ locally, and /api/admin/migrate only executes its own hardcoded           │
-- │ MIGRATIONS array — it does not accept arbitrary SQL. Applying this needs  │
-- │ the Supabase SQL editor or a direct psql connection.                      │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- READ THIS FIRST — the 20260729_drop_streak_tokens postmortem applies here
-- too. On that migration the SQL editor reported success and the column
-- survived anyway. DROP ... IF EXISTS reports success whether or not anything
-- was dropped, so a green check in the editor is NOT evidence. Use section 3
-- below to confirm, and if a drop silently no-ops, re-run it WITHOUT IF EXISTS
-- and capture the error text — that message is the missing diagnostic.
--
-- ───────────────────────────────────────────────────────────────────────────
--
-- Drop the referral system: public.referrals and the four users columns that
-- backed it. The feature has no surface and no reader left.
--
-- History:
--   35b48c2  removed /referral (the page) and /api/referral (the only endpoint
--            that read a user's code, count and referral list).
--   fc78373  removed the signup-side capture — the referralCode field on
--            SignupSchema, the ?ref= capture in onboarding, and the block that
--            wrote the referrals row and bumped the referrer's counters. That
--            block was the only writer.
--
-- As of fc78373 nothing in the codebase touches any of this:
--   git grep -E 'referralCode|referral_code|referred_by|referral_count|referrals'
--     -- app lib components store  →  no matches
--
-- NOTE — users.referred_by was never referenced by application code at all,
-- in any commit. It was found only by introspecting the live PostgREST schema;
-- a grep-driven cleanup would have missed it and left one orphan behind.
--
-- NOTE — the referrals table never recorded a single row, and could not have.
-- The insert removed in fc78373 wrote a `referred_id` column that does not
-- exist on this table (the live columns are id, referrer_id, referred_email,
-- status, reward_given, created_at). Every insert therefore failed with a
-- PostgREST 42703, swallowed by the `.then(undefined, () => {})` error sink
-- wrapped around it. The 0-row count below is that bug, not low usage.
--
-- DESTRUCTIVE, but the measured blast radius is two strings. Live counts taken
-- 2026-07-29 against project fqfgacmnqppifpzncrip, across 47 users rows:
--
--   public.referrals            0 rows
--   users.referral_code         2 non-null  — 'ABHIPQ71', 'SKIPQZEP'
--   users.referred_by           0 non-null
--   users.referred_by_code      0 non-null
--   users.referral_count        0 rows with a value > 0
--
-- Only the two referral_code values are real data, and they are not derivable
-- from anything else. If those codes were ever shared publicly, dropping the
-- column means an inbound ?ref=ABHIPQ71 link can never be re-attributed —
-- though as of fc78373 nothing reads the parameter anyway.
--
-- 20260508_performance_indexes.sql declares idx_users_referral_code on the
-- column being dropped. It is deliberately left as-is: these migrations are
-- forward-only, so a fresh database creates the index and this file removes it.
-- No explicit DROP INDEX is needed — Postgres drops an index automatically with
-- its last remaining column.
--
-- Schema-qualified: an unqualified ALTER can resolve against a non-public
-- search_path schema (see the 20260715 postmortem).
-- Idempotent: IF EXISTS throughout, so this is safe to re-run.


-- ── 0. OPTIONAL SNAPSHOT — run BEFORE the drop if you want the codes kept ───
-- Uncomment to park the two live referral codes in a side table first.
--
-- CREATE TABLE IF NOT EXISTS public.referral_archive_20260729 AS
--   SELECT id, email, referral_code, referred_by, referred_by_code,
--          referral_count, NOW() AS archived_at
--   FROM public.users
--   WHERE referral_code    IS NOT NULL
--      OR referred_by      IS NOT NULL
--      OR referred_by_code IS NOT NULL
--      OR COALESCE(referral_count, 0) > 0;


-- ── 1. PREVIEW — confirm the blast radius before destroying anything ────────
-- Run this on its own first. Expect: 47 / 2 / 0 / 0 / 0 as of 2026-07-29.
--
-- SELECT COUNT(*)                                                AS users_total,
--        COUNT(*) FILTER (WHERE referral_code    IS NOT NULL)    AS has_code,
--        COUNT(*) FILTER (WHERE referred_by      IS NOT NULL)    AS has_referred_by,
--        COUNT(*) FILTER (WHERE referred_by_code IS NOT NULL)    AS has_referred_by_code,
--        COUNT(*) FILTER (WHERE COALESCE(referral_count,0) > 0)  AS has_count
-- FROM public.users;
--
-- SELECT COUNT(*) AS referrals_rows FROM public.referrals;


-- ── 2. DROP ─────────────────────────────────────────────────────────────────
-- referrals first: its referrer_id is a FK to users.id, so it is the dependent
-- side. Nothing references referrals, so no CASCADE is required.
DROP TABLE IF EXISTS public.referrals;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS referred_by_code,
  DROP COLUMN IF EXISTS referral_count;


-- ── 3. VERIFY — both queries must return ZERO rows ──────────────────────────
-- Do not trust the editor's success indicator; trust these.
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'users'
  AND column_name IN ('referral_code','referred_by','referred_by_code','referral_count');

SELECT to_regclass('public.referrals') AS should_be_null;


-- Reload PostgREST's schema cache so the table and columns stop appearing in
-- the REST API. Without this they linger in the OpenAPI spec.
NOTIFY pgrst, 'reload schema';
