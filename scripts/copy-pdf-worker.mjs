/**
 * Copies pdf.js's worker out of node_modules into public/.
 *
 * The worker used to be resolved with `new URL(..., import.meta.url)`, which
 * webpack turns into an emitted asset but Turbopack does not — so the deployed
 * build 404'd on the worker while local dev was fine. Serving it from public/
 * gives it one stable path that does not depend on which bundler runs.
 *
 * This runs on postinstall and again on prebuild so the copy is always
 * regenerated from the installed pdfjs-dist. That matters: pdf.js refuses to
 * run when the worker version and the API version differ, so a stale committed
 * copy would break every upload after a dependency bump.
 */
import { copyFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));

const SOURCE = 'pdfjs-dist/build/pdf.worker.min.mjs';
const DEST = path.join(root, 'public', 'pdf.worker.min.mjs');

let source;
try {
  source = require.resolve(SOURCE);
} catch {
  // postinstall can run before pdfjs-dist is present (or in a --omit=optional
  // install). Missing here is not fatal; prebuild runs this again, and the
  // build below fails loudly if it is still absent.
  console.warn(`[copy-pdf-worker] ${SOURCE} not resolvable yet — skipping.`);
  process.exit(0);
}

mkdirSync(path.dirname(DEST), { recursive: true });
copyFileSync(source, DEST);

const version = JSON.parse(readFileSync(require.resolve('pdfjs-dist/package.json'), 'utf8')).version;
const size = existsSync(DEST) ? readFileSync(DEST).length : 0;
console.log(`[copy-pdf-worker] public/pdf.worker.min.mjs <- pdfjs-dist@${version} (${(size / 1024).toFixed(0)} KB)`);
