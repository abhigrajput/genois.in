import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';
import { csrfCheck } from '@/lib/security';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('dsa_roadmap_progress')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    const { data: tasks } = await supabase
      .from('dsa_day_tasks')
      .select('*')
      .eq('user_id', payload.userId);

    const completedDays = (tasks || []).filter(t => t.completed_at).map(t => t.day_number);
    const currentDay = progress?.current_day || 1;

    const userLevel = progress?.level || 'beginner';
    const curriculum = DSA_LEVELS[userLevel] || DSA_LEVELS.beginner;
    const currentDayData = curriculum.find(d => d.day === currentDay);

    return successResponse({
      progress: progress || { current_day: 1, language: 'cpp' },
      completedDays,
      currentDay,
      totalDays: curriculum.length,
      currentDayData,
    });
  } catch (error) {
    console.error('DSA roadmap GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`dsa_roadmap_post_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { action, language, day, taskType } = body || {};

    // Input validation
    const VALID_ACTIONS = ['start', 'complete_task'];
    const VALID_LANGUAGES = ['cpp', 'python', 'java', 'javascript'];
    const VALID_TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes'];

    if (!action || !VALID_ACTIONS.includes(action)) {
      return errorResponse('Invalid action. Must be: start | complete_task', 400);
    }
    if (language && !VALID_LANGUAGES.includes(language)) {
      return errorResponse('Invalid language', 400);
    }
    if (action === 'complete_task') {
      const dayNum = parseInt(day);
      if (!dayNum || dayNum < 1 || dayNum > 90) {
        return errorResponse('day must be between 1 and 90', 400);
      }
      if (!taskType || !VALID_TASK_TYPES.includes(taskType)) {
        return errorResponse('Invalid taskType. Must be: video | resource | coding | test | notes', 400);
      }
    }

    const supabase = getAdminClient();

    if (action === 'start') {
      await supabase.from('dsa_roadmap_progress').upsert({
        user_id: payload.userId,
        language: language || 'cpp',
        current_day: 1,
        last_active_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id' });
      return successResponse({ started: true });
    }

    if (action === 'complete_task') {
      const { data: existing } = await supabase
        .from('dsa_day_tasks')
        .select('*')
        .eq('user_id', payload.userId)
        .eq('day_number', day)
        .single();

      const tasksCompleted = existing?.tasks_completed || {};
      tasksCompleted[taskType] = true;

      const allDone = tasksCompleted.video && tasksCompleted.resource && tasksCompleted.coding && tasksCompleted.test && tasksCompleted.notes;

      await supabase.from('dsa_day_tasks').upsert({
        user_id: payload.userId,
        day_number: day,
        tasks_completed: tasksCompleted,
        day_score: Object.keys(tasksCompleted).length * 20,
        completed_at: allDone ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,day_number' });

      if (allDone) {
        const { data: prog } = await supabase.from('dsa_roadmap_progress').select('current_day').eq('user_id', payload.userId).single();
        if (prog?.current_day === day) {
          await supabase.from('dsa_roadmap_progress').update({
            current_day: day + 1,
            last_active_date: new Date().toISOString().split('T')[0],
          }).eq('user_id', payload.userId);
        }

        const { data: cur } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
        await supabase.from('scores').update({
          total_score: (cur?.total_score || 0) + 20,
        }).eq('user_id', payload.userId);
      }

      return successResponse({ tasksCompleted, allDone });
    }

    return errorResponse('Unknown action', 400);
  } catch (error) {
    console.error('DSA roadmap POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}
