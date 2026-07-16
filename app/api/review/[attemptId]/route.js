import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

// Full question-by-question data for one attempt. Ownership-scoped; degrades
// to `available: false` when the test_questions migration isn't applied.
export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { attemptId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(attemptId || '')) {
      return errorResponse('Invalid attempt id', 400);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('test_questions')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', payload.userId)
      .single();

    if (error) {
      // Missing table (migration not run) and missing row both land here —
      // the page shows the same graceful "not available" state for both.
      console.warn('[review] attempt unavailable:', error.message);
      return successResponse({ available: false, attempt: null });
    }
    return successResponse({ available: true, attempt: data });
  } catch (error) {
    console.error('[review] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
