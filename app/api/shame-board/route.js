import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1 query: progress rows that have been inactive for 3+ days
    const { data: staleProgress } = await supabase
      .from('progress')
      .select('user_id, current_day, streak, last_active_date')
      .not('last_active_date', 'is', null)
      .lt('last_active_date', threeDaysAgo);

    const userIds = (staleProgress || []).map(p => p.user_id);

    // 2 batched lookups for the matching users and their scores
    const [{ data: users }, { data: scores }] = await Promise.all([
      supabase.from('users').select('id, name, college, domain_slug, created_at').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']).not('name', 'is', null),
      supabase.from('scores').select('user_id, total_score').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
    ]);

    const userMap = {};
    for (const u of (users || [])) userMap[u.id] = u;
    const scoreMap = {};
    for (const s of (scores || [])) scoreMap[s.user_id] = s.total_score;

    const results = [];
    for (const progress of (staleProgress || [])) {
      const user = userMap[progress.user_id];
      if (!user) continue; // skips users with null name
      const lastActiveDate = new Date(progress.last_active_date);
      const daysSinceActive = Math.floor((Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24));

      results.push({
        name: user.name,
        college: user.college || 'Unknown College',
        domain: user.domain_slug,
        currentDay: progress.current_day || 1,
        streak: progress.streak || 0,
        score: scoreMap[progress.user_id] || 0,
        lastActive: progress.last_active_date,
        daysSinceActive,
        joinedAt: user.created_at,
      });
    }

    results.sort((a, b) => b.daysSinceActive - a.daysSinceActive);

    return successResponse({ students: results.slice(0, 50), total: results.length });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
