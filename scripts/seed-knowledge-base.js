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

const SITE_URL = (process.env.NEXTAUTH_URL || 'https://www.genois.in').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  console.error('✘ Missing CRON_SECRET in .env.local');
  process.exit(1);
}

console.log(`▶ Seeding knowledge base via ${SITE_URL}/api/rag/seed`);

const res = await fetch(`${SITE_URL}/api/rag/seed`, {
  method: 'POST',
  headers: { 'x-cron-secret': CRON_SECRET, 'Content-Type': 'application/json' },
});

const body = await res.json().catch(() => null);

if (!res.ok) {
  console.error(`✘ Seed failed (${res.status})`, body?.message || '');
  if (res.status === 404 || /relation .* does not exist|knowledge_base/i.test(body?.message || '')) {
    console.error('  → The knowledge_base table may not exist yet. Run the v3-migrate endpoint first, then retry.');
  }
  process.exit(1);
}

console.log(`✓ Seed complete — inserted: ${body?.data?.inserted ?? 0}, skipped: ${body?.data?.skipped ?? 0}`);
