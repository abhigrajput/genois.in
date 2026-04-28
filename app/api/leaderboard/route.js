import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedLeaderboard = null;
let cacheExpiresAt = 0;
const CACHE_TTL = 60 * 1000;

export async function GET(request) {
  try {
    const now = Date.now();
    if (cachedLeaderboard && now < cacheExpiresAt) {
      return successResponse(cachedLeaderboard);
    }

    const supabase = getAdminClient();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, subscription_plan, created_at')
      .not('name', 'is', null)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error('Leaderboard query error:', error);
      if (cachedLeaderboard) return successResponse(cachedLeaderboard);
      return errorResponse('Failed to load leaderboard: ' + error.message, 500);
    }

    const leaderboard = (users || []).map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name || 'Anonymous',
      college: u.college || 'Not set',
      domain: u.domain_slug || 'general',
      score: 0,
      day: 0,
      streak: 0,
      plan: u.subscription_plan || 'spectator',
    }));

    const result = { leaderboard, total: leaderboard.length, updatedAt: new Date().toISOString() };
    
    cachedLeaderboard = result;
    cacheExpiresAt = now + CACHE_TTL;

    return successResponse(result);
  } catch (error) {
    console.error('Leaderboard exception:', error);
    if (cachedLeaderboard) return successResponse(cachedLeaderboard);
    return errorResponse(error.message || 'Leaderboard failed', 500);
  }
}
