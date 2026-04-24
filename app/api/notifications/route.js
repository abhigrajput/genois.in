import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    const [
      { data: progress },
      { data: score },
      { data: user },
    ] = await Promise.all([
      supabase.from('progress').select('current_day, streak, tasks_completed_today, last_completed_date').eq('user_id', payload.userId).single(),
      supabase.from('scores').select('total_score').eq('user_id', payload.userId).single(),
      supabase.from('users').select('name, domain_slug, trial_end').eq('id', payload.userId).single(),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });

    const myScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1 || 1;
    const tasksToday = progress?.tasks_completed_today || 0;
    const streak = progress?.streak || 0;
    const currentDay = progress?.current_day || 1;
    const lastCompleted = progress?.last_completed_date;
    const completedToday = tasksToday >= 5 && lastCompleted === todayStr;
    const partialToday = tasksToday > 0 && tasksToday < 5;

    const trialEnd = user?.trial_end ? new Date(user.trial_end) : null;
    const trialDaysLeft = trialEnd ? Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24)) : null;

    const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
    const daysUntilFirst = dateOfMonth === 1 ? 0 : new Date(today.getFullYear(), today.getMonth() + 1, 1).getDate() - dateOfMonth;

    const notifications = [];

    // Daily progress notification
    if (completedToday) {
      notifications.push({
        id: 'daily_done',
        message: `✅ Day ${currentDay} complete! All 5 tasks done. Score: ${myScore} pts. Come back tomorrow.`,
        time: 'Today',
        read: true,
        type: 'success',
      });
    } else if (partialToday) {
      notifications.push({
        id: 'daily_partial',
        message: `⏳ Day ${currentDay} in progress. ${tasksToday}/5 tasks done. Complete all 5 to advance to Day ${currentDay + 1}.`,
        time: 'Today',
        read: false,
        type: 'reminder',
      });
    } else {
      notifications.push({
        id: 'daily_test',
        message: `🎯 Day ${currentDay} is waiting. 0/5 tasks done today. Complete them to keep your streak alive.`,
        time: 'Today',
        read: false,
        type: 'reminder',
      });
    }

    // Rank notification
    notifications.push({
      id: 'rank',
      message: `🏆 Your current rank is #${rank}. Score: ${myScore} pts. Complete today's tasks to climb higher.`,
      time: 'Updated daily',
      read: false,
      type: 'rank',
    });

    // Streak notification
    if (streak > 0) {
      notifications.push({
        id: 'streak',
        message: `🔥 ${streak} day streak! ${completedToday ? 'Great work today.' : 'Do not break it — complete today\'s tasks now.'}`,
        time: 'Ongoing',
        read: completedToday,
        type: 'streak',
      });
    }

    // Weekly test notification
    if (dayOfWeek === 1) {
      notifications.push({
        id: 'weekly_test',
        message: `📅 Weekly test is LIVE today only! 10 questions. Available until midnight tonight.`,
        time: 'Today — Monday only',
        read: false,
        type: 'test',
      });
    } else {
      notifications.push({
        id: 'weekly_upcoming',
        message: `📅 Weekly test in ${daysUntilMonday} day${daysUntilMonday > 1 ? 's' : ''}. Prepare by completing daily tests.`,
        time: `${daysUntilMonday} days away`,
        read: true,
        type: 'test',
      });
    }

    // Monthly test notification
    if (dateOfMonth === 1) {
      notifications.push({
        id: 'monthly_test',
        message: `🏆 Monthly test is LIVE today only! 20 questions. This happens only once a month.`,
        time: 'Today — 1st only',
        read: false,
        type: 'test',
      });
    } else {
      notifications.push({
        id: 'monthly_upcoming',
        message: `🗓️ Monthly test in ${daysUntilFirst} days on the 1st. Keep grinding daily.`,
        time: `${daysUntilFirst} days away`,
        read: true,
        type: 'test',
      });
    }

    // Trial expiry notification
    if (trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft > 0) {
      notifications.push({
        id: 'trial_expiry',
        message: `⚠️ Your free trial expires in ${trialDaysLeft} day${trialDaysLeft > 1 ? 's' : ''}. Upgrade now to keep your streak and rank.`,
        time: `${trialDaysLeft} days left`,
        read: false,
        type: 'warning',
      });
    }

    // Domain mastery reminder
    const daysLeft = Math.max(0, 365 - currentDay);
    notifications.push({
      id: 'mastery',
      message: `⚡ ${daysLeft} days left until you master ${user?.domain_slug?.toUpperCase()}. Day ${currentDay} of 365.`,
      time: 'Domain progress',
      read: true,
      type: 'info',
    });

    return successResponse({ notifications });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
