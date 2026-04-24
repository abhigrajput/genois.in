import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = getAdminClient();
    let query = supabase
      .from('mentor_history').select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (mode) query = query.eq('mode', mode);
    const { data } = await query;

    return successResponse({ messages: data || [] });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    const supabase = getAdminClient();
    let query = supabase.from('mentor_history').delete().eq('user_id', payload.userId);
    if (mode) query = query.eq('mode', mode);
    await query;

    return successResponse({ cleared: true });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
