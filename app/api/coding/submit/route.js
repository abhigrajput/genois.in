import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { reviewCode } from '@/lib/claudeHelpers';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { codingTestId, code, language } = await request.json();
    if (!codingTestId || !code) return errorResponse('codingTestId and code are required', 400);

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const { data: codingTest } = await supabase
      .from('coding_tests').select('*').eq('id', codingTestId).single();

    if (!codingTest) return errorResponse('Coding test not found', 404);

    const review = await reviewCode(
      codingTest.problem, code,
      language || 'javascript',
      user.level, user.domain_slug
    );

    let status = 'incorrect';
    let points = 5;
    if (review.score >= 70) { status = 'correct'; points = 20; }
    else if (review.score >= 40) { status = 'partial'; points = 10; }

    const { data: submission } = await supabase.from('coding_submissions').insert({
      user_id: payload.userId,
      coding_test_id: codingTestId,
      code,
      language: language || 'javascript',
      status,
      score: points,
      ai_feedback: JSON.stringify(review),
    }).select().single();

    const { data: currentScore } = await supabase
      .from('scores').select('total_score, coding_score').eq('user_id', payload.userId).single();

    if (currentScore) {
      await supabase.from('scores').update({
        total_score: (currentScore.total_score || 0) + points,
        coding_score: (currentScore.coding_score || 0) + points,
      }).eq('user_id', payload.userId);
    }

    await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'coding',
      points,
      reason: `Coding: ${codingTest.title} — ${review.score}/100`,
    });

    return successResponse({ submission, review, points, status });
  } catch (error) {
    console.error('Submit coding error:', error);
    return errorResponse('Internal server error', 500);
  }
}
