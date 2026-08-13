import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: submissions } = await supabase
      .from('coding_submissions')
      .select('*, coding_tests(title, topic, difficulty)')
      .eq('user_id', payload.userId)
      // coding_submissions has created_at, not submitted_at (lib/database.sql
      // still says otherwise — it is stale). Ordering by a column PostgREST
      // cannot resolve fails the whole query, so this silently returned nothing.
      .order('created_at', { ascending: false })
      .limit(20);

    return successResponse({ submissions: submissions || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
