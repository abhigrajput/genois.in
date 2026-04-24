import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'global';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const supabase = getAdminClient();

    // Get top students by total_score
    const { data: scores, error } = await supabase
      .from('scores')
      .select('user_id, total_score, domain_score')
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error) return errorResponse(error.message, 500);

    // Get user info for each score
    const userIds = (scores || []).map(s => s.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, level, weekly_badge')
      .in('id', userIds);

    const { data: progresses } = await supabase
      .from('progress')
      .select('user_id, streak, current_day')
      .in('user_id', userIds);

    const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));
    const progressMap = Object.fromEntries((progresses || []).map(p => [p.user_id, p]));

    const leaderboard = (scores || []).map((s, idx) => {
      const user = userMap[s.user_id] || {};
      const prog = progressMap[s.user_id] || {};
      return {
        rank: idx + 1,
        userId: s.user_id,
        name: user.name || 'Anonymous',
        domainSlug: user.domain_slug || '',
        totalScore: s.total_score || 0,
        streak: prog.streak || 0,
        currentDay: prog.current_day || 1,
        weeklyBadge: user.weekly_badge || null,
      };
    });

    // Find current user's rank
    let myRank = null;
    if (payload.userId) {
      const myIndex = leaderboard.findIndex(e => e.userId === payload.userId);
      myRank = myIndex >= 0 ? myIndex + 1 : null;
    }

    return successResponse({ leaderboard, myRank, type, total: leaderboard.length });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
