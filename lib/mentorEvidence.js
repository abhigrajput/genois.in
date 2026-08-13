/**
 * Mentor evidence — the student's REAL state, rendered as a prompt block.
 *
 * The complaint this exists to fix: "asked about REST APIs, got a generic
 * answer — feels like another chatbot". The mentor already had a personalized
 * prompt (lib/contextBuilder.js) built from aggregate counters. What it did NOT
 * have was the evidence loop the rest of GENOIS now runs on: which named skills
 * the student is measurably weak at, how ready they are for each target
 * company, and which DSA pattern they are actually on.
 *
 * This module reads those three systems and turns them into two strings the
 * chat route appends to its existing system prompt. It is purely additive:
 *   - it never re-implements an aggregation (evidence bus → readiness → pattern
 *     plan are consumed as-is),
 *   - it writes nothing,
 *   - every branch degrades to an honest "not measured" line rather than a
 *     guess, and with nothing measured at all the block instructs the mentor to
 *     say so out loud.
 *
 * THE ANTI-FABRICATION CONTRACT, which is the whole point:
 *   1. Every student-specific number in the block is copied from an evidence
 *      function. Nothing here computes a new score, and nothing here rounds a
 *      "not measured" into a zero.
 *   2. The block enumerates the facts the model is allowed to state, and tells
 *      it that anything absent is unknown. "Weak" requires correct/total.
 *   3. Thin evidence and no evidence produce DIFFERENT text — an unmeasured
 *      skill is an unknown, never a weakness (same rule the roadmap targeting
 *      module runs on).
 *   4. Self-reported weak subjects are labelled as self-reported, so the mentor
 *      can't quote the student's own guess back as a measurement.
 */

import { getAdminClient } from './supabaseAdmin';
import { getSkillEvidence } from './skillEvidence';
import { getPlacementReadiness, READINESS_CONSTANTS } from './placementReadiness';
import { getRoadmapTargeting } from './roadmapTargeting';
import { readPatternRows, computePlan } from './dsaPatternProgress';
import { isDsaTrack } from './curriculumGenerator';

/**
 * Questions of evidence before a skill may be CALLED weak or strong in chat.
 * Same threshold getSkillStrengths() uses — one wrong MCQ is noise, and a
 * mentor that opens with "you're weak at Graphs" off one question is worse than
 * a generic one.
 */
const MIN_EVIDENCE_TO_JUDGE = 3;

/**
 * At or below this accuracy a skill is WEAK. Borrowed from the readiness engine
 * rather than chosen here, so the mentor's idea of "weak" and the readiness
 * page's idea of "weak" can never drift apart.
 */
const { WEAK_ACCURACY } = READINESS_CONSTANTS;

const MAX_WEAK = 5;
const MAX_STRONG = 3;
const MAX_COMPANIES = 3;
const MAX_GAPS_PER_COMPANY = 4;
const MAX_RECENT = 5;

/** The only destinations the mentor may send a student to. */
const ACTION_SURFACES = [
  '/coding — solve a specific problem',
  '/roadmap — the pattern board and today\'s plan',
  '/tests — a topic test that produces new evidence',
  '/diagnostic — a broad assessment when too little is measured',
  '/aptitude — aptitude practice',
  '/voice-interview — a mock interview',
  '/resume — ATS resume analysis',
  '/readiness — the per-company readiness breakdown',
];

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * The student's last few attempts, each with its own correct/total.
 *
 * Read straight off test_questions (the evidence bus's own table) rather than
 * the `tests` rollup, because per-attempt correct/total is what makes a
 * sentence like "6/10 on your Arrays test on 2026-08-01" checkable. Missing
 * table/column → empty list, never an exception.
 */
async function recentAttempts(userId, limit = MAX_RECENT) {
  try {
    const supabase = getAdminClient();
    let { data, error } = await supabase
      .from('test_questions')
      .select('attempt_type, topic, taken_at, questions, skill_breakdown')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    // Pre-20260731 database: no skill_breakdown column yet.
    if (error) {
      ({ data, error } = await supabase
        .from('test_questions')
        .select('attempt_type, topic, taken_at, questions')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false })
        .limit(limit));
    }
    if (error) return [];

    return (data || []).map((row) => {
      let correct = 0;
      let total = 0;
      const breakdown = row.skill_breakdown;
      if (breakdown && typeof breakdown === 'object' && Object.keys(breakdown).length) {
        for (const counts of Object.values(breakdown)) {
          correct += Number(counts?.correct) || 0;
          total += Number(counts?.total) || 0;
        }
      } else {
        for (const q of row.questions || []) {
          total += 1;
          if (q.is_correct) correct += 1;
        }
      }
      return {
        type: row.attempt_type || 'assessment',
        topic: row.topic || null,
        takenAt: fmtDate(row.taken_at),
        correct,
        total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
      };
    }).filter(a => a.total > 0);
  } catch (e) {
    console.warn('[mentorEvidence] recent attempts unavailable:', e.message);
    return [];
  }
}

/**
 * Gather everything the mentor is allowed to know about this student.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {object} [opts.user]        the users row, if the caller already has it
 * @param {number} [opts.currentDay]  progress.current_day, for pattern pace maths
 * @returns {Promise<object>} see the return literal — all fields degrade to
 *                            null/empty rather than throwing.
 */
export async function getMentorEvidence(userId, opts = {}) {
  const empty = {
    available: false,
    hasAnyEvidence: false,
    questionsScanned: 0,
    attemptsScanned: 0,
    weakest: [],
    strongest: [],
    byDomain: {},
    readiness: null,
    pattern: null,
    recent: [],
    selfReportedWeak: [],
    targetCompanies: [],
  };
  if (!userId) return empty;

  const { user = null, currentDay = 1 } = opts;

  // One evidence read, shared with the pattern plan below. Readiness pays for
  // its own — it is the module that owns that aggregation and takes no
  // injection — which is the only duplicated scan in this path.
  const [evidence, readiness, recent] = await Promise.all([
    getSkillEvidence(userId, { minEvidence: 1 }).catch((e) => {
      console.warn('[mentorEvidence] evidence unavailable:', e.message);
      return { available: false, skills: [], byDomain: {}, questionsScanned: 0, attemptsScanned: 0 };
    }),
    getPlacementReadiness(userId).catch((e) => {
      console.warn('[mentorEvidence] readiness unavailable:', e.message);
      return null;
    }),
    recentAttempts(userId),
  ]);

  // Judgeable skills only — below MIN_EVIDENCE_TO_JUDGE a skill is an UNKNOWN,
  // and the block says so explicitly instead of listing it as a weakness.
  const judgeable = (evidence.skills || []).filter(s => s.total >= MIN_EVIDENCE_TO_JUDGE);
  const ranked = [...judgeable].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

  // Pattern plan. Reuses the evidence already read and the readiness already
  // computed, so this costs one small table read. `userId` is deliberately NOT
  // passed to computePlan: a chat message must not write mastery timestamps —
  // /api/roadmap/patterns owns that side effect.
  let pattern = null;
  const domain = user?.domain_slug;
  if (!domain || isDsaTrack(domain)) {
    try {
      const targeting = await getRoadmapTargeting(userId, {
        dayNumber: currentDay,
        readiness: readiness || undefined,
      });
      const coverage = await readPatternRows(userId);
      const plan = computePlan({
        evidence,
        coverage,
        user,
        targeting,
        currentDay,
        skipBasics: user?.level === 'advanced',
      });
      pattern = plan?.current
        ? {
            name: plan.current.name,
            state: plan.current.state,
            why: plan.current.why,
            solvedCount: plan.current.solvedCount,
            problemCount: plan.current.problemCount,
            evidence: plan.current.evidence,
            requirement: plan.current.requirement?.text || null,
            next: plan.next?.name || null,
            detour: plan.detour,
            problemsPerDay: plan.pace?.problemsPerDay ?? null,
            mastered: plan.totals?.mastered ?? 0,
            patternsTotal: plan.totals?.patterns ?? 0,
            coverageTracking: !!plan.signals?.coverageTracking,
          }
        : null;
    } catch (e) {
      console.warn('[mentorEvidence] pattern plan unavailable:', e.message);
    }
  }

  return {
    available: true,
    hasAnyEvidence:
      (evidence.available && (evidence.questionsScanned || 0) > 0) ||
      !!readiness?.hasAnyEvidence,
    questionsScanned: evidence.questionsScanned || 0,
    attemptsScanned: evidence.attemptsScanned || 0,
    weakest: ranked.slice(0, MAX_WEAK),
    strongest: [...ranked].reverse().slice(0, MAX_STRONG),
    thinSkills: (evidence.skills || []).length - judgeable.length,
    byDomain: evidence.byDomain || {},
    readiness,
    pattern,
    recent,
    selfReportedWeak: user?.weak_subjects || [],
    targetCompanies: user?.target_companies || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt rendering
// ─────────────────────────────────────────────────────────────────────────────

function readinessLines(readiness) {
  if (!readiness?.available) {
    return ['Readiness: unavailable on this database — do not state a readiness number.'];
  }
  if (!readiness.hasTargets) {
    // "No targets" and "targets GENOIS has no profile for" are different facts,
    // and telling a student who picked one that they picked none is its own
    // small fabrication.
    const unknown = readiness.unknownTargets || [];
    return [
      unknown.length
        ? `Readiness: their stated target${unknown.length > 1 ? 's' : ''} (${unknown.join(', ')}) ${unknown.length > 1 ? 'are' : 'is'} not a company GENOIS holds a scoring profile for, so there is no readiness score for them.`
        : 'Readiness: the student has NOT set target companies, so there is no readiness score.',
      'Do not invent a percentage or substitute a different company\'s score. If they ask, tell them to set a supported target on /readiness.',
    ];
  }

  const lines = [];
  for (const c of (readiness.companies || []).slice(0, MAX_COMPANIES)) {
    if (c.scored && c.overall != null) {
      lines.push(`${c.company}: readiness ${c.overall}/100 (${c.coverage.dimensionsMeasured} of ${c.coverage.dimensionsTotal} dimensions measured, ${c.coverage.areasMeasured} of ${c.coverage.areasTotal} focus areas).`);
    } else {
      const reason = String(c.unscoredReason || 'not enough evidence').replace(/\.\s*$/, '');
      lines.push(`${c.company}: NOT SCORED — ${reason}. There is no readiness percentage for this company; do not produce one.`);
    }

    const gaps = (c.gaps || []).slice(0, MAX_GAPS_PER_COMPANY);
    for (const g of gaps) {
      lines.push(
        g.type === 'weak'
          ? `  · GAP (measured weak) ${g.label}: ${g.accuracy}% — ${g.detail}. Fix at ${g.action.href}.`
          : `  · GAP (NOT measured) ${g.label}: ${g.detail}. This is an UNKNOWN, not a weakness — the fix is to measure it at ${g.action.href}.`
      );
    }
    for (const m of (c.missingInputs || [])) {
      lines.push(`  · ${m.message} (${m.action.href})`);
    }
  }
  return lines;
}

function patternLines(pattern) {
  // No plan at all. The student is either off the DSA track or has nothing the
  // planner can work from — and "no plan" carries NO counts, so the mentor must
  // not report a mastered/total either. Saying "0 patterns mastered" reads as a
  // measurement and is exactly the shape of number this block exists to stop.
  if (!pattern) {
    return [
      'DSA pattern roadmap: no current pattern available — do not claim they are on one.',
      'You also do NOT have a patterns-mastered count for them. Do not state one, including zero. If asked, say the pattern roadmap has nothing for them yet and point at /roadmap.',
    ];
  }

  const lines = [];
  const ev = pattern.evidence;
  const evText = ev && ev.total > 0
    ? `${ev.correct}/${ev.total} correct (${ev.accuracy}%) on tested questions for this pattern`
    : 'no assessment evidence on this pattern yet';
  lines.push(`Current pattern: ${pattern.name} — state "${pattern.state}", ${evText}.`);
  if (pattern.coverageTracking) {
    lines.push(`Problems ticked off in this pattern: ${pattern.solvedCount} of ${pattern.problemCount}.`);
  } else {
    lines.push('Per-problem tracking is unavailable on this database — do not state how many problems they have solved in the pattern.');
  }
  if (pattern.requirement) lines.push(`To advance: ${pattern.requirement}`);
  if (pattern.next) lines.push(`Next pattern after this one: ${pattern.next}.`);
  if (pattern.detour) {
    lines.push(`They were pulled off the canonical order (${pattern.detour.from.name} → ${pattern.detour.to.name}) because the evidence says ${pattern.detour.to.name} is the blocking weakness.`);
  }
  if (pattern.problemsPerDay != null) {
    lines.push(`Pace their remaining runway demands: ${pattern.problemsPerDay} problems/day.`);
  }
  lines.push(`Patterns mastered: ${pattern.mastered} of ${pattern.patternsTotal}.`);
  return lines;
}

/**
 * The evidence block. Everything the mentor may assert about this student, and
 * an explicit instruction that anything not in it is unknown.
 *
 * Returns '' for a null/unavailable bundle so the caller's prompt is byte-for-
 * byte what it was before this module existed.
 */
export function buildEvidenceBlock(ev) {
  if (!ev?.available) return '';

  const sections = [];

  if (!ev.hasAnyEvidence) {
    sections.push(
      'NO ASSESSMENT EVIDENCE YET. This student has not completed any graded assessment, so GENOIS does not know what they are good or bad at.',
      'You therefore do NOT know their weak topics, their strong topics, their readiness for any company, or their real level.',
      'If they ask anything of that shape ("am I ready", "what am I weak at", "what should I focus on"), say plainly: "I don\'t have enough of your data yet to say" — then point them at /diagnostic to produce that data. Never guess, never hedge into a number.'
    );
  } else {
    sections.push(
      `EVIDENCE BASE: ${ev.questionsScanned} graded question${ev.questionsScanned === 1 ? '' : 's'} across ${ev.attemptsScanned} attempt${ev.attemptsScanned === 1 ? '' : 's'}, tagged by skill.`
    );

    if (ev.weakest.length) {
      // Ranked worst-first, but each row carries its OWN verdict against the
      // same threshold readiness uses. Without that a student whose worst
      // measured skill is 100% gets told they're weak at it purely because
      // something has to be bottom of a list.
      sections.push(
        `MEASURED SKILLS, WEAKEST FIRST (each has at least ${MIN_EVIDENCE_TO_JUDGE} questions behind it). `
          + `A skill counts as WEAK only at ${WEAK_ACCURACY}% or below — anything above that is fine, however low it ranks here:\n`
          + ev.weakest.map(s =>
              `- ${s.label}: ${s.accuracy}% (${s.correct}/${s.total})`
              + `${s.lastSeen ? `, last tested ${fmtDate(s.lastSeen)}` : ''}`
              + ` → ${s.accuracy <= WEAK_ACCURACY ? 'WEAK' : 'not weak'}`
            ).join('\n')
      );
      if (!ev.weakest.some(s => s.accuracy <= WEAK_ACCURACY)) {
        sections.push(`NOTE: nothing measured is at or below ${WEAK_ACCURACY}%. This student has NO measured weakness right now — do not manufacture one out of the bottom of the list. Their real gaps are the UNMEASURED areas below.`);
      }
    } else {
      sections.push(
        `WEAKEST MEASURED SKILLS: none — no single skill has reached ${MIN_EVIDENCE_TO_JUDGE} questions of evidence yet. You do NOT know their weak skills; say so if asked.`
      );
    }

    // Only worth a section when it isn't just the weakest list read backwards —
    // with two measured skills, "strongest" and "weakest" naming the same rows
    // reads as more evidence than there is.
    const weakestIds = new Set(ev.weakest.map(s => s.skill));
    const strongest = ev.strongest.filter(s => !weakestIds.has(s.skill));
    if (strongest.length) {
      sections.push(
        'STRONGEST MEASURED SKILLS:\n'
          + strongest.map(s => `- ${s.label}: ${s.accuracy}% (${s.correct}/${s.total})`).join('\n')
      );
    }

    if (ev.thinSkills > 0) {
      sections.push(
        `${ev.thinSkills} further skill(s) have 1-2 questions of evidence. That is TOO THIN to judge — they are unknowns, not weaknesses, and you must not describe them either way.`
      );
    }

    const domains = Object.entries(ev.byDomain);
    if (domains.length) {
      sections.push(
        'BY AREA:\n' + domains.map(([, d]) => `- ${d.label}: ${d.accuracy}% (${d.correct}/${d.total} across ${d.skills} skill${d.skills === 1 ? '' : 's'})`).join('\n')
      );
    }

    if (ev.recent.length) {
      sections.push(
        'RECENT ASSESSMENTS (newest first):\n'
          + ev.recent.map(a => `- ${a.takenAt || 'undated'} · ${a.type}${a.topic ? ` · ${a.topic}` : ''}: ${a.correct}/${a.total} (${a.accuracy}%)`).join('\n')
      );
    }
  }

  sections.push('READINESS PER TARGET COMPANY:\n' + readinessLines(ev.readiness).join('\n'));
  sections.push('DSA PATTERN ROADMAP:\n' + patternLines(ev.pattern).join('\n'));

  if (ev.selfReportedWeak.length) {
    sections.push(
      `SELF-REPORTED (NOT MEASURED): the student told us at signup they struggle with ${ev.selfReportedWeak.join(', ')}. This is their own claim, with no assessment behind it. You may act on it, but attribute it ("you told us…") — never present it as something GENOIS measured.`
    );
  }

  return `

=== EVIDENCE ABOUT THIS STUDENT (the ONLY student-specific facts you may state) ===
${sections.join('\n\n')}

=== ANTI-FABRICATION RULES (these override every other instruction) ===
1. Every number you state about THIS STUDENT — accuracy, readiness, counts, pattern progress — must appear verbatim in the block above. If it is not above, you do not have it.
2. Never invent, estimate, extrapolate or "roughly" a student number. No "you're probably around 60%". If asked something the block doesn't answer, say: "I don't have enough of your data yet to say" and name the one thing that would produce it.
3. NOT MEASURED ≠ WEAK. An area with no evidence is an unknown. Say "we haven't measured this yet", never "you're weak here".
4. Do not call the student weak or strong at anything that is not listed above with a correct/total behind it.
5. General knowledge (how a REST API works, how to write a query) is yours to explain freely — these rules constrain claims ABOUT THE STUDENT, not the subject matter.
=== END EVIDENCE ===`;
}

/**
 * The actionable half: how to turn the evidence into a next step, and how to
 * behave when the student pastes code or an error.
 *
 * Kept separate from the evidence block so the facts and the instructions can
 * be reasoned about (and changed) independently.
 */
export function buildActionInstructions(ev, message = '') {
  const lines = [
    '=== BE ACTIONABLE, NOT CONVERSATIONAL ===',
    'Answer the question that was asked first — properly and technically. Then, when it is genuinely relevant, connect it to this student\'s real state.',
  ];

  if (ev?.hasAnyEvidence && (ev.weakest.length || ev.pattern)) {
    // Only a genuinely weak skill may be named as the anchor. The bottom row of
    // a list of strong skills is not a gap.
    const anchor = ev.weakest.find(s => s.accuracy <= WEAK_ACCURACY) || null;
    lines.push(
      'End with exactly ONE concrete next step, tied to a REAL gap from the evidence block'
        + (anchor
            ? ` (their worst measured weakness right now is ${anchor.label} at ${anchor.accuracy}%)`
            : ' — note that nothing measured is currently weak, so the real gap is an UNMEASURED area, not a low score')
        + '. One step, not a list — a menu of five options is the generic answer wearing a different hat.'
    );
    lines.push('Link it to one of these surfaces, and only these:\n' + ACTION_SURFACES.map(a => `- ${a}`).join('\n'));
    lines.push('If the question has nothing to do with their gaps, skip the next step rather than forcing a connection. A bolted-on "by the way, you\'re weak at Trees" on an unrelated question is exactly the noise this is meant to avoid.');
  } else {
    lines.push(
      'This student has no measured gaps yet, so there is no real weakness to point them at. Do NOT manufacture one. The honest next step is to produce evidence: /diagnostic for a broad picture, /tests for one topic.'
    );
  }

  if (looksLikeCode(message)) {
    lines.push(
      '',
      '=== CODING MOMENT — THEY PASTED CODE OR AN ERROR ===',
      'This is coaching, not a lecture. Do all of the following:',
      '1. Name the specific mistake in THEIR code — quote the exact line or expression that is wrong.',
      '2. Explain WHY it is wrong (what actually happens at runtime, on which input it breaks).',
      '3. Give the minimal corrected version — do not rewrite their whole solution in your own style.',
      '4. State the complexity of the fixed version.',
      '5. If the mistake matches a skill or pattern in the evidence block, say so and use their real number ("this is the same off-by-one that shows up in your Binary Search evidence at 42%"). If it does not match anything measured, do not stretch for a connection.',
      'If you cannot see the bug from what they pasted, say exactly what you would need (input, error text, the rest of the function) instead of guessing at a fix.'
    );
  }

  return `\n${lines.join('\n')}`;
}

/**
 * Does this message contain code or an error the mentor should coach on?
 *
 * Deliberately cheap and deliberately generous — a false positive only adds a
 * coaching instruction to a prompt that already answers the question, while a
 * false negative loses the coaching moment the test user asked for.
 */
export function looksLikeCode(message) {
  const text = String(message || '');
  if (!text) return false;
  if (/```/.test(text)) return true;
  if (/\b(Error|Exception|Traceback|SyntaxError|TypeError|NullPointerException|Segmentation fault|undefined is not a function|panic:)\b/i.test(text)) return true;
  if (/\b(at\s+\w+\.\w+\(|line\s+\d+,\s+in\b|\.java:\d+|\.py:\d+|:\d+:\d+\))/.test(text)) return true;

  // Structural fallback: several code-shaped lines in a row.
  const codeish = text.split('\n').filter(l =>
    /[;{}]\s*$/.test(l.trim()) ||
    /^\s*(def|class|function|const|let|var|public|private|import|from|for|while|if|return|print|cout|System\.out)\b/.test(l)
  );
  return codeish.length >= 2;
}

export const MENTOR_EVIDENCE_CONSTANTS = {
  MIN_EVIDENCE_TO_JUDGE,
  WEAK_ACCURACY,
  MAX_WEAK,
  MAX_STRONG,
  MAX_COMPANIES,
  ACTION_SURFACES,
};
