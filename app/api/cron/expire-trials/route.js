import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('users')
      .update({ is_on_trial: false })
      .eq('is_on_trial', true)
      .lt('trial_ends_at', new Date().toISOString())
      .select('id');

    return successResponse({ expired: data?.length || 0 });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
