import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

const TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes'];
const TASK_POINTS = { video: 10, resource: 10, coding: 20, test: 30, notes: 10 };
const DAY_COMPLETE_BONUS = 20;
const TOTAL_DAYS = 30;
const TOTAL_TASKS = 5;

async function addScore(supabase, userId, type, points, reason) {
  const fieldMap = {
    video: 'task_score', resource: 'task_score', notes: 'task_score',
    coding: 'coding_score', test: 'test_score',
    project: 'project_score', streak: 'streak_score',
  };
  const field = fieldMap[type] || 'task_score';

  const { data: current } = await supabase
    .from('scores').select('*').eq('user_id', userId).single();

  if (current) {
    await supabase.from('scores').update({
      total_score: (current.total_score || 0) + points,
      domain_score: (current.domain_score || 0) + points,
      [field]: (current[field] || 0) + points,
    }).eq('user_id', userId);
  }

  await supabase.from('score_events').insert({
    user_id: userId, type, points, reason,
  });
}

async function updateSkillIdentity(supabase, userId, progressPercent) {
  let skillLevel = 'beginner';
  if (progressPercent >= 80) skillLevel = 'job_ready';
  else if (progressPercent >= 50) skillLevel = 'advanced';
  else if (progressPercent >= 25) skillLevel = 'intermediate';

  const { data: tests } = await supabase
    .from('tests')
    .select('score')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(20);

  const avgTestScore = tests && tests.length > 0
    ? tests.reduce((a, t) => a + (t.score || 0), 0) / tests.length
    : 0;

  const { data: progress } = await supabase
    .from('progress').select('streak').eq('user_id', userId).single();

  const streak = progress?.streak || 0;
  const jobReady = Math.min(100, Math.round(
    progressPercent * 0.4 + avgTestScore * 0.3 + Math.min(streak, 30) / 30 * 100 * 0.3
  ));

  await supabase.from('skill_identity').update({
    skill_level: skillLevel,
    progress_percent: progressPercent,
    job_ready_score: jobReady,
    domain_level: skillLevel,
  }).eq('user_id', userId);
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { dayNumber, taskType, score: rawScore } = await request.json();

    if (!TASK_TYPES.includes(taskType)) {
      return errorResponse('Invalid task type', 400);
    }

    const supabase = getAdminClient();

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('day_number', dayNumber)
      .eq('type', taskType)
      .single();

    if (taskError || !task) {
      return errorResponse('Task not found. Visit the daily roadmap first.', 404);
    }

    if (task.status === 'completed') {
      return successResponse({ task, alreadyDone: true, message: 'Already completed' });
    }

    const points = rawScore !== undefined && rawScore !== null
      ? Math.min(rawScore, TASK_POINTS[taskType])
      : TASK_POINTS[taskType];

    await supabase.from('tasks').update({
      status: 'completed',
      score: points,
      completed_at: new Date().toISOString(),
    }).eq('id', task.id);

    await addScore(supabase, payload.userId, taskType, points,
      `Completed ${taskType} task on day ${dayNumber}`);

    const { data: allTasks } = await supabase
      .from('tasks')
      .select('status, score, id')
      .eq('user_id', payload.userId)
      .eq('day_number', dayNumber);

    const completedCount = (allTasks || []).filter(t => t.status === 'completed').length;
    const allDone = completedCount >= TOTAL_TASKS;

    let dayUnlocked = false;
    let newDay = dayNumber;

    if (allDone) {
      dayUnlocked = true;

      await addScore(supabase, payload.userId, 'streak', DAY_COMPLETE_BONUS,
        `Day ${dayNumber} complete bonus`);

      const { data: progress } = await supabase
        .from('progress').select('*').eq('user_id', payload.userId).single();

      // Track tasks_completed_today and last_completed_date
      // Day advancement is handled by roadmap/daily — here we just track completion
      const today = new Date().toISOString().split('T')[0];
      const newCount = TOTAL_TASKS;
      await supabase.from('progress').update({
        tasks_completed_today: newCount,
        last_completed_date: today,
        day_progress: 100,
      }).eq('user_id', payload.userId);

      const dayScore = (allTasks || []).reduce((a, t) => a + (t.score || 0), 0) + points;
      const newProgressPercent = Math.min(100, Math.round(((dayNumber - 1) / TOTAL_DAYS) * 100));

      await supabase.from('analytics').upsert({
        user_id: payload.userId,
        date: today,
        tasks_completed: TOTAL_TASKS,
        daily_score: dayScore,
        streak_day: progress?.streak || 1,
      }, { onConflict: 'user_id,date' });

      await updateSkillIdentity(supabase, payload.userId, newProgressPercent);
      newDay = dayNumber; // actual advance happens at next GET of roadmap/daily
    } else {
      // Increment tasks_completed_today
      const { data: prog } = await supabase
        .from('progress').select('tasks_completed_today').eq('user_id', payload.userId).single();
      const newCount = Math.min((prog?.tasks_completed_today || 0) + 1, TOTAL_TASKS);
      const updates = { tasks_completed_today: newCount };
      if (newCount >= TOTAL_TASKS) {
        updates.last_completed_date = new Date().toISOString().split('T')[0];
      }
      await supabase.from('progress').update(updates).eq('user_id', payload.userId);
    }

    return successResponse({
      points,
      dayUnlocked,
      newDay,
      completedCount: Math.min(completedCount, 6),
      allDone,
      alreadyDone: false,
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return errorResponse(error.message, 500);
  }
}
