import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: test } = await supabase
      .from('coding_tests').select('hints, title')
      .eq('id', params.id).single();

    if (!test) return errorResponse('Test not found', 404);

    const hintIndex = parseInt(params.index);
    const hint = test.hints?.[hintIndex];
    if (!hint) return errorResponse('Hint not found', 404);

    // Deduct 2 points for using a hint
    const { data: score } = await supabase
      .from('scores').select('total_score').eq('user_id', payload.userId).single();

    if (score) {
      await supabase.from('scores').update({
        total_score: Math.max(0, (score.total_score || 0) - 2),
      }).eq('user_id', payload.userId);
    }

    return successResponse({ hint, hintIndex, pointsDeducted: 2 });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
