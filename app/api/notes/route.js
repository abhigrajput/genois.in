import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const domainSlug = searchParams.get('domainSlug');

    const supabase = getAdminClient();
    let query = supabase
      .from('notes')
      .select('*, roadmap(topic, day_number)')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    if (domainSlug) query = query.eq('domain_slug', domainSlug);

    const { data: notes } = await query;
    return successResponse({ notes: notes || [] });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
