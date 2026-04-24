import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    console.log('RAZORPAY KEY ID:', process.env.RAZORPAY_KEY_ID?.substring(0,10));

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      amount,
    } = await request.json();

    // Verify HMAC signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return errorResponse('Payment verification failed — invalid signature', 400);
    }

    const supabase = getAdminClient();

    // Calculate subscription end date
    const endDate = new Date();
    if (plan === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Activate premium on user
    await supabase.from('users')
      .update({ plan: 'premium' })
      .eq('id', payload.userId);

    // Upsert subscription record
    await supabase.from('subscriptions').upsert({
      user_id: payload.userId,
      plan,
      status: 'active',
      payment_id: razorpay_payment_id,
      amount: amount / 100,
      currency: 'INR',
      end_date: endDate.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Award 100 bonus points
    const { data: score } = await supabase
      .from('user_scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    if (score) {
      await supabase.from('user_scores')
        .update({ total_score: (score.total_score || 0) + 100 })
        .eq('user_id', payload.userId);
    }

    await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'subscription',
      points: 100,
      reason: 'Premium activated via Razorpay — welcome bonus',
    });

    return successResponse({
      verified: true,
      plan,
      message: 'Premium activated! +100 bonus points.',
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return errorResponse(error.message, 500);
  }
}
