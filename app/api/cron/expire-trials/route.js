import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { isAuthorizedCron } from '@/lib/security';

export async function GET(request) {
  try {
    if (!isAuthorizedCron(request)) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_on_trial: false,
        subscription_plan: 'spectator',
      })
      .eq('is_on_trial', true)
      .lt('trial_ends_at', new Date().toISOString())
      .is('plan_expires_at', null)
      .select('id, email');

    return successResponse({ expired: data?.length || 0, users: data });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
