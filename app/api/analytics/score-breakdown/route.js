import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: score } = await supabase
      .from('scores').select('*').eq('user_id', payload.userId).single();

    const { data: events } = await supabase
      .from('score_events').select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return successResponse({ score: score || {}, events: events || [] });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
