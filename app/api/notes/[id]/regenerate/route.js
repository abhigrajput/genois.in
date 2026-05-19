import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: note } = await supabase
      .from('notes').select('*').eq('id', params.id).single();

    if (!note || note.user_id !== payload.userId) {
      return errorResponse('Note not found', 404);
    }

    // Delete old note so generate endpoint creates a fresh one
    await supabase.from('notes').delete().eq('id', params.id);

    const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization'),
      },
      body: JSON.stringify({ roadmapId: note.roadmap_id, noteType: note.type }),
    });

    const result = await genRes.json();
    return successResponse({ note: result.data?.note, isNew: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
