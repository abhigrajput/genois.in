#!/usr/bin/env node
/**
 * Run pending Supabase migrations.
 *
 * Strategy:
 *   1. Read each .sql file in supabase/migrations.
 *   2. POST to https://{ref}.supabase.co/pg/v1/query with the service role key.
 *      (postgres-meta endpoint exposed on the supabase domain — service role
 *       key is enough; no DB password needed.)
 *   3. If postgres-meta isn't reachable, fall back to splitting the SQL on
 *      statement boundaries and trying the `pg-meta` JSON RPC.
 *
 * Idempotent: every CREATE TABLE / CREATE POLICY uses IF NOT EXISTS or DROP-then-CREATE.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ── env loader (no dotenv dep) ───────────────────────────────────────────────
function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const URL_ROOT = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ROOT || !KEY) {
  console.error('✘ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const PROJECT_REF = new URL(URL_ROOT).hostname.split('.')[0];

// ── pick migrations to run (only new 20260531_* files) ───────────────────────
const MIGRATION_DIR = path.join(ROOT, 'supabase', 'migrations');
const TARGET_FILES  = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(MIGRATION_DIR).filter(f => f.startsWith('20260531_') && f.endsWith('.sql'));

console.log(`▶ Running ${TARGET_FILES.length} migration(s) on project ${PROJECT_REF}`);

// ── attempt: management API (needs PAT) ──────────────────────────────────────
async function runViaManagementApi(sql) {
  const pat = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
  if (!pat) return { ok: false, reason: 'no-pat' };
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!r.ok) return { ok: false, reason: `mgmt-${r.status}`, body: await r.text() };
  return { ok: true, via: 'management-api' };
}

// ── attempt: custom exec_sql rpc on PostgREST ────────────────────────────────
async function runViaExecRpc(sql) {
  const r = await fetch(`${URL_ROOT}/rest/v1/rpc/exec_sql`, {
    method : 'POST',
    headers: {
      'apikey'       : KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) return { ok: false, reason: `rpc-${r.status}`, body: await r.text() };
  return { ok: true, via: 'rpc:exec_sql' };
}

async function runOne(filename) {
  const sql = fs.readFileSync(path.join(MIGRATION_DIR, filename), 'utf8');
  console.log(`\n▶ ${filename}`);

  let res = await runViaManagementApi(sql);
  if (!res.ok) res = await runViaExecRpc(sql);

  if (res.ok) {
    console.log(`  ✓ applied via ${res.via}`);
    return;
  }

  console.error(`  ✘ could not run automatically (${res.reason})`);
  console.error('    Open the Supabase Dashboard → SQL editor and paste the file contents:');
  console.error(`    ${path.join('supabase', 'migrations', filename)}`);
  process.exitCode = 2;
}

for (const f of TARGET_FILES) await runOne(f);

// ── post-run inspection ──────────────────────────────────────────────────────
async function inspect() {
  console.log('\n▶ Inspecting DB state…');

  // security_events table?
  const sec = await fetch(`${URL_ROOT}/rest/v1/security_events?select=id&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  console.log(sec.ok
    ? '  ✓ security_events table exists and is reachable'
    : `  ✘ security_events not reachable (${sec.status})`);

  // roadmap new columns?
  const rm = await fetch(
    `${URL_ROOT}/rest/v1/roadmap?select=id,objectives,key_concepts,is_project_day&limit=1`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  console.log(rm.ok
    ? '  ✓ roadmap cache columns are queryable'
    : `  ✘ roadmap cache columns missing (${rm.status})`);
}
await inspect();

if (process.exitCode === 2) {
  console.log('\nSome migrations could not be run automatically.');
  console.log('To run them: copy each file in supabase/migrations/20260531_*.sql into the Supabase Dashboard → SQL editor → Run.');
  console.log('Or set SUPABASE_ACCESS_TOKEN to a Personal Access Token (https://supabase.com/dashboard/account/tokens) and re-run.');
}
