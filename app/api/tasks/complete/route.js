import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { updateStreak } from '@/lib/streak';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { taskType, completed, day } = await request.json();
    const supabase = getAdminClient();
    
    // Get current day from progress if day not provided
    let dayNumber = day;
    if (!dayNumber) {
      const { data: prog } = await supabase.from('progress').select('current_day').eq('user_id', payload.userId).single();
      dayNumber = prog?.current_day || 1;
    }

    // Get or create day task record
    const { data: existing } = await supabase.from('tasks').select('*').eq('user_id', payload.userId).eq('day_number', dayNumber).eq('type', taskType).single();

    if (existing) {
      await supabase.from('tasks').update({ status: completed ? 'completed' : 'pending', completed_at: completed ? new Date().toISOString() : null, score: completed ? 20 : 0 }).eq('id', existing.id);
    } else {
      await supabase.from('tasks').insert({ user_id: payload.userId, day_number: dayNumber, type: taskType, domain_slug: 'fullstack', status: completed ? 'completed' : 'pending', completed_at: completed ? new Date().toISOString() : null, score: completed ? 20 : 0 });
    }

    // Update total score and streak if completed
    if (completed) {
      const { data: user } = await supabase.from('users').select('total_score').eq('id', payload.userId).single();
      await supabase.from('users').update({ total_score: (user?.total_score || 0) + 20 }).eq('id', payload.userId);
      await updateStreak(payload.userId);
    }

    // Check if all tasks for day are done
    const { data: allTasks } = await supabase.from('tasks').select('*').eq('user_id', payload.userId).eq('day_number', dayNumber);
    const completedCount = allTasks?.filter(t => t.status === 'completed').length || 0;
    const allDone = completedCount >= 5;

    if (allDone) {
      // Update progress to next day
      const { data: prog } = await supabase.from('progress').select('*').eq('user_id', payload.userId).single();
      if (prog && prog.current_day === dayNumber) {
        await supabase.from('progress').update({ current_day: dayNumber + 1, tasks_completed_today: 5, last_completed_date: new Date().toISOString() }).eq('user_id', payload.userId);
      }
    }

    return successResponse({ success: true, taskType, completed, dayNumber, allDone, completedCount });
  } catch (error) {
    console.error('tasks/complete error:', error);
    return errorResponse('Internal server error', 500);
  }
}
