import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { data: allUsers },
      { data: recentUsers },
      { data: scores },
      { data: progress },
      { data: aptitudeSessions },
      { data: interviewSessions },
      { data: payments },
      { data: subscriptions },
      { data: cacheData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).then(r => r).catch(() => ({ data: [] })),
      supabase.from('users').select('id, name, email, college, year, domain_slug, total_score, current_day, streak, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, last_active_date, created_at, password_hash').order('created_at', { ascending: false }).limit(200).then(r => r).catch(() => ({ data: [] })),
      supabase.from('users').select('id, name, email, created_at').gte('created_at', weekAgo).order('created_at', { ascending: false }).then(r => r).catch(() => ({ data: [] })),
      supabase.from('scores').select('user_id, total_score').order('total_score', { ascending: false }).then(r => r).catch(() => ({ data: [] })),
      supabase.from('progress').select('user_id, current_day, streak, last_active_date').then(r => r).catch(() => ({ data: [] })),
      supabase.from('aptitude_sessions').select('user_id, score, completed, created_at').gte('created_at', monthAgo).then(r => r).catch(() => ({ data: [] })),
      supabase.from('interview_sessions').select('user_id, overall_score, verdict, completed, started_at').gte('started_at', monthAgo).then(r => r).catch(() => ({ data: [] })),
      supabase.from('payments').select('user_id, amount, plan, created_at').gte('created_at', monthAgo).order('created_at', { ascending: false }).limit(50).then(r => r).catch(() => ({ data: [] })),
      supabase.from('subscriptions').select('user_id, plan, status, amount, end_date, updated_at').order('updated_at', { ascending: false }).limit(50).then(r => r).catch(() => ({ data: [] })),
      supabase.from('ai_cache').select('cache_key, hits, expires_at').order('hits', { ascending: false }).limit(20).then(r => r).catch(() => ({ data: [] })),
    ]);

    const todayUsers = (allUsers || []).filter(u =>
      u.last_login_at && u.last_login_at.startsWith(today)
    );

    const planBreakdown = (allUsers || []).reduce((acc, u) => {
      const plan = u.subscription_plan || u.plan || 'spectator';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    const domainBreakdown = (allUsers || []).reduce((acc, u) => {
      const d = u.domain_slug || 'unknown';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    const avgScore = scores?.length
      ? Math.round(scores.reduce((s, r) => s + (r.total_score || 0), 0) / scores.length)
      : 0;

    const activeStreaks = (progress || []).filter(p => p.streak > 0).length;

    const totalRevenue = (subscriptions || [])
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const usersWithProgress = (allUsers || []).map(u => {
      const userScore = (scores || []).find(s => s.user_id === u.id);
      const userProgress = (progress || []).find(p => p.user_id === u.id);
      const trialDaysLeft = u.trial_ends_at ? Math.max(0, Math.ceil((new Date(u.trial_ends_at) - new Date()) / (1000*60*60*24))) : 0;
      const lastActive = u.last_active_date ? Math.floor((new Date() - new Date(u.last_active_date)) / (1000*60*60*24)) : null;
      return {
        id: u.id,
        name: u.name || 'Unnamed',
        email: u.email,
        college: u.college || '-',
        year: u.year || '-',
        domain: u.domain_slug || '-',
        score: userScore?.total_score || u.total_score || 0,
        day: userProgress?.current_day || u.current_day || 0,
        streak: userProgress?.streak || u.streak || 0,
        plan: u.subscription_plan || 'spectator',
        isOnTrial: u.is_on_trial,
        trialDaysLeft,
        lastActiveDays: lastActive,
        joined: u.created_at,
        passwordHashPreview: u.password_hash ? u.password_hash.substring(0, 20) + '...' : 'none',
      };
    });

    return successResponse({
      overview: {
        totalUsers: totalUsers || 0,
        activeToday: todayUsers.length,
        newThisWeek: recentUsers?.length || 0,
        avgScore,
        activeStreaks,
        totalRevenue,
        aptitudeAttempts: aptitudeSessions?.length || 0,
        interviewAttempts: interviewSessions?.length || 0,
      },
      cacheStats: {
        totalCached: cacheData?.length || 0,
        totalHits: cacheData?.reduce((s, c) => s + (c.hits || 0), 0) || 0,
        topCached: cacheData?.slice(0, 5) || [],
      },
      planBreakdown,
      domainBreakdown,
      recentUsers: recentUsers || [],
      recentPayments: subscriptions || [],
      topStudents: usersWithProgress.sort((a, b) => b.score - a.score).slice(0, 20),
      inactiveUsers: usersWithProgress.filter(u => {
        if (!u.lastActive) return true;
        const daysSince = Math.floor((Date.now() - new Date(u.lastActive)) / 86400000);
        return daysSince > 7;
      }).slice(0, 30),
      allUsers: usersWithProgress,
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return errorResponse(error.message, 500);
  }
}
