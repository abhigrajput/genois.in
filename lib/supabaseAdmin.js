import { createClient } from '@supabase/supabase-js';

let adminClient = null;

export function getAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return adminClient;
}

// Supabase query builders resolve with { error } instead of throwing, so an
// unchecked `await supabase.from(...).insert(...)` turns a schema/DB failure
// into a silent no-op that no try/catch can see. Pass the result's error here
// to get it into prod logs without changing route behavior.
export function logWriteError(route, op, error) {
  if (!error) return;
  console.error(`[${route}] ${op} failed: ${error.message}${error.code ? ` (${error.code})` : ''}`);
}

export default getAdminClient;
