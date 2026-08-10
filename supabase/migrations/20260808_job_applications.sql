-- Placement Journey, Part 2: the student's own application tracker.
--
-- GENOIS stops at PREP. This is the first table that records what a student
-- did AFTER prepping — which company they applied to, and how far that
-- application got. It is the student's own data, not curated content: nothing
-- here is seeded, generated, or shared between users.
--
-- ONE TABLE, ADDITIVE ONLY. No existing column is renamed, retyped or dropped.
-- Nothing else in the app reads it, so every existing page keeps working
-- byte-for-byte whether or not this migration has been applied.
--
-- DEGRADES GRACEFULLY UNTIL APPLIED. app/api/applications/route.js catches
-- PostgREST's missing-relation error (42P01 / PGRST205) and returns
-- `{ available: false, applications: [] }`; the tracker page then renders an
-- explicit "tracker storage isn't set up yet" state instead of an empty board
-- that silently loses writes. Creates return 503 in that state rather than
-- reporting a success that stored nothing.
--
-- Schema-qualified throughout: unqualified DDL has landed outside `public`
-- twice on this project (test_questions, coding_tests), and `public` is the
-- only schema PostgREST exposes.

CREATE TABLE IF NOT EXISTS public.job_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Free text, NOT a foreign key to any curated company list. A student can
  -- apply anywhere; constraining this to the 9 names in COMPANY_PROFILES would
  -- make the tracker useless for the local startup they actually applied to.
  company    TEXT NOT NULL,
  role       TEXT,

  -- The date the student says they applied. DATE, not TIMESTAMPTZ: this is a
  -- calendar fact the student types in, not an event we observed, so storing a
  -- clock time would imply a precision we do not have. Nullable — a student
  -- logging an application they made weeks ago may not remember the day.
  applied_on DATE,

  -- The pipeline stage. CHECK rather than an ENUM type so adding a stage later
  -- is an ALTER of one constraint instead of a type migration; the API
  -- validates against the same list (lib/applyDirectory.js APPLICATION_STAGES)
  -- before writing, so this is the second line of defence, not the first.
  stage      TEXT NOT NULL DEFAULT 'applied'
             CHECK (stage IN ('applied', 'oa', 'interview', 'offer', 'rejected')),

  -- How they applied. The whole point of the Apply directory is that off-campus
  -- is a real, separate channel from the campus drive, so the tracker records
  -- which one this was. Nullable — an older entry may predate the student
  -- caring about the distinction.
  source     TEXT CHECK (source IN ('off_campus', 'on_campus', 'referral', 'other')),

  notes      TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The only access path: "this student's board", read once per page load and
-- ordered newest-application-first.
CREATE INDEX IF NOT EXISTS job_applications_user_idx
  ON public.job_applications (user_id, applied_on DESC NULLS LAST, created_at DESC);

-- Every read and write goes through the service-role admin client
-- (lib/supabaseAdmin.js) behind getUserFromRequest, same as notes and roadmap
-- progress. RLS on with no policy therefore denies anon/authenticated clients
-- outright while the server path is unaffected — a student cannot read, edit or
-- delete another student's applications by hitting PostgREST directly with
-- their own token, which for this table would leak where they are interviewing.
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Make PostgREST pick up the new table immediately.
NOTIFY pgrst, 'reload schema';
