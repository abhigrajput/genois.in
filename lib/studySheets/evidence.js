/**
 * Evidence overlay for study sheets.
 *
 * Answers one question per sheet: does this student's OWN assessment history say
 * anything about the skills this sheet covers? When it does, the library can
 * lead with "Trees — 31% over 16 questions" instead of an alphabetical list.
 *
 * THE ANTI-FABRICATION CONTRACT — the same one lib/mentorEvidence.js runs on,
 * because two features disagreeing about what "weak" means is worse than
 * neither having the feature:
 *
 *   1. Every number here is copied from getSkillEvidence(). Nothing computes a
 *      new score and nothing rounds a "not measured" into a zero.
 *   2. NOT MEASURED is a distinct state from WEAK. A sheet with no evidence is
 *      an unknown; it is never rendered as a weakness.
 *   3. Below MIN_EVIDENCE_TO_JUDGE questions a sheet is THIN, not weak. One
 *      wrong MCQ is noise, and "you're weak at Graphs" off a single question is
 *      worse than saying nothing.
 *   4. The WEAK threshold is imported from the readiness engine, so the sheet
 *      library's idea of weak and the readiness page's idea of weak cannot drift.
 *   5. Total failure (no evidence table, an unapplied migration) degrades to
 *      `available: false`, and the UI then shows the plain library — never a
 *      library decorated with invented state.
 */

import { getSkillEvidence } from '@/lib/skillEvidence';
import { READINESS_CONSTANTS } from '@/lib/placementReadiness';
import { STUDY_SHEETS } from './index';

/** Questions needed across a sheet's skills before it may be judged at all. */
const MIN_EVIDENCE_TO_JUDGE = 3;

/** Borrowed, not chosen here — see rule 4 above. */
const { WEAK_ACCURACY } = READINESS_CONSTANTS;

export const SHEET_STATUS = Object.freeze({
  weak: 'weak',             // measured, at or below the weak threshold
  solid: 'solid',           // measured, above it
  thin: 'thin',             // some evidence, too little to judge
  unmeasured: 'unmeasured', // no evidence at all — an UNKNOWN, not a weakness
});

/**
 * Roll a student's per-skill evidence up to one row per sheet.
 *
 * @param {string} userId
 * @returns {Promise<{available: boolean, hasAnyEvidence: boolean,
 *   questionsScanned: number, bySheet: Record<string, object>, weakest: object[]}>}
 */
export async function getSheetEvidence(userId) {
  const empty = {
    available: false,
    hasAnyEvidence: false,
    questionsScanned: 0,
    bySheet: {},
    weakest: [],
  };
  if (!userId) return empty;

  let evidence;
  try {
    evidence = await getSkillEvidence(userId, { minEvidence: 1 });
  } catch (e) {
    console.warn('[sheetEvidence] unavailable:', e.message);
    return empty;
  }
  if (!evidence?.available) return empty;

  const bySkill = new Map((evidence.skills || []).map(s => [s.skill, s]));
  const bySheet = {};

  for (const sheet of STUDY_SHEETS) {
    let correct = 0;
    let total = 0;
    const measured = [];

    for (const skillId of sheet.skills || []) {
      const s = bySkill.get(skillId);
      if (!s || !s.total) continue;
      correct += s.correct;
      total += s.total;
      measured.push({
        skill: s.skill,
        label: s.label,
        correct: s.correct,
        total: s.total,
        accuracy: s.accuracy,
      });
    }

    // Accuracy is only ever reported alongside the counts that produced it, and
    // is null whenever there is nothing to divide.
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;

    let status = SHEET_STATUS.unmeasured;
    if (total >= MIN_EVIDENCE_TO_JUDGE) {
      status = accuracy <= WEAK_ACCURACY ? SHEET_STATUS.weak : SHEET_STATUS.solid;
    } else if (total > 0) {
      status = SHEET_STATUS.thin;
    }

    bySheet[sheet.id] = {
      status,
      correct,
      total,
      accuracy,
      // Worst measured skill first — what the "why am I seeing this" line quotes.
      skills: measured.sort((a, b) => a.accuracy - b.accuracy),
      skillsUnmeasured: (sheet.skills || []).length - measured.length,
    };
  }

  // Only genuinely weak sheets are promoted. A student whose worst measured
  // sheet sits at 90% has no weakness to surface, and manufacturing one out of
  // the bottom of a sorted list is exactly the fabrication this guards against.
  const weakest = Object.entries(bySheet)
    .filter(([, r]) => r.status === SHEET_STATUS.weak)
    .sort((a, b) => a[1].accuracy - b[1].accuracy || b[1].total - a[1].total)
    .slice(0, 3)
    .map(([id, r]) => ({ sheetId: id, accuracy: r.accuracy, correct: r.correct, total: r.total }));

  return {
    available: true,
    hasAnyEvidence: (evidence.questionsScanned || 0) > 0,
    questionsScanned: evidence.questionsScanned || 0,
    bySheet,
    weakest,
  };
}

export const SHEET_EVIDENCE_CONSTANTS = { MIN_EVIDENCE_TO_JUDGE, WEAK_ACCURACY };
