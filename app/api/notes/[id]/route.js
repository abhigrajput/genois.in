import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { title, content } = body || {};

    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== payload.userId) {
      return errorResponse('Note not found', 404);
    }

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim().substring(0, 200);
    if (content !== undefined) updates.content = content.substring(0, 50000);

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse('Internal server error', 500);
    return successResponse({ note });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: existing } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== payload.userId) {
      return errorResponse('Note not found', 404);
    }

    await supabase.from('notes').delete().eq('id', id);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
