import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { generateMCQQuestions } from '@/lib/claudeHelpers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const allowed = rateLimit(`test_${payload.userId}`, 5, 60000);
    if (!allowed) return rateLimitResponse();

    const { roadmapId, dayNumber } = await request.json();
    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const { data: roadmap } = await supabase
      .from('roadmap').select('topic, difficulty').eq('id', roadmapId).single();

    if (!roadmap) return errorResponse('Roadmap item not found', 404);

    // FIX 2: Always fresh — include today's date so Claude never repeats
    const today = new Date().toISOString().split('T')[0];
    const freshPrompt = `${roadmap.topic} — Day ${dayNumber} — Date ${today}. Generate completely new questions. Never repeat previous questions.`;

    const allQuestions = await generateMCQQuestions(
      freshPrompt, user.domain_slug, user.level, 5, 'daily'
    );

    const questionsForDb = allQuestions.map(({ correct, explanation, ...q }) => q);
    const answers = allQuestions.map(q => ({
      correct: q.correct,
      explanation: q.explanation,
    }));

    const { data: test, error } = await supabase.from('tests').insert({
      user_id: payload.userId,
      roadmap_id: roadmapId,
      domain_slug: user.domain_slug,
      topic: roadmap.topic,
      type: 'daily',
      difficulty: user.level,
      total_questions: 5,
      questions: questionsForDb,
      answers,
      result: 'pending',
    }).select().single();

    if (error) throw new Error(error.message);

    return successResponse({
      testId: test.id,
      questions: questionsForDb,
      topic: roadmap.topic,
    });
  } catch (error) {
    console.error('Generate test error:', error);
    return errorResponse('Internal server error', 500);
  }
}
