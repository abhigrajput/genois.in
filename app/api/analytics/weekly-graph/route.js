import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('progress').select('current_week').eq('user_id', payload.userId).single();

    const currentWeek = progress?.current_week || 1;
    const weeks = [];

    for (let w = 1; w <= currentWeek; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = w * 7;

      const { data: tasks } = await supabase
        .from('tasks')
        .select('score, status')
        .eq('user_id', payload.userId)
        .gte('day_number', startDay)
        .lte('day_number', endDay)
        .eq('status', 'completed');

      const { data: tests } = await supabase
        .from('tests')
        .select('score')
        .eq('user_id', payload.userId)
        .eq('type', 'daily');

      const weekScore = (tasks || []).reduce((a, t) => a + (t.score || 0), 0);
      const avgTest = tests && tests.length > 0
        ? Math.round(tests.reduce((a, t) => a + (t.score || 0), 0) / tests.length)
        : 0;

      weeks.push({
        week: w,
        tasksCompleted: (tasks || []).length,
        weekScore,
        avgTestScore: avgTest,
      });
    }

    return successResponse({ weeks });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
