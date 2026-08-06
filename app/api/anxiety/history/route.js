import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data } = await supabase
      .from('anxiety_chat')
      .select('id, message, response, mood, created_at')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(30);

    return successResponse({ messages: data || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { error: writeErr } = await supabase.from('anxiety_chat')
      .delete().eq('user_id', payload.userId);
    if (writeErr) console.error('DB write failed: anxiety_chat.delete', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ cleared: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
