import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isBillingEnabled, billingDisabledResponse, verifyPayment } from '@/lib/razorpay';

// Server-side price for a prep pack: ₹199 → 19900 paise. Same rule as the
// subscription route — the client never gets to say what it paid.
const PREP_PACK_PRICE_PAISE = 19900;
const PREP_PACK_PRICE_RUPEES = PREP_PACK_PRICE_PAISE / 100;

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    if (!await rateLimit(`prep_purchase_${payload.userId}`, 5, 60000)) {
      return rateLimitResponse();
    }

    // Billing kill-switch — see lib/razorpay.js. Nothing is unlocked while
    // payments are suspended.
    if (!isBillingEnabled()) return billingDisabledResponse();

    const { company, paymentId, orderId, signature } = await request.json();

    const companySlug = String(company || '').trim().slice(0, 100);
    if (!companySlug) return errorResponse('company is required', 400);
    if (!paymentId) return errorResponse('paymentId is required', 400);

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('prep_packs')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('company', companySlug)
      .maybeSingle();

    if (existing) return successResponse({ message: 'Already purchased' });

    // ── Verify with Razorpay before unlocking ────────────────────────────────
    const verification = await verifyPayment({
      paymentId,
      orderId,
      signature,
      expectedAmountPaise: PREP_PACK_PRICE_PAISE,
    });

    if (!verification.ok) {
      console.error('PREP_PACK_VERIFY_REJECTED:', verification.reason, 'user:', payload.userId);
      return errorResponse('Payment could not be verified', 402);
    }

    // ── Replay guard ─────────────────────────────────────────────────────────
    // One payment unlocks one pack. Without this, a single ₹199 payment id
    // could be replayed against every company in the catalogue.
    const { data: reused } = await supabase
      .from('prep_packs')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (reused) {
      console.error('PREP_PACK_REPLAY_BLOCKED:', paymentId, 'user:', payload.userId);
      return errorResponse('Payment could not be verified', 402);
    }

    const { error: writeErr } = await supabase.from('prep_packs').insert({
      user_id: payload.userId,
      company: companySlug,
      payment_id: paymentId,
      amount: PREP_PACK_PRICE_RUPEES,
    });
    if (writeErr) console.error('DB write failed: prep_packs.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ message: 'Pack unlocked successfully' });
  } catch (error) {
    console.error('PREP_PACK_PURCHASE_ERROR:', error?.message || error);
    return errorResponse('Internal server error', 500);
  }
}
