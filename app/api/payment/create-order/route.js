import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`payment_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { amount, plan } = body || {};
    if (!amount || amount < 1) return errorResponse('Invalid amount', 400);
    if (!plan) return errorResponse('Plan is required', 400);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay env vars missing');
      return errorResponse('Payment system not configured', 500);
    }

    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `genois_${payload.userId.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: payload.userId,
        plan,
      },
    });

    return successResponse({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID.trim(),
    });
  } catch (error) {
    console.error('Razorpay error:', error.message, error);
    return errorResponse('Payment setup failed: ' + error.message, 500);
  }
}
