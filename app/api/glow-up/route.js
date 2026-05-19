import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const [
      { data: user },
      { data: progress },
      { data: score },
      { data: analytics },
    ] = await Promise.all([
      supabase.from('users').select('name, college, domain_slug, created_at').eq('id', payload.userId).single(),
      supabase.from('progress').select('current_day, streak, progress_percent').eq('user_id', payload.userId).single(),
      supabase.from('scores').select('total_score').eq('user_id', payload.userId).single(),
      supabase.from('analytics').select('daily_score, date').eq('user_id', payload.userId).order('date', { ascending: true }),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });

    const currentDay = progress?.current_day || 1;
    const currentScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= currentScore) + 1 || 1;
    const total = allScores?.length || 1;
    const percentile = Math.round(((total - rank) / total) * 100);

    const day1Analytics = (analytics || [])[0];
    const day1Score = day1Analytics?.daily_score || 0;

    const scoreImprovement = currentScore - day1Score;
    const improvementPercent = day1Score > 0 ? Math.round((scoreImprovement / day1Score) * 100) : 0;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('topic')
      .eq('user_id', payload.userId)
      .eq('status', 'completed');

    const uniqueTopics = new Set((tasks || []).map(t => t.topic).filter(Boolean));
    const topicsCovered = uniqueTopics.size;

    const { data: projects } = await supabase
      .from('project_progress')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('status', 'completed');

    const projectsDone = projects?.length || 0;

    const { data: tests } = await supabase
      .from('tests')
      .select('id, score')
      .eq('user_id', payload.userId);

    const testsTaken = tests?.length || 0;
    const avgTestScore = testsTaken > 0
      ? Math.round((tests || []).reduce((a, t) => a + (t.score || 0), 0) / testsTaken)
      : 0;

    const milestone = currentDay >= 30 ? 30 : currentDay >= 15 ? 15 : currentDay;
    const isEligible = currentDay >= 15;

    return successResponse({
      name: user?.name,
      college: user?.college,
      domain: user?.domain_slug,
      joinedAt: user?.created_at,
      currentDay,
      currentScore,
      day1Score,
      scoreImprovement,
      improvementPercent,
      currentRank: rank,
      percentile,
      totalStudents: total,
      streak: progress?.streak || 0,
      topicsCovered,
      projectsDone,
      testsTaken,
      avgTestScore,
      milestone,
      isEligible,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
