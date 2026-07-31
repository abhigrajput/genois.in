/**
 * Roadmap targeting — turns readiness gaps into today's lesson focus.
 *
 * This is the loop-closer. Phase 1 tags every assessment by skill, Phase 2
 * turns those tags into per-company readiness with NAMED gaps, and this module
 * feeds those named gaps back into the roadmap generator so the next day's
 * content works on what the student is actually failing.
 *
 * It consumes `getPlacementReadiness` directly — no third aggregation of
 * questions, no parallel opinion about what a gap is.
 *
 * FOUR RULES, all inherited from Phase 2 and all load-bearing:
 *
 *   1. NO EVIDENCE → NO CLAIMS. With nothing measured this returns
 *      `targeted: false` and the roadmap generates exactly as it does today.
 *      A targeting block never says "you're weak at X" without correct/total
 *      behind it.
 *
 *   2. "WEAK" AND "UNMEASURED" ARE DIFFERENT PRESCRIPTIONS. A measured 31% is
 *      a proven weakness → remediate it. An area with no evidence is an
 *      UNKNOWN, not a weakness → the honest response is to assess it, never to
 *      drill a student on something they may already know. The two kinds carry
 *      different `kind` values and produce different instructions.
 *
 *   3. RIGID TRACK ROUTING IS PRESERVED. Only `dsa.*` and `cs.*` gaps may
 *      reshape a day's content. An aptitude or communication gap belongs to
 *      /aptitude and /voice-interview; injecting it into an AI/ML student's
 *      day would resurrect exactly the domain-bleed bug that DOMAIN_TRACKS
 *      exists to prevent. Those gaps come back in `elsewhere` for the UI to
 *      link, and never enter the prompt.
 *
 *   4. THE FINGERPRINT IGNORES SCORES. Cache invalidation keys on the SET of
 *      open gaps, not their accuracies — otherwise every answered question
 *      would invalidate the cached day and trigger a fresh AI generation.
 */

import { getPlacementReadiness } from './placementReadiness';
import { getSkill } from './skillTaxonomy';

/**
 * Skill domains whose gaps may reshape roadmap CONTENT. See rule 3 — this list
 * is the boundary between "the roadmap can fix this" and "another feature owns
 * this", and widening it re-opens domain bleed.
 */
const INJECTABLE_DOMAINS = ['dsa', 'cs'];

/** Ranked gaps considered for rotation. Beyond this it's noise, not a plan. */
const MAX_FOCUS_POOL = 5;

/** Where a non-injectable gap actually gets closed. */
const ELSEWHERE_ACTION = {
  apt: { href: '/aptitude', label: 'Run an aptitude session' },
  comm: { href: '/voice-interview', label: 'Run a mock interview' },
};

/**
 * Stable, order-independent fingerprint of a gap SET. Deliberately excludes
 * accuracies (rule 4): it changes when a gap opens or closes, not when a score
 * moves a point.
 */
function fingerprint(gaps) {
  const keys = gaps.map(g => `${g.kind}:${g.key}`).sort();
  if (!keys.length) return 'none';
  // Small, stable, non-cryptographic — this only ever compares equal/not-equal.
  let h = 0;
  const s = keys.join('|');
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `g${(h >>> 0).toString(36)}:${keys.length}`;
}

/**
 * Merge the per-company gap lists into one ranked list.
 *
 * Ranking, in order:
 *   1. Proven weaknesses before unknowns — we can only assert a weakness where
 *      there is evidence.
 *   2. More target companies blocked first — a gap blocking both Amazon and
 *      TCS is worth more of the student's day than one blocking neither.
 *   3. Lowest accuracy first, for weaknesses.
 */
function rankGaps(companies) {
  const merged = new Map();

  for (const c of companies) {
    for (const gap of c.gaps) {
      const kind = gap.type === 'weak' ? 'remediate' : 'measure';
      const id = `${kind}:${gap.key}`;
      const area = c.areas.find(a => a.key === gap.key);
      const existing = merged.get(id);

      if (existing) {
        if (!existing.companies.includes(c.company)) existing.companies.push(c.company);
        continue;
      }

      merged.set(id, {
        key: gap.key,
        kind,
        label: gap.label,
        accuracy: gap.accuracy,
        correct: area?.correct ?? 0,
        total: area?.total ?? 0,
        // The individual tagged skills behind the area — this is what makes a
        // targeting instruction specific instead of a vague topic name.
        skills: (area?.skills || []).map(s => ({
          skill: s.skill, label: s.label, correct: s.correct, total: s.total, accuracy: s.accuracy,
        })),
        domain: area?.domain || getSkill(gap.key)?.domain || null,
        companies: [c.company],
        action: gap.action,
        detail: gap.detail,
      });
    }
  }

  return [...merged.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'remediate' ? -1 : 1;
    if (b.companies.length !== a.companies.length) return b.companies.length - a.companies.length;
    if (a.kind === 'remediate') return (a.accuracy ?? 100) - (b.accuracy ?? 100);
    return a.label.localeCompare(b.label);
  });
}

/**
 * Build the prompt block for one focus gap.
 *
 * Every figure in here is a real count from the student's own rows. The block
 * also states what NOT to do, because the failure mode of a targeted day is a
 * generator that dumps a hard problem on a student who is already at 31%.
 */
function buildInstructions(focus, allGaps) {
  const blocking = focus.companies.join(' and ');
  const skillDetail = focus.skills.length
    ? focus.skills.map(s => `${s.label} ${s.correct}/${s.total} (${s.accuracy}%)`).join(', ')
    : null;

  const lines = [];

  if (focus.kind === 'remediate') {
    lines.push(
      `MEASURED WEAKNESS — today must address it: ${focus.label}. This student has answered ${focus.correct} of ${focus.total} questions correctly (${focus.accuracy}%) in this area across their real assessment history.`
    );
    if (skillDetail) lines.push(`Per-skill evidence: ${skillDetail}.`);
    lines.push(`This gap blocks their ${blocking} target.`);
    lines.push(
      `Today's coding task, worked example and key concepts MUST exercise ${focus.label}. Pitch it at a level they can actually FINISH given ${focus.accuracy}% accuracy — rebuild the fundamentals and the standard pattern first. Do NOT open with an interview-hard problem in this area.`
    );
  } else {
    // An unknown is not a weakness. Say so, and prescribe measurement.
    lines.push(
      `UNMEASURED AREA — ${focus.label}. This student's ${blocking} target depends on it and we have NO assessment evidence either way, so do not assume they are weak at it and do not tell them they are.`
    );
    lines.push(
      `Treat today as a calibration day for ${focus.label}: teach the core idea, then set a task that will REVEAL their actual level (one standard problem plus one that needs the pattern properly applied). Keep the explanation complete enough that a student new to it can follow.`
    );
  }

  const others = allGaps.filter(g => g.key !== focus.key).slice(0, 3);
  if (others.length) {
    lines.push(
      `Other open gaps, for context only — do NOT cover them today: ${others.map(g => `${g.label}${g.kind === 'remediate' ? ` (${g.accuracy}%)` : ' (unmeasured)'}`).join(', ')}.`
    );
  }

  return `\n=== TODAY'S EVIDENCE-DRIVEN FOCUS ===\n${lines.join('\n')}\n=== END FOCUS ===\n`;
}

/**
 * Compute what today's roadmap day should target for one user.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {number} [opts.dayNumber]  used to rotate deterministically through
 *                                   the ranked gaps so one weakness doesn't
 *                                   monopolise every day
 * @param {object} [opts.readiness]  pre-computed readiness, to avoid paying for
 *                                   it twice in one request
 * @returns {Promise<object>} {
 *   targeted, reason, focus, gaps, elsewhere, instructions, fingerprint, evidence
 * }
 */
export async function getRoadmapTargeting(userId, opts = {}) {
  const { dayNumber = 1, readiness = null } = opts;

  const untargeted = (reason) => ({
    targeted: false,
    reason,
    focus: null,
    gaps: [],
    elsewhere: [],
    instructions: '',
    fingerprint: 'none',
    evidence: null,
  });

  if (!userId) return untargeted('no_user');

  let data;
  try {
    data = readiness || await getPlacementReadiness(userId);
  } catch (e) {
    console.warn('[roadmapTargeting] readiness unavailable:', e.message);
    return untargeted('unavailable');
  }

  if (!data?.available) return untargeted('unavailable');
  if (!data.hasTargets) return untargeted('no_targets');
  if (!data.hasAnyEvidence) return untargeted('no_evidence');

  const ranked = rankGaps(data.companies);
  if (!ranked.length) return untargeted('no_gaps');

  // Rule 3 — only DSA/CS gaps may reshape the day. The rest are real, and are
  // returned so the UI can link them, but they never touch the prompt.
  const injectable = ranked.filter(g => INJECTABLE_DOMAINS.includes(g.domain));
  const elsewhere = ranked
    .filter(g => !INJECTABLE_DOMAINS.includes(g.domain))
    .map(g => ({ ...g, action: ELSEWHERE_ACTION[g.domain] || g.action }));

  const evidence = {
    questions: data.evidenceSummary.questions,
    attempts: data.evidenceSummary.attempts,
    companies: data.targets,
  };

  if (!injectable.length) {
    // Everything blocking this student lives outside the roadmap's track.
    // Saying so is more useful than bending the day's syllabus to reach it.
    return {
      ...untargeted('gaps_elsewhere'),
      gaps: ranked,
      elsewhere,
      evidence,
      fingerprint: fingerprint(ranked),
    };
  }

  const pool = injectable.slice(0, MAX_FOCUS_POOL);
  const focus = pool[(Math.max(1, dayNumber) - 1) % pool.length];

  return {
    targeted: true,
    reason: null,
    focus,
    gaps: injectable,
    elsewhere,
    instructions: buildInstructions(focus, injectable),
    // Fingerprint covers ALL gaps: a gap closing anywhere should re-plan the
    // day, including one that only shifts the rotation.
    fingerprint: fingerprint(ranked),
    evidence,
  };
}

/**
 * The slice of targeting persisted on a cached roadmap day, so a later request
 * can tell whether that day was planned against a gap set that still holds.
 * Kept tiny — it rides inside the existing `roadmap.meta` JSONB, no schema.
 */
export function focusForCache(targeting) {
  if (!targeting?.targeted || !targeting.focus) return null;
  const f = targeting.focus;
  return {
    key: f.key,
    kind: f.kind,
    label: f.label,
    accuracy: f.accuracy ?? null,
    correct: f.correct ?? null,
    total: f.total ?? null,
    companies: f.companies,
    fingerprint: targeting.fingerprint,
  };
}

/**
 * Client-safe view. Strips `instructions` — that is prompt text written for a
 * model, not copy written for a student, and shipping it would put unreviewed
 * imperative language on screen.
 */
export function targetingForClient(targeting) {
  if (!targeting) return null;
  const rest = { ...targeting };
  delete rest.instructions;
  return rest;
}

/**
 * Is a cached day still planned against reality?
 *
 * Stale when the open-gap SET has changed since the day was generated — a gap
 * closed, or a new one opened. Unchanged scores never trigger this (rule 4),
 * so a student answering questions all day doesn't burn AI generations.
 *
 * A day cached BEFORE targeting existed (no focus) is only stale once the
 * student actually has targetable gaps — otherwise every legacy row would
 * regenerate at once.
 */
export function isFocusStale(cachedFocus, targeting) {
  if (!targeting?.targeted) return false;
  if (!cachedFocus) return true;
  return cachedFocus.fingerprint !== targeting.fingerprint;
}
