import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const supabase = getAdminClient();
    const { data } = await supabase
      .from('analytics')
      .select('date, tasks_completed, daily_score, test_score, streak_day')
      .eq('user_id', payload.userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    return successResponse({ graph: data || [], days });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
