import Razorpay from 'razorpay';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const PLANS = {
  basic: { amount: 9900,  currency: 'INR', description: 'GENOIS Basic — Monthly' },
  pro:   { amount: 19900,  currency: 'INR', description: 'GENOIS Pro — Monthly' },
  elite: { amount: 49900, currency: 'INR', description: 'GENOIS Elite — Monthly' },
  prep_tcs: { amount: 19900, currency: 'INR', description: 'TCS Prep Pack' },
  prep_infosys: { amount: 19900, currency: 'INR', description: 'Infosys Prep Pack' },
  prep_wipro: { amount: 19900, currency: 'INR', description: 'Wipro Prep Pack' },
  mentor_session: { amount: 29900, currency: 'INR', description: 'Mentor Session' },
  legend: { amount: 99900, currency: 'INR', description: 'GENOIS Legend Access' },
};

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return errorResponse('Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local', 503);
    }
    console.log('RAZORPAY KEY ID:', process.env.RAZORPAY_KEY_ID?.substring(0,10));

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const body = await request.json();
    const plan = body.plan || body.planId || 'basic';
    const planData = PLANS[plan] || PLANS.basic;

    const amount = body.amount ? body.amount * 100 : (planData?.amount || 0);
    if (!amount) return errorResponse('Invalid plan or amount', 400);

    const description = body.description || planData?.description || 'GENOIS Payment';

    try {
      // Razorpay receipt must be ≤40 chars
      const shortId = String(payload.userId).slice(0, 8);
      const ts = String(Date.now()).slice(-8);
      const receipt = `g_${shortId}_${ts}`;

      const order = await razorpay.orders.create({
        amount: amount,
        currency: planData.currency,
        receipt,
        notes: {
          userId: payload.userId,
          plan,
          description: description,
        },
      });

      return successResponse({
        orderId: order.id,
        amount: amount,
        currency: planData.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
      });
    } catch (razorpayError) {
      console.error('Razorpay error:', JSON.stringify(razorpayError));
      return errorResponse('Razorpay error: ' + (razorpayError.error?.description || razorpayError.message || JSON.stringify(razorpayError)), 500);
    }
  } catch (error) {
    console.error('Razorpay order error:', error);
    return errorResponse(error.message || 'Payment order failed', 500);
  }
}
