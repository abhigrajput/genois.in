import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const userId = payload.userId;

    const ops = [
      'scores.update', 'progress.update', 'skill_identity.update',
      'tasks.delete', 'tests.delete', 'score_events.delete',
      'weak_topics.delete', 'strong_topics.delete',
    ];
    const results = await Promise.all([
      supabase.from('scores').update({
        total_score: 0, domain_score: 0, task_score: 0,
        test_score: 0, coding_score: 0, project_score: 0, streak_score: 0,
      }).eq('user_id', userId),
      supabase.from('progress').update({
        current_day: 1, current_week: 1, current_month: 1,
        streak: 0, progress_percent: 0, day_progress: 0,
        week_progress: 0, month_progress: 0, weekly_score: 0, monthly_score: 0,
      }).eq('user_id', userId),
      supabase.from('skill_identity').update({
        skill_level: 'beginner', progress_percent: 0, job_ready_score: 0,
      }).eq('user_id', userId),
      supabase.from('tasks').delete().eq('user_id', userId),
      supabase.from('tests').delete().eq('user_id', userId),
      supabase.from('score_events').delete().eq('user_id', userId),
      supabase.from('weak_topics').delete().eq('user_id', userId),
      supabase.from('strong_topics').delete().eq('user_id', userId),
    ]);
    results.forEach((res, i) => logWriteError('auth/reset-progress', ops[i], res?.error));

    return successResponse({}, 'Progress reset successfully');
  } catch (error) {
    console.error('auth/reset-progress error:', error);
    return errorResponse('Internal server error', 500);
  }
}
