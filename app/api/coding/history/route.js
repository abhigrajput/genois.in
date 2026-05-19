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
      .order('submitted_at', { ascending: false })
      .limit(20);

    return successResponse({ submissions: submissions || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
