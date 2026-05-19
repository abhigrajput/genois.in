import { getUserFromRequest, generateToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await rateLimit(`refresh_${ip}`, 10, 60000)) return rateLimitResponse();

    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, subscription_plan')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 401);

    const newToken = generateToken({ userId: user.id });
    return successResponse({ token: newToken });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
