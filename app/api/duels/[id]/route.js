import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { data: duel } = await supabase
      .from('duels')
      .select('*')
      .eq('id', id)
      .single();

    if (!duel) return errorResponse('Duel not found', 404);
    if (duel.challenger_id !== payload.userId && duel.opponent_id !== payload.userId) {
      return errorResponse('Not your duel', 403);
    }

    const otherId = duel.challenger_id === payload.userId ? duel.opponent_id : duel.challenger_id;
    const { data: other } = await supabase.from('users').select('name, college').eq('id', otherId).single();

    return successResponse({
      duel,
      isChallenger: duel.challenger_id === payload.userId,
      opponentName: other?.name,
      opponentCollege: other?.college,
      myScore: duel.challenger_id === payload.userId ? duel.challenger_score : duel.opponent_score,
      theirScore: duel.challenger_id === payload.userId ? duel.opponent_score : duel.challenger_score,
      iFinished: duel.challenger_id === payload.userId ? duel.challenger_finished : duel.opponent_finished,
      theyFinished: duel.challenger_id === payload.userId ? duel.opponent_finished : duel.challenger_finished,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const { action, answers } = await request.json();
    const supabase = getAdminClient();

    const { data: duel } = await supabase.from('duels').select('*').eq('id', id).single();
    if (!duel) return errorResponse('Duel not found', 404);

    const isChallenger = duel.challenger_id === payload.userId;
    const isOpponent = duel.opponent_id === payload.userId;
    if (!isChallenger && !isOpponent) return errorResponse('Not your duel', 403);

    if (action === 'accept') {
      await supabase.from('duels').update({ status: 'active' }).eq('id', id);
      return successResponse({ message: 'Duel accepted' });
    }

    if (action === 'submit') {
      const questions = duel.questions || [];
      let score = 0;

      for (let i = 0; i < answers.length; i++) {
        const q = questions[i];
        const isCorrect = q && answers[i]?.answer === q.correct;
        if (isCorrect) score++;
        await supabase.from('duel_answers').insert({
          duel_id: id,
          user_id: payload.userId,
          question_index: i,
          answer: answers[i]?.answer,
          is_correct: isCorrect,
          time_taken: answers[i]?.timeTaken || 0,
        });
      }

      const scorePoints = score * 10;
      const updateField = isChallenger
        ? { challenger_score: scorePoints, challenger_finished: true }
        : { opponent_score: scorePoints, opponent_finished: true };

      const { data: updated } = await supabase
        .from('duels')
        .update(updateField)
        .eq('id', id)
        .select()
        .single();

      const bothDone = updated.challenger_finished && updated.opponent_finished;
      if (bothDone) {
        let winnerId = null;
        if (updated.challenger_score > updated.opponent_score) winnerId = updated.challenger_id;
        else if (updated.opponent_score > updated.challenger_score) winnerId = updated.opponent_id;

        await supabase.from('duels').update({
          status: 'completed',
          winner_id: winnerId,
          finished_at: new Date().toISOString(),
        }).eq('id', id);

        if (winnerId) {
          await supabase.from('scores').select('total_score').eq('user_id', winnerId).single().then(async ({ data: s }) => {
            if (s) await supabase.from('scores').update({ total_score: (s.total_score || 0) + 50 }).eq('user_id', winnerId);
          });
        }
      }

      return successResponse({ score, scorePoints, correct: score, total: questions.length });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
