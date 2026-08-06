import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { generateMCQQuestions } from '@/lib/claudeHelpers';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 3, 60000)) return rateLimitResponse();

    // FIX 2: Weekly gate — only on Mondays, only once per week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday
    if (dayOfWeek !== 1) {
      const daysUntilMonday = (8 - dayOfWeek) % 7;
      return errorResponse(
        `Weekly test is only available on Mondays. Come back in ${daysUntilMonday} day${daysUntilMonday > 1 ? 's' : ''}!`,
        403
      );
    }

    const supabase = getAdminClient();

    // Check if already taken this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: existingTest } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('type', 'weekly')
      .gte('taken_at', startOfWeek.toISOString())
      .maybeSingle();

    if (existingTest) {
      return errorResponse('You already took the weekly test this week. Next one on Monday!', 403);
    }

    const { data: user } = await supabase
      .from('users').select('domain_slug, level, plan').eq('id', payload.userId).single();

    const { data: progress } = await supabase
      .from('progress').select('current_week').eq('user_id', payload.userId).single();

    const weekNumber = progress?.current_week || 1;
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;

    const { data: topics } = await supabase
      .from('roadmap').select('topic')
      .eq('domain_slug', user.domain_slug)
      .gte('day_number', startDay)
      .lte('day_number', endDay);

    const topicList = (topics || []).map(t => t.topic).join(', ');
    const questions = await generateMCQQuestions(
      `Week ${weekNumber} review: ${topicList}`,
      user.domain_slug, user.level, 10, 'weekly'
    );

    const questionsForDb = questions.map(({ correct, explanation, ...q }) => q);
    const answers = questions.map(q => ({ correct: q.correct, explanation: q.explanation }));

    const { data: test, error: writeErr } = await supabase.from('tests').insert({
      user_id: payload.userId,
      domain_slug: user.domain_slug,
      topic: `Week ${weekNumber} Review`,
      type: 'weekly',
      difficulty: user.level,
      total_questions: 10,
      questions: questionsForDb,
      answers,
      result: 'pending',
    }).select().single();
    if (writeErr) console.error('DB write failed: tests.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ testId: test.id, questions: questionsForDb, weekNumber });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
