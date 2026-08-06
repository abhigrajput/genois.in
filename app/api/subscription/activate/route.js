import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isBillingEnabled, billingDisabledResponse, verifyPayment } from '@/lib/razorpay';

// Server-side price list. This is the ONLY source of truth for what a plan
// costs — the `amount` field in the request body is ignored entirely, because
// the client can put anything there.
const PLANS = {
  basic:  { amount: 19900,  currency: 'INR', months: 1 },
  pro:    { amount: 49900,  currency: 'INR', months: 1 },
  elite:  { amount: 199900, currency: 'INR', months: 12 },
};

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    if (!await rateLimit(`sub_activate_${payload.userId}`, 5, 60000)) {
      return rateLimitResponse();
    }

    // Billing kill-switch. Payments are suspended for the Placement Beta
    // (/api/payment/create-order returns 503), so no order can legitimately be
    // created and nothing should be granted. The verified path below stays
    // wired for when PAYMENTS_ENABLED is flipped back on.
    if (!isBillingEnabled()) return billingDisabledResponse();

    const { paymentId, orderId, signature, plan } = await request.json();

    const planKey = String(plan || '').toLowerCase();
    const planConfig = PLANS[planKey];
    if (!planConfig) return errorResponse('Unknown plan', 400);
    if (!paymentId) return errorResponse('paymentId is required', 400);

    // ── Verify with Razorpay before granting anything ────────────────────────
    const verification = await verifyPayment({
      paymentId,
      orderId,
      signature,
      expectedAmountPaise: planConfig.amount,
      expectedCurrency: planConfig.currency,
    });

    if (!verification.ok) {
      console.error('SUBSCRIPTION_VERIFY_REJECTED:', verification.reason, 'user:', payload.userId);
      return errorResponse('Payment could not be verified', 402);
    }

    const supabase = getAdminClient();

    // ── Replay guard ─────────────────────────────────────────────────────────
    // A captured payment id is public to whoever made the payment. Without this
    // check one real ₹199 payment could be replayed to upgrade any number of
    // accounts. `subscriptions.payment_id` has no UNIQUE constraint yet, so the
    // check lives here (see the note in the security handoff).
    const { data: reused } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (reused && reused.user_id !== payload.userId) {
      console.error('SUBSCRIPTION_REPLAY_BLOCKED:', paymentId, 'user:', payload.userId);
      return errorResponse('Payment could not be verified', 402);
    }
    if (reused) {
      return successResponse({ message: 'Subscription already active for this payment.' });
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planConfig.months);

    const { error: writeErr } = await supabase.from('users')
      .update({ plan: 'premium' }).eq('id', payload.userId);
    // Fatal: this update IS the entitlement the user paid for. Returning
    // success without it means a completed payment and no premium access.
    if (writeErr) {
      console.error('SUBSCRIPTION_PLAN_GRANT_FAILED:', { userId: payload.userId, paymentId, code: writeErr.code, message: writeErr.message, details: writeErr.details });
      return errorResponse('Payment received but we could not activate your plan. Contact support with your payment id.', 500);
    }

    const { data: subscription, error: subErr } = await supabase
      .from('subscriptions').upsert({
        user_id: payload.userId,
        plan: planKey,
        status: 'active',
        payment_id: paymentId,
        // Stored in rupees, matching prep_packs.amount.
        amount: verification.payment.amount / 100,
        currency: planConfig.currency,
        end_date: endDate.toISOString(),
      }, { onConflict: 'user_id' }).select().single();

    // Fatal for the same reason, and this row is the payment record itself —
    // without it there is nothing tying the payment to the subscription.
    if (subErr) {
      console.error('SUBSCRIPTION_UPSERT_FAILED:', { userId: payload.userId, paymentId, code: subErr.code, message: subErr.message, details: subErr.details });
      return errorResponse('Payment received but we could not record your subscription. Contact support with your payment id.', 500);
    }

    const { data: score } = await supabase
      .from('scores').select('total_score').eq('user_id', payload.userId).single();

    if (score) {
      const { error: writeErr2 } = await supabase.from('scores').update({
        total_score: (score.total_score || 0) + 100,
      }).eq('user_id', payload.userId);
      if (writeErr2) console.error('DB write failed: scores.update', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });
    }

    const { error: writeErr3 } = await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'subscription',
      points: 100,
      reason: 'Premium subscription welcome bonus',
    });
    if (writeErr3) console.error('DB write failed: score_events.insert', { code: writeErr3.code, message: writeErr3.message, details: writeErr3.details });

    return successResponse({
      subscription,
      message: 'Premium activated! +100 bonus points added.',
    });
  } catch (error) {
    console.error('SUBSCRIPTION_ACTIVATE_ERROR:', error?.message || error);
    return errorResponse('Internal server error', 500);
  }
}
