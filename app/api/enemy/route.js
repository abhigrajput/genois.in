import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: myScore } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    const { data: allScores } = await supabase
      .from('scores')
      .select('user_id, total_score')
      .order('total_score', { ascending: false });

    if (!allScores || allScores.length === 0) {
      return errorResponse('No scores found', 404);
    }

    const myScoreVal = myScore?.total_score || 0;
    const myRankIndex = allScores.findIndex(s => s.user_id === payload.userId);
    const myRank = myRankIndex + 1;

    if (myRank <= 1) {
      return successResponse({
        isTopRanked: true,
        myRank: 1,
        myScore: myScoreVal,
        message: 'You are ranked #1. No one to beat. Stay on top.',
      });
    }

    const enemyEntry = allScores[myRankIndex - 1];
    if (!enemyEntry) return errorResponse('No rival found', 404);

    const { data: enemy } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, level')
      .eq('id', enemyEntry.user_id)
      .single();

    const { data: enemyProgress } = await supabase
      .from('progress')
      .select('current_day, streak, tasks_completed_today, last_active_date')
      .eq('user_id', enemyEntry.user_id)
      .single();

    const { data: enemySkill } = await supabase
      .from('skill_identity')
      .select('skill_level, job_ready_score')
      .eq('user_id', enemyEntry.user_id)
      .single();

    const { data: enemyTests } = await supabase
      .from('tests')
      .select('score, type')
      .eq('user_id', enemyEntry.user_id)
      .order('taken_at', { ascending: false })
      .limit(10);

    const avgTestScore = enemyTests && enemyTests.length > 0
      ? Math.round(enemyTests.reduce((a, t) => a + (t.score || 0), 0) / enemyTests.length)
      : 0;

    const scoreDiff = enemyEntry.total_score - myScoreVal;
    const today = new Date().toISOString().split('T')[0];
    const enemyActiveToday = enemyProgress?.last_active_date?.split('T')[0] === today;

    const gapToClose = Math.max(1, Math.ceil(scoreDiff / 20));

    return successResponse({
      isTopRanked: false,
      myRank,
      myScore: myScoreVal,
      enemy: {
        name: enemy?.name || 'Unknown',
        college: enemy?.college || 'Unknown College',
        domain: enemy?.domain_slug || 'unknown',
        rank: myRank - 1,
        score: enemyEntry.total_score,
        scoreDiff,
        streak: enemyProgress?.streak || 0,
        currentDay: enemyProgress?.current_day || 1,
        activeToday: enemyActiveToday,
        tasksToday: enemyProgress?.tasks_completed_today || 0,
        skillLevel: enemySkill?.skill_level || 'beginner',
        jobReady: Math.round(enemySkill?.job_ready_score || 0),
        avgTestScore,
        gapToClose,
      },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
