import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getStreakDay, getStreakDayStart } from '@/lib/streak';

const CALENDAR_DAYS = 30;

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
      supabase.from('progress').select('*').eq('user_id', payload.userId).single(),
      supabase.from('scores').select('*').eq('user_id', payload.userId).single(),
      supabase.from('skill_identity').select('*').eq('user_id', payload.userId).single(),
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

    // ── 30-day activity calendar for the dashboard streak grid ───────────────
    // Same definition of "a day of activity" as /api/analytics/insights: real
    // task completions bucketed by streak-day (5AM IST reset, via lib/streak),
    // so the grid, the /analytics activity chart and progress.streak all agree.
    // A user with no completions gets [] — the dashboard then renders its empty
    // state rather than 30 grey squares dressed up as data.
    const todayStr = getStreakDay();
    const today = new Date(todayStr + 'T00:00:00Z');
    const windowStart = getStreakDayStart(
      new Date(today.getTime() - (CALENDAR_DAYS - 1) * 86400000).toISOString().slice(0, 10)
    );

    const { data: recentTasks, error: calendarError } = await supabase
      .from('tasks').select('completed_at')
      .eq('user_id', payload.userId)
      .eq('status', 'completed')
      .gte('completed_at', windowStart.toISOString())
      .limit(500);

    // A missing column/table degrades to the empty state, never a 500.
    if (calendarError) console.warn('[progress/full] calendar unavailable:', calendarError.message);

    const countsByDay = new Map();
    for (const t of recentTasks || []) {
      if (!t.completed_at) continue;
      const day = getStreakDay(new Date(t.completed_at));
      countsByDay.set(day, (countsByDay.get(day) || 0) + 1);
    }

    const calendarData = countsByDay.size === 0 ? [] : Array.from({ length: CALENDAR_DAYS }, (_, i) => {
      const date = new Date(today.getTime() - (CALENDAR_DAYS - 1 - i) * 86400000).toISOString().slice(0, 10);
      const count = countsByDay.get(date) || 0;
      return { date, count, done: count > 0, isToday: date === todayStr };
    });

    return successResponse({
      calendarData,
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
      score: score || {},
      skillLevel: skill?.skill_level || 'beginner',
      jobReadyScore: Math.round(skill?.job_ready_score || 0),
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
