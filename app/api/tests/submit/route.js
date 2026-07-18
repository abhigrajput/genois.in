import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { saveAttemptReview } from '@/lib/attemptReview';

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

    const { error: testUpdErr } = await supabase.from('tests').update({
      correct_answers: correct,
      score,
      result,
    }).eq('id', testId);
    logWriteError('tests/submit', 'tests.update(result)', testUpdErr);

    // Persist the full question set (question + user pick + correct +
    // explanation) so the review page can render this attempt. No-op if the
    // test_questions migration isn't applied yet.
    const attemptId = await saveAttemptReview({
      userId: payload.userId,
      attemptType: test.type || 'daily',
      sourceId: test.id,
      topic: test.topic,
      score,
      questions: (test.questions || []).map((q, i) => ({
        question: q.question,
        code: q.code || null,
        options: q.options ?? null,
        correct_answer: storedAnswers[i]?.correct,
        user_answer: (userAnswers || [])[i]?.answer,
        is_correct: (userAnswers || [])[i]?.answer === storedAnswers[i]?.correct,
        explanation: storedAnswers[i]?.explanation,
        topic: q.topic || test.topic,
      })),
    });

    if (test.topic) {
      if (score < 60) {
        const { error: weakErr } = await supabase.from('weak_topics').upsert({
          user_id: payload.userId,
          topic: test.topic,
          domain_slug: test.domain_slug,
          test_count: 1,
          avg_score: score,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,topic' });
        logWriteError('tests/submit', 'weak_topics.upsert', weakErr);
        const { error: strongDelErr } = await supabase.from('strong_topics')
          .delete().eq('user_id', payload.userId).eq('topic', test.topic);
        logWriteError('tests/submit', 'strong_topics.delete', strongDelErr);
      } else if (score >= 80) {
        const { error: strongErr } = await supabase.from('strong_topics').upsert({
          user_id: payload.userId,
          topic: test.topic,
          domain_slug: test.domain_slug,
          test_count: 1,
          avg_score: score,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,topic' });
        logWriteError('tests/submit', 'strong_topics.upsert', strongErr);
        const { error: weakDelErr } = await supabase.from('weak_topics')
          .delete().eq('user_id', payload.userId).eq('topic', test.topic);
        logWriteError('tests/submit', 'weak_topics.delete', weakDelErr);
      }
    }

    const testPoints = Math.max(5, Math.round(score * 0.3));
    const { data: currentScore } = await supabase
      .from('scores').select('total_score, test_score').eq('user_id', payload.userId).single();

    if (currentScore) {
      const { error: scoresErr } = await supabase.from('scores').update({
        total_score: (currentScore.total_score || 0) + testPoints,
        test_score: (currentScore.test_score || 0) + testPoints,
      }).eq('user_id', payload.userId);
      logWriteError('tests/submit', 'scores.update(award)', scoresErr);
    }

    const { error: eventErr } = await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'test',
      points: testPoints,
      reason: `Daily test on ${test.topic}: ${score}%`,
    });
    logWriteError('tests/submit', 'score_events.insert', eventErr);

    // Auto-award streak insurance token for 100% on weekly test
    if (score >= 100 && test.type === 'weekly') {
      const { data: prog } = await supabase
        .from('progress')
        .select('streak_tokens')
        .eq('user_id', payload.userId)
        .single();
      const { error: tokenErr } = await supabase.from('progress').update({
        streak_tokens: (prog?.streak_tokens || 0) + 1,
      }).eq('user_id', payload.userId);
      logWriteError('tests/submit', 'progress.update(streak-token)', tokenErr);
    }

    return successResponse({
      score,
      result,
      correct,
      total: test.total_questions,
      feedback,
      pointsEarned: testPoints,
      attemptId,
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return errorResponse('Internal server error', 500);
  }
}
