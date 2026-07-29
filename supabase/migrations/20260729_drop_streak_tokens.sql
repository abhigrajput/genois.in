-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ STATUS: DEFERRED — NOT APPLIED. Do not assume this ran.                   │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- As of 2026-07-29 progress.streak_tokens is STILL PRESENT in production
-- (project fqfgacmnqppifpzncrip). Applying this was attempted and abandoned:
--
--   * Run via the Supabase SQL editor reported success, but the column
--     survived — verified three ways over PostgREST: select=streak_tokens
--     returned 200 with values, the key appeared in select=* row objects, and
--     ?streak_tokens=gte.0 filtered successfully. A stale PostgREST schema
--     cache cannot explain that: the generated SQL still reaches Postgres, so
--     a dropped column would raise 42703 (which progress.token_used_date and
--     a deliberately invented control column both did, in the same response).
--     Note DROP COLUMN IF EXISTS reports success either way, so the editor's
--     green check was never evidence.
--   * Re-run as a bare ALTER (no IF EXISTS) errored. The error text was not
--     captured, so the cause is UNDIAGNOSED — candidates never ruled out were
--     a read-only editor session, a dependent object needing CASCADE, or the
--     session not owning the table.
--
-- Deliberately left in place: nothing reads or writes the column (see below),
-- and a preview across all 38 progress rows found zero non-zero balances, so
-- the column is inert. Cost of leaving it is cosmetic.
--
-- If you pick this up: run the bare ALTER below and READ THE ERROR — that
-- message is the missing piece, and everything else here is already verified.
--
--   ALTER TABLE public.progress DROP COLUMN streak_tokens;
--
-- ───────────────────────────────────────────────────────────────────────────
--
-- Drop progress.streak_tokens — the streak-insurance feature is gone.
--
-- History:
--   30720de  removed /api/streak-token, the only endpoint that read or spent
--            the tokens (it was unreferenced by any page, lib or other route).
--   54ca10b  removed the award branch in app/api/tests/submit/route.js, which
--            was the only writer — it incremented the column on a 100% weekly
--            test, so after 30720de the value was written and never read.
--
-- As of 54ca10b nothing in the codebase reads or writes streak_tokens:
--   git grep streak_tokens -- app lib components store scripts  →  no matches
-- The only remaining mention is the original CREATE TABLE in
-- 20260510_complete_schema.sql, which is left as-is: these migrations are
-- forward-only, so a fresh database creates the column and this file drops it.
--
-- DESTRUCTIVE: this discards every user's token balance. The counts are not
-- recoverable after the drop and are not derivable from score_events, which
-- never recorded token awards. If you want them preserved, run the snapshot
-- below FIRST and keep the table — otherwise the data is gone for good.
--
-- Schema-qualified: an unqualified ALTER can resolve against a non-public
-- search_path schema (see the 20260715 postmortem).
-- Idempotent: IF EXISTS, so this is safe to re-run.


-- ── 0. OPTIONAL SNAPSHOT — run BEFORE the drop if you want the data kept ────
-- Uncomment to park the non-zero balances in a side table first.
--
-- CREATE TABLE IF NOT EXISTS public.streak_tokens_archive_20260729 AS
--   SELECT user_id, streak_tokens, NOW() AS archived_at
--   FROM public.progress
--   WHERE streak_tokens IS NOT NULL AND streak_tokens > 0;


-- ── 1. PREVIEW — how much data the drop destroys ────────────────────────────
-- Run this on its own first if you want to see what you are discarding.
--
-- SELECT COUNT(*)                        AS rows_total,
--        COUNT(*) FILTER (WHERE streak_tokens > 0) AS rows_with_tokens,
--        COALESCE(SUM(streak_tokens), 0) AS tokens_outstanding
-- FROM public.progress;


-- ── 2. DROP ─────────────────────────────────────────────────────────────────
ALTER TABLE public.progress
  DROP COLUMN IF EXISTS streak_tokens;


-- ── 3. VERIFY — expect zero rows ────────────────────────────────────────────
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'progress'
  AND column_name  = 'streak_tokens';


-- Reload PostgREST's schema cache so the column stops appearing in the API.
NOTIFY pgrst, 'reload schema';
