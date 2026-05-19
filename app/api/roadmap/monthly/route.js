import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users').select('domain_slug').eq('id', payload.userId).single();

    const { data: items } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .order('day_number');

    const { data: tasks } = await supabase
      .from('tasks')
      .select('day_number, status')
      .eq('user_id', payload.userId);

    const completedDays = new Set(
      (tasks || [])
        .filter(t => t.status === 'completed')
        .map(t => t.day_number)
    );

    const byWeek = {};
    (items || []).forEach(item => {
      const w = item.week_number;
      if (!byWeek[w]) byWeek[w] = { week: w, days: [], completedDays: 0 };
      const isComplete = completedDays.has(item.day_number);
      byWeek[w].days.push({ ...item, isComplete });
      if (isComplete) byWeek[w].completedDays++;
    });

    return successResponse({
      weeks: Object.values(byWeek),
      totalCompleted: completedDays.size,
      totalDays: 30,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
