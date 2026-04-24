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
    const { data: progress } = await supabase
      .from('progress').select('current_week, current_day').eq('user_id', payload.userId).single();

    const currentWeek = progress?.current_week || 1;
    const startDay = (currentWeek - 1) * 7 + 1;
    const endDay = currentWeek * 7;

    const { data: items } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .gte('day_number', startDay)
      .lte('day_number', endDay)
      .order('day_number');

    const { data: tasks } = await supabase
      .from('tasks')
      .select('day_number, type, status, score')
      .eq('user_id', payload.userId)
      .gte('day_number', startDay)
      .lte('day_number', endDay);

    const tasksByDay = {};
    (tasks || []).forEach(t => {
      if (!tasksByDay[t.day_number]) tasksByDay[t.day_number] = [];
      tasksByDay[t.day_number].push(t);
    });

    const days = (items || []).map(item => ({
      ...item,
      tasks: tasksByDay[item.day_number] || [],
      completedTasks: (tasksByDay[item.day_number] || []).filter(t => t.status === 'completed').length,
      isComplete: (tasksByDay[item.day_number] || []).filter(t => t.status === 'completed').length === 6,
      dayScore: (tasksByDay[item.day_number] || []).reduce((a, t) => a + (t.score || 0), 0),
    }));

    return successResponse({ week: currentWeek, startDay, endDay, days });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
