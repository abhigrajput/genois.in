import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, college, domain_slug, plan, trial_end, created_at, level, weekly_badge')
      .order('created_at', { ascending: false });

    const { data: progress } = await supabase
      .from('progress')
      .select('user_id, current_day, streak, progress_percent, last_active_date, tasks_completed_today');

    const { data: scores } = await supabase
      .from('scores')
      .select('user_id, total_score');

    const progressMap = {};
    (progress || []).forEach(p => { progressMap[p.user_id] = p; });

    const scoreMap = {};
    (scores || []).forEach(s => { scoreMap[s.user_id] = s; });

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const enriched = (users || []).map(u => {
      const p = progressMap[u.id] || {};
      const s = scoreMap[u.id] || {};
      const lastActive = p.last_active_date ? p.last_active_date.split('T')[0] : null;
      const isActiveToday = lastActive === today;
      const isInactive = lastActive && lastActive < sevenDaysAgo;
      const trialEnd = u.trial_end ? new Date(u.trial_end) : null;
      const trialDaysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : null;
      const isTrialExpiring = trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft > 0;
      const isTrialExpired = trialDaysLeft !== null && trialDaysLeft <= 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        college: u.college,
        domain: u.domain_slug,
        plan: u.plan,
        level: u.level,
        joinedAt: u.created_at,
        currentDay: p.current_day || 1,
        streak: p.streak || 0,
        progressPercent: Math.round(p.progress_percent || 0),
        totalScore: s.total_score || 0,
        lastActive: lastActive,
        isActiveToday,
        isInactive,
        tasksToday: p.tasks_completed_today || 0,
        trialDaysLeft,
        isTrialExpiring,
        isTrialExpired,
        weeklyBadge: u.weekly_badge || null,
      };
    });

    const totalUsers = enriched.length;
    const activeToday = enriched.filter(u => u.isActiveToday).length;
    const inactiveUsers = enriched.filter(u => u.isInactive).length;
    const trialUsers = enriched.filter(u => u.plan === 'trial' || u.plan === 'free').length;
    const paidUsers = enriched.filter(u => u.plan !== 'trial' && u.plan !== 'free').length;
    const expiringTrials = enriched.filter(u => u.isTrialExpiring).length;

    return successResponse({
      stats: { totalUsers, activeToday, inactiveUsers, trialUsers, paidUsers, expiringTrials },
      users: enriched,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
