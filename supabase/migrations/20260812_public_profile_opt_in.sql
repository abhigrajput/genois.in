-- Public profile opt-in.
-- /u/<name> was serving every user's profile with no consent step. This adds an
-- explicit opt-in flag; DEFAULT false means every existing user is opt-OUT until
-- they turn it on themselves.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'profile_public';
