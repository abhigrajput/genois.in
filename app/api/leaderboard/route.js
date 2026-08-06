import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedLeaderboard = null;
let cacheExpiresAt = 0;
const CACHE_TTL = 60 * 1000;

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`leaderboard_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const now = Date.now();
    if (cachedLeaderboard && now < cacheExpiresAt) {
      return successResponse(cachedLeaderboard);
    }

    const supabase = getAdminClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, subscription_plan, total_score')
      .not('name', 'is', null)
      .order('total_score', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      // The Postgres error text names tables, columns and constraints. It goes to
      // the server log; the client gets nothing it could map the schema from.
      console.error('Leaderboard query error:', error);
      if (cachedLeaderboard) return successResponse(cachedLeaderboard);
      return errorResponse('Something went wrong, please retry.', 500);
    }

    // Batch-fetch progress (day/streak) for the ranked users in a single query
    const ids = (users || []).map(u => u.id);
    const progressMap = {};
    if (ids.length) {
      const { data: progressRows } = await supabase
        .from('progress')
        .select('user_id, current_day, streak')
        .in('user_id', ids);
      for (const p of (progressRows || [])) progressMap[p.user_id] = p;
    }

    const leaderboard = (users || []).map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name || 'Anonymous',
      college: u.college || 'Not set',
      domain: u.domain_slug || 'general',
      score: u.total_score || 0,
      day: progressMap[u.id]?.current_day || 0,
      streak: progressMap[u.id]?.streak || 0,
      plan: u.subscription_plan || 'spectator',
    }));

    const result = { leaderboard, total: leaderboard.length, updatedAt: new Date().toISOString() };
    
    cachedLeaderboard = result;
    cacheExpiresAt = now + CACHE_TTL;

    return successResponse(result);
  } catch (error) {
    console.error('Leaderboard exception:', error);
    if (cachedLeaderboard) return successResponse(cachedLeaderboard);
    return errorResponse('Internal server error', 500);
  }
}
