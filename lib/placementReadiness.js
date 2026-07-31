/**
 * Placement Readiness — the scoring engine.
 *
 * ONE RULE GOVERNS THIS FILE: every number rendered to a student must be
 * traceable to a row they actually created. Nothing here estimates, models,
 * predicts, or fills a gap with a plausible-looking default. If the evidence
 * isn't there, the field comes back `measured: false` and the UI says so.
 *
 * Consequences of that rule, spelled out because they are easy to erode:
 *   - A missing dimension is NOT scored 0. Zero is a claim ("we measured you
 *     and you failed"); absence is the truth ("we never measured you").
 *     Missing dimensions are dropped from the weighted average and named.
 *   - A focus area with no evidence is NOT scored 0 either — it lowers
 *     `coverage`, which is reported next to the score.
 *   - No overall % appears at all until there is enough evidence to mean
 *     something (MIN_QUESTIONS_FOR_SCORE). A fresh account gets an empty
 *     state, never "31%".
 *   - ETA comes from the student's own logged pace over their own history, or
 *     it does not come at all. See `paceFromHistory`.
 *   - There is deliberately no offer/interview probability. GENOIS holds zero
 *     interview-outcome data, so any such number would be fabricated.
 *
 * Inputs, all pre-existing tables — this phase adds NO schema:
 *   public.test_questions   → skill mastery, via the Phase 1 evidence bus
 *                             (lib/skillEvidence.js — the single aggregator;
 *                             this file never re-aggregates questions itself)
 *   public.resume_analyses  → resume readiness (ats_score)
 *   public.interview_results→ interview readiness (total_score + 3 metrics)
 *   public.users            → target_companies
 *
 * Every read degrades: a missing table yields `measured: false`, never a throw.
 */

import { getAdminClient } from './supabaseAdmin';
import { getSkillEvidence } from './skillEvidence';
import { COMPANY_PROFILES } from './curriculumGenerator';
import { SKILLS, SKILL_DOMAINS, resolveSkill, getSkill, UNCLASSIFIED } from './skillTaxonomy';

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds. All of them are display gates, not score adjustments.
// ─────────────────────────────────────────────────────────────────────────────

/** Questions needed on a focus area before its accuracy is worth reporting. */
const MIN_ANCHOR_EVIDENCE = 3;

/** Total questions needed before ANY overall readiness % is shown at all. */
const MIN_QUESTIONS_FOR_SCORE = 20;

/** Accuracy at or below this counts the area as a gap that blocks readiness. */
const WEAK_ACCURACY = 60;

/** Practice volume assumed to close one gap — used ONLY for the ETA workload. */
const QUESTIONS_TO_CLOSE_A_GAP = 10;

/** ETA needs real history: this many distinct active days across this span. */
const ETA_MIN_ACTIVE_DAYS = 3;
const ETA_MIN_SPAN_DAYS = 7;

/** Rows scanned for the pace calculation. Matches the evidence bus bound. */
const MAX_HISTORY_ROWS = 500;

/** Interview sessions averaged for the interview dimension. */
const INTERVIEW_WINDOW = 3;

const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : null);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ─────────────────────────────────────────────────────────────────────────────
// Company focus areas, read out of the EXISTING COMPANY_PROFILES map.
//
// The company list is Object.keys(COMPANY_PROFILES) — no company is invented
// here. Each profile's prose names its focus areas ("Focus: Graphs, Trees, DP,
// System Design"); we parse that sentence and resolve each phrase onto the
// Phase 1 taxonomy, so a company's weighting is derived from the profile that
// already ships rather than from a second, parallel opinion about companies.
//
// SHORTHAND is the same kind of hand-authored vocabulary as the aliases in
// skillTaxonomy.js: profile prose says "Quant" where the taxonomy says
// "Quantitative", and "DSA" where the taxonomy has a domain key. Phrases that
// resolve to nothing are dropped and reported in `unmappedFocus` rather than
// guessed at — the fix is to add a shorthand, never to invent a mapping at
// runtime.
// ─────────────────────────────────────────────────────────────────────────────

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9+/ -]/g, ' ').replace(/\s+/g, ' ').trim();

/** phrase → { kind: 'domain'|'group'|'skills', value } */
const SHORTHAND = [
  // The taxonomy splits DP across three sibling skills with no common id
  // prefix, so "DP" in a profile has to name them explicitly or a student's
  // knapsack evidence would never count towards a company's DP focus.
  ['dynamic programming', { kind: 'skills', value: ['dsa.dynamic-programming', 'dsa.dp-knapsack', 'dsa.dp-strings'], label: 'Dynamic Programming' }],
  ['dp', { kind: 'skills', value: ['dsa.dynamic-programming', 'dsa.dp-knapsack', 'dsa.dp-strings'], label: 'Dynamic Programming' }],
  // Accenture's "Technical assessment" is a CS-fundamentals round; without
  // this it substring-matches "Explaining Technical Concepts", a comm skill.
  ['technical assessment', { kind: 'domain', value: 'cs' }],
  ['advanced dsa', { kind: 'domain', value: 'dsa' }],
  ['strong dsa', { kind: 'domain', value: 'dsa' }],
  ['dsa', { kind: 'domain', value: 'dsa' }],
  ['data structures', { kind: 'domain', value: 'dsa' }],
  ['algorithms', { kind: 'domain', value: 'dsa' }],
  ['coding section', { kind: 'domain', value: 'dsa' }],
  ['coding', { kind: 'domain', value: 'dsa' }],
  ['aptitude', { kind: 'domain', value: 'apt' }],
  ['quant', { kind: 'group', value: 'Quantitative' }],
  ['quantitative', { kind: 'group', value: 'Quantitative' }],
  ['verbal', { kind: 'group', value: 'Verbal Ability' }],
  ['english', { kind: 'group', value: 'Verbal Ability' }],
  ['essay writing', { kind: 'group', value: 'Verbal Ability' }],
  ['logic', { kind: 'group', value: 'Logical Reasoning' }],
  ['logical reasoning', { kind: 'group', value: 'Logical Reasoning' }],
  ['cognitive', { kind: 'group', value: 'Logical Reasoning' }],
  ['oop', { kind: 'group', value: 'OOP' }],
  ['oop concepts', { kind: 'group', value: 'OOP' }],
  ['dbms', { kind: 'group', value: 'Databases' }],
  ['databases', { kind: 'group', value: 'Databases' }],
  ['operating systems', { kind: 'group', value: 'Operating Systems' }],
  ['networking', { kind: 'group', value: 'Networks' }],
  ['networks', { kind: 'group', value: 'Networks' }],
  ['system design', { kind: 'group', value: 'Systems & Practice' }],
  ['low-level design', { kind: 'group', value: 'Systems & Practice' }],
  ['machine coding', { kind: 'group', value: 'Systems & Practice' }],
  ['cloud basics', { kind: 'group', value: 'Systems & Practice' }],
  ['system fundamentals', { kind: 'group', value: 'Systems & Practice' }],
  ['clean code', { kind: 'group', value: 'Systems & Practice' }],
  ['behavioral', { kind: 'group', value: 'Behavioural & HR' }],
  ['behavioural', { kind: 'group', value: 'Behavioural & HR' }],
  ['leadership principles', { kind: 'group', value: 'Behavioural & HR' }],
  ['communication round', { kind: 'group', value: 'Interview Delivery' }],
].sort((a, b) => b[0].length - a[0].length);

const skillsInGroup = (group) => SKILLS.filter(s => s.group === group).map(s => s.id);
const skillsInDomain = (domain) => SKILLS.filter(s => s.domain === domain).map(s => s.id);
const GROUP_NAMES = [...new Set(SKILLS.map(s => s.group))];

function groupAnchor(group) {
  const ids = skillsInGroup(group);
  if (!ids.length) return null;
  return { key: `group:${group}`, label: group, kind: 'group', domain: getSkill(ids[0])?.domain || null, skills: ids };
}

function domainAnchor(domain) {
  const ids = skillsInDomain(domain);
  if (!ids.length) return null;
  return { key: `domain:${domain}`, label: SKILL_DOMAINS[domain].label, kind: 'domain', domain, skills: ids };
}

function skillSetAnchor(target) {
  const ids = target.value.filter(id => getSkill(id));
  if (!ids.length) return null;
  return { key: `set:${target.label}`, label: target.label, kind: 'skill-set', domain: getSkill(ids[0])?.domain || null, skills: ids };
}

const targetAnchor = (t) =>
  t.kind === 'group' ? groupAnchor(t.value)
  : t.kind === 'skills' ? skillSetAnchor(t)
  : domainAnchor(t.value);

/**
 * Build one focus anchor from a phrase, or null if it maps to nothing.
 *
 * Group/domain rollups are checked BEFORE single skills on purpose. When a
 * profile says "Graphs" it means the whole graphs group — resolving it to the
 * single `dsa.graph-basics` skill would report "Graphs: not measured" for a
 * student who has done nothing but BFS and Dijkstra.
 */
function anchorFromPhrase(phrase) {
  const n = norm(phrase);
  if (!n || n.length < 2) return null;

  // 1. The phrase IS a taxonomy group name ("Graphs", "Trees").
  const group = GROUP_NAMES.find(g => norm(g) === n);
  if (group) return groupAnchor(group);

  // 2. Profile shorthand naming a whole group/domain ("Quant", "System Design").
  const exactShorthand = SHORTHAND.find(([alias]) => alias === n);
  if (exactShorthand) {
    const anchor = targetAnchor(exactShorthand[1]);
    if (anchor) return anchor;
  }

  // 3. A named skill in the taxonomy — the most precise anchor available.
  const skill = resolveSkill(n, { fallback: null });
  if (skill && skill !== UNCLASSIFIED) {
    const def = getSkill(skill);
    return { key: skill, label: def.label, kind: 'skill', domain: def.domain, skills: [skill] };
  }

  // 4. Shorthand appearing inside a longer phrase.
  for (const [alias, target] of SHORTHAND) {
    if (!n.includes(alias)) continue;
    const anchor = targetAnchor(target);
    if (anchor) return anchor;
  }

  return null;
}

const splitPhrases = (sentence) => sentence
  .split(/,| and | \+ |—|–|\//)
  .map(s => s.trim())
  .filter(Boolean);

/**
 * Parse one COMPANY_PROFILES blurb into focus anchors.
 *
 * The "Focus: …" sentence is always a topic list. Later sentences are mixed —
 * some are topic lists too ("Pseudocode, networking, cloud basics."), others
 * are advice prose ("Expect LeetCode Hard difficulty and close scrutiny of
 * Big-O."). A sentence is treated as a topic list only when every one of its
 * comma-items is at most three words; prose sentences fail that test, so we
 * pick up the extra topics without mining the advice for false anchors.
 */
export function companyFocus(company) {
  const profile = COMPANY_PROFILES[company] || '';
  const sentences = profile.split('.').map(s => s.trim()).filter(Boolean);

  const focusSentence = (profile.match(/Focus:\s*([^.]*)\./) || [])[1] || '';

  const isTopicList = (s) => splitPhrases(s).every(p => p.split(/\s+/).length <= 3);

  const phrases = [
    ...splitPhrases(focusSentence),
    ...sentences
      .filter(s => !/^Focus:/.test(s) && isTopicList(s))
      .flatMap(splitPhrases),
  ];

  const anchors = [];
  const unmapped = [];
  for (const phrase of phrases) {
    const anchor = anchorFromPhrase(phrase);
    if (!anchor) { unmapped.push(phrase); continue; }
    if (!anchors.some(a => a.key === anchor.key)) anchors.push({ ...anchor, phrase });
  }

  return { company, profile, focusSentence, anchors, unmappedFocus: unmapped };
}

/**
 * Dimension weights, also derived from the profile text rather than asserted.
 *
 * Base split is the same for every company: skill evidence dominates, resume
 * and interview each carry a fifth. A profile that explicitly calls out
 * behavioural / communication rounds shifts ten points from skills to
 * interview — that is the only per-company variation, and the UI shows both
 * the weights and the sentence that caused the shift.
 */
export function companyWeights(company) {
  const profile = COMPANY_PROFILES[company] || '';
  const behaviouralSignal = /behaviou?ral|leadership principle|communication round|essay writing|hr round/i.test(profile);
  return behaviouralSignal
    ? { skills: 0.5, resume: 0.2, interview: 0.3, behaviouralSignal: true }
    : { skills: 0.6, resume: 0.2, interview: 0.2, behaviouralSignal: false };
}

/** Company names the student targets, matched against the existing profile map. */
export function resolveTargets(targetCompanies) {
  const names = Object.keys(COMPANY_PROFILES);
  const raw = Array.isArray(targetCompanies) ? targetCompanies : [];
  const matched = [];
  const unknown = [];
  for (const t of raw) {
    const hit = names.find(n => n.toLowerCase() === String(t).toLowerCase().trim());
    if (hit) { if (!matched.includes(hit)) matched.push(hit); }
    else if (String(t).trim()) unknown.push(String(t).trim());
  }
  return { matched, unknown, allCompanies: names };
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-skill evidence reads. Both return `measured: false` when the table is
// missing or the student has simply never used the feature — the two cases are
// distinguished by `reason` so the UI can say the right thing.
// ─────────────────────────────────────────────────────────────────────────────

async function readResume(userId) {
  try {
    const { data, error } = await getAdminClient()
      .from('resume_analyses')
      .select('ats_score, target_role, target_company, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return { measured: false, reason: 'unavailable', detail: error.message };
    const row = (data || [])[0];
    if (!row || row.ats_score == null) return { measured: false, reason: 'no_data' };
    return {
      measured: true,
      score: clamp(Math.round(Number(row.ats_score)), 0, 100),
      analysedAt: row.created_at,
      targetRole: row.target_role || null,
      evidence: `ATS score from your resume analysis on ${new Date(row.created_at).toLocaleDateString()}`,
    };
  } catch (e) {
    return { measured: false, reason: 'unavailable', detail: e.message };
  }
}

async function readInterview(userId) {
  try {
    const { data, error } = await getAdminClient()
      .from('interview_results')
      .select('total_score, technical_accuracy, communication_clarity, confidence_score, mode, questions_answered, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(INTERVIEW_WINDOW);
    if (error) return { measured: false, reason: 'unavailable', detail: error.message };

    const rows = (data || []).filter(r => r.total_score != null);
    if (!rows.length) return { measured: false, reason: 'no_data' };

    const avg = (key) => {
      const vals = rows.map(r => Number(r[key])).filter(v => Number.isFinite(v));
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };

    return {
      measured: true,
      score: clamp(avg('total_score'), 0, 100),
      sessions: rows.length,
      lastAt: rows[0].created_at,
      metrics: {
        technical: avg('technical_accuracy'),
        clarity: avg('communication_clarity'),
        confidence: avg('confidence_score'),
      },
      evidence: `Average of your last ${rows.length} mock interview${rows.length > 1 ? 's' : ''}`,
    };
  } catch (e) {
    return { measured: false, reason: 'unavailable', detail: e.message };
  }
}

/**
 * The student's real practice pace, from their own attempt timestamps.
 *
 * Returns `{ known: false }` unless there is genuine history — fewer than
 * ETA_MIN_ACTIVE_DAYS active days, or a span under ETA_MIN_SPAN_DAYS, means we
 * have no basis for a rate and therefore publish no ETA anywhere. There is no
 * default pace and no assumed study schedule.
 */
async function paceFromHistory(userId, questionsScanned) {
  const unknown = (reason) => ({ known: false, reason });
  try {
    const { data, error } = await getAdminClient()
      .from('test_questions')
      .select('taken_at')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(MAX_HISTORY_ROWS);
    if (error) return unknown('unavailable');

    const stamps = (data || []).map(r => r.taken_at).filter(Boolean).map(t => new Date(t)).filter(d => !Number.isNaN(+d));
    if (!stamps.length) return unknown('no_history');

    const days = new Set(stamps.map(d => d.toISOString().slice(0, 10)));
    const newest = Math.max(...stamps.map(d => +d));
    const oldest = Math.min(...stamps.map(d => +d));
    const spanDays = Math.max(1, Math.round((newest - oldest) / 86400000));

    if (days.size < ETA_MIN_ACTIVE_DAYS) return unknown('too_few_active_days');
    if (spanDays < ETA_MIN_SPAN_DAYS) return unknown('history_too_short');

    // Questions per calendar day across the observed window — rest days
    // included, because rest days are part of a real pace.
    const perDay = questionsScanned / spanDays;
    if (!(perDay > 0)) return unknown('no_history');

    return {
      known: true,
      perDay: Math.round(perDay * 10) / 10,
      activeDays: days.size,
      spanDays,
      questions: questionsScanned,
      basis: `${questionsScanned} questions across ${spanDays} days (${days.size} active days)`,
    };
  } catch {
    return unknown('unavailable');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Next action per gap — each gap links to the feature that actually produces
// evidence for it, so a named weakness is always one click from being fixed.
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_ACTION = {
  dsa: { href: '/coding', label: 'Practice coding problems' },
  cs: { href: '/tests', label: 'Take a CS fundamentals test' },
  apt: { href: '/aptitude', label: 'Run an aptitude session' },
  comm: { href: '/voice-interview', label: 'Run a mock interview' },
};

function actionForAnchor(anchor) {
  if (anchor.domain === 'comm' && anchor.skills.some(id => id.startsWith('comm.resume-'))) {
    return { href: '/resume', label: 'Re-run your resume analysis' };
  }
  return DOMAIN_ACTION[anchor.domain] || { href: '/roadmap', label: 'Continue your roadmap' };
}

// ─────────────────────────────────────────────────────────────────────────────
// The engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score one company against an already-loaded evidence bundle.
 *
 * Formula (also rendered verbatim in the UI):
 *   skills    = mean(accuracy of each MEASURED focus area)
 *   resume    = latest resume_analyses.ats_score
 *   interview = mean(total_score of last 3 interview_results)
 *   overall   = Σ(dimension × weight) / Σ(weight)   over MEASURED dimensions only
 *
 * `scored: false` (no overall number at all) whenever the skills dimension is
 * too thin to mean anything. That is the fresh-account path.
 */
function scoreCompany(company, { evidence, resume, interview, pace }) {
  const { anchors, unmappedFocus, focusSentence, profile } = companyFocus(company);
  const weights = companyWeights(company);

  const bySkill = new Map(evidence.skills.map(s => [s.skill, s]));

  // ── Focus-area breakdown. Un-evidenced areas are reported, never zeroed. ──
  const areas = anchors.map(anchor => {
    const contributing = anchor.skills
      .map(id => bySkill.get(id))
      .filter(Boolean)
      .sort((a, b) => b.total - a.total);
    const correct = contributing.reduce((n, s) => n + s.correct, 0);
    const total = contributing.reduce((n, s) => n + s.total, 0);
    const measured = total >= MIN_ANCHOR_EVIDENCE;
    const accuracy = measured ? pct(correct, total) : null;

    return {
      key: anchor.key,
      label: anchor.label,
      kind: anchor.kind,
      domain: anchor.domain,
      phrase: anchor.phrase,
      measured,
      accuracy,
      correct,
      total,
      // The actual rows behind the number — this is what makes it explainable.
      skills: contributing.map(s => ({
        skill: s.skill, label: s.label, correct: s.correct, total: s.total,
        accuracy: s.accuracy, lastSeen: s.lastSeen, sources: s.sources,
      })),
      status: !measured ? 'not_measured' : accuracy <= WEAK_ACCURACY ? 'weak' : 'ok',
      action: actionForAnchor(anchor),
    };
  });

  const measuredAreas = areas.filter(a => a.measured);
  const skillsScore = measuredAreas.length
    ? Math.round(measuredAreas.reduce((n, a) => n + a.accuracy, 0) / measuredAreas.length)
    : null;

  // ── Dimensions ──────────────────────────────────────────────────────────
  const enoughEvidence =
    evidence.available &&
    evidence.questionsScanned >= MIN_QUESTIONS_FOR_SCORE &&
    measuredAreas.length >= Math.min(2, areas.length) &&
    measuredAreas.length > 0;

  const dimensions = [
    {
      key: 'skills',
      label: 'Skill mastery',
      weight: weights.skills,
      measured: enoughEvidence && skillsScore !== null,
      score: enoughEvidence ? skillsScore : null,
      evidence: enoughEvidence
        ? `${measuredAreas.length} of ${areas.length} focus areas measured, from ${evidence.questionsScanned} questions across ${evidence.attemptsScanned} attempts`
        : null,
      missingMessage: evidence.questionsScanned < MIN_QUESTIONS_FOR_SCORE
        ? `Skill mastery not measured — ${MIN_QUESTIONS_FOR_SCORE - evidence.questionsScanned} more graded questions needed before this can be scored.`
        : 'Skill mastery not measured — none of this company\'s focus areas have enough evidence yet.',
      action: { href: '/diagnostic', label: 'Take a diagnostic' },
    },
    {
      key: 'resume',
      label: 'Resume readiness',
      weight: weights.resume,
      measured: resume.measured,
      score: resume.measured ? resume.score : null,
      evidence: resume.measured ? resume.evidence : null,
      missingMessage: resume.reason === 'unavailable'
        ? 'Resume readiness not measured — resume history is unavailable on this database.'
        : 'Resume readiness not measured — run an ATS analysis on your resume.',
      action: { href: '/resume', label: 'Analyse my resume' },
    },
    {
      key: 'interview',
      label: 'Interview readiness',
      weight: weights.interview,
      measured: interview.measured,
      score: interview.measured ? interview.score : null,
      evidence: interview.measured ? interview.evidence : null,
      detail: interview.measured ? interview.metrics : null,
      missingMessage: interview.reason === 'unavailable'
        ? 'Interview readiness not measured — interview history is unavailable on this database.'
        : 'Interview readiness not measured — run a mock interview.',
      action: { href: '/voice-interview', label: 'Run a mock interview' },
    },
  ];

  const measuredDims = dimensions.filter(d => d.measured);
  const missingInputs = dimensions.filter(d => !d.measured).map(d => ({
    key: d.key, label: d.label, message: d.missingMessage, action: d.action,
  }));

  // The overall number requires the skills dimension: resume + interview alone
  // describe presentation, not ability, and averaging them into a headline
  // "readiness" would overstate what we know.
  const skillsDim = dimensions[0];
  const scored = skillsDim.measured;
  const weightSum = measuredDims.reduce((n, d) => n + d.weight, 0);
  const overall = scored && weightSum > 0
    ? Math.round(measuredDims.reduce((n, d) => n + d.score * d.weight, 0) / weightSum)
    : null;

  // ── Named gaps, ordered worst-first ─────────────────────────────────────
  const gaps = [
    ...areas.filter(a => a.status === 'weak')
      .sort((a, b) => a.accuracy - b.accuracy)
      .map(a => ({
        key: a.key, label: a.label, type: 'weak', accuracy: a.accuracy,
        detail: `${a.correct}/${a.total} correct across ${a.skills.length} tracked skill${a.skills.length > 1 ? 's' : ''}`,
        action: a.action,
      })),
    ...areas.filter(a => a.status === 'not_measured')
      .map(a => ({
        key: a.key, label: a.label, type: 'not_measured', accuracy: null,
        detail: a.total > 0
          ? `only ${a.total} question${a.total > 1 ? 's' : ''} of evidence — ${MIN_ANCHOR_EVIDENCE} needed`
          : 'no evidence yet',
        action: a.action,
      })),
  ];

  // ── ETA. Derived from the student's own logged pace, or omitted. ─────────
  const remainingQuestions = gaps.length * QUESTIONS_TO_CLOSE_A_GAP;
  let eta = { available: false, reason: pace.known ? 'no_gaps' : pace.reason };
  if (pace.known && remainingQuestions > 0) {
    eta = {
      available: true,
      days: Math.max(1, Math.ceil(remainingQuestions / pace.perDay)),
      questionsRemaining: remainingQuestions,
      perDay: pace.perDay,
      basis: pace.basis,
      note: `Estimate only — projects your own pace of ${pace.perDay} questions/day over the last ${pace.spanDays} days onto the ${gaps.length} open gap${gaps.length > 1 ? 's' : ''}. Not a prediction of hiring outcomes.`,
    };
  }

  return {
    company,
    profile,
    focusSentence,
    weights: { skills: weights.skills, resume: weights.resume, interview: weights.interview },
    weightsNote: weights.behaviouralSignal
      ? `${company}'s profile calls out behavioural / communication rounds, so interview readiness carries 30% here instead of the usual 20%.`
      : 'Standard split — skill evidence dominates, resume and interview carry a fifth each.',
    scored,
    overall,
    unscoredReason: scored ? null : skillsDim.missingMessage,
    coverage: {
      areasMeasured: measuredAreas.length,
      areasTotal: areas.length,
      dimensionsMeasured: measuredDims.length,
      dimensionsTotal: dimensions.length,
    },
    dimensions,
    areas,
    gaps,
    missingInputs,
    eta,
    unmappedFocus,
  };
}

/**
 * Full readiness payload for one user.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {string[]} [opts.companies]  override the target list (defaults to the
 *                                     user's profile target_companies)
 */
export async function getPlacementReadiness(userId, opts = {}) {
  if (!userId) {
    return { available: false, reason: 'no_user', companies: [] };
  }

  // Profile targets first — with no target company there is nothing to score
  // against, and picking one for the student would be inventing intent.
  let targetCompanies = opts.companies || null;
  if (!targetCompanies) {
    try {
      const { data } = await getAdminClient()
        .from('users')
        .select('target_companies')
        .eq('id', userId)
        .single();
      targetCompanies = data?.target_companies || [];
    } catch {
      targetCompanies = [];
    }
  }

  const { matched, unknown, allCompanies } = resolveTargets(targetCompanies);

  const [evidence, resume, interview] = await Promise.all([
    getSkillEvidence(userId),
    readResume(userId),
    readInterview(userId),
  ]);
  const pace = await paceFromHistory(userId, evidence.questionsScanned);

  const bundle = { evidence, resume, interview, pace };
  const companies = matched.map(name => scoreCompany(name, bundle));

  const hasAnyEvidence =
    (evidence.available && evidence.questionsScanned > 0) || resume.measured || interview.measured;

  return {
    available: true,
    hasTargets: matched.length > 0,
    hasAnyEvidence,
    targets: matched,
    unknownTargets: unknown,
    allCompanies,
    companies,
    evidenceSummary: {
      available: evidence.available,
      attempts: evidence.attemptsScanned,
      questions: evidence.questionsScanned,
      skillsWithEvidence: evidence.skills.length,
      byDomain: evidence.byDomain,
      resume: { measured: resume.measured, reason: resume.reason || null, analysedAt: resume.analysedAt || null },
      interview: { measured: interview.measured, reason: interview.reason || null, sessions: interview.sessions || 0 },
      pace,
    },
    // Rendered in the UI so the number is never a black box.
    formula: {
      overall: 'Σ(dimension score × weight) ÷ Σ(weight), over measured dimensions only',
      skills: 'mean(accuracy of each measured focus area); an area is measured at ≥ 3 graded questions',
      resume: 'latest resume_analyses.ats_score',
      interview: `mean(total_score) of your last ${INTERVIEW_WINDOW} interview_results`,
      thresholds: {
        minQuestionsForScore: MIN_QUESTIONS_FOR_SCORE,
        minAnchorEvidence: MIN_ANCHOR_EVIDENCE,
        weakAccuracy: WEAK_ACCURACY,
      },
      excluded: 'No offer or interview probability is computed — GENOIS holds no hiring-outcome data, so any such number would be fabricated.',
    },
  };
}

export const READINESS_CONSTANTS = {
  MIN_ANCHOR_EVIDENCE,
  MIN_QUESTIONS_FOR_SCORE,
  WEAK_ACCURACY,
  QUESTIONS_TO_CLOSE_A_GAP,
  INTERVIEW_WINDOW,
};
