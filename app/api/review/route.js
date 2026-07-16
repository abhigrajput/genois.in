import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

// List the user's reviewable attempts (newest first). If the 20260715
// migration isn't applied yet the table doesn't exist — report that as a
// clean `available: false` instead of a 500.
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('test_questions')
      .select('id, attempt_type, topic, score, total_questions, correct_count, taken_at')
      .eq('user_id', payload.userId)
      .order('taken_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[review] list unavailable:', error.message);
      return successResponse({ available: false, attempts: [] });
    }
    return successResponse({ available: true, attempts: data || [] });
  } catch (error) {
    console.error('[review] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
