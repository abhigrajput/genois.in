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
      .from('progress').select('current_day').eq('user_id', payload.userId).single();

    const { data: allItems } = await supabase
      .from('roadmap').select('id, day_number, topic, week_number, difficulty')
      .eq('domain_slug', user.domain_slug)
      .order('day_number');

    const { data: completedTasks } = await supabase
      .from('tasks').select('day_number')
      .eq('user_id', payload.userId)
      .eq('status', 'completed')
      .eq('type', 'project');

    const completedDays = new Set((completedTasks || []).map(t => t.day_number));

    const items = (allItems || []).map(item => ({
      ...item,
      isComplete: completedDays.has(item.day_number),
    }));

    return successResponse({
      currentDay: progress?.current_day || 1,
      totalDays: 30,
      completedDays: completedDays.size,
      progressPercent: Math.round((completedDays.size / 30) * 100),
      items,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
