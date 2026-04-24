import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: sub } = await supabase
      .from('subscriptions').select('*').eq('user_id', payload.userId).single();

    if (!sub) return errorResponse('No active subscription found', 404);

    await supabase.from('subscriptions').update({
      status: 'cancelled',
    }).eq('user_id', payload.userId);

    return successResponse({
      message: 'Subscription cancelled. Access continues until end date.',
      endDate: sub.end_date,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
