/**
 * Evidence bus — read side.
 *
 * One function answers "what does this student actually know", by aggregating
 * every assessment they've taken out of public.test_questions and rolling it up
 * by canonical skill tag. Readiness (next phase) consumes this; nothing here
 * renders UI.
 *
 * Three levels of degradation, in order of preference:
 *   1. `skill_breakdown` column   — post-20260731, cheapest, one field per row
 *   2. `questions[].skill`        — written by the evidence bus even when the
 *                                   migration is unapplied
 *   3. resolve from `questions[].topic` at read time — covers rows written
 *                                   before the evidence bus existed
 * So this returns useful numbers on an un-migrated database, and useful numbers
 * over historic rows. It never throws on a missing table/column: callers get
 * `available: false` and empty aggregates, same contract as /api/review.
 */

import { getAdminClient } from './supabaseAdmin';
import {
  resolveSkillFromEntry, skillLabel, getSkill, SKILL_DOMAINS, UNCLASSIFIED,
} from './skillTaxonomy';

// Rows scanned per user. 500 attempts is far beyond any real student's history
// while keeping the aggregate a single bounded query.
const MAX_ATTEMPTS = 500;

const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : 0);

function bump(acc, skill, correct, total, meta) {
  if (!skill || !total) return;
  if (!acc[skill]) {
    acc[skill] = {
      skill,
      correct: 0,
      total: 0,
      attempts: 0,
      lastSeen: null,
      sources: {},
    };
  }
  const bucket = acc[skill];
  bucket.correct += correct;
  bucket.total += total;
  bucket.attempts += 1;
  if (meta?.takenAt && (!bucket.lastSeen || meta.takenAt > bucket.lastSeen)) {
    bucket.lastSeen = meta.takenAt;
  }
  const src = meta?.attemptType || 'unknown';
  bucket.sources[src] = (bucket.sources[src] || 0) + total;
}

/**
 * Pull one row's { skill: {correct, total} } map, whichever level of evidence
 * that row happens to carry.
 */
function skillMapForRow(row) {
  // Level 1 — the dedicated column.
  if (row.skill_breakdown && typeof row.skill_breakdown === 'object') {
    const keys = Object.keys(row.skill_breakdown);
    if (keys.length) return row.skill_breakdown;
  }

  // Levels 2 and 3 — derive from the question entries.
  const map = {};
  for (const q of row.questions || []) {
    const skill = q.skill || resolveSkillFromEntry(q) || UNCLASSIFIED;
    if (!map[skill]) map[skill] = { correct: 0, total: 0 };
    map[skill].total++;
    if (q.is_correct) map[skill].correct++;
  }
  return map;
}

/**
 * Aggregate a user's whole assessment history by skill tag.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {string[]} [opts.attemptTypes]  restrict to these attempt_type values
 * @param {string}   [opts.since]         ISO timestamp lower bound
 * @param {number}   [opts.minEvidence]   drop skills with fewer than N questions
 *                                        of evidence (default 1 — keep all)
 * @returns {Promise<object>} {
 *   available, userId, attemptsScanned, questionsScanned,
 *   skills: [{ skill, label, domain, group, correct, total, accuracy, attempts, lastSeen, sources }],
 *   byDomain: { dsa: { correct, total, accuracy, skills } , ... },
 *   unclassified: { total, sampleTopics }
 * }
 */
export async function getSkillEvidence(userId, opts = {}) {
  const { attemptTypes = null, since = null, minEvidence = 1 } = opts;

  const empty = {
    available: false,
    userId,
    attemptsScanned: 0,
    questionsScanned: 0,
    skills: [],
    byDomain: {},
    unclassified: { total: 0, sampleTopics: [] },
  };

  if (!userId) return empty;

  let rows;
  try {
    const supabase = getAdminClient();
    let query = supabase
      .from('test_questions')
      .select('attempt_type, attempt_category, topic, taken_at, questions, skill_breakdown')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(MAX_ATTEMPTS);
    if (attemptTypes?.length) query = query.in('attempt_type', attemptTypes);
    if (since) query = query.gte('taken_at', since);

    let { data, error } = await query;

    // Pre-20260731 database: `skill_breakdown` isn't a column yet. Re-run
    // without it and fall through to deriving tags from the question entries.
    if (error) {
      let fallback = supabase
        .from('test_questions')
        .select('attempt_type, topic, taken_at, questions')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false })
        .limit(MAX_ATTEMPTS);
      if (attemptTypes?.length) fallback = fallback.in('attempt_type', attemptTypes);
      if (since) fallback = fallback.gte('taken_at', since);
      ({ data, error } = await fallback);
    }

    // Still failing means the table itself is missing (20260715 unapplied).
    if (error) {
      console.warn('[skillEvidence] unavailable:', error.message);
      return empty;
    }
    rows = data || [];
  } catch (e) {
    console.warn('[skillEvidence] unavailable:', e.message);
    return empty;
  }

  const acc = {};
  const unclassifiedTopics = new Map();
  let questionsScanned = 0;

  for (const row of rows) {
    const meta = { attemptType: row.attempt_type, takenAt: row.taken_at };
    const map = skillMapForRow(row);
    for (const [skill, counts] of Object.entries(map)) {
      const total = Number(counts?.total) || 0;
      const correct = Number(counts?.correct) || 0;
      questionsScanned += total;
      bump(acc, skill, correct, total, meta);
    }
    // Track what failed to classify so the vocabulary can be extended with real
    // strings rather than guesses.
    if (map[UNCLASSIFIED]) {
      for (const q of row.questions || []) {
        const tag = q.skill || resolveSkillFromEntry(q);
        if (tag === UNCLASSIFIED && q.topic) {
          unclassifiedTopics.set(q.topic, (unclassifiedTopics.get(q.topic) || 0) + 1);
        }
      }
    }
  }

  const skills = Object.values(acc)
    .filter(s => s.skill !== UNCLASSIFIED && s.total >= minEvidence)
    .map(s => {
      const def = getSkill(s.skill);
      return {
        ...s,
        label: skillLabel(s.skill),
        domain: def?.domain || null,
        group: def?.group || null,
        accuracy: pct(s.correct, s.total),
      };
    })
    .sort((a, b) => b.total - a.total || a.skill.localeCompare(b.skill));

  const byDomain = {};
  for (const key of Object.keys(SKILL_DOMAINS)) {
    const inDomain = skills.filter(s => s.domain === key);
    if (!inDomain.length) continue;
    const correct = inDomain.reduce((n, s) => n + s.correct, 0);
    const total = inDomain.reduce((n, s) => n + s.total, 0);
    byDomain[key] = {
      label: SKILL_DOMAINS[key].label,
      correct,
      total,
      accuracy: pct(correct, total),
      skills: inDomain.length,
    };
  }

  return {
    available: true,
    userId,
    attemptsScanned: rows.length,
    questionsScanned,
    skills,
    byDomain,
    unclassified: {
      total: acc[UNCLASSIFIED]?.total || 0,
      sampleTopics: [...unclassifiedTopics.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([topic, count]) => ({ topic, count })),
    },
  };
}

/**
 * Convenience slice for readiness: the weakest and strongest skills that have
 * enough evidence behind them to be worth acting on.
 *
 * `minEvidence` defaults to 3 here (not 1) — calling a skill "weak" off a
 * single wrong MCQ is noise, and a roadmap built on that noise is worse than no
 * roadmap.
 */
export async function getSkillStrengths(userId, { minEvidence = 3, limit = 10, ...rest } = {}) {
  const evidence = await getSkillEvidence(userId, { ...rest, minEvidence });
  if (!evidence.available) return { available: false, weakest: [], strongest: [] };

  const ranked = [...evidence.skills].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  return {
    available: true,
    weakest: ranked.slice(0, limit),
    strongest: [...ranked].reverse().slice(0, limit),
    byDomain: evidence.byDomain,
  };
}
