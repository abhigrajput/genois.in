/**
 * Re-verify every id in lib/curatedVideos.js against YouTube.
 *
 *   node scripts/verify-curated-videos.mjs
 *
 * Two checks per video, both over public endpoints — no API key, no login:
 *   1. oEmbed 200          → the video exists. Also re-reads the live title and
 *                            channel and flags drift from what we shipped.
 *   2. /embed/<id> playable → the owner still permits framing, so a student sees
 *                            a player rather than "Video unavailable".
 *
 * Exits non-zero if anything fails, so this can gate a release. A failing entry
 * gets REPLACED with another verified video or REMOVED — never patched with a
 * guessed id and never with a search link.
 */
import { CURATED_VIDEOS } from '../lib/curatedVideos.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function oembed(id) {
  const r = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`
  );
  return r.ok ? r.json() : null;
}

async function embeddable(id) {
  const r = await fetch(`https://www.youtube.com/embed/${id}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36' },
  });
  if (!r.ok) return { ok: false, why: `embed HTTP ${r.status}` };
  const html = await r.text();
  const m = html.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/);
  if (m && m[1] !== 'OK') return { ok: false, why: `playability ${m[1]}` };
  if (/playableInEmbed":false/.test(html)) return { ok: false, why: 'embedding disabled' };
  return { ok: true };
}

const failures = [];
const drift = [];
const seen = new Map();

for (const v of CURATED_VIDEOS) {
  if (seen.has(v.id)) drift.push(`${v.slug}: id ${v.id} is also used by ${seen.get(v.id)}`);
  seen.set(v.id, v.slug);

  const meta = await oembed(v.id);
  if (!meta) { failures.push(`${v.slug} (${v.id}): does not exist`); console.log(`FAIL ${v.slug}`); continue; }

  const emb = await embeddable(v.id);
  if (!emb.ok) { failures.push(`${v.slug} (${v.id}): ${emb.why}`); console.log(`FAIL ${v.slug} — ${emb.why}`); continue; }

  if (meta.title !== v.title) drift.push(`${v.slug}: title changed → ${JSON.stringify(meta.title)}`);
  if (meta.author_name !== v.channel) drift.push(`${v.slug}: channel changed → ${JSON.stringify(meta.author_name)}`);

  console.log(`ok   ${v.slug}`);
  await sleep(120);
}

console.log(`\n${CURATED_VIDEOS.length - failures.length}/${CURATED_VIDEOS.length} verified`);
if (drift.length) { console.log('\nDrift (not fatal, but review):'); for (const d of drift) console.log('  ' + d); }
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  ' + f);
  process.exit(1);
}
