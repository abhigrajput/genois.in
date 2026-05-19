import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function isAdmin(userId, supabase) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    if (!user) return false;
    
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();
    return !!admin;
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    
    const supabase = getAdminClient();
    const adminCheck = await isAdmin(payload.userId, supabase);
    if (!adminCheck) return errorResponse('Forbidden - Admin access required', 403);

    const [usersRes, scoresRes, progressRes, paymentsRes, aptitudeRes, interviewRes, cacheRes] = await Promise.all([
      supabase.from('users').select('id, name, email, college, year, domain_slug, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, created_at, password_hash').order('created_at', { ascending: false }).then(r => r).catch(() => ({ data: [] })),
      supabase.from('scores').select('user_id, total_score').then(r => r).catch(() => ({ data: [] })),
      supabase.from('progress').select('user_id, current_day, streak, last_active_date').then(r => r).catch(() => ({ data: [] })),
      supabase.from('payments').select('user_id, amount, plan, created_at').order('created_at', { ascending: false }).then(r => r).catch(() => ({ data: [] })),
      supabase.from('aptitude_sessions').select('id').then(r => r).catch(() => ({ data: [] })),
      supabase.from('interview_sessions').select('id').then(r => r).catch(() => ({ data: [] })),
      supabase.from('ai_cache').select('cache_key, hits, expires_at').order('hits', { ascending: false }).limit(20).then(r => r).catch(() => ({ data: [] })),
    ]);

    const users = usersRes.data || [];
    const scores = scoresRes.data || [];
    const progress = progressRes.data || [];
    const payments = paymentsRes.data || [];

    const scoresMap = {};
    scores.forEach(s => { scoresMap[s.user_id] = s.total_score || 0; });

    const progressMap = {};
    progress.forEach(p => { 
      progressMap[p.user_id] = { 
        day: p.current_day || 0, 
        streak: p.streak || 0,
        lastActive: p.last_active_date,
      }; 
    });

    const enrichedUsers = users.map(u => {
      const trialDaysLeft = u.trial_ends_at 
        ? Math.max(0, Math.ceil((new Date(u.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))) 
        : 0;
      const userProgress = progressMap[u.id] || {};
      const lastActiveDays = userProgress.lastActive 
        ? Math.floor((new Date() - new Date(userProgress.lastActive)) / (1000 * 60 * 60 * 24)) 
        : null;
      
      return {
        id: u.id,
        name: u.name || 'Unnamed',
        email: u.email,
        college: u.college || '-',
        year: u.year || '-',
        domain: u.domain_slug || '-',
        score: scoresMap[u.id] || 0,
        day: userProgress.day || 0,
        streak: userProgress.streak || 0,
        plan: u.subscription_plan || 'spectator',
        isOnTrial: u.is_on_trial || false,
        trialDaysLeft,
        lastActiveDays,
        joined: u.created_at,
        passwordHashPreview: u.password_hash ? u.password_hash.substring(0, 20) + '...' : 'none',
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const activeToday = enrichedUsers.filter(u => 
      u.lastActiveDays !== null && u.lastActiveDays === 0
    ).length;
    
    const newThisWeek = enrichedUsers.filter(u => 
      new Date(u.joined) >= weekAgo
    ).length;
    
    const activeStreaks = enrichedUsers.filter(u => u.streak > 0).length;
    
    const totalScore = enrichedUsers.reduce((s, u) => s + u.score, 0);
    const avgScore = enrichedUsers.length ? Math.round(totalScore / enrichedUsers.length) : 0;
    
    const monthRevenue = payments
      .filter(p => new Date(p.created_at) >= monthAgo)
      .reduce((s, p) => s + (p.amount || 0), 0);

    const planBreakdown = {};
    enrichedUsers.forEach(u => {
      planBreakdown[u.plan] = (planBreakdown[u.plan] || 0) + 1;
    });

    const domainBreakdown = {};
    enrichedUsers.forEach(u => {
      if (u.domain && u.domain !== '-') {
        domainBreakdown[u.domain] = (domainBreakdown[u.domain] || 0) + 1;
      }
    });

    const topStudents = [...enrichedUsers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const inactiveUsers = enrichedUsers.filter(u => 
      u.lastActiveDays !== null && u.lastActiveDays > 7
    );

    const recentSignups = enrichedUsers.slice(0, 10);

    const cacheData = cacheRes.data || [];

    return successResponse({
      stats: {
        totalUsers: enrichedUsers.length,
        activeToday,
        newThisWeek,
        activeStreaks,
        avgScore,
        monthRevenue,
        aptitudeSessions: aptitudeRes.data?.length || 0,
        interviewSessions: interviewRes.data?.length || 0,
      },
      allUsers: enrichedUsers,
      topStudents,
      inactiveUsers,
      recentSignups,
      planBreakdown,
      domainBreakdown,
      payments: payments.slice(0, 50),
      cacheStats: {
        totalCached: cacheData.length,
        totalHits: cacheData.reduce((s, c) => s + (c.hits || 0), 0),
        topCached: cacheData.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return errorResponse('Internal server error', 500);
  }
}
