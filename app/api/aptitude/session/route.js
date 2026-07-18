import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { APTITUDE_CATEGORIES } from '@/lib/aptitudeConfig';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { saveAttemptReview, getRecentSeenQuestions, seenOverlap, shuffle } from '@/lib/attemptReview';

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`apt_gen_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty') || 'medium';

    if (!category || !topic) return errorResponse('Category and topic required', 400);

    const catData = APTITUDE_CATEGORIES[category];
    if (!catData) return errorResponse('Invalid category', 400);
    const topicData = catData.topics.find(t => t.slug === topic);
    if (!topicData) return errorResponse('Invalid topic', 400);

    const prompt = `You are generating ${difficulty} level aptitude questions for Indian engineering students.

Category: ${catData.label}
Topic: ${topicData.name}
Difficulty: ${difficulty}

Generate exactly 10 questions. Each question must be complete with all 4 options, correct answer, and detailed step-by-step explanation.

CRITICAL: Return ONLY valid JSON. No markdown, no extra text, no explanation before or after.

Format:
[
  {"question": "Q1 text", "options": ["A option", "B option", "C option", "D option"], "correct": "A option", "explanation": "step by step solution", "topic": "${topicData.name}", "difficulty": "${difficulty}"},
  ...9 more
]

Make sure all 10 questions are included and JSON is valid.`;

    const supabase = getAdminClient();

    // Retake randomization: the cache key rotates through 3 pools per
    // (category, topic, difficulty) based on the user's session count, so a
    // retake lands on a different pool instead of the identical cached set.
    // If the chosen pool still overlaps what this user recently saw, it is
    // regenerated with an explicit avoid-list. Caching stays — cost unchanged
    // for first-time takers.
    const { count: priorSessions } = await supabase
      .from('aptitude_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', payload.userId)
      .eq('category', category)
      .eq('topic', topic);

    const variant = (priorSessions || 0) % 3;
    const cacheKey = buildCacheKey('aptitude', category, topic, difficulty, `set${variant}`);
    const seen = await getRecentSeenQuestions({
      userId: payload.userId, attemptTypes: 'aptitude', topic, attempts: 3,
    });

    let cached = await getCached(cacheKey);
    if (cached && seenOverlap(cached, seen) >= 0.5) cached = null; // mostly seen — force fresh below

    if (cached) {
      const questions = shuffle(cached);
      const { data: session, error: sessionErr } = await supabase
        .from('aptitude_sessions')
        .insert({
          user_id: payload.userId,
          category,
          topic,
          questions,
          total_questions: questions.length,
        })
        .select()
        .single();
      logWriteError('aptitude/session', 'aptitude_sessions.insert(cached)', sessionErr);
      return successResponse({ session, questions, topicName: topicData.name, categoryLabel: catData.label, fromCache: true });
    }

    const avoidList = [...seen].slice(0, 20);
    const genPrompt = avoidList.length
      ? `${prompt}\n\nIMPORTANT: Do NOT repeat or lightly rephrase any of these questions the student already saw:\n${avoidList.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : prompt;

    const text = await callClaude(genPrompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!Array.isArray(questions) || questions.length < 5) throw new Error('Not enough questions generated');
      setCached(cacheKey, questions, 48);
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
    }
    const { data: session, error: sessionErr } = await supabase
      .from('aptitude_sessions')
      .insert({
        user_id: payload.userId,
        category,
        topic,
        questions,
        total_questions: questions.length,
      })
      .select()
      .single();
    logWriteError('aptitude/session', 'aptitude_sessions.insert(fresh)', sessionErr);

    return successResponse({ session, questions, topicName: topicData.name, categoryLabel: catData.label });
  } catch (error) {
    console.error('aptitude/session GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { sessionId, answers, timeTaken } = await request.json();
    const supabase = getAdminClient();

    const { data: session } = await supabase
      .from('aptitude_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', payload.userId)
      .single();

    if (!session) return errorResponse('Session not found', 404);
    if (session.completed) return errorResponse('Already submitted', 400);

    const questions = session.questions || [];
    let correct = 0;
    const wrongTopics = [];
    const results = [];

    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) correct++;
      else if (q.topic) wrongTopics.push(q.topic);
      results.push({
        question: q.question,
        yourAnswer: answers[i] || 'Skipped',
        correct: q.correct,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const percentage = Math.round((correct / questions.length) * 100);

    // Persist full per-question data for the review page (and retake
    // exclusion). No-op if the test_questions migration isn't applied.
    const attemptId = await saveAttemptReview({
      userId: payload.userId,
      attemptType: 'aptitude',
      sourceId: session.id,
      topic: session.topic,
      score: percentage,
      questions: questions.map((q, i) => ({
        question: q.question,
        options: q.options ?? null,
        correct_answer: q.correct,
        user_answer: answers[i],
        is_correct: answers[i] === q.correct,
        explanation: q.explanation,
        topic: q.topic || session.topic,
      })),
    });

    const { error: sessionUpdErr } = await supabase.from('aptitude_sessions').update({
      answers,
      score: percentage,
      time_taken_seconds: timeTaken || 0,
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId);
    logWriteError('aptitude/session', 'aptitude_sessions.update(submit)', sessionUpdErr);

    const { data: existingProg } = await supabase
      .from('aptitude_progress')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const categoryField = session.category + '_score';

    if (existingProg) {
      const newStreak = existingProg.last_session_date === today
        ? existingProg.current_streak
        : (existingProg.last_session_date === new Date(Date.now() - 86400000).toISOString().split('T')[0]
          ? existingProg.current_streak + 1
          : 1);

      const { error: progUpdErr } = await supabase.from('aptitude_progress').update({
        total_sessions: existingProg.total_sessions + 1,
        total_correct: existingProg.total_correct + correct,
        total_attempted: existingProg.total_attempted + questions.length,
        [categoryField]: Math.max(existingProg[categoryField], percentage),
        current_streak: newStreak,
        last_session_date: today,
        weak_topics: [...new Set([...(existingProg.weak_topics || []), ...wrongTopics])].slice(-20),
        updated_at: new Date().toISOString(),
      }).eq('user_id', payload.userId);
      logWriteError('aptitude/session', 'aptitude_progress.update', progUpdErr);
    } else {
      const { error: progInsErr } = await supabase.from('aptitude_progress').insert({
        user_id: payload.userId,
        total_sessions: 1,
        total_correct: correct,
        total_attempted: questions.length,
        [categoryField]: percentage,
        current_streak: 1,
        last_session_date: today,
        weak_topics: [...new Set(wrongTopics)],
      });
      logWriteError('aptitude/session', 'aptitude_progress.insert', progInsErr);
    }

    if (percentage >= 70) {
      const { data: currentScore } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
      const { error: scoresErr } = await supabase.from('scores').update({
        total_score: (currentScore?.total_score || 0) + 15,
      }).eq('user_id', payload.userId);
      logWriteError('aptitude/session', 'scores.update(award)', scoresErr);
    }

    return successResponse({
      score: percentage,
      correct,
      total: questions.length,
      results,
      pointsEarned: percentage >= 70 ? 15 : 0,
      attemptId,
    });
  } catch (error) {
    console.error('aptitude/session POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}
