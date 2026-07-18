-- ── coding_tests: create the table PostgREST can actually see ────────────────
-- Prod drift (found 2026-07-17): `coding_tests` does not exist in the `public`
-- schema (PGRST205), so the daily coding flow has never persisted problems and
-- always leaned on AI regeneration / the Two Sum fallback, and every
-- /api/coding/submit lookup of a non-fallback id 404s. Same failure mode as the
-- test_questions incident: unqualified DDL landed outside `public`, which is
-- the only schema PostgREST exposes. Everything here is schema-qualified.
--
-- Shape mirrors lib/database.sql exactly (plus gen_random_uuid, which needs no
-- extension on Supabase). Company practice encodes provenance in `topic`
-- ("Company OA (Real): X" / "Company Practice: X") — no extra column needed.

create table if not exists public.coding_tests (
  id uuid primary key default gen_random_uuid(),
  domain_slug text references public.domains(slug),
  topic text,
  title text not null,
  problem text not null,
  input_desc text,
  output_desc text,
  example_input text,
  example_output text,
  hints text[],
  difficulty text default 'beginner',
  created_at timestamptz default now()
);

-- Both the daily route and company practice read by (domain_slug, topic).
create index if not exists coding_tests_domain_topic_idx
  on public.coding_tests (domain_slug, topic);

-- ── coding_submissions: add the columns the submit route already writes ──────
-- Prod drift: coding_submissions exists but is missing coding_test_id, score
-- and ai_feedback, so every insert from /api/coding/submit has silently failed
-- (points were still awarded via scores/score_events; the submission row was
-- dropped). Additive only — no existing column is renamed or altered.

alter table public.coding_submissions
  add column if not exists coding_test_id uuid references public.coding_tests(id) on delete set null;

alter table public.coding_submissions
  add column if not exists score integer default 0;

alter table public.coding_submissions
  add column if not exists ai_feedback text;

create index if not exists coding_submissions_user_idx
  on public.coding_submissions (user_id);

-- Make PostgREST pick up the new table/columns immediately.
notify pgrst, 'reload schema';
