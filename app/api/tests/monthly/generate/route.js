import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { generateMCQQuestions } from '@/lib/claudeHelpers';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 2, 60000)) return rateLimitResponse();

    // FIX 2: Monthly gate — only on 1st of month, only once per month
    const today = new Date();
    if (today.getDate() !== 1) {
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const daysLeft = Math.ceil((startOfNextMonth - today) / (1000 * 60 * 60 * 24));
      return errorResponse(
        `Monthly test is only available on the 1st of each month. Come back in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
        403
      );
    }

    const supabase = getAdminClient();

    // Check if already taken this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: existingTest } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('type', 'monthly')
      .gte('taken_at', startOfMonth.toISOString())
      .maybeSingle();

    if (existingTest) {
      return errorResponse('You already took the monthly test this month. Next one on the 1st!', 403);
    }

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const questions = await generateMCQQuestions(
      `Complete ${user.domain_slug} curriculum review`,
      user.domain_slug, user.level, 20, 'monthly'
    );

    const questionsForDb = questions.map(({ correct, explanation, ...q }) => q);
    const answers = questions.map(q => ({ correct: q.correct, explanation: q.explanation }));

    const { data: test } = await supabase.from('tests').insert({
      user_id: payload.userId,
      domain_slug: user.domain_slug,
      topic: 'Monthly Evaluation',
      type: 'monthly',
      difficulty: user.level,
      total_questions: 20,
      questions: questionsForDb,
      answers,
      result: 'pending',
    }).select().single();

    return successResponse({ testId: test.id, questions: questionsForDb });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
