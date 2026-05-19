import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data } = await supabase
      .from('project_progress')
      .select('*, projects(*)')
      .eq('user_id', payload.userId)
      .order('updated_at', { ascending: false });

    return successResponse({ projects: data || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
