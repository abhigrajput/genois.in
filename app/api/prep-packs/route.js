import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: purchases } = await supabase
      .from('prep_packs')
      .select('company, purchased_at')
      .eq('user_id', payload.userId);

    const purchased = (purchases || []).map(p => p.company);
    return successResponse({ purchased });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
