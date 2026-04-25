import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return successResponse({ tracked: false });

    const { event_type, page, feature, metadata } = await request.json();
    const supabase = getAdminClient();

    await supabase.from('user_events').insert({
      user_id: payload.userId,
      event_type: event_type || 'page_view',
      page: page || null,
      feature: feature || null,
      metadata: metadata || {},
    });

    return successResponse({ tracked: true });
  } catch {
    return successResponse({ tracked: false });
  }
}
