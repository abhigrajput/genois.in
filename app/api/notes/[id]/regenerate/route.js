import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: note } = await supabase
      .from('notes').select('*').eq('id', id).single();

    if (!note || note.user_id !== payload.userId) {
      return errorResponse('Note not found', 404);
    }

    // Regenerate by calling /api/notes/generate, which UPSERTS the note on
    // (user_id, roadmap_id, type) — i.e. it overwrites THIS note in place.
    //
    // The previous version deleted the note BEFORE this call. That meant any
    // failure (and, in prod, the misconfigured localhost NEXT_PUBLIC_APP_URL
    // made failure certain) left the user with the note permanently gone and no
    // replacement. There is no delete here at all: the upsert does the
    // replacement, so on any failure the existing note is simply left untouched.
    //
    // Derive the origin from the incoming request instead of an env var, so this
    // internal same-origin call can never be re-broken by a bad/empty
    // NEXT_PUBLIC_APP_URL again.
    const origin = new URL(request.url).origin;

    let result;
    try {
      const genRes = await fetch(`${origin}/api/notes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('authorization'),
        },
        body: JSON.stringify({ roadmapId: note.roadmap_id, noteType: note.type }),
      });

      if (!genRes.ok) {
        return errorResponse('Could not regenerate this note right now. Your existing note is unchanged.', 502);
      }
      result = await genRes.json();
    } catch (e) {
      console.error('REGENERATE_FETCH_ERROR:', e);
      return errorResponse('Could not regenerate this note right now. Your existing note is unchanged.', 502);
    }

    if (!result?.success || !result?.data?.note) {
      return errorResponse('Could not regenerate this note right now. Your existing note is unchanged.', 502);
    }

    return successResponse({ note: result.data.note, isNew: true });
  } catch (error) {
    console.error('REGENERATE_ERROR:', error);
    return errorResponse('Internal server error', 500);
  }
}
