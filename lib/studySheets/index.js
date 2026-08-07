/**
 * Study sheet registry — the curated half of /notes.
 *
 * Two sources, one vocabulary:
 *   ./patterns.js  one sheet per DSA pattern, JOINED at read time with
 *                  lib/dsaPatterns.js so intro/tell/skills/problems are never
 *                  copied and can never drift.
 *   ./cs.js        CS fundamentals sheets, declaring taxonomy skill ids directly.
 *
 * Everything downstream — the library listing, the evidence overlay, the
 * "you are weak in X, here is the sheet" link — goes through the lookups here,
 * so there is exactly one place that knows what a sheet is.
 *
 * NO DATABASE. This module is pure data plus lookups: no reads, no writes, no
 * network, no AI call. Serving a sheet costs nothing and cannot fail, which is
 * the entire point of curating instead of generating.
 */

import { DSA_PATTERNS, getPattern } from '@/lib/dsaPatterns';
import { getSkill, skillLabel, skillsForDomain } from '@/lib/skillTaxonomy';
import { videoFor, publicVideo } from '@/lib/curatedVideos';
import PATTERN_SHEETS from './patterns';
import CS_SHEETS from './cs';

export const SHEET_KIND = Object.freeze({ pattern: 'pattern', cs: 'cs' });

/** Library section order. Patterns lead because they are the default study path. */
export const SHEET_GROUPS = Object.freeze([
  'DSA Patterns',
  'OOP & Design',
  'Operating Systems',
  'Databases',
  'Networks',
  'System Design',
  'Engineering Practice',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Build the registry
// ─────────────────────────────────────────────────────────────────────────────

// Pattern sheets inherit from the pattern rather than restating it. A sheet
// whose id has no matching pattern is DROPPED rather than served half-built —
// a sheet with no skills behind it cannot participate in the evidence overlay,
// which would make it silently second-class.
const patternEntries = PATTERN_SHEETS.map((sheet) => {
  const pattern = getPattern(sheet.id);
  if (!pattern) {
    console.warn(`[studySheets] no pattern "${sheet.id}" — sheet dropped`);
    return null;
  }
  return {
    ...sheet,
    kind: SHEET_KIND.pattern,
    group: 'DSA Patterns',
    patternId: pattern.id,
    order: pattern.order,
    // Inherited, never duplicated in ./patterns.js:
    skills: pattern.skills,
    intro: pattern.intro,
    tell: pattern.tell,
    prerequisites: pattern.prerequisites,
    problems: pattern.problems,
  };
}).filter(Boolean);

const csEntries = CS_SHEETS.map((sheet, i) => ({
  ...sheet,
  kind: SHEET_KIND.cs,
  patternId: null,
  order: 100 + i,
  problems: [],
  prerequisites: [],
}));

export const STUDY_SHEETS = [...patternEntries, ...csEntries];

const BY_ID = new Map(STUDY_SHEETS.map(s => [s.id, s]));

/** skill id → sheet ids. Many-to-many: a CS sheet covers several skills. */
const SHEETS_BY_SKILL = new Map();
for (const sheet of STUDY_SHEETS) {
  for (const skill of sheet.skills || []) {
    if (!SHEETS_BY_SKILL.has(skill)) SHEETS_BY_SKILL.set(skill, []);
    SHEETS_BY_SKILL.get(skill).push(sheet.id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────────────────

export function getSheet(id) {
  return BY_ID.get(id) || null;
}

/** Every sheet covering this skill, most specific first (patterns are 1:1). */
export function sheetsForSkill(skillId) {
  return (SHEETS_BY_SKILL.get(skillId) || []).map(id => BY_ID.get(id)).filter(Boolean);
}

/** The single best sheet to send someone to for a skill, or null. */
export function sheetForSkill(skillId) {
  return sheetsForSkill(skillId)[0] || null;
}

/**
 * Light listing row — what the library grid needs and nothing more. The full
 * sheet body is only ever sent by the [id] route, so opening /notes does not
 * ship every concept of every sheet.
 */
export function sheetSummary(sheet) {
  if (!sheet) return null;
  return {
    id: sheet.id,
    kind: sheet.kind,
    group: sheet.group,
    title: sheet.title,
    summary: sheet.summary,
    skills: sheet.skills || [],
    skillLabels: (sheet.skills || []).map(skillLabel),
    counts: {
      concepts: sheet.concepts?.length || 0,
      cards: sheet.recall?.length || 0,
      interview: sheet.interview?.length || 0,
      pitfalls: sheet.pitfalls?.length || 0,
      problems: sheet.problems?.length || 0,
    },
    hasTemplate: !!sheet.template,
    order: sheet.order,
  };
}

/** The whole library, ordered: patterns in teaching order, then CS by group. */
export function listSheets() {
  return [...STUDY_SHEETS].sort((a, b) => a.order - b.order).map(sheetSummary);
}

/** Full sheet for the reader view. Same shape for both kinds. */
export function sheetDetail(sheet) {
  if (!sheet) return null;
  return {
    ...sheetSummary(sheet),
    // The one curated video for this sheet, or null. Resolved by sheet id first
    // (pattern sheets share their id with the pattern) and then by the sheet's
    // taxonomy skills, so a sheet gains a video the moment one is curated for
    // any skill it covers. Still no DB and still no network — the map is static.
    video: publicVideo(videoFor({ sheet: sheet.id, skills: sheet.skills })),
    intro: sheet.intro || null,
    tell: sheet.tell || null,
    recognise: sheet.recognise || [],
    concepts: sheet.concepts || [],
    complexity: sheet.complexity || [],
    template: sheet.template || null,
    pitfalls: sheet.pitfalls || [],
    recall: sheet.recall || [],
    interview: sheet.interview || [],
    problems: sheet.problems || [],
    prerequisites: (sheet.prerequisites || []).map((id) => {
      const p = getPattern(id);
      return p ? { id: p.id, name: p.name } : null;
    }).filter(Boolean),
  };
}

/**
 * Render a sheet as markdown, for "save a copy into my notes".
 *
 * This is what makes the curated half additive rather than parallel: a student
 * can pull a sheet into the SAME notes table the freeform editor has always
 * used, then annotate it. No new storage, no new schema — a saved sheet is an
 * ordinary note from that moment on.
 */
export function sheetToMarkdown(sheet) {
  if (!sheet) return '';
  const out = [`# ${sheet.title}`, '', sheet.summary, ''];

  if (sheet.intro) out.push(sheet.intro, '');
  if (sheet.tell) out.push(`**You have got it when:** ${sheet.tell}`, '');

  if (sheet.recognise?.length) {
    out.push('## When to reach for it', ...sheet.recognise.map(r => `- ${r}`), '');
  }
  if (sheet.concepts?.length) {
    out.push('## Key concepts', ...sheet.concepts.map(c => `- **${c.term}** — ${c.detail}`), '');
  }
  if (sheet.complexity?.length) {
    out.push('## Complexity', '| Operation | Time | Space | Notes |', '| --- | --- | --- | --- |');
    for (const r of sheet.complexity) out.push(`| ${r.label} | ${r.time} | ${r.space} | ${r.note || ''} |`);
    out.push('');
  }
  if (sheet.template) {
    out.push(`## ${sheet.template.caption}`, '```' + (sheet.template.lang || ''), sheet.template.code, '```', '');
  }
  if (sheet.pitfalls?.length) {
    out.push('## Common mistakes', ...sheet.pitfalls.map(p => `- ${p}`), '');
  }
  if (sheet.recall?.length) {
    out.push('## Flashcards', ...sheet.recall.map(c => `- **${c.q}** ${c.a}`), '');
  }
  if (sheet.interview?.length) {
    out.push('## Interview questions', ...sheet.interview.flatMap(c => [`**${c.q}**`, c.a, '']));
  }
  if (sheet.problems?.length) {
    out.push('## Practice problems', ...sheet.problems.map(p => `- [${p.title}](${p.url}) — ${p.difficulty}`), '');
  }

  out.push('---', '_Curated GENOIS study sheet. Edit freely — this is your copy._');
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanity check for the debug endpoint, mirroring assertCoverage() in
 * lib/dsaPatterns.js. Not run at import time: a content edit should surface as a
 * visible failing check, never as a module that refuses to load in production.
 *
 *   unknownSkills  — a sheet claims a skill the taxonomy has never heard of
 *   uncoveredDsa   — a dsa.* skill no sheet covers
 *   uncoveredCs    — a cs.* skill no sheet covers
 *   missingPattern — a pattern with no sheet written yet
 */
export function assertSheetCoverage() {
  const unknownSkills = [];
  for (const sheet of STUDY_SHEETS) {
    for (const skill of sheet.skills || []) {
      if (!getSkill(skill)) unknownSkills.push({ sheet: sheet.id, skill });
    }
  }

  const covered = new Set(SHEETS_BY_SKILL.keys());
  const uncoveredDsa = skillsForDomain('dsa').map(s => s.id).filter(id => !covered.has(id));
  const uncoveredCs = skillsForDomain('cs').map(s => s.id).filter(id => !covered.has(id));
  const sheetIds = new Set(STUDY_SHEETS.map(s => s.id));
  const missingPattern = DSA_PATTERNS.map(p => p.id).filter(id => !sheetIds.has(id));

  return {
    ok: !unknownSkills.length && !uncoveredDsa.length && !uncoveredCs.length && !missingPattern.length,
    totals: {
      sheets: STUDY_SHEETS.length,
      patternSheets: patternEntries.length,
      csSheets: csEntries.length,
      skillsCovered: covered.size,
      cards: STUDY_SHEETS.reduce((n, s) => n + (s.recall?.length || 0), 0),
    },
    unknownSkills,
    uncoveredDsa,
    uncoveredCs,
    missingPattern,
  };
}
