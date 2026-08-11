import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getStreakDay, getStreakDayStart } from '@/lib/streak';

const CALENDAR_DAYS = 30;
// A mentor-only day counts as activity at the SAME threshold the chatbot uses to
// bump the streak (app/api/chatbot/message/route.js): 3 messages in a streak-day.
// Anything lower would light up days progress.streak never counted.
const MENTOR_MESSAGES_FOR_ACTIVE_DAY = 3;

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
    // Two real sources, both bucketed by streak-day (5AM IST reset, lib/streak),
    // so the grid, the /analytics activity chart and progress.streak agree:
    //   tasks.completed_at  → completions (same definition as analytics/insights)
    //   chat_history        → a mentor day, but only at the 3-message threshold
    //                         the chatbot itself uses to bump the streak
    // Neither present in the window → [] , so the dashboard renders its empty
    // state rather than 30 grey squares dressed up as data.
    const todayStr = getStreakDay();
    const today = new Date(todayStr + 'T00:00:00Z');
    const windowStart = getStreakDayStart(
      new Date(today.getTime() - (CALENDAR_DAYS - 1) * 86400000).toISOString().slice(0, 10)
    );

    const [
      { data: recentTasks, error: tasksError },
      { data: recentChats, error: chatError },
    ] = await Promise.all([
      supabase.from('tasks').select('completed_at')
        .eq('user_id', payload.userId)
        .eq('status', 'completed')
        .gte('completed_at', windowStart.toISOString())
        .limit(500),
      // Descending + capped: if a very chatty month exceeds the cap, the recent
      // days (the ones a user actually looks at) stay accurate.
      supabase.from('chat_history').select('created_at')
        .eq('user_id', payload.userId)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);

    // A missing column/table degrades that source to nothing, never a 500.
    if (tasksError) console.warn('[progress/full] task calendar unavailable:', tasksError.message);
    if (chatError) console.warn('[progress/full] mentor calendar unavailable:', chatError.message);

    const countsByDay = new Map();
    for (const t of recentTasks || []) {
      if (!t.completed_at) continue;
      const day = getStreakDay(new Date(t.completed_at));
      countsByDay.set(day, (countsByDay.get(day) || 0) + 1);
    }

    const messagesByDay = new Map();
    for (const c of recentChats || []) {
      if (!c.created_at) continue;
      const day = getStreakDay(new Date(c.created_at));
      messagesByDay.set(day, (messagesByDay.get(day) || 0) + 1);
    }

    const mentorDays = new Set(
      [...messagesByDay.entries()]
        .filter(([, n]) => n >= MENTOR_MESSAGES_FOR_ACTIVE_DAY)
        .map(([day]) => day)
    );

    const hasActivity = countsByDay.size > 0 || mentorDays.size > 0;
    const calendarData = !hasActivity ? [] : Array.from({ length: CALENDAR_DAYS }, (_, i) => {
      const date = new Date(today.getTime() - (CALENDAR_DAYS - 1 - i) * 86400000).toISOString().slice(0, 10);
      const count = countsByDay.get(date) || 0;
      const mentor = mentorDays.has(date);
      return {
        date,
        count,
        mentorMessages: messagesByDay.get(date) || 0,
        mentor,
        done: count > 0 || mentor,
        isToday: date === todayStr,
      };
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
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
