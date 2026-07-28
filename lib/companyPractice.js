import crypto from 'node:crypto';

// Company practice problems live in the existing coding_tests bank, keyed by
// the free-text `topic` column — no schema change to existing columns. Two
// buckets per company so the origin of each row survives persistence:
//   "Company OA (Real): TCS"   — curated from knowledge_base
//   "Company Practice: TCS"    — AI-generated in the company's style
//
// PROVENANCE: neither bucket is a real past exam question. The knowledge_base
// entries are hand-written study notes with no source and no date, so nothing
// here may be presented to a student as an actual past OA question. Both
// buckets are surfaced as "practice, in the style of {company}".
//
// The "(Real)" in the first key is a legacy storage value: these exact strings
// are already persisted in coding_tests.topic, and changing them would orphan
// every existing row. They are internal bucket keys and are never rendered.
export const curatedTopic = (company) => `Company OA (Real): ${company}`;
export const practiceTopic = (company) => `Company Practice: ${company}`;

// SOLVABILITY gate — not a provenance gate. A knowledge_base oa_question is
// only servable as a problem if it contains an actual task statement
// (imperative verbs). Entries that merely describe the round ("3 problems —
// 1 easy, 1 medium…") aren't solvable, so they instead ground the AI generator
// in the company's OA pattern. Passing this check says the text is a workable
// problem; it says nothing about where the text came from.
export const TASK_STATEMENT = /\b(given|find|implement|write|return|compute|calculate|count|print|reverse|sort)\b/i;

// Deterministic title from RAG content — doubles as the dedupe key, so the
// same knowledge_base entry never inserts twice.
export function titleFromContent(content) {
  const first = (content || '').split('. ')[0].trim();
  return first.length > 90 ? first.slice(0, 87) + '…' : first;
}

export function kbContentHash(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex').slice(0, 16);
}

// Ephemeral id for a curated KB problem served while the coding_tests bank is
// unavailable (migration pending). The hash is re-derived server-side on
// submit, so the id only SELECTS trusted knowledge_base content — a client can
// never inject its own problem text through it.
export function kbOaId(company, content) {
  return `kb-oa:${company}:${kbContentHash(content)}`;
}

export function parseKbOaId(id) {
  if (typeof id !== 'string' || !id.startsWith('kb-oa:')) return null;
  const parts = id.split(':');
  if (parts.length !== 3 || !parts[1] || !/^[a-f0-9]{16}$/.test(parts[2])) return null;
  return { company: parts[1], hash: parts[2] };
}
