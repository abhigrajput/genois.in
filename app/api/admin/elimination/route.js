import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    // Get all users with their scores
    const { data: scores } = await supabase
      .from('scores')
      .select('user_id, total_score')
      .order('total_score', { ascending: false });

    if (!scores || scores.length === 0) {
      return errorResponse('No users found', 404);
    }

    const total = scores.length;
    const top10Cutoff = Math.ceil(total * 0.1);
    const bottom30Cutoff = Math.floor(total * 0.7);

    const now = new Date().toISOString();
    let hireReady = 0;
    let notReady = 0;
    let cleared = 0;

    for (let i = 0; i < scores.length; i++) {
      const { user_id } = scores[i];
      let badge = null;

      if (i < top10Cutoff) {
        badge = 'hire_ready';
        hireReady++;
      } else if (i >= bottom30Cutoff) {
        badge = 'not_ready';
        notReady++;
      } else {
        badge = null;
        cleared++;
      }

      await supabase
        .from('users')
        .update({ weekly_badge: badge, badge_updated_at: now })
        .eq('id', user_id);
    }

    return successResponse({
      message: 'Elimination run complete',
      total,
      hireReady,
      notReady,
      cleared,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function GET(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: users } = await supabase
      .from('users')
      .select('id, name, weekly_badge, badge_updated_at')
      .not('weekly_badge', 'is', null);

    const hireReady = (users || []).filter(u => u.weekly_badge === 'hire_ready');
    const notReady = (users || []).filter(u => u.weekly_badge === 'not_ready');

    return successResponse({ hireReady, notReady });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
