import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, domain_slug, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, created_at')
      .eq('id', payload.userId)
      .single();
    return successResponse({ user });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
