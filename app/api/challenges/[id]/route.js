import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { data: challenge } = await supabase
      .from('company_challenges')
      .select('*, companies(name, location, website)')
      .eq('id', id)
      .single();

    if (!challenge) return errorResponse('Challenge not found', 404);

    const { data: attempt } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('challenge_id', id)
      .eq('user_id', payload.userId)
      .single();

    const { data: allAttempts } = await supabase
      .from('challenge_attempts')
      .select('user_id, score')
      .eq('challenge_id', id)
      .eq('completed', true)
      .order('score', { ascending: false });

    const rank = attempt
      ? (allAttempts || []).findIndex(a => a.user_id === payload.userId) + 1
      : null;

    return successResponse({
      challenge: { ...challenge, companyName: challenge.companies?.name },
      myAttempt: attempt || null,
      totalAttempts: allAttempts?.length || 0,
      myRank: rank,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const { answers } = await request.json();
    const supabase = getAdminClient();

    const { data: challenge } = await supabase
      .from('company_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (!challenge) return errorResponse('Challenge not found', 404);

    const { data: existing } = await supabase
      .from('challenge_attempts')
      .select('id')
      .eq('challenge_id', id)
      .eq('user_id', payload.userId)
      .single();

    if (existing) return errorResponse('You have already attempted this challenge', 400);

    const questions = challenge.questions || [];
    let score = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 20), 0);

    questions.forEach((q, i) => {
      if (answers[i] === q.correct) {
        score += q.points || 20;
      }
    });

    const percentage = Math.round((score / totalPoints) * 100);

    await supabase
      .from('challenge_attempts')
      .insert({
        challenge_id: id,
        user_id: payload.userId,
        answers,
        score: percentage,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    const { data: allAttempts } = await supabase
      .from('challenge_attempts')
      .select('user_id, score')
      .eq('challenge_id', id)
      .eq('completed', true)
      .order('score', { ascending: false });

    const rank = (allAttempts || []).findIndex(a => a.user_id === payload.userId) + 1;

    // Award +50 GENOIS points for 80%+ score
    if (percentage >= 80) {
      const { data: currentScore } = await supabase
        .from('scores')
        .select('total_score')
        .eq('user_id', payload.userId)
        .single();

      await supabase.from('scores').update({
        total_score: (currentScore?.total_score || 0) + 50,
      }).eq('user_id', payload.userId);

      await supabase.from('score_events').insert({
        user_id: payload.userId,
        type: 'challenge',
        points: 50,
        reason: `Company challenge: ${challenge.title} — ${percentage}%`,
      });
    }

    return successResponse({ score: percentage, rank, totalAttempts: allAttempts?.length });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
