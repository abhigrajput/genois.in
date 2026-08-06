import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return successResponse({ tracked: false });

    const { event_type, page, feature, metadata } = await request.json();
    const supabase = getAdminClient();

    const { error: writeErr } = await supabase.from('user_events').insert({
      user_id: payload.userId,
      event_type: event_type || 'page_view',
      page: page || null,
      feature: feature || null,
      metadata: metadata || {},
    });
    if (writeErr) console.error('DB write failed: user_events.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ tracked: true });
  } catch {
    return successResponse({ tracked: false });
  }
}
