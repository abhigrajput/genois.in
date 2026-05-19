import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { testId, answers: userAnswers } = await request.json();
    const supabase = getAdminClient();

    const { data: test, error } = await supabase
      .from('tests').select('*').eq('id', testId).single();

    if (error || !test) return errorResponse('Test not found', 404);
    if (test.user_id !== payload.userId) return errorResponse('Unauthorized', 403);
    if (test.result !== 'pending') {
      return successResponse({
        alreadySubmitted: true,
        score: test.score,
        result: test.result,
      });
    }

    const storedAnswers = test.answers;
    let correct = 0;
    const feedback = (userAnswers || []).map((ua, i) => {
      const isCorrect = ua.answer === storedAnswers[i]?.correct;
      if (isCorrect) correct++;
      return {
        questionIndex: i,
        isCorrect,
        yourAnswer: ua.answer,
        correctAnswer: storedAnswers[i]?.correct,
        explanation: storedAnswers[i]?.explanation,
      };
    });

    const score = Math.round((correct / test.total_questions) * 100);
    const result = score >= 60 ? 'passed' : 'failed';

    await supabase.from('tests').update({
      correct_answers: correct,
      score,
      result,
    }).eq('id', testId);

    if (test.topic) {
      if (score < 60) {
        await supabase.from('weak_topics').upsert({
          user_id: payload.userId,
          topic: test.topic,
          domain_slug: test.domain_slug,
          test_count: 1,
          avg_score: score,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,topic' });
        await supabase.from('strong_topics')
          .delete().eq('user_id', payload.userId).eq('topic', test.topic);
      } else if (score >= 80) {
        await supabase.from('strong_topics').upsert({
          user_id: payload.userId,
          topic: test.topic,
          domain_slug: test.domain_slug,
          test_count: 1,
          avg_score: score,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,topic' });
        await supabase.from('weak_topics')
          .delete().eq('user_id', payload.userId).eq('topic', test.topic);
      }
    }

    const testPoints = Math.max(5, Math.round(score * 0.3));
    const { data: currentScore } = await supabase
      .from('scores').select('total_score, test_score').eq('user_id', payload.userId).single();

    if (currentScore) {
      await supabase.from('scores').update({
        total_score: (currentScore.total_score || 0) + testPoints,
        test_score: (currentScore.test_score || 0) + testPoints,
      }).eq('user_id', payload.userId);
    }

    await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'test',
      points: testPoints,
      reason: `Daily test on ${test.topic}: ${score}%`,
    });

    // Auto-award streak insurance token for 100% on weekly test
    if (score >= 100 && test.type === 'weekly') {
      const { data: prog } = await supabase
        .from('progress')
        .select('streak_tokens')
        .eq('user_id', payload.userId)
        .single();
      await supabase.from('progress').update({
        streak_tokens: (prog?.streak_tokens || 0) + 1,
      }).eq('user_id', payload.userId);
    }

    return successResponse({
      score,
      result,
      correct,
      total: test.total_questions,
      feedback,
      pointsEarned: testPoints,
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return errorResponse('Internal server error', 500);
  }
}
