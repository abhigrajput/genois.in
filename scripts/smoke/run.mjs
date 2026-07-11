#!/usr/bin/env node
// Smoke-test runner for GENOIS. Discovers every *.smoke.mjs in this directory,
// runs each against the deployed site (default https://genois.in), and reports a
// pass/fail checklist. Exits non-zero if any check fails — CI-friendly.
//
// Usage:
//   node scripts/smoke/run.mjs                 # run all
//   node scripts/smoke/run.mjs --only aptitude # only smokes whose name matches
//   node scripts/smoke/run.mjs --base http://localhost:3000
//   node scripts/smoke/run.mjs --headful       # watch it in a real window
//   node scripts/smoke/run.mjs --list          # list smokes, run nothing
//
// Requires: Node >= 22 (built-in WebSocket) and a Chrome/Chromium binary
// (auto-detected, or set CHROME_BIN).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };

const only = opt('only');
const base = opt('base');
const headful = flag('headful');
if (base) process.env.SMOKE_BASE_URL = base; // must be set BEFORE importing smokes (fixtures reads it at load)

const files = fs.readdirSync(HERE)
  .filter((f) => f.endsWith('.smoke.mjs'))
  .filter((f) => (only ? f.includes(only) : true))
  .sort();

if (files.length === 0) { console.error('No matching *.smoke.mjs files.'); process.exit(1); }

const C = { g: '\x1b[32m', r: '\x1b[31m', dim: '\x1b[90m', b: '\x1b[1m', x: '\x1b[0m' };

async function main() {
  const mods = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(HERE, f)).href);
    mods.push({ f, mod });
  }

  if (flag('list')) {
    console.log(`\n${C.b}Available smokes:${C.x}`);
    for (const { mod } of mods) console.log(`  ${C.b}${mod.meta.name}${C.x} — ${C.dim}${mod.meta.description}${C.x}`);
    console.log('');
    return 0;
  }

  const target = process.env.SMOKE_BASE_URL || 'https://genois.in';
  console.log(`\n${C.b}GENOIS smoke tests${C.x} ${C.dim}→ ${target}${C.x}\n`);

  const results = [];
  for (const { mod } of mods) {
    const label = mod.meta.name;
    process.stdout.write(`${C.dim}running${C.x} ${C.b}${label}${C.x} … `);
    const t0 = Date.now();
    try {
      const res = await mod.run({ headful });
      const passed = res.checks.every((c) => c.ok);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(passed ? `${C.g}PASS${C.x} ${C.dim}(${secs}s)${C.x}` : `${C.r}FAIL${C.x} ${C.dim}(${secs}s)${C.x}`);
      for (const c of res.checks) console.log(`    ${c.ok ? C.g + '✓' : C.r + '✗'}${C.x} ${c.label}`);
      if (res.artifacts?.length) console.log(`    ${C.dim}artifacts: ${res.artifacts.map((a) => path.relative(process.cwd(), a)).join(', ')}${C.x}`);
      results.push({ label, passed });
    } catch (e) {
      console.log(`${C.r}ERROR${C.x}`);
      console.log(`    ${C.r}${e?.stack || e?.message || e}${C.x}`);
      results.push({ label, passed: false });
    }
    console.log('');
  }

  const passCount = results.filter((r) => r.passed).length;
  const allPass = passCount === results.length;
  console.log(`${C.b}${allPass ? C.g : C.r}${passCount}/${results.length} smokes passed${C.x}\n`);
  return allPass ? 0 : 1;
}

main().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1); });
