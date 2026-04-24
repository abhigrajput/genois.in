import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { company, paymentId, orderId } = await request.json();
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('prep_packs')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('company', company)
      .single();

    if (existing) return successResponse({ message: 'Already purchased' });

    await supabase.from('prep_packs').insert({
      user_id: payload.userId,
      company,
      payment_id: paymentId,
      amount: 199,
    });

    return successResponse({ message: 'Pack unlocked successfully' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
