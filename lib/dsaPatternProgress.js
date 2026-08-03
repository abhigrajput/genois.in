/**
 * Pattern progression — which pattern the student is on, and why.
 *
 * This is the piece that turns lib/dsaPatterns.js (a static, hand-authored
 * ordering) into a plan for ONE student: where they are, what they must do to
 * advance, what got pulled forward because the evidence says they are weak at
 * it, and how many problems a day their remaining runway actually demands.
 *
 * FIVE RULES, four of them inherited from Phase 2/3 and all load-bearing:
 *
 *   1. NO EVIDENCE → NO CLAIMS. A pattern with no measurements is `unmeasured`,
 *      never `weak`. The prescription for an unknown is to MEASURE it, not to
 *      drill a student on something they may already know. Same distinction
 *      lib/roadmapTargeting.js draws between `remediate` and `measure`, and for
 *      the same reason.
 *
 *   2. THERE IS ONE TARGETING SYSTEM. Weak/unmeasured signal comes from
 *      getRoadmapTargeting() — this module maps its gaps onto patterns and does
 *      not re-derive them from raw rows. Company weighting likewise reuses
 *      companyFocus() rather than re-parsing COMPANY_PROFILES.
 *
 *   3. MASTERY NEEDS TWO SIGNALS. Doing the problems (coverage) and getting
 *      them right under test (accuracy) are different claims. A student who has
 *      ticked every box but never been measured is `practiced`, not `mastered`,
 *      and the UI says exactly that. We do not launder a checkbox into a claim
 *      about skill.
 *
 *   4. TRIMMING IS ANNOUNCED. When the runway cannot fit the full pattern list
 *      even at the maximum sane pace, patterns get cut — lowest company
 *      relevance first — and the plan reports which ones and why. A silently
 *      shortened syllabus is how a student finds out in the interview.
 *
 *   5. EVERY LAYER DEGRADES. No `dsa_pattern_progress` table (migration
 *      unapplied), no evidence bus, no target companies, no timeline: each is
 *      independently optional. The plan gets less specific, never absent, and
 *      never invents the missing half.
 */

import { getAdminClient } from './supabaseAdmin';
import { DSA_PATTERNS, getPattern, patternForSkill, patternSummary, TOTAL_PROBLEMS } from './dsaPatterns';
import { getSkillEvidence } from './skillEvidence';
import { companyFocus, resolveTargets } from './placementReadiness';
import { roadmapTotalDays } from './roadmapCache';

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds. Every one of these is a judgement call, so they live in one
// exported block: the UI quotes them back to the student ("6 of 8 problems, and
// 70% on a test") instead of showing a mastery bar with no stated rule behind it.
// ─────────────────────────────────────────────────────────────────────────────

export const MASTERY_RULES = Object.freeze({
  /** Questions tagged to a pattern's skills before we will call it measured at all. */
  MIN_EVIDENCE: 8,
  /** Accuracy at or above this, with MIN_EVIDENCE behind it, confirms the pattern. */
  MASTERY_ACCURACY: 70,
  /** Accuracy below this, with MIN_EVIDENCE behind it, is a proven weakness. */
  WEAK_ACCURACY: 50,
  /** Share of the pattern's problem list that must be solved to count as covered. */
  COVERAGE_FRACTION: 0.6,
  /**
   * Evidence-only fallback bar, used when the progress table is unavailable and
   * coverage cannot be read. Deliberately higher than MIN_EVIDENCE: with one
   * signal missing the other has to carry more weight.
   */
  DEGRADED_MIN_EVIDENCE: 15,
  /** Realistic daily problem count. A real test user reported 2–5/day, not 1. */
  MIN_PROBLEMS_PER_DAY: 2,
  MAX_PROBLEMS_PER_DAY: 5,
});

/** Pattern states, in the order the UI ranks them. */
export const PATTERN_STATES = Object.freeze({
  MASTERED: 'mastered',
  PRACTICED: 'practiced',     // coverage done, accuracy unconfirmed
  IN_PROGRESS: 'in-progress',
  WEAK: 'weak',               // measured below WEAK_ACCURACY — revisit
  UNMEASURED: 'unmeasured',
  LOCKED: 'locked',           // prerequisite neither mastered nor started
});

const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : null);

// ─────────────────────────────────────────────────────────────────────────────
// Persistence — solved-problem checkmarks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read this user's per-pattern rows.
 *
 * Returns `{ available: false, rows: {} }` when the 20260803 migration hasn't
 * been applied. Every caller treats that as "coverage unknown" and falls back
 * to the evidence-only bar — it never throws and never blocks the roadmap.
 *
 * @returns {Promise<{available: boolean, rows: Record<string, {solved: string[], masteredAt: string|null, startedAt: string|null}>}>}
 */
export async function readPatternRows(userId, supabase = getAdminClient()) {
  if (!userId) return { available: false, rows: {} };
  try {
    const { data, error } = await supabase
      .from('dsa_pattern_progress')
      .select('pattern_id, solved_problems, started_at, mastered_at')
      .eq('user_id', userId);

    if (error) {
      console.warn('[dsaPatternProgress] progress table unavailable:', error.message);
      return { available: false, rows: {} };
    }

    const rows = {};
    for (const r of data || []) {
      rows[r.pattern_id] = {
        solved: Array.isArray(r.solved_problems) ? r.solved_problems.filter(x => typeof x === 'string') : [],
        startedAt: r.started_at || null,
        masteredAt: r.mastered_at || null,
      };
    }
    return { available: true, rows };
  } catch (e) {
    console.warn('[dsaPatternProgress] progress table unavailable:', e.message);
    return { available: false, rows: {} };
  }
}

/**
 * Toggle one problem's solved flag for a pattern.
 *
 * Idempotent, and the whole row is rewritten from the merged set rather than
 * appended to, so a double-click can't produce duplicates.
 *
 * @returns {Promise<{ok: boolean, solved: string[], reason?: string}>}
 */
export async function setProblemSolved(userId, patternId, problemId, solved, supabase = getAdminClient()) {
  const pattern = getPattern(patternId);
  if (!pattern) return { ok: false, solved: [], reason: 'unknown_pattern' };
  // Only ids from the hand-authored list are storable — the same controlled
  // vocabulary discipline the skill taxonomy uses. A client cannot invent one.
  if (!pattern.problems.some(p => p.id === problemId)) {
    return { ok: false, solved: [], reason: 'unknown_problem' };
  }

  try {
    const { data: existing } = await supabase
      .from('dsa_pattern_progress')
      .select('solved_problems')
      .eq('user_id', userId)
      .eq('pattern_id', patternId)
      .maybeSingle();

    const current = new Set(
      Array.isArray(existing?.solved_problems) ? existing.solved_problems : []
    );
    if (solved) current.add(problemId);
    else current.delete(problemId);

    // Preserve authored order so the stored list reads the same as the UI.
    const next = pattern.problems.filter(p => current.has(p.id)).map(p => p.id);

    const { error } = await supabase
      .from('dsa_pattern_progress')
      .upsert(
        {
          user_id: userId,
          pattern_id: patternId,
          solved_problems: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,pattern_id' }
      );

    if (error) {
      console.warn('[dsaPatternProgress] save failed:', error.message);
      return { ok: false, solved: [...current], reason: 'unavailable' };
    }
    return { ok: true, solved: next };
  } catch (e) {
    console.warn('[dsaPatternProgress] save failed:', e.message);
    return { ok: false, solved: [], reason: 'unavailable' };
  }
}

/**
 * Stamp `mastered_at` the first time a pattern clears the bar, so the timeline
 * of "when did this click" survives even if later evidence moves the accuracy
 * around. Best-effort — a failure here never affects the returned plan.
 */
async function stampMastery(userId, patternIds, supabase = getAdminClient()) {
  if (!userId || !patternIds.length) return;
  const now = new Date().toISOString();
  await Promise.allSettled(
    patternIds.map(pattern_id =>
      supabase
        .from('dsa_pattern_progress')
        .update({ mastered_at: now, updated_at: now })
        .eq('user_id', userId)
        .eq('pattern_id', pattern_id)
        .is('mastered_at', null)
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence rollup — skill tags → pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Roll the evidence bus up from skills to patterns.
 *
 * `coding` is tracked separately from the raw total because "solved 6 coding
 * problems tagged sliding-window" and "answered 6 MCQs about sliding window"
 * are not the same claim, and the interview only tests one of them.
 */
function evidenceByPattern(evidence) {
  const byPattern = {};
  for (const p of DSA_PATTERNS) {
    byPattern[p.id] = { correct: 0, total: 0, coding: 0, codingCorrect: 0, skills: [] };
  }

  for (const s of evidence?.skills || []) {
    const patternId = patternForSkill(s.skill);
    if (!patternId) continue;             // cs./apt./comm. skills — not our track
    const bucket = byPattern[patternId];
    bucket.correct += s.correct;
    bucket.total += s.total;
    // `sources` is keyed by attempt_type; 'coding' is written by /api/coding/submit.
    const codingTotal = Number(s.sources?.coding) || 0;
    bucket.coding += codingTotal;
    bucket.skills.push({
      skill: s.skill, label: s.label, correct: s.correct, total: s.total, accuracy: s.accuracy,
    });
  }

  for (const bucket of Object.values(byPattern)) {
    bucket.accuracy = pct(bucket.correct, bucket.total);
    bucket.skills.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
  }
  return byPattern;
}

/**
 * Map targeting's ranked gaps onto patterns.
 * @returns {Record<string, {kind: 'remediate'|'measure', label: string, accuracy: number|null, correct: number, total: number, companies: string[]}>}
 */
function gapsByPattern(targeting) {
  const out = {};
  for (const gap of targeting?.gaps || []) {
    // A gap's `key` is either a single skill id or a group/domain rollup key.
    // Single skills map directly; rollups map through their member skills.
    const candidates = gap.skills?.length ? gap.skills.map(s => s.skill) : [gap.key];
    for (const skillId of candidates) {
      const patternId = patternForSkill(skillId);
      if (!patternId) continue;
      // A proven weakness always beats an unknown for the same pattern.
      const existing = out[patternId];
      if (existing && !(existing.kind === 'measure' && gap.kind === 'remediate')) continue;
      out[patternId] = {
        kind: gap.kind,
        label: gap.label,
        accuracy: gap.accuracy ?? null,
        correct: gap.correct ?? 0,
        total: gap.total ?? 0,
        companies: gap.companies || [],
      };
    }
  }
  return out;
}

/**
 * Which patterns the student's target companies actually interview on.
 *
 * Reuses companyFocus() — the same parse that drives readiness — instead of
 * re-reading COMPANY_PROFILES with a second set of rules. A pattern named by
 * two target companies weighs more than one named by neither.
 *
 * @returns {{weights: Record<string, number>, companies: string[], byPattern: Record<string, string[]>}}
 */
function companyWeighting(targetCompanies) {
  const { matched } = resolveTargets(targetCompanies);
  const weights = {};
  const byPattern = {};
  for (const company of matched) {
    const seen = new Set();
    for (const anchor of companyFocus(company).anchors) {
      for (const skillId of anchor.skills || []) {
        const patternId = patternForSkill(skillId);
        if (!patternId || seen.has(patternId)) continue;
        seen.add(patternId);
        weights[patternId] = (weights[patternId] || 0) + 1;
        (byPattern[patternId] ||= []).push(company);
      }
    }
  }
  return { weights, companies: matched, byPattern };
}

// ─────────────────────────────────────────────────────────────────────────────
// State machine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify one pattern from its two signals.
 *
 * @param {object} ev        pattern-rolled evidence { correct, total, coding, accuracy }
 * @param {string[]} solved  solved problem ids
 * @param {number} problemCount
 * @param {boolean} coverageAvailable  false when the progress table is missing
 */
function classify(ev, solved, problemCount, coverageAvailable) {
  const R = MASTERY_RULES;
  const needed = Math.max(1, Math.ceil(problemCount * R.COVERAGE_FRACTION));
  const covered = coverageAvailable && solved.length >= needed;
  const measured = ev.total >= R.MIN_EVIDENCE;
  const accurate = measured && ev.accuracy >= R.MASTERY_ACCURACY;

  // Degraded path: no coverage signal at all, so accuracy alone decides, at a
  // higher evidence bar. Stated in the returned `basis` so the UI can say so.
  if (!coverageAvailable) {
    if (ev.total >= R.DEGRADED_MIN_EVIDENCE && ev.accuracy >= R.MASTERY_ACCURACY) {
      return { state: PATTERN_STATES.MASTERED, basis: 'evidence-only', needed, covered: false };
    }
    if (measured && ev.accuracy < R.WEAK_ACCURACY) {
      return { state: PATTERN_STATES.WEAK, basis: 'evidence-only', needed, covered: false };
    }
    if (ev.total > 0) return { state: PATTERN_STATES.IN_PROGRESS, basis: 'evidence-only', needed, covered: false };
    return { state: PATTERN_STATES.UNMEASURED, basis: 'evidence-only', needed, covered: false };
  }

  if (covered && accurate) return { state: PATTERN_STATES.MASTERED, basis: 'both', needed, covered };
  // Rule 3 — coverage without measurement is not mastery, and we say so.
  if (covered && !measured) return { state: PATTERN_STATES.PRACTICED, basis: 'coverage-only', needed, covered };
  if (measured && ev.accuracy < R.WEAK_ACCURACY) return { state: PATTERN_STATES.WEAK, basis: 'evidence', needed, covered };
  if (solved.length > 0 || ev.total > 0) return { state: PATTERN_STATES.IN_PROGRESS, basis: 'partial', needed, covered };
  return { state: PATTERN_STATES.UNMEASURED, basis: 'none', needed, covered };
}

const ADVANCED = new Set([PATTERN_STATES.MASTERED, PATTERN_STATES.PRACTICED]);
const STARTED = new Set([PATTERN_STATES.MASTERED, PATTERN_STATES.PRACTICED, PATTERN_STATES.IN_PROGRESS, PATTERN_STATES.WEAK]);

/**
 * Human sentence for why this pattern is where it is. Every number in here is
 * a real count from the student's own rows — there is no branch that produces
 * an encouraging sentence with nothing behind it.
 */
function explain(entry) {
  const { state, evidence: ev, solved, needed, gap, companies, basis, blockedBy } = entry;
  const acc = ev.accuracy;

  // Degraded database: there is no coverage signal, so no sentence may quote a
  // problem count. Saying "0/8 problems done" when we cannot read them would be
  // a claim about the student that we have no rows for.
  if (basis === 'evidence-only' && state !== PATTERN_STATES.MASTERED) {
    if (state === PATTERN_STATES.WEAK) {
      const who = companies.length ? ` It blocks your ${companies.join(' and ')} target.` : '';
      return `Measured weakness: ${ev.correct}/${ev.total} correct (${acc}%) across your assessment history.${who}`;
    }
    if (ev.total > 0) {
      return `In progress: ${ev.correct}/${ev.total} correct (${acc}%) on questions tagged to this pattern. Per-problem tracking is unavailable on this database.`;
    }
    return `Not started. No evidence either way yet.`;
  }

  if (state === PATTERN_STATES.MASTERED) {
    return basis === 'evidence-only'
      ? `Mastered on test evidence alone: ${ev.correct}/${ev.total} correct (${acc}%). Per-problem tracking is unavailable on this database, so coverage isn't counted.`
      : `Mastered: ${solved.length}/${needed} problems done and ${ev.correct}/${ev.total} correct (${acc}%) on questions tagged to this pattern.`;
  }
  if (state === PATTERN_STATES.PRACTICED) {
    return `You've done the problems (${solved.length}/${needed}) but nothing has tested you on this yet. Take a test on it to confirm — until then this is unverified.`;
  }
  if (state === PATTERN_STATES.WEAK) {
    const who = companies.length ? ` It blocks your ${companies.join(' and ')} target.` : '';
    const leans = blockedBy?.length
      ? ` It leans on ${blockedBy.map(id => getPattern(id)?.name || id).join(' and ')}, which you haven't started — expect to borrow from there.`
      : '';
    return `Measured weakness: ${ev.correct}/${ev.total} correct (${acc}%) across your assessment history.${who} Rebuild the standard pattern before pushing to harder problems.${leans}`;
  }
  if (state === PATTERN_STATES.IN_PROGRESS) {
    const evPart = ev.total > 0 ? `, ${ev.correct}/${ev.total} correct (${acc}%) so far` : ', no test evidence yet';
    return `In progress: ${solved.length}/${needed} problems done${evPart}.`;
  }
  if (state === PATTERN_STATES.LOCKED) {
    return `Locked — it builds on a pattern you haven't started.`;
  }
  // UNMEASURED
  if (gap?.kind === 'measure') {
    const who = companies.length ? `Your ${companies.join(' and ')} target depends on it` : 'Your targets depend on it';
    return `${who} and there's no evidence either way yet — this is an unknown, not a weakness. Working through it will measure you.`;
  }
  return `Not started. No evidence either way yet.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// The plan
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the full pattern plan for one student.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {object} [opts.user]        the users row (months_to_placement, target_companies, level)
 * @param {object} [opts.targeting]   pre-computed getRoadmapTargeting() result — passed in
 *                                    by the caller so readiness is paid for once per request
 * @param {number} [opts.currentDay]  progress.current_day, for pace maths
 * @param {boolean} [opts.skipBasics] treat Foundations as skipped (advanced students)
 * @returns {Promise<object>} see the return literal at the bottom
 */
export async function getPatternPlan(userId, opts = {}) {
  // ── inputs, each independently optional ─────────────────────────────────
  let evidence = { available: false, skills: [] };
  try {
    evidence = await getSkillEvidence(userId, { minEvidence: 1 });
  } catch (e) {
    console.warn('[dsaPatternProgress] evidence unavailable:', e.message);
  }

  const coverage = await readPatternRows(userId);

  return computePlan({ ...opts, userId, evidence, coverage });
}

/**
 * The plan itself, with every database read already done.
 *
 * Split out from getPatternPlan so the progression rules are exercisable
 * against constructed inputs (a fresh student, a student mid-pattern, a student
 * who just cleared one) without a database — the same code path the request
 * takes, not a reimplementation of it.
 *
 * @param {object} args
 * @param {object} args.evidence   getSkillEvidence() result
 * @param {object} args.coverage   readPatternRows() result
 * @param {object} [args.user]     the users row
 * @param {object} [args.targeting] getRoadmapTargeting() result
 * @param {number} [args.currentDay]
 * @param {boolean} [args.skipBasics]
 * @param {string} [args.userId]   only used to stamp mastered_at; omit for a dry run
 */
export function computePlan({
  evidence = { available: false, skills: [] },
  coverage = { available: false, rows: {} },
  user = null,
  targeting = null,
  currentDay = 1,
  skipBasics = false,
  userId = null,
} = {}) {
  const { available: coverageAvailable, rows } = coverage;
  const evByPattern = evidenceByPattern(evidence);
  const gaps = gapsByPattern(targeting);
  const { weights: companyWeights, companies: targetCompanies, byPattern: companiesByPattern } =
    companyWeighting(user?.target_companies);

  // ── 1. Classify every pattern ───────────────────────────────────────────
  const entries = DSA_PATTERNS.map((pattern) => {
    const ev = evByPattern[pattern.id];
    const row = rows[pattern.id] || { solved: [], startedAt: null, masteredAt: null };
    // Stored ids are filtered against the authored list so a renamed problem
    // can't inflate coverage forever.
    const solved = pattern.problems.filter(p => row.solved.includes(p.id)).map(p => p.id);
    const { state, basis, needed, covered } = classify(ev, solved, pattern.problems.length, coverageAvailable);

    return {
      ...patternSummary(pattern),
      state,
      basis,
      needed,
      covered,
      solved,
      solvedCount: solved.length,
      masteredAt: row.masteredAt,
      evidence: ev,
      gap: gaps[pattern.id] || null,
      companies: companiesByPattern[pattern.id] || [],
      companyWeight: companyWeights[pattern.id] || 0,
      problems: pattern.problems.map(p => ({ ...p, solved: solved.includes(p.id) })),
    };
  });

  const byId = new Map(entries.map(e => [e.id, e]));

  // Foundations is the one skippable pattern: an advanced student who has
  // already skipped basics on the day-roadmap shouldn't be parked on Big-O.
  if (skipBasics) {
    const f = byId.get('foundations');
    if (f && !ADVANCED.has(f.state)) {
      f.state = PATTERN_STATES.PRACTICED;
      f.basis = 'skipped';
      f.skipped = true;
    }
  }

  // ── 2. Lock patterns whose prerequisite hasn't been started ─────────────
  // Advisory, not punitive: a prerequisite that's merely in-progress does NOT
  // lock its dependant, so a student is never fully blocked by one hard pattern.
  //
  // A PROVEN WEAKNESS IS NEVER LOCKED. If the evidence says a student is at 21%
  // on Graphs, they are already being examined on Graphs — telling them it's
  // locked behind Trees would bury the one thing readiness says is blocking
  // their target. The prerequisite is still reported in `blockedBy` so the UI
  // can say "this leans on Trees", it just doesn't gate the queue.
  for (const e of entries) {
    if (ADVANCED.has(e.state)) continue;
    const blocking = e.prerequisites.filter(id => {
      const pre = byId.get(id);
      return pre && !STARTED.has(pre.state);
    });
    if (!blocking.length) continue;
    e.blockedBy = blocking;
    const proven = e.state === PATTERN_STATES.WEAK || e.gap?.kind === 'remediate';
    if (!proven) e.state = PATTERN_STATES.LOCKED;
  }

  // ── 3. Priority ─────────────────────────────────────────────────────────
  // Canonical order is the spine. Evidence and company relevance can pull a
  // pattern forward; nothing invents an order of its own (rule 2).
  //
  //   proven weakness      −1000  jumps the queue outright — see below
  //   unmeasured + blocking  −15   an unknown a target company tests
  //   company relevance       −4 per naming company
  //   locked                +100   never surfaces as "current"
  //
  // A PROVEN WEAKNESS JUMPS THE QUEUE OUTRIGHT rather than getting a nudge.
  // Two reasons. First, a measured 21% on Graphs with an Amazon target is the
  // single most valuable thing that student can work on, and a −40 nudge on an
  // order-scaled score would leave them eight patterns away from it. Second,
  // Phase 3 gap targeting is ALSO reshaping today's content toward that gap —
  // if the pattern and the gap disagreed, the generated day would be told to
  // teach two different subjects at once. Making them agree is what keeps the
  // two systems one system (rule 2). Among several proven weaknesses the
  // canonical order still decides, so the student isn't bounced around.
  for (const e of entries) {
    let score = e.order * 10;
    const proven = e.gap?.kind === 'remediate' || e.state === PATTERN_STATES.WEAK;
    if (proven) score -= 1000;
    else if (e.gap?.kind === 'measure') score -= 15;
    score -= e.companyWeight * 4;
    if (e.state === PATTERN_STATES.LOCKED) score += 100;
    if (ADVANCED.has(e.state)) score += 10000;   // done — sink to the bottom
    e.priority = score;
    e.prioritised = proven;
  }

  const queue = [...entries].sort((a, b) => a.priority - b.priority || a.order - b.order);
  const current = queue.find(e => !ADVANCED.has(e.state)) || null;
  const next = queue.find(e => e !== current && !ADVANCED.has(e.state)) || null;

  // When evidence pulls the student OFF the canonical sequence, say so — a
  // roadmap that silently jumps from Sliding Window to Graphs looks broken.
  const inOrder = entries.find(e => !ADVANCED.has(e.state) && e.state !== PATTERN_STATES.LOCKED) || null;
  const detour = current && inOrder && current.id !== inOrder.id && current.prioritised
    ? { from: { id: inOrder.id, name: inOrder.name }, to: { id: current.id, name: current.name } }
    : null;

  // ── 4. Time-awareness ───────────────────────────────────────────────────
  const pace = computePace({
    entries,
    monthsToPlacement: user?.months_to_placement ?? null,
    currentDay,
  });

  // ── 5. Persist the mastery timestamp for anything newly cleared ─────────
  const newlyMastered = entries
    .filter(e => e.state === PATTERN_STATES.MASTERED && !e.masteredAt)
    .map(e => e.id);
  if (userId && coverageAvailable && newlyMastered.length) {
    stampMastery(userId, newlyMastered).catch(() => {});
  }

  for (const e of entries) e.why = explain(e);

  const masteredCount = entries.filter(e => e.state === PATTERN_STATES.MASTERED).length;
  const solvedTotal = entries.reduce((n, e) => n + e.solvedCount, 0);

  return {
    available: true,
    // What the student is on right now, and what it takes to leave it.
    current: current
      ? {
          ...current,
          unlocks: next ? { id: next.id, name: next.name } : null,
          requirement: advanceRequirement(current, coverageAvailable),
        }
      : null,
    next: next ? { id: next.id, name: next.name, why: next.why, state: next.state } : null,
    // Non-null only when a measured weakness pulled the student off the
    // canonical sequence. The UI turns this into "detoured from X to Y because…".
    detour,
    patterns: entries.sort((a, b) => a.order - b.order),
    queue: queue.map(e => e.id),
    pace,
    totals: {
      patterns: entries.length,
      mastered: masteredCount,
      problemsSolved: solvedTotal,
      problemsTotal: TOTAL_PROBLEMS,
      percentPatterns: Math.round((masteredCount / entries.length) * 100),
    },
    signals: {
      // Exactly which inputs were live for this computation — the UI uses these
      // to avoid claiming personalization it didn't actually get (rule 1).
      evidence: !!evidence.available,
      evidenceQuestions: evidence.questionsScanned || 0,
      coverageTracking: coverageAvailable,
      targeted: !!targeting?.targeted,
      targetCompanies,
      timeline: user?.months_to_placement ?? null,
      skipBasics: !!skipBasics,
    },
    rules: MASTERY_RULES,
  };
}

/**
 * What, concretely, unlocks the next pattern. Phrased as the student's own
 * remaining counts, never as a percentage with no rule attached.
 */
function advanceRequirement(entry, coverageAvailable) {
  const R = MASTERY_RULES;
  const ev = entry.evidence;

  if (!coverageAvailable) {
    const need = Math.max(0, R.DEGRADED_MIN_EVIDENCE - ev.total);
    return {
      problemsRemaining: null,
      evidenceRemaining: need,
      text: need > 0
        ? `Answer ${need} more assessment question${need === 1 ? '' : 's'} on this pattern at ${R.MASTERY_ACCURACY}%+ to advance. (Per-problem tracking is unavailable on this database.)`
        : `Reach ${R.MASTERY_ACCURACY}% on this pattern's questions to advance — currently ${ev.accuracy ?? 0}%.`,
    };
  }

  const problemsRemaining = Math.max(0, entry.needed - entry.solvedCount);
  const evidenceRemaining = Math.max(0, R.MIN_EVIDENCE - ev.total);
  const bits = [];
  if (problemsRemaining > 0) bits.push(`${problemsRemaining} more problem${problemsRemaining === 1 ? '' : 's'}`);
  if (evidenceRemaining > 0) bits.push(`${evidenceRemaining} more tested question${evidenceRemaining === 1 ? '' : 's'} on it`);
  if (!bits.length && (ev.accuracy ?? 0) < R.MASTERY_ACCURACY) {
    bits.push(`your accuracy up from ${ev.accuracy}% to ${R.MASTERY_ACCURACY}%`);
  }

  return {
    problemsRemaining,
    evidenceRemaining,
    text: bits.length
      ? `Needs ${bits.join(' and ')}.`
      : `Requirements met — this pattern clears on the next refresh.`,
  };
}

/**
 * Pace and trimming.
 *
 * Inputs are the two the profile actually carries: `months_to_placement` and
 * how many days of the plan are already spent. There is no `hours_per_day`
 * column on this database, so nothing here claims to know one — the pace is
 * expressed in problems per day and clamped to the range a real student
 * sustains (2–5), not derived from an invented hours figure.
 */
function computePace({ entries, monthsToPlacement, currentDay }) {
  const R = MASTERY_RULES;
  const totalDays = roadmapTotalDays(monthsToPlacement);
  const remainingDays = Math.max(1, totalDays - Math.max(0, currentDay - 1));

  const outstanding = entries.filter(e => !ADVANCED.has(e.state));

  // TWO budgets, because "enough to advance" and "the whole curriculum" are
  // different targets and a long runway should buy the second one.
  //   core — the 60% of each list that clears the mastery bar
  //   full — every problem in every unfinished pattern
  const coreProblems = outstanding.reduce((n, e) => n + Math.max(0, e.needed - e.solvedCount), 0);
  const fullProblems = outstanding.reduce((n, e) => n + Math.max(0, e.problemCount - e.solvedCount), 0);

  // A student with room does NOT get told "1 problem a day" — the surplus buys
  // depth (the rest of each pattern's list), not idleness. Only when even the
  // core doesn't fit do we fall back to it and start cutting.
  const ceiling = R.MAX_PROBLEMS_PER_DAY * remainingDays;
  const targetsFullList = fullProblems <= ceiling;
  const remainingProblems = targetsFullList ? fullProblems : coreProblems;

  const idealRate = remainingProblems / remainingDays;
  const problemsPerDay = Math.min(
    R.MAX_PROBLEMS_PER_DAY,
    Math.max(R.MIN_PROBLEMS_PER_DAY, Math.ceil(idealRate))
  );

  // Rule 4 — if even the core list doesn't fit at the top of the sane range,
  // cut from the least company-relevant end and SAY SO.
  const capacity = problemsPerDay * remainingDays;
  const trimmed = [];
  if (remainingProblems > capacity) {
    // Drop candidates: lowest company weight first, then latest in the canonical
    // order. Foundations and anything with a proven gap are never dropped.
    const droppable = [...outstanding]
      .filter(e => e.id !== 'foundations' && e.gap?.kind !== 'remediate' && e.state !== PATTERN_STATES.WEAK)
      .sort((a, b) => a.companyWeight - b.companyWeight || b.order - a.order);

    let fitted = remainingProblems;
    for (const e of droppable) {
      if (fitted <= capacity) break;
      const cost = Math.max(0, e.needed - e.solvedCount);
      fitted -= cost;
      trimmed.push({
        id: e.id,
        name: e.name,
        problems: cost,
        reason: e.companyWeight > 0
          ? `Lower priority for ${e.companies.join(' and ')} than the patterns kept ahead of it.`
          : `Not named in any of your target companies' interview focus.`,
      });
    }
  }

  const patternsWord = `${outstanding.length} unfinished pattern${outstanding.length === 1 ? '' : 's'}`;
  const scope = targetsFullList
    ? `Your runway fits the COMPLETE list — ${fullProblems} problems across ${patternsWord}, not just the ${coreProblems} needed to advance.`
    : `Your runway is tight, so this targets the ${coreProblems} problems needed to clear each pattern (of ${fullProblems} listed) across ${patternsWord}.`;

  return {
    problemsPerDay,
    remainingDays,
    totalDays,
    monthsToPlacement,
    remainingProblems,
    coreProblems,
    fullProblems,
    targetsFullList,
    capacity,
    fits: remainingProblems <= capacity,
    patternsOutstanding: outstanding.length,
    trimmed,
    // Honest about the shape of the estimate: this is a problem budget, not a
    // schedule, and it says which number drove it.
    note: monthsToPlacement == null
      ? `${scope} No placement timeline set, so this paces against the default ${totalDays}-day plan — set a target in your profile to tighten it.`
      : `${scope} ${remainingDays} of your ${totalDays} days remain.`,
  };
}

/**
 * The slice of the plan that rides in `roadmap.meta` on a generated day, so a
 * cached day can explain which pattern it was built for. Tiny by design — same
 * reasoning as focusForCache() in lib/roadmapTargeting.js, no new column.
 */
export function patternForCache(plan) {
  const c = plan?.current;
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    state: c.state,
    solved: c.solvedCount,
    needed: c.needed,
    accuracy: c.evidence?.accuracy ?? null,
    evidenceTotal: c.evidence?.total ?? 0,
  };
}

/**
 * Prompt block for the day generator. Reshapes the day's SUBJECT to the current
 * pattern, on top of (not instead of) the evidence-gap instructions from
 * lib/roadmapTargeting.js — that module still owns which gap the day attacks.
 *
 * Returns '' when there is no plan, so an untargeted day generates exactly as
 * it did before this module existed.
 */
export function buildPatternInstructions(plan) {
  const c = plan?.current;
  if (!c) return '';

  const lines = [
    `PATTERN-BASED ROADMAP — the student is working through ONE pattern at a time, and today belongs to: ${c.name.toUpperCase()}.`,
    `Everything today — the worked example, the key concepts and the coding task — MUST exercise ${c.name}. Do not introduce a different pattern.`,
    `The pattern's core idea, in the student's own curriculum: ${c.intro}`,
  ];

  if (c.state === PATTERN_STATES.WEAK && c.evidence.total > 0) {
    lines.push(
      `They are MEASURED WEAK here: ${c.evidence.correct}/${c.evidence.total} correct (${c.evidence.accuracy}%). Rebuild the standard shape of the pattern first and pitch today at something they can finish. Do NOT open with an interview-hard problem.`
    );
  } else if (c.state === PATTERN_STATES.UNMEASURED) {
    lines.push(
      `There is NO assessment evidence on this pattern either way, so do not tell them they are weak at it. Teach the core idea, then set work that will REVEAL their actual level.`
    );
  } else if (c.evidence.total > 0) {
    lines.push(
      `Evidence so far on this pattern: ${c.evidence.correct}/${c.evidence.total} correct (${c.evidence.accuracy}%), ${c.solvedCount} of ${c.problemCount} listed problems solved.`
    );
  }

  lines.push(
    `Pace: this student's remaining runway works out to ${plan.pace.problemsPerDay} problems per day. Size today's coding task accordingly — one substantial problem plus ${Math.max(1, plan.pace.problemsPerDay - 1)} shorter reps of the same pattern, not one problem in isolation.`
  );
  lines.push(`What "mastered" means here, so today can build toward it: ${c.tell}`);

  return `\n=== TODAY'S PATTERN ===\n${lines.join('\n')}\n=== END PATTERN ===\n`;
}
