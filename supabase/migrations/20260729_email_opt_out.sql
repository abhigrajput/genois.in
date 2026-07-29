-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ STATUS: NOT APPLIED — written 2026-07-29, never run. Do not assume it     │
-- │ ran. There is no DATABASE_URL, POSTGRES_URL or Supabase PAT available     │
-- │ locally, and /api/admin/migrate only executes its own hardcoded           │
-- │ MIGRATIONS array — it does not accept arbitrary SQL. Applying this needs  │
-- │ the Supabase SQL editor or a direct psql connection.                      │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- Add the email opt-out flag that backs /api/email/unsubscribe.
--
-- Unlike the 20260729 drop migrations, this one is ADDITIVE — it creates a
-- column rather than destroying one, so the "IF EXISTS silently no-ops" trap
-- from the streak_tokens postmortem does not apply in the same way. It has the
-- mirror-image trap instead: ADD COLUMN IF NOT EXISTS also reports success when
-- the column already exists with a DIFFERENT type. Section 3 checks the type,
-- not just the name.
--
-- WHAT DEPENDS ON THIS
--   lib/emailOptOut.js       reads users.email_opted_out to filter recipients
--   /api/email/unsubscribe   sets it to TRUE from a signed token in an email
--   /api/notifications-v2/preferences  clears it when email is re-enabled
--
-- UNTIL THIS RUNS, the application degrades gracefully and deliberately
-- FAIL-OPEN: lib/emailOptOut.js catches PostgREST 42703 ("column does not
-- exist") and treats every user as opted in, exactly matching today's
-- behaviour. Nothing breaks; opt-outs simply cannot be recorded yet. The
-- unsubscribe route detects the same 42703 and shows the user an honest error
-- page instead of a false "you're unsubscribed" confirmation — see
-- app/unsubscribed/page.jsx, status=error.
--
-- SCOPE — this flag governs NON-TRANSACTIONAL mail only:
--   weekly digest, trial reminders, streak-break nudges, daily digest,
--   motivational notification emails.
-- It is NOT consulted for signup verification, email re-verification or
-- password reset. Those are required account mail and must keep sending to
-- opted-out users.
--
-- NOTE — public.notification_preferences.email_enabled already exists
-- (20260510_complete_schema.sql) and is honoured by /api/notifications-v2/send.
-- It is NOT reused as the unsubscribe flag: a row only exists for users who
-- have saved preferences at least once, so a missing row is indistinguishable
-- from "never asked", and an unsubscribe link must work for a user who has
-- never opened the settings page. The two stay in sync — the unsubscribe route
-- writes both, and re-enabling email in settings clears both.
--
-- Schema-qualified: an unqualified ALTER can resolve against a non-public
-- search_path schema (see the 20260715 postmortem).
-- Idempotent: IF NOT EXISTS throughout, so this is safe to re-run.


-- ── 1. ADD ──────────────────────────────────────────────────────────────────
-- NOT NULL DEFAULT FALSE: every existing row becomes explicitly opted IN, which
-- preserves current behaviour. NOT NULL keeps the read path free of
-- three-valued logic — callers never have to distinguish FALSE from NULL.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_opted_out    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_opted_out_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.email_opted_out IS
  'TRUE = user unsubscribed from non-transactional email. Never suppresses '
  'verification or password-reset mail.';
COMMENT ON COLUMN public.users.email_opted_out_at IS
  'When email_opted_out was last set TRUE. NULL when never opted out.';

-- Partial index: the batch senders ask "which of these users opted out", and
-- the TRUE set is expected to stay small. A partial index only stores those
-- rows, so it costs almost nothing at 47 users and still holds up later.
CREATE INDEX IF NOT EXISTS idx_users_email_opted_out
  ON public.users (id)
  WHERE email_opted_out;


-- ── 2. VERIFY — do not trust the editor's success indicator ─────────────────
-- Expect exactly two rows: email_opted_out / boolean / NO / false,
--                          email_opted_out_at / timestamp with time zone / YES.
-- A wrong data_type here means the column pre-existed with another type and the
-- ADD was a silent no-op.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'users'
  AND column_name IN ('email_opted_out', 'email_opted_out_at')
ORDER BY column_name;

-- Expect one row: idx_users_email_opted_out.
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename  = 'users'
  AND indexname  = 'idx_users_email_opted_out';

-- Expect opted_out = 0 immediately after the migration.
SELECT COUNT(*)                                       AS users_total,
       COUNT(*) FILTER (WHERE email_opted_out)        AS opted_out
FROM public.users;


-- ── 3. RELOAD ───────────────────────────────────────────────────────────────
-- Without this the new columns are missing from PostgREST's cached schema and
-- every read keeps failing with 42703 — meaning the app stays in its fail-open
-- degraded mode and unsubscribes still will not record, even though the ALTER
-- above succeeded. This line is the difference between "migrated" and "working".
NOTIFY pgrst, 'reload schema';


-- ── ROLLBACK (only if this needs to be undone) ──────────────────────────────
-- Destroys every recorded opt-out. Anyone who unsubscribed starts receiving
-- non-transactional mail again, so snapshot first if that matters.
--
-- CREATE TABLE public.email_opt_out_archive_20260729 AS
--   SELECT id, email, email_opted_out_at FROM public.users WHERE email_opted_out;
--
-- DROP INDEX IF EXISTS public.idx_users_email_opted_out;
-- ALTER TABLE public.users
--   DROP COLUMN IF EXISTS email_opted_out,
--   DROP COLUMN IF EXISTS email_opted_out_at;
-- NOTIFY pgrst, 'reload schema';
