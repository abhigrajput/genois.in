import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

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
      .select('id, name, college, domain_slug, total_score, current_day, streak')
      .order('total_score', { ascending: false })
      .limit(100);

    if (error) return errorResponse(error.message, 500);

    const leaderboard = (users || []).map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      college: u.college,
      domain: u.domain_slug,
      score: u.total_score || 0,
      day: u.current_day || 0,
      streak: u.streak || 0,
    }));

    const result = { leaderboard, total: leaderboard.length };
    
    cachedLeaderboard = result;
    cacheExpiresAt = now + CACHE_TTL;

    return successResponse(result);
  } catch (error) {
    if (cachedLeaderboard) return successResponse(cachedLeaderboard);
    return errorResponse(error.message, 500);
  }
}
