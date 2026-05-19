import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    const supabase = getAdminClient();
    const now = new Date().toISOString();

    let query = supabase
      .from('user_badges')
      .select('id, domain, score, level, status, earned_at, expires_at')
      .eq('user_id', payload.userId);

    if (domain) query = query.eq('domain', domain);

    const { data: badges, error } = await query.order('earned_at', { ascending: false });
    if (error) throw error;

    // Auto-expire badges
    const expiredIds = (badges || [])
      .filter(b => b.status === 'active' && new Date(b.expires_at) < new Date())
      .map(b => b.id);

    if (expiredIds.length > 0) {
      await supabase.from('user_badges').update({ status: 'inactive' }).in('id', expiredIds);
    }

    // Also fetch cooldowns
    const { data: cooldowns } = await supabase
      .from('badge_cooldowns')
      .select('domain, unlocks_at')
      .eq('user_id', payload.userId)
      .gt('unlocks_at', now);

    const cooldownMap = (cooldowns || []).reduce((acc, c) => {
      acc[c.domain] = c.unlocks_at;
      return acc;
    }, {});

    const enriched = (badges || []).map(b => {
      const isExpired = expiredIds.includes(b.id) || new Date(b.expires_at) < new Date();
      const daysLeft = isExpired ? 0 : Math.ceil((new Date(b.expires_at) - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        ...b,
        status: isExpired ? 'inactive' : b.status,
        daysLeft,
        cooldownUntil: cooldownMap[b.domain] || null,
      };
    });

    return successResponse({ badges: enriched, cooldowns: cooldownMap });
  } catch (error) {
    console.error('[badge/status] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
