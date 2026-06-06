#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ROOT || !KEY) {
  console.error('✘ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const PROJECT_REF = new URL(URL_ROOT).hostname.split('.')[0];
const MIGRATION_FILE = path.join(ROOT, 'supabase', 'migrations', '20260605_v3_context_schema.sql');
const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

console.log(`▶ Running V3 context migration on project ${PROJECT_REF}`);

async function runViaManagementApi() {
  const pat = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
  if (!pat) return { ok: false, reason: 'no-pat' };
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${pat}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) return { ok: false, reason: `mgmt-${r.status}`, body: await r.text() };
  return { ok: true, via: 'management-api' };
}

async function runViaExecRpc() {
  const r = await fetch(`${URL_ROOT}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) return { ok: false, reason: `rpc-${r.status}`, body: await r.text() };
  return { ok: true, via: 'rpc:exec_sql' };
}

let res = await runViaManagementApi();
if (!res.ok) res = await runViaExecRpc();

if (res.ok) {
  console.log(`✓ V3 migration applied via ${res.via}`);

  // Verify columns exist
  const check = await fetch(`${URL_ROOT}/rest/v1/users?select=target_companies,cgpa,months_to_placement,weak_subjects,placement_type,college_tier&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  console.log(check.ok
    ? '✓ V3 columns verified (target_companies, cgpa, months_to_placement, weak_subjects, placement_type, college_tier)'
    : `✘ Column check failed (${check.status})`);
} else {
  console.error(`✘ Migration failed (${res.reason})`);
  console.error('Paste this into Supabase Dashboard → SQL editor:');
  console.error(MIGRATION_FILE);
  process.exit(1);
}
