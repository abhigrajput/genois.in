/**
 * Feature D — the mentor's HOLISTIC view of one student's placement journey.
 *
 * WHAT THIS ADDS TO lib/mentorEvidence.js
 * ---------------------------------------
 * Batch 2 made the mentor evidence-aware: it already knows the student's
 * measured weak skills, their readiness per target company, and which DSA
 * pattern they are on. What it could NOT see is the half of the journey that
 * happens outside assessments:
 *
 *   · the guided BUILD (Feature C) — public.project_phase_progress, which
 *     project they are mid-way through and which phase is next;
 *   · the APPLICATIONS (Feature B) — public.job_applications, whether they have
 *     actually applied anywhere and how far those got.
 *
 * With all four signals in one place the mentor can connect dots it previously
 * could not: "you're at 38% on Trees, you're three phases into the REST API
 * build and you haven't logged a single application — here's the one thing to
 * do this week."
 *
 * This module does two things and nothing else:
 *   1. READS the two new signals (nothing is written — a chat message must not
 *      mutate build progress or the tracker), and
 *   2. DERIVES, deterministically and with no model in the loop, the single
 *      biggest real gap across the whole journey — the proactive "focus now".
 *
 * WHY THE FOCUS IS COMPUTED IN CODE, NOT GENERATED
 * ------------------------------------------------
 * The proactive nudge is the one surface that speaks BEFORE the student asks,
 * so it is the one place where a fabricated number would never be challenged.
 * Every field of the focus object is therefore assembled from values that came
 * out of getMentorEvidence()/getJourneySignals() — there is no code path in
 * which a percentage, a count or a date is produced by anything but a read. The
 * model only ever paraphrases a focus that already exists; it cannot invent one.
 *
 * THE ANTI-FABRICATION CONTRACT (inherited from lib/mentorEvidence.js)
 *   1. A signal that is UNAVAILABLE (migration not applied) and a signal that is
 *      EMPTY (student has done nothing) produce different text. "Tracking isn't
 *      set up here" is never rendered as "you haven't started".
 *   2. Absence is named, never guessed at. Zero applications is stated as zero
 *      applications logged — not inferred to mean the student is not applying.
 *   3. No outcome claim. Nothing here computes or implies an offer probability,
 *      a success rate, or a guarantee; the readiness engine explicitly refuses
 *      to produce one (placementReadiness formula.excluded) and so does this.
 */

import { getAdminClient } from './supabaseAdmin';
import { isMissingTable } from './applicationRecords';
import { buildJourney } from './projectJourney';
import { READINESS_CONSTANTS } from './placementReadiness';
import { APPLICATION_STAGES } from './applyDirectory';

const { WEAK_ACCURACY } = READINESS_CONSTANTS;

/**
 * Days without a phase tick before a started build counts as STALLED.
 *
 * A product judgment, not a measurement, and it is only ever used to decide
 * WHICH true fact to lead with — the sentence the student reads still quotes
 * the real date and the real phase count. Two weeks is the shortest gap that
 * cannot be explained by "I had exams last week".
 */
const STALL_DAYS = 14;

/**
 * Days since the last logged application before the tracker counts as gone
 * quiet. Longer than STALL_DAYS because application cycles genuinely are slower
 * than build sessions.
 */
const APPLICATIONS_QUIET_DAYS = 30;

/**
 * Readiness at or above which "you have not applied anywhere" outranks "your
 * score could be higher" as the biggest gap.
 *
 * This is a ROUTING threshold — it picks which real fact to lead with. It is
 * never stated to the student as a cutoff, a pass mark, or odds of anything:
 * GENOIS holds no hiring-outcome data, so any such claim would be invented.
 */
const APPLY_SIGNAL_SCORE = 55;

const STAGE_LABEL = Object.fromEntries(APPLICATION_STAGES.map(s => [s.id, s.label]));

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between an ISO timestamp/date and now, or null if unparseable. */
function daysSince(iso) {
  if (!iso) return null;
  const t = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
}

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

// ─────────────────────────────────────────────────────────────────────────────
// Signal 3 — the guided build (Feature C)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where this student is in the guided project journey for their domain.
 *
 * Reads project_phase_progress and joins it, in memory, against the catalog
 * path buildJourney() produces — the same pairing /api/projects/journey does,
 * so the mentor and the /projects page can never disagree about how many
 * phases are done.
 *
 * @returns {Promise<object>} `available:false` when the 20260810 migration has
 *   not been applied here — which is NOT the same fact as "nothing started".
 */
async function readProjectSignal(userId, domain) {
  const base = {
    available: false,
    reason: null,
    catalogSize: 0,
    startedCount: 0,
    completedCount: 0,
    current: null,
    completedTitles: [],
  };

  let journey;
  try {
    journey = buildJourney(domain);
  } catch (e) {
    console.warn('[mentorJourney] project catalog unavailable:', e.message);
    return { ...base, reason: 'catalog_unavailable' };
  }
  base.catalogSize = journey.length;

  let rows;
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('project_phase_progress')
      .select('project_key, completed_phases, completed_at, updated_at')
      .eq('user_id', userId);
    if (error) {
      console.warn('[mentorJourney] project progress read failed:', error.code, error.message);
      return { ...base, reason: isMissingTable(error) ? 'not_migrated' : 'unavailable' };
    }
    rows = data || [];
  } catch (e) {
    console.warn('[mentorJourney] project progress unavailable:', e.message);
    return { ...base, reason: 'unavailable' };
  }

  const byKey = new Map(journey.map(p => [p.key, p]));
  const tracked = [];

  for (const row of rows) {
    const project = byKey.get(row.project_key);
    // A key with no catalog entry means the student's domain changed, or the
    // catalog was edited. Dropping it is the honest move — we cannot name a
    // project we no longer have.
    if (!project) continue;

    const raw = Array.isArray(row.completed_phases) ? row.completed_phases : [];
    const done = [...new Set(
      raw.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < project.phaseCount),
    )].sort((a, b) => a - b);

    const nextIndex = project.phases.findIndex(p => !done.includes(p.index));

    tracked.push({
      key: project.key,
      title: project.title,
      difficulty: project.difficulty,
      phasesDone: done.length,
      phaseCount: project.phaseCount,
      nextPhase: nextIndex === -1 ? null : project.phases[nextIndex].name,
      nextPhaseIndex: nextIndex === -1 ? null : nextIndex,
      nextPhaseHours: nextIndex === -1 ? null : project.phases[nextIndex].hours.label,
      complete: done.length === project.phaseCount,
      completedAt: fmtDate(row.completed_at),
      updatedAt: fmtDate(row.updated_at),
      daysSinceUpdate: daysSince(row.updated_at),
    });
  }

  const inFlight = tracked
    .filter(p => !p.complete && p.phasesDone > 0)
    .sort((a, b) => (a.daysSinceUpdate ?? 1e9) - (b.daysSinceUpdate ?? 1e9));

  return {
    available: true,
    reason: null,
    catalogSize: journey.length,
    startedCount: tracked.filter(p => p.phasesDone > 0).length,
    completedCount: tracked.filter(p => p.complete).length,
    // The build they most recently touched and have not finished. That is the
    // one a nudge can honestly call "your current project".
    current: inFlight[0] || null,
    completedTitles: tracked.filter(p => p.complete).map(p => p.title),
    // Only meaningful when there is a current build; used by the focus rules.
    stalled: !!(inFlight[0] && inFlight[0].daysSinceUpdate != null && inFlight[0].daysSinceUpdate >= STALL_DAYS),
    firstUnstarted: journey.find(p => !tracked.some(t => t.key === p.key && t.phasesDone > 0)) || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal 4 — applications (Feature B)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the student has logged in their own application tracker.
 *
 * Everything in job_applications is typed by the student. GENOIS does not
 * observe applications, so this function's zero is "you have logged nothing",
 * never "you have applied nowhere" — the difference is stated in the prompt
 * block below and it matters.
 */
async function readApplicationSignal(userId) {
  const base = {
    available: false,
    reason: null,
    total: 0,
    byStage: {},
    companies: [],
    lastAppliedOn: null,
    daysSinceLast: null,
    open: 0,
    rejected: 0,
    offers: 0,
    interviewsOrBeyond: 0,
  };

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('job_applications')
      .select('company, role, stage, applied_on, created_at')
      .eq('user_id', userId)
      .order('applied_on', { ascending: false, nullsFirst: false })
      .limit(300);

    if (error) {
      console.warn('[mentorJourney] applications read failed:', error.code, error.message);
      return { ...base, reason: isMissingTable(error) ? 'not_migrated' : 'unavailable' };
    }

    const rows = data || [];
    const byStage = {};
    for (const r of rows) {
      const stage = r.stage || 'applied';
      byStage[stage] = (byStage[stage] || 0) + 1;
    }

    // The most recent date the STUDENT gave us. Rows with no date contribute
    // nothing here rather than falling back to created_at — the tracker
    // deliberately allows a dateless entry, and treating the row's insert time
    // as the application date would be inventing a fact about them.
    const dates = rows.map(r => r.applied_on).filter(Boolean).sort();
    const lastAppliedOn = dates.length ? dates[dates.length - 1] : null;

    return {
      available: true,
      reason: null,
      total: rows.length,
      byStage,
      companies: [...new Set(rows.map(r => r.company).filter(Boolean))].slice(0, 8),
      lastAppliedOn,
      daysSinceLast: daysSince(lastAppliedOn),
      datedRows: dates.length,
      open: rows.filter(r => r.stage !== 'rejected' && r.stage !== 'offer').length,
      rejected: byStage.rejected || 0,
      offers: byStage.offer || 0,
      interviewsOrBeyond: (byStage.interview || 0) + (byStage.offer || 0),
    };
  } catch (e) {
    console.warn('[mentorJourney] applications unavailable:', e.message);
    return { ...base, reason: 'unavailable' };
  }
}

/**
 * Both new journey signals. Never throws — each half degrades to
 * `available:false` with a reason, and the prompt block renders that honestly.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {string} [opts.domain] the student's domain_slug, if already loaded
 */
export async function getJourneySignals(userId, opts = {}) {
  if (!userId) return { available: false, projects: null, applications: null };
  const domain = opts.domain || 'fullstack';

  const [projects, applications] = await Promise.all([
    readProjectSignal(userId, domain),
    readApplicationSignal(userId),
  ]);

  return { available: true, domain, projects, applications };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt rendering — the two new signals
// ─────────────────────────────────────────────────────────────────────────────

function projectLines(p) {
  if (!p?.available) {
    return [
      p?.reason === 'not_migrated'
        ? 'Guided build tracking is NOT SET UP on this environment, so GENOIS has no record of their project progress. Do not say they have or have not started a project — say the tracking is not available here.'
        : 'Guided build progress is unavailable right now — do not state anything about their project progress.',
    ];
  }

  const lines = [];
  if (p.startedCount === 0) {
    lines.push(`They have ticked off ZERO phases on any of the ${p.catalogSize} guided projects in their track. This is a real, checkable fact: nothing started, not "not measured".`);
    if (p.firstUnstarted) {
      lines.push(`The first project on their track is "${p.firstUnstarted.title}" (${p.firstUnstarted.phaseCount} phases, estimated ${p.firstUnstarted.totalHours.min}–${p.firstUnstarted.totalHours.max} h total).`);
    }
    return lines;
  }

  lines.push(`Guided projects: ${p.startedCount} started, ${p.completedCount} finished, out of ${p.catalogSize} on their track.`);
  if (p.completedTitles.length) {
    lines.push(`Finished: ${p.completedTitles.join('; ')}.`);
  }
  if (p.current) {
    const c = p.current;
    lines.push(`Current build: "${c.title}" — ${c.phasesDone} of ${c.phaseCount} phases ticked${c.updatedAt ? `, last touched ${c.updatedAt}` : ''}${c.daysSinceUpdate != null ? ` (${c.daysSinceUpdate} day${c.daysSinceUpdate === 1 ? '' : 's'} ago)` : ''}.`);
    if (c.nextPhase) {
      lines.push(`Their next phase on it is "${c.nextPhase}"${c.nextPhaseHours ? ` (estimated ${c.nextPhaseHours} — an ESTIMATE, not a measurement)` : ''}.`);
    }
    if (p.stalled) {
      lines.push(`This build has not moved in ${c.daysSinceUpdate} days. That is a stall, and you may say so — but only with the real number.`);
    }
  } else {
    lines.push('No build is currently in flight — everything they started is finished.');
  }
  return lines;
}

function applicationLines(a) {
  if (!a?.available) {
    return [
      a?.reason === 'not_migrated'
        ? 'The application tracker is NOT SET UP on this environment, so GENOIS has no record of where they applied. Do not say they have not applied anywhere — say the tracker is not available here.'
        : 'The application tracker is unavailable right now — do not state anything about their applications.',
    ];
  }

  if (a.total === 0) {
    return [
      'Applications logged: ZERO. Nothing in their tracker at all.',
      'Say this precisely: they have not LOGGED any application. GENOIS only knows what the student types into /applications — it does not observe applications, so this does not prove they have applied nowhere. Ask rather than assert.',
    ];
  }

  const stageBits = Object.entries(a.byStage)
    .map(([id, n]) => `${n} ${STAGE_LABEL[id] || id}`)
    .join(', ');

  const lines = [
    `Applications logged: ${a.total} — ${stageBits}.`,
    `Companies in their tracker: ${a.companies.join(', ')}${a.total > a.companies.length ? ' (and others)' : ''}.`,
  ];
  if (a.lastAppliedOn) {
    lines.push(`Most recent application date they recorded: ${a.lastAppliedOn}${a.daysSinceLast != null ? ` (${a.daysSinceLast} days ago)` : ''}.`);
  } else {
    lines.push('None of their entries carry a date, so you do not know when they applied. Do not estimate one.');
  }
  if (a.offers > 0) {
    lines.push(`${a.offers} entr${a.offers === 1 ? 'y is' : 'ies are'} marked Offer. That is their own record; acknowledge it, do not treat it as a placement outcome GENOIS verified.`);
  }
  lines.push('These rows are SELF-REPORTED by the student. You may reason about the pattern in them; never present them as something GENOIS verified.');
  return lines;
}

/**
 * The journey block — the two signals the evidence block does not carry.
 *
 * Designed to be appended DIRECTLY AFTER buildEvidenceBlock()'s output, whose
 * anti-fabrication rules already cover it ("every number about this student
 * must appear verbatim above"). Returns '' for an unavailable bundle so the
 * prompt is byte-for-byte what it was before Feature D existed.
 */
export function buildJourneyBlock(journey) {
  if (!journey?.available) return '';

  return `

=== THEIR JOURNEY BEYOND ASSESSMENTS (same rules — these are facts, not starting points for guesses) ===
GUIDED BUILD (/projects):
${projectLines(journey.projects).join('\n')}

APPLICATIONS (/applications):
${applicationLines(journey.applications).join('\n')}
=== END JOURNEY ===`;
}

// ─────────────────────────────────────────────────────────────────────────────
// The proactive layer — one focus, derived, never generated
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every focus a student can be given. Ordered by priority: the first rule whose
 * preconditions hold wins, so the mentor leads with the biggest REAL gap rather
 * than the most recently touched thing.
 *
 * Each rule returns `{ id, title, because, facts, action, ask }`:
 *   · `because` — one sentence, every number in it lifted from a read;
 *   · `facts`   — the individual grounded statements the UI lists and the
 *                 prompt hands the model. If a rule cannot produce at least one
 *                 fact it does not fire;
 *   · `action`  — a real surface in this app, never an invented one;
 *   · `ask`     — the question the student can send to the chat to go deeper.
 */
function focusRules({ ev, journey }) {
  const proj = journey?.projects;
  const apps = journey?.applications;
  const readiness = ev?.readiness;

  // Best SCORED company, if any. Used to decide whether the gap is "raise the
  // score" or "you're scoring and not applying".
  const scored = (readiness?.companies || []).filter(c => c.scored && c.overall != null);
  const best = scored.length
    ? scored.reduce((a, b) => (b.overall > a.overall ? b : a))
    : null;

  const weakest = (ev?.weakest || []).find(s => s.accuracy <= WEAK_ACCURACY) || null;

  // The first "not measured" gap across their targets — an unknown, which is a
  // different problem from a low score and gets different words.
  const unmeasuredGap = (readiness?.companies || [])
    .flatMap(c => (c.gaps || []).map(g => ({ ...g, company: c.company })))
    .find(g => g.type === 'not_measured') || null;

  return [
    // 1. Nothing measured at all. Everything else would be a guess.
    {
      id: 'no-evidence',
      when: () => !ev?.hasAnyEvidence,
      build: () => ({
        title: 'Start with a diagnostic — I have nothing to go on yet',
        because: 'You have not completed a graded assessment yet, so I genuinely do not know your weak areas, your level, or your readiness for any company.',
        facts: ['0 graded questions on record'],
        action: { href: '/diagnostic', label: 'Take the diagnostic' },
        ask: 'What should I focus on first?',
      }),
    },

    // 2. A measured weakness that is also blocking a target company. The
    //    strongest signal in the product: two independent systems agree.
    {
      id: 'weak-skill-blocking-target',
      when: () => !!weakest && !!best && (best.gaps || []).some(g => g.type === 'weak'),
      build: () => {
        const gap = best.gaps.find(g => g.type === 'weak');
        return {
          title: `${gap.label} is holding your ${best.company} readiness down`,
          because: `Your ${best.company} readiness is ${best.overall}/100, and ${gap.label} is a measured weak area inside it at ${gap.accuracy}%.`,
          facts: [
            `${best.company} readiness: ${best.overall}/100`,
            `${gap.label}: ${gap.accuracy}% — measured weak (at or below ${WEAK_ACCURACY}%)`,
            `Your weakest measured skill overall: ${weakest.label} at ${weakest.accuracy}% (${weakest.correct}/${weakest.total})`,
          ],
          action: gap.action || { href: '/tests', label: 'Work on this area' },
          ask: `How do I fix my ${gap.label} gap for ${best.company}?`,
        };
      },
    },

    // 3. A measured weakness with no company context.
    {
      id: 'weak-skill',
      when: () => !!weakest,
      build: () => ({
        title: `${weakest.label} is your weakest measured skill`,
        because: `You are at ${weakest.accuracy}% on ${weakest.label} across ${weakest.total} graded questions — that is at or below the ${WEAK_ACCURACY}% line GENOIS calls weak.`,
        facts: [
          `${weakest.label}: ${weakest.accuracy}% (${weakest.correct}/${weakest.total})`,
          ...(ev.pattern ? [`Current DSA pattern: ${ev.pattern.name} (${ev.pattern.state})`] : []),
        ],
        action: { href: '/tests', label: `Run a ${weakest.label} test` },
        ask: `Why do I keep getting ${weakest.label} questions wrong?`,
      }),
    },

    // 4. A build that has gone quiet. Real dates, real phase counts.
    {
      id: 'stalled-project',
      when: () => !!proj?.stalled && !!proj.current,
      build: () => ({
        title: `Your "${proj.current.title}" build has stalled`,
        because: `You ticked ${proj.current.phasesDone} of ${proj.current.phaseCount} phases and have not touched it in ${proj.current.daysSinceUpdate} days. An unfinished project is worth nothing on a resume.`,
        facts: [
          `${proj.current.title}: ${proj.current.phasesDone}/${proj.current.phaseCount} phases`,
          `Last touched ${proj.current.updatedAt} (${proj.current.daysSinceUpdate} days ago)`,
          ...(proj.current.nextPhase ? [`Next phase: ${proj.current.nextPhase}`] : []),
        ],
        action: { href: '/projects', label: 'Reopen the build' },
        ask: `Help me get "${proj.current.title}" moving again.`,
      }),
    },

    // 5. Scoring, and not applying. The gap GENOIS previously could not see.
    {
      id: 'ready-but-not-applying',
      when: () => !!best && best.overall >= APPLY_SIGNAL_SCORE && apps?.available && apps.total === 0,
      build: () => ({
        title: 'You are preparing, but nothing is logged in your tracker',
        because: `Your ${best.company} readiness is ${best.overall}/100 and you have zero applications logged. Preparation only converts once applications are in.`,
        facts: [
          `${best.company} readiness: ${best.overall}/100`,
          '0 applications logged in your tracker',
        ],
        action: { href: '/apply', label: 'Find where to apply' },
        ask: 'Where should I be applying right now?',
      }),
    },

    // 6. Applications logged, but nothing new for a long time.
    {
      id: 'applications-quiet',
      when: () => apps?.available && apps.total > 0 && apps.daysSinceLast != null
        && apps.daysSinceLast >= APPLICATIONS_QUIET_DAYS && apps.open === 0,
      build: () => ({
        title: 'Your application pipeline has gone quiet',
        because: `Your last logged application was ${apps.lastAppliedOn} (${apps.daysSinceLast} days ago) and none of your ${apps.total} entries are still open.`,
        facts: [
          `${apps.total} applications logged, 0 still open`,
          `Last logged application: ${apps.lastAppliedOn}`,
          ...(apps.rejected ? [`${apps.rejected} marked Rejected`] : []),
        ],
        action: { href: '/apply', label: 'Open the apply directory' },
        ask: 'How do I get more applications out this month?',
      }),
    },

    // 7. Targets set, but a whole dimension unmeasured. An unknown, not a
    //    weakness — and the words say so.
    {
      id: 'unmeasured-gap',
      when: () => !!unmeasuredGap,
      build: () => ({
        title: `${unmeasuredGap.label} is unmeasured for ${unmeasuredGap.company}`,
        because: `${unmeasuredGap.company} weighs ${unmeasuredGap.label} and you have no evidence there yet. That is an unknown, not a weakness — but it is capping what your readiness score can tell you.`,
        facts: [
          `${unmeasuredGap.label}: not measured`,
          ...(best ? [`${best.company} readiness: ${best.overall}/100 (${best.coverage.dimensionsMeasured} of ${best.coverage.dimensionsTotal} dimensions measured)`] : []),
        ],
        action: unmeasuredGap.action || { href: '/tests', label: 'Measure it' },
        ask: `What do I need to do to measure ${unmeasuredGap.label}?`,
      }),
    },

    // 8. Assessments moving, nothing ever built.
    {
      id: 'no-project',
      when: () => proj?.available && proj.startedCount === 0 && !!proj.firstUnstarted,
      build: () => ({
        title: 'You have solved and tested, but built nothing yet',
        because: `You have ${ev.questionsScanned} graded questions on record and zero phases ticked on any of the ${proj.catalogSize} guided projects. Interviews ask what you have built.`,
        facts: [
          `${ev.questionsScanned} graded questions across ${ev.attemptsScanned} attempts`,
          '0 project phases ticked',
          `First project on your track: ${proj.firstUnstarted.title} (${proj.firstUnstarted.phaseCount} phases)`,
        ],
        action: { href: '/projects', label: 'Start the first build' },
        ask: `Walk me through starting "${proj.firstUnstarted.title}".`,
      }),
    },

    // 9. Nothing broken. Advance the pattern, and say only what is true.
    {
      id: 'advance-pattern',
      when: () => !!ev?.pattern,
      build: () => ({
        title: `Keep moving on ${ev.pattern.name}`,
        because: `Nothing in your data is currently flagged weak. Your open front is ${ev.pattern.name} — state "${ev.pattern.state}"${ev.pattern.requirement ? `, and to advance: ${ev.pattern.requirement}` : ''}.`,
        facts: [
          `Current pattern: ${ev.pattern.name} (${ev.pattern.state})`,
          `Patterns mastered: ${ev.pattern.mastered} of ${ev.pattern.patternsTotal}`,
          ...(proj?.available && proj.current ? [`${proj.current.title}: ${proj.current.phasesDone}/${proj.current.phaseCount} phases`] : []),
          ...(apps?.available ? [`${apps.total} application${apps.total === 1 ? '' : 's'} logged`] : []),
        ],
        action: { href: '/roadmap', label: 'Open the pattern board' },
        ask: `What do I need to clear ${ev.pattern.name}?`,
      }),
    },
  ];
}

/**
 * The single thing this student should do next, derived from all four signals.
 *
 * @param {object} args
 * @param {object} args.ev       getMentorEvidence() output
 * @param {object} args.journey  getJourneySignals() output
 * @returns {object} `{ available, id, title, because, facts, action, ask,
 *                      unknowns }` — `available:false` when not one rule could
 *                      fire, which happens only when every signal is missing.
 */
export function deriveMentorFocus({ ev, journey }) {
  // What we honestly do NOT know. Surfaced next to the focus so a thin picture
  // reads as a thin picture instead of a confident one.
  const unknowns = [];
  if (!ev?.available || !ev.hasAnyEvidence) unknowns.push('No graded assessment evidence yet');
  // "No target set" and "targets set, none scorable yet" are different facts and
  // get different words — collapsing them would tell a student who picked a
  // company that they picked none.
  if (!ev?.readiness?.hasTargets) {
    unknowns.push('No target company set, so no readiness score');
  } else if (!(ev.readiness.companies || []).some(c => c.scored && c.overall != null)) {
    const names = (ev.readiness.companies || []).map(c => c.company).join(', ');
    unknowns.push(`Not enough evidence to score your readiness${names ? ` for ${names}` : ''} yet`);
  }
  if (journey?.projects?.available && journey.projects.startedCount === 0) {
    unknowns.push('No guided project phases ticked yet');
  }
  if (journey?.projects && !journey.projects.available) unknowns.push('Build tracking is not set up on this environment');
  if (journey?.applications && !journey.applications.available) unknowns.push('Application tracker is not set up on this environment');
  else if (journey?.applications?.total === 0) unknowns.push('No applications logged');

  for (const rule of focusRules({ ev, journey })) {
    let ok = false;
    try { ok = !!rule.when(); } catch { ok = false; }
    if (!ok) continue;

    let built;
    try { built = rule.build(); } catch (e) {
      console.warn(`[mentorJourney] focus rule ${rule.id} failed to build:`, e.message);
      continue;
    }
    // A rule with nothing grounded behind it is a rule that would have to
    // invent something. Skip it rather than ship it.
    if (!built?.facts?.length) continue;

    return { available: true, id: rule.id, ...built, unknowns };
  }

  return {
    available: false,
    id: 'insufficient-data',
    title: 'I do not have enough of your data yet',
    because: 'There is nothing measured, built or logged on your account yet, so anything I suggested would be a guess.',
    facts: [],
    action: { href: '/diagnostic', label: 'Take the diagnostic' },
    ask: 'How do I get started on GENOIS?',
    unknowns,
  };
}

/**
 * The focus, rendered for the system prompt.
 *
 * The model is handed a focus that ALREADY EXISTS and told to use its facts
 * verbatim. It is never asked to work out what the student should do — that
 * would put a number in the model's hands, which is the one thing this feature
 * exists to prevent.
 */
export function buildFocusBlock(focus) {
  if (!focus) return '';

  if (!focus.available) {
    return `

=== WHAT THEY SHOULD FOCUS ON NOW (derived from their data, not from you) ===
There is not enough on this account to name a focus. If they ask what to work on, say exactly that — "I don't have enough of your data yet" — and point them at ${focus.action.href}. Do not manufacture a priority.
=== END FOCUS ===`;
  }

  return `

=== WHAT THEY SHOULD FOCUS ON NOW (derived from their data, not from you) ===
FOCUS: ${focus.title}
WHY: ${focus.because}
GROUNDED IN:
${focus.facts.map(f => `- ${f}`).join('\n')}
NEXT ACTION: ${focus.action.label} → ${focus.action.href}
${focus.unknowns.length ? `STILL UNKNOWN (name these honestly if they come up, never fill them in):\n${focus.unknowns.map(u => `- ${u}`).join('\n')}` : ''}

How to use this:
- If they open with something vague ("hi", "what should I do", "where do I stand", "help"), LEAD with this focus, in your own words, using the grounded facts above verbatim.
- If they ask a specific technical question, answer that question first and properly. Only connect back to this focus if it is genuinely relevant — a bolted-on nudge on an unrelated question is noise.
- Never restate this focus with different numbers, a rounded number, or an extra one. The facts above are the complete set you have.
=== END FOCUS ===`;
}

/**
 * Tone. Deliberately separate from the facts so the two can be changed
 * independently, and deliberately explicit about what "senior" does NOT mean —
 * an over-promising mentor is a worse failure mode than a dry one.
 */
export function buildMentorToneBlock() {
  return `

=== HOW YOU TALK (an experienced senior, not a chatbot) ===
You are the senior who went through placements two years ago and now sits across from this student. That means:
- Warm and direct. Say the hard thing plainly, then say what to do about it. No hype, no exclamation marks, no "you've got this!".
- Practical over theoretical. Concrete next actions with real surfaces, not advice-shaped paragraphs.
- Connect the dots across their whole journey — skills, roadmap, builds and applications are one story, not four dashboards.
- One priority at a time. A list of five things is the generic answer wearing a different hat.

HARD LIMITS (these override tone):
- NEVER promise or imply an outcome. No "you'll get placed", no "this will get you the offer", no success rates, no odds, no "students who do this usually...". GENOIS holds no hiring-outcome data — any such number or claim is fabricated by definition.
- NEVER manufacture encouragement out of data that does not exist. If they have done nothing, the honest line is "you haven't started yet", not "great progress".
- If you cannot ground an answer in their data, say "I don't have enough of your data yet to say", then name the ONE thing that would produce it.
- Their applications and self-reported weaknesses are their own claims. Reason about them; never present them as something GENOIS measured.
=== END TONE ===`;
}

export const MENTOR_JOURNEY_CONSTANTS = {
  STALL_DAYS,
  APPLICATIONS_QUIET_DAYS,
  APPLY_SIGNAL_SCORE,
};
