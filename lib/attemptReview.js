import { getAdminClient } from './supabaseAdmin';
import { resolveSkillFromEntry, isKnownSkill, UNCLASSIFIED } from './skillTaxonomy';

// Whitespace/case-insensitive fingerprint so "seen before" survives minor
// LLM re-phrasings of spacing and casing.
export function normalizeQuestionText(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Derive { topic: { correct, total } } from normalized question entries.
export function buildTopicBreakdown(questions) {
  const breakdown = {};
  for (const q of questions || []) {
    const topic = q.topic || 'general';
    if (!breakdown[topic]) breakdown[topic] = { correct: 0, total: 0 };
    breakdown[topic].total++;
    if (q.is_correct) breakdown[topic].correct++;
  }
  return breakdown;
}

// Same shape as buildTopicBreakdown, but keyed by canonical skill id instead of
// free text. This is the column readiness reads.
export function buildSkillBreakdown(questions) {
  const breakdown = {};
  for (const q of questions || []) {
    const skill = q.skill || UNCLASSIFIED;
    if (!breakdown[skill]) breakdown[skill] = { correct: 0, total: 0 };
    breakdown[skill].total++;
    if (q.is_correct) breakdown[skill].correct++;
  }
  return breakdown;
}

// The coarse family an attempt_type belongs to. Kept here (not in the DB) so a
// new assessment can start writing without a migration.
const CATEGORY_BY_TYPE = {
  daily: 'mcq', weekly: 'mcq', monthly: 'mcq', revision: 'mcq',
  aptitude: 'mcq', dsa_diagnostic: 'mcq', diagnostic: 'mcq',
  coding: 'coding',
  voice_interview: 'interview', mock_interview: 'interview', interview_round: 'interview',
  resume: 'resume',
};

export function categoryForAttemptType(attemptType) {
  return CATEGORY_BY_TYPE[attemptType] || null;
}

// Postgres/PostgREST signals for "that column doesn't exist" — i.e. the
// 20260731 evidence-bus migration hasn't been applied on this database yet.
function isMissingColumnError(error) {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('column') && (msg.includes('does not exist') || msg.includes('could not find'));
}

/**
 * Persist the full question set of one finished attempt into `test_questions`
 * so the review page can render it. Fire-and-forget by design: if the
 * 20260715 migration isn't applied yet this resolves to null and the caller's
 * response is unaffected.
 *
 * Every entry is additionally tagged with a canonical skill id from
 * lib/skillTaxonomy.js — that tag is what makes evidence from an aptitude
 * session and evidence from a mock interview aggregate into one picture.
 *
 * @param {object} attempt
 * @param {string} attempt.userId
 * @param {string} attempt.attemptType  dsa_diagnostic | aptitude | daily | weekly | monthly | revision | voice_interview | diagnostic | coding | mock_interview | interview_round | resume
 * @param {Array}  attempt.questions    [{ question, code, options, correct_answer, user_answer, is_correct, explanation, topic, skill? }]
 * @param {string[]} [attempt.skillDomains]  taxonomy domains to prefer when resolving tags (e.g. ['apt'])
 * @returns {Promise<string|null>} the attempt id, or null when unavailable
 */
export async function saveAttemptReview({
  userId, attemptType, sourceId = null, topic = null,
  score = null, questions = [], skillDomains = null,
}) {
  try {
    if (!userId || !attemptType || !Array.isArray(questions) || questions.length === 0) return null;

    const entries = questions.map(q => {
      const entry = {
        question: String(q.question || ''),
        code: q.code || null,
        options: q.options ?? null,
        correct_answer: q.correct_answer != null ? String(q.correct_answer) : '',
        user_answer: q.user_answer != null && q.user_answer !== '' ? String(q.user_answer) : null,
        is_correct: !!q.is_correct,
        explanation: q.explanation ? String(q.explanation) : '',
        topic: q.topic ? String(q.topic) : null,
      };
      // A caller that already knows the exact skill (resume checks, curriculum
      // days) passes it through; anything else is resolved from the topic, then
      // from the question text. Callers can't invent tags — an unrecognised id
      // is discarded and re-resolved, which is the whole point of a controlled
      // vocabulary.
      entry.skill = isKnownSkill(q.skill)
        ? q.skill
        : resolveSkillFromEntry({ topic: entry.topic, question: entry.question }, { domains: skillDomains });
      return entry;
    });

    const correctCount = entries.filter(e => e.is_correct).length;
    const skillBreakdown = buildSkillBreakdown(entries);
    const supabase = getAdminClient();

    const base = {
      user_id: userId,
      attempt_type: attemptType,
      source_id: sourceId,
      topic,
      score: score != null ? Math.round(score) : Math.round((correctCount / entries.length) * 100),
      total_questions: entries.length,
      correct_count: correctCount,
      topic_breakdown: buildTopicBreakdown(entries),
      questions: entries,
    };
    const withSkills = {
      ...base,
      skill_breakdown: skillBreakdown,
      skill_tags: Object.keys(skillBreakdown),
      attempt_category: categoryForAttemptType(attemptType),
    };

    let { data, error } = await supabase
      .from('test_questions').insert(withSkills).select('id').single();

    // Graceful degradation: on a database where the 20260731 migration hasn't
    // run, the three new columns don't exist. Retry with the pre-migration
    // shape so the attempt is still recorded — the per-entry `skill` tag rides
    // along inside the `questions` JSONB either way, so nothing is lost
    // permanently and the read helper can still compute from it.
    if (error && isMissingColumnError(error)) {
      console.warn('[attemptReview] skill columns missing (20260731 not applied) — saving without them');
      ({ data, error } = await supabase
        .from('test_questions').insert(base).select('id').single());
    }

    if (error) {
      console.warn('[attemptReview] save skipped:', error.message);
      return null;
    }
    return data?.id || null;
  } catch (e) {
    console.warn('[attemptReview] save skipped:', e.message);
    return null;
  }
}

/**
 * Question texts the user saw in their last N attempts of a given type
 * (optionally same topic) — used by the generators to avoid identical
 * retakes. Returns an empty Set when the table doesn't exist yet.
 */
export async function getRecentSeenQuestions({ userId, attemptTypes, topic = null, attempts = 2 }) {
  const seen = new Set();
  try {
    const supabase = getAdminClient();
    let query = supabase
      .from('test_questions')
      .select('questions')
      .eq('user_id', userId)
      .in('attempt_type', Array.isArray(attemptTypes) ? attemptTypes : [attemptTypes])
      .order('taken_at', { ascending: false })
      .limit(attempts);
    if (topic) query = query.eq('topic', topic);

    const { data } = await query;
    for (const row of data || []) {
      for (const q of row.questions || []) {
        const key = normalizeQuestionText(q.question);
        if (key) seen.add(key);
      }
    }
  } catch (e) {
    console.warn('[attemptReview] seen lookup skipped:', e.message);
  }
  return seen;
}

// Fraction (0..1) of `questions` whose text appears in `seenSet`.
export function seenOverlap(questions, seenSet, textOf = q => q?.question) {
  if (!seenSet?.size || !questions?.length) return 0;
  const hits = questions.filter(q => seenSet.has(normalizeQuestionText(textOf(q)))).length;
  return hits / questions.length;
}

// Unbiased Fisher-Yates (the old `.sort(() => Math.random() - 0.5)` trick is
// both biased and, on some engines, barely shuffles at all).
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
