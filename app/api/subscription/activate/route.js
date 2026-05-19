import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const PLANS = {
  basic:  { amount: 19900,  currency: 'INR', months: 1 },
  pro:    { amount: 49900,  currency: 'INR', months: 1 },
  elite:  { amount: 199900, currency: 'INR', months: 12 },
};

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { paymentId, amount, currency, plan } = await request.json();
    if (!paymentId || !amount) {
      return errorResponse('paymentId and amount are required', 400);
    }

    const supabase = getAdminClient();

    const endDate = new Date();
    const planMonths = PLANS[plan]?.months || 1;
    endDate.setMonth(endDate.getMonth() + planMonths);

    await supabase.from('users')
      .update({ plan: 'premium' }).eq('id', payload.userId);

    const { data: subscription } = await supabase
      .from('subscriptions').upsert({
        user_id: payload.userId,
        plan: plan || 'monthly',
        status: 'active',
        payment_id: paymentId,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        end_date: endDate.toISOString(),
      }, { onConflict: 'user_id' }).select().single();

    const { data: score } = await supabase
      .from('scores').select('total_score').eq('user_id', payload.userId).single();

    if (score) {
      await supabase.from('scores').update({
        total_score: (score.total_score || 0) + 100,
      }).eq('user_id', payload.userId);
    }

    await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'subscription',
      points: 100,
      reason: 'Premium subscription welcome bonus',
    });

    return successResponse({
      subscription,
      message: 'Premium activated! +100 bonus points added.',
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
