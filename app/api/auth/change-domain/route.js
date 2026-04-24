import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function PUT(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { domainSlug } = await request.json();
    if (!domainSlug) return errorResponse('Domain is required', 400);

    const supabase = getAdminClient();

    const { data: domain } = await supabase
      .from('domains')
      .select('slug')
      .eq('slug', domainSlug)
      .single();

    if (!domain) return errorResponse('Domain not found', 404);

    await supabase
      .from('users')
      .update({ domain_slug: domainSlug, updated_at: new Date().toISOString() })
      .eq('id', payload.userId);

    await supabase
      .from('progress')
      .update({
        current_day: 1,
        current_week: 1,
        current_month: 1,
        day_progress: 0,
        week_progress: 0,
        progress_percent: 0,
      })
      .eq('user_id', payload.userId);

    return successResponse({ domainSlug }, 'Domain changed successfully');
  } catch (error) {
    return errorResponse(error.message || 'Failed to change domain', 500);
  }
}
