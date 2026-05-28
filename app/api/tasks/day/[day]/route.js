import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { day } = await params;
    const dayNumber = parseInt(day);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
      return errorResponse('Invalid day number', 400);
    }

    const supabase = getAdminClient();

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('day_number', dayNumber)
      .order('id');

    const completedCount = (tasks || []).filter(t => t.status === 'completed').length;

    return successResponse({
      tasks: tasks || [],
      completedCount,
      totalTasks: 6,
      isComplete: completedCount === 6,
      dayScore: (tasks || []).reduce((a, t) => a + (t.score || 0), 0),
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
