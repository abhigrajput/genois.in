import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const LEGEND_THRESHOLD = 1500;
const LEGEND_PRICE = 999;

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: score } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('plan, name')
      .eq('user_id', payload.userId)
      .single();

    const currentScore = score?.total_score || 0;
    const isEligible = currentScore >= LEGEND_THRESHOLD;
    const isLegend = user?.plan === 'legend';
    const pointsNeeded = Math.max(0, LEGEND_THRESHOLD - currentScore);
    const progressPercent = Math.min(100, Math.round((currentScore / LEGEND_THRESHOLD) * 100));

    return successResponse({
      isEligible,
      isLegend,
      currentScore,
      threshold: LEGEND_THRESHOLD,
      pointsNeeded,
      progressPercent,
      price: LEGEND_PRICE,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
