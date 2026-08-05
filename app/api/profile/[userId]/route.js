import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/profile/[userId] — the signed-in student's own private profile.
 *
 * The [userId] segment is addressing only, never authority. Being logged in was
 * previously enough to read ANY id in this table, which handed every account the
 * whole cohort's weak topics, readiness and 30-day activity graph by walking
 * uuids. The id in the path must therefore match the id in the verified
 * genois_token, and the token is the only thing that decides whose rows load.
 *
 * Sharing a profile publicly is a different feature with a different, curated
 * shape: /api/public/profile/[username], which deliberately omits weak topics
 * and the activity graph. Nothing here is a substitute for it.
 */
export async function GET(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { userId } = await context.params;

    // 404, not 403: a mismatch must not confirm that the requested id exists.
    if (userId !== payload.userId) return errorResponse('User not found', 404);

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, college, year, domain_slug, level, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) return errorResponse('User not found', 404);

    const [
      { data: score },
      { data: progress },
      { data: skill },
      { data: strongTopics },
      { data: weakTopics },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('scores').select('total_score').eq('user_id', userId).single(),
      supabase.from('progress').select('current_day, streak, progress_percent').eq('user_id', userId).single(),
      supabase.from('skill_identity').select('skill_level, job_ready_score').eq('user_id', userId).single(),
      supabase.from('strong_topics').select('topic, avg_score').eq('user_id', userId).order('avg_score', { ascending: false }).limit(5),
      supabase.from('weak_topics').select('topic, avg_score').eq('user_id', userId).order('avg_score', { ascending: true }).limit(5),
      supabase.from('analytics').select('date, daily_score, tasks_completed').eq('user_id', userId).order('date', { ascending: false }).limit(30),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });

    const myScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1;
    const total = allScores?.length || 1;
    const percentile = Math.round(((total - rank) / total) * 100);
    const isJobReady = (skill?.job_ready_score || 0) >= 70;

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        college: user.college,
        year: user.year,
        domain: user.domain_slug,
        level: user.level,
        joinedAt: user.created_at,
      },
      stats: {
        totalScore: myScore,
        rank,
        percentile,
        currentDay: progress?.current_day || 1,
        streak: progress?.streak || 0,
        progressPercent: Math.round(progress?.progress_percent || 0),
        skillLevel: skill?.skill_level || 'beginner',
        jobReadyScore: Math.round(skill?.job_ready_score || 0),
        isJobReady,
      },
      strongTopics: strongTopics || [],
      weakTopics: weakTopics || [],
      activityGraph: recentActivity || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
