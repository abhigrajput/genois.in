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
      { data: score },
      { data: progress },
      { data: skill },
      { data: trial },
    ] = await Promise.all([
      supabase.from('users').select('name,email,domain_slug,level,plan,college,trial_end').eq('id', payload.userId).single(),
      supabase.from('scores').select('*').eq('user_id', payload.userId).single(),
      supabase.from('progress').select('*').eq('user_id', payload.userId).single(),
      supabase.from('skill_identity').select('*').eq('user_id', payload.userId).single(),
      supabase.from('trials').select('*').eq('user_id', payload.userId).single(),
    ]);

    const currentDay = progress?.current_day || 1;
    const { data: todayTasks } = await supabase
      .from('tasks').select('type,status,score')
      .eq('user_id', payload.userId).eq('day_number', currentDay);

    const now = new Date();
    const trialEnd = trial?.end_date ? new Date(trial.end_date) : null;
    const daysLeft = trialEnd
      ? Math.max(0, Math.ceil((trialEnd - now) / 86400000))
      : 0;

    const { data: recentEvents } = await supabase
      .from('score_events').select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false }).limit(5);

    return successResponse({
      user,
      score: score || {},
      progress: {
        currentDay: progress?.current_day || 1,
        currentWeek: progress?.current_week || 1,
        streak: progress?.streak || 0,
        progressPercent: Math.round(progress?.progress_percent || 0),
      },
      skill: {
        skillLevel: skill?.skill_level || 'beginner',
        jobReadyScore: Math.round(skill?.job_ready_score || 0),
        progressPercent: Math.round(skill?.progress_percent || 0),
      },
      today: {
        tasks: todayTasks || [],
        tasksCompleted: (todayTasks || []).filter(t => t.status === 'completed').length,
        totalTasks: 6,
        allDone: (todayTasks || []).filter(t => t.status === 'completed').length === 6,
      },
      trial: {
        plan: user?.plan,
        daysLeft,
        trialEnd: trial?.end_date,
        isExpired: trialEnd ? now > trialEnd : false,
      },
      recentActivity: recentEvents || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
