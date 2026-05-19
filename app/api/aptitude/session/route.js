import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { APTITUDE_CATEGORIES } from '@/lib/aptitudeConfig';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';

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

    const cacheKey = buildCacheKey('aptitude', category, topic, difficulty);
    const cached = await getCached(cacheKey);
    if (cached) {
      const supabase = getAdminClient();
      const { data: session } = await supabase
        .from('aptitude_sessions')
        .insert({
          user_id: payload.userId,
          category,
          topic,
          questions: cached,
          total_questions: cached.length,
        })
        .select()
        .single();
      return successResponse({ session, questions: cached, topicName: topicData.name, categoryLabel: catData.label, fromCache: true });
    }

    const text = await callClaude(prompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!Array.isArray(questions) || questions.length < 5) throw new Error('Not enough questions generated');
      setCached(cacheKey, questions, 48);
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
    }

    const supabase = getAdminClient();
    const { data: session } = await supabase
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

    return successResponse({ session, questions, topicName: topicData.name, categoryLabel: catData.label });
  } catch (error) {
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

    await supabase.from('aptitude_sessions').update({
      answers,
      score: percentage,
      time_taken_seconds: timeTaken || 0,
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId);

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

      await supabase.from('aptitude_progress').update({
        total_sessions: existingProg.total_sessions + 1,
        total_correct: existingProg.total_correct + correct,
        total_attempted: existingProg.total_attempted + questions.length,
        [categoryField]: Math.max(existingProg[categoryField], percentage),
        current_streak: newStreak,
        last_session_date: today,
        weak_topics: [...new Set([...(existingProg.weak_topics || []), ...wrongTopics])].slice(-20),
        updated_at: new Date().toISOString(),
      }).eq('user_id', payload.userId);
    } else {
      await supabase.from('aptitude_progress').insert({
        user_id: payload.userId,
        total_sessions: 1,
        total_correct: correct,
        total_attempted: questions.length,
        [categoryField]: percentage,
        current_streak: 1,
        last_session_date: today,
        weak_topics: [...new Set(wrongTopics)],
      });
    }

    if (percentage >= 70) {
      const { data: currentScore } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
      await supabase.from('scores').update({
        total_score: (currentScore?.total_score || 0) + 15,
      }).eq('user_id', payload.userId);
    }

    return successResponse({
      score: percentage,
      correct,
      total: questions.length,
      results,
      pointsEarned: percentage >= 70 ? 15 : 0,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
