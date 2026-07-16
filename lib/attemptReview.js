import { getAdminClient } from './supabaseAdmin';

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

/**
 * Persist the full question set of one finished attempt into `test_questions`
 * so the review page can render it. Fire-and-forget by design: if the
 * 20260715 migration isn't applied yet this resolves to null and the caller's
 * response is unaffected.
 *
 * @param {object} attempt
 * @param {string} attempt.userId
 * @param {string} attempt.attemptType  dsa_diagnostic | aptitude | daily | weekly | monthly | revision | voice_interview
 * @param {Array}  attempt.questions    [{ question, code, options, correct_answer, user_answer, is_correct, explanation, topic }]
 * @returns {Promise<string|null>} the attempt id, or null when unavailable
 */
export async function saveAttemptReview({
  userId, attemptType, sourceId = null, topic = null,
  score = null, questions = [],
}) {
  try {
    if (!userId || !attemptType || !Array.isArray(questions) || questions.length === 0) return null;

    const entries = questions.map(q => ({
      question: String(q.question || ''),
      code: q.code || null,
      options: q.options ?? null,
      correct_answer: q.correct_answer != null ? String(q.correct_answer) : '',
      user_answer: q.user_answer != null && q.user_answer !== '' ? String(q.user_answer) : null,
      is_correct: !!q.is_correct,
      explanation: q.explanation ? String(q.explanation) : '',
      topic: q.topic ? String(q.topic) : null,
    }));

    const correctCount = entries.filter(e => e.is_correct).length;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('test_questions')
      .insert({
        user_id: userId,
        attempt_type: attemptType,
        source_id: sourceId,
        topic,
        score: score != null ? Math.round(score) : Math.round((correctCount / entries.length) * 100),
        total_questions: entries.length,
        correct_count: correctCount,
        topic_breakdown: buildTopicBreakdown(entries),
        questions: entries,
      })
      .select('id')
      .single();

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
