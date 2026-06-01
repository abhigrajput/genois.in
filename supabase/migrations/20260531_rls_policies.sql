-- ─── RLS policies ────────────────────────────────────────────────────────────
-- This app uses a custom JWT (not Supabase auth.uid()), so all DB access goes
-- through the service-role admin client in API routes.  We still enable RLS on
-- every table so that any future anon/authenticated key access is denied by
-- default, and the service role retains full power.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- Service-role full access on all public tables (idempotent).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "service role full" ON public.%I;', r.tablename
    );
    EXECUTE format(
      'CREATE POLICY "service role full" ON public.%I
         FOR ALL USING (auth.role() = ''service_role'')
                 WITH CHECK (auth.role() = ''service_role'');',
      r.tablename
    );
  END LOOP;
END $$;

-- Allow anon read on truly public catalog tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='domains') THEN
    DROP POLICY IF EXISTS "domains public read" ON public.domains;
    CREATE POLICY "domains public read" ON public.domains FOR SELECT USING (TRUE);
  END IF;
END $$;
