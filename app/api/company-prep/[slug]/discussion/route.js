import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`discussion_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { slug } = await params;
    const { message, parentId } = await request.json();
    if (!message || message.length < 5) return errorResponse('Message too short', 400);
    if (message.length > 2000) return errorResponse('Message too long', 400);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('company_discussions')
      .insert({
        company_slug: slug,
        user_id: payload.userId,
        message: message.trim(),
        parent_id: parentId || null,
      })
      .select('*, users(name)')
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse({ discussion: data });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
