import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';

const TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes'];
const TOTAL_TASKS = 5;

async function ensureTasksExist(supabase, userId, dayNumber, roadmapId, domainSlug, topic) {
  const { data: existing } = await supabase
    .from('tasks')
    .select('type')
    .eq('user_id', userId)
    .eq('day_number', dayNumber);

  const existingTypes = new Set((existing || []).map(t => t.type));
  const missing = TASK_TYPES.filter(t => !existingTypes.has(t));

  if (missing.length > 0) {
    await supabase.from('tasks').insert(
      missing.map(type => ({
        user_id: userId,
        roadmap_id: roadmapId,
        domain_slug: domainSlug,
        topic,
        day_number: dayNumber,
        type,
        status: 'pending',
        score: 0,
      }))
    );
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('day_number', dayNumber)
    .order('id');

  return tasks || [];
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level')
      .eq('id', payload.userId)
      .single();

    // FIX 1: Smart day advancement — only advance if yesterday completed all 5
    const { data: progress } = await supabase
      .from('progress')
      .select('current_day, current_week, progress_percent, tasks_completed_today, last_completed_date, streak')
      .eq('user_id', payload.userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = progress?.last_completed_date;
    const tasksToday = progress?.tasks_completed_today || 0;
    const currentDay = progress?.current_day || 1;
    const currentWeek = progress?.current_week || 1;

    // Only advance day if: yesterday was completed (5 tasks) AND today is a new calendar day
    let displayDay = currentDay;
    if (lastCompleted && lastCompleted < today && tasksToday >= 5) {
      displayDay = Math.min(currentDay + 1, 30);
      const newWeek = Math.ceil(displayDay / 7);
      const newProgressPercent = Math.min(100, Math.round(((displayDay - 1) / 30) * 100));
      await supabase
        .from('progress')
        .update({
          current_day: displayDay,
          current_week: newWeek,
          progress_percent: newProgressPercent,
          tasks_completed_today: 0,
          last_completed_date: today,
        })
        .eq('user_id', payload.userId);
    }

    const { data: roadmapItem, error: roadmapError } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .eq('day_number', displayDay)
      .single();

    if (roadmapError || !roadmapItem) {
      return errorResponse(`No roadmap found for day ${displayDay} in domain ${user.domain_slug}`, 404);
    }

    const tasks = await ensureTasksExist(
      supabase,
      payload.userId,
      displayDay,
      roadmapItem.id,
      user.domain_slug,
      roadmapItem.topic
    );

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const isComplete = completedCount >= TOTAL_TASKS;

    const { data: codingTest } = await supabase
      .from('coding_tests')
      .select('id, title, problem, input_desc, output_desc, example_input, example_output, hints, difficulty')
      .eq('domain_slug', user.domain_slug)
      .limit(1)
      .single();

    return successResponse({
      roadmapItem,
      tasks,
      completedCount,
      totalTasks: TOTAL_TASKS,
      isComplete,
      currentDay: displayDay,
      currentWeek: Math.ceil(displayDay / 7),
      codingTest: codingTest || null,
      project: null,
      projectProgress: null,
    });
  } catch (error) {
    console.error('Daily roadmap error:', error);
    return errorResponse(error.message, 500);
  }
}
