import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { generateMCQQuestions } from '@/lib/claudeHelpers';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const { data: weakTopics } = await supabase
      .from('weak_topics').select('topic')
      .eq('user_id', payload.userId)
      .order('avg_score', { ascending: true })
      .limit(5);

    const topicFocus = weakTopics && weakTopics.length > 0
      ? weakTopics.map(w => w.topic).join(', ')
      : `${user.domain_slug} fundamentals`;

    const questions = await generateMCQQuestions(
      topicFocus, user.domain_slug, user.level, 5, 'revision'
    );

    const questionsForDb = questions.map(({ correct, explanation, ...q }) => q);
    const answers = questions.map(q => ({ correct: q.correct, explanation: q.explanation }));

    const { data: test } = await supabase.from('tests').insert({
      user_id: payload.userId,
      domain_slug: user.domain_slug,
      topic: 'Revision — Weak Topics',
      type: 'revision',
      difficulty: user.level,
      total_questions: 5,
      questions: questionsForDb,
      answers,
      result: 'pending',
    }).select().single();

    return successResponse({
      testId: test.id,
      questions: questionsForDb,
      weakTopics: weakTopics || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
