// Alias: /api/progress → /api/progress/full
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const [
      { data: progress },
      { data: score },
      { data: skill },
    ] = await Promise.all([
      supabase.from('progress').select('*').eq('user_id', payload.userId).maybeSingle(),
      supabase.from('scores').select('*').eq('user_id', payload.userId).maybeSingle(),
      supabase.from('skill_identity').select('*').eq('user_id', payload.userId).maybeSingle(),
    ]);

    const currentDay = progress?.current_day || 1;
    const currentWeek = progress?.current_week || 1;
    const weekStart = (currentWeek - 1) * 7 + 1;
    const weekEnd = currentWeek * 7;

    const { data: weekTasks } = await supabase
      .from('tasks').select('day_number, status')
      .eq('user_id', payload.userId)
      .gte('day_number', weekStart)
      .lte('day_number', weekEnd)
      .eq('status', 'completed');

    const uniqueCompletedDaysThisWeek = new Set(
      (weekTasks || []).map(t => t.day_number)
    ).size;

    return successResponse({
      dayProgress: {
        currentDay,
        dayPercent: progress?.day_progress || 0,
      },
      weekProgress: {
        currentWeek,
        daysCompletedThisWeek: uniqueCompletedDaysThisWeek,
        totalDaysInWeek: 7,
        weekScore: progress?.weekly_score || 0,
      },
      monthProgress: {
        currentMonth: progress?.current_month || 1,
        monthScore: progress?.monthly_score || 0,
      },
      domainProgress: Math.round(progress?.domain_progress || 0),
      overallProgress: Math.round(progress?.progress_percent || 0),
      streak: progress?.streak || 0,
      tasksCompletedToday: progress?.tasks_completed_today || 0,
      lastCompletedDate: progress?.last_completed_date || null,
      score: score || {},
      skillLevel: skill?.skill_level || 'beginner',
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
