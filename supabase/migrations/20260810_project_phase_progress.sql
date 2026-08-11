-- Feature C, the guided project journey: per-phase build progress.
--
-- /projects already recorded two things about a student's portfolio: that they
-- SUBMITTED a repo (public.project_progress.status) and what the AI audit said
-- about it. Neither of those exists until the project is finished, so a student
-- who is three weeks into a build had nothing to show for it and no way to pick
-- up where they left off.
--
-- This table records the middle: which PHASES of a catalog project the student
-- has ticked off. It is the same shape of fact as dsa_pattern_progress
-- (20260803) — a coverage set the student maintains by hand — and it is stored
-- the same way, as a whole-set rewrite rather than an append, so a double-click
-- cannot produce duplicates.
--
-- ONE TABLE, ADDITIVE ONLY. No existing column is renamed, retyped or dropped.
-- public.project_progress and public.projects are untouched: submissions and
-- AI audits keep working byte-for-byte, and the two tables never join. They are
-- also keyed differently ON PURPOSE — see project_key below.
--
-- DEGRADES GRACEFULLY UNTIL APPLIED. app/api/projects/journey/route.js catches
-- PostgREST's missing-relation error (42P01 / PGRST205) and returns
-- `{ trackingAvailable: false, reason: 'not_migrated' }`; /projects then renders
-- the whole guided build path with its phase checkboxes DISABLED and an
-- explicit note, rather than accepting ticks that go nowhere. Writes return 503
-- in that state instead of reporting a success that stored nothing.
--
-- Schema-qualified throughout: unqualified DDL has landed outside `public`
-- twice on this project (test_questions, coding_tests), and `public` is the
-- only schema PostgREST exposes.

CREATE TABLE IF NOT EXISTS public.project_phase_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- A catalog project, as `<domain>::w<week>::<title-slug>` — the value
  -- lib/projectLevels.js projectKey() builds, e.g.
  -- 'fullstack::w16::rest-api-with-node-js'.
  --
  -- TEXT and deliberately NOT a foreign key to public.projects, for the same
  -- reason dsa_pattern_progress.pattern_id is not one: the project catalog is
  -- CODE (lib/projectTemplates.js), not data, so it must be reviewable in a
  -- diff and identical across environments. public.projects only ever gets a
  -- row when someone submits a repo, so an FK here would mean a student could
  -- not track progress on a project until after they had finished it.
  --
  -- The API validates every incoming key against the catalog for the student's
  -- own domain before writing, so an unknown or foreign key cannot get in.
  project_key TEXT NOT NULL,

  -- Zero-based phase indexes the student has ticked, e.g. [0, 1]. Rewritten as
  -- a whole set on every toggle. Indexes outside the project's authored phase
  -- count are filtered at read time, so shortening a project's phase list in a
  -- later edit cannot leave stale entries inflating someone's progress.
  completed_phases JSONB NOT NULL DEFAULT '[]'::jsonb,

  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Stamped the FIRST time every phase is ticked, and never cleared afterwards
  -- — same rule as dsa_pattern_progress.mastered_at. Finishing a build is a
  -- moment in the student's history; unticking a phase later to re-read it
  -- should not erase that it happened.
  completed_at TIMESTAMPTZ,

  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per (student, project) — the upsert target.
  UNIQUE (user_id, project_key)
);

-- The only access path: "this student's whole board", read once per /projects
-- page load.
CREATE INDEX IF NOT EXISTS project_phase_progress_user_idx
  ON public.project_phase_progress (user_id);

-- Every read and write goes through the service-role admin client
-- (lib/supabaseAdmin.js) behind getUserFromRequest, same as the roadmap and the
-- application tracker. RLS on with no policy therefore denies anon/authenticated
-- clients outright while the server path is unaffected — a student cannot read
-- or forge another student's build progress by hitting PostgREST directly with
-- their own token.
ALTER TABLE public.project_phase_progress ENABLE ROW LEVEL SECURITY;

-- Make PostgREST pick up the new table immediately.
NOTIFY pgrst, 'reload schema';
