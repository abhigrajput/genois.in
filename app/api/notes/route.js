import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', payload.userId)
      .order('updated_at', { ascending: false });

    if (error) return errorResponse('Internal server error', 500);
    return successResponse({ notes: notes || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`notes_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { title, content } = body || {};

    if (!title || title.trim().length === 0) return errorResponse('Title required', 400);
    if (title.length > 200) return errorResponse('Title too long', 400);
    if (content && content.length > 50000) return errorResponse('Content too long', 400);

    const supabase = getAdminClient();
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: payload.userId,
        title: title.trim(),
        content: content || '',
      })
      .select()
      .single();

    if (error) return errorResponse('Internal server error', 500);
    return successResponse({ note });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
