import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { updateStreak, getStreakDay, getStreakDayStart } from '@/lib/streak';

const TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes'];
const TOTAL_TASKS = 5;
const TASK_POINTS = 20;

// Minimum dwell before a passive read/watch task can be marked complete,
// measured from the task row's created_at (set when the day was first opened
// by roadmap/daily → ensureTasksExist). Blocks the "open a fresh day and
// instantly mark everything done" bypass. Activity tasks (coding/test) are
// gated on real evidence instead of a timer.
const READ_GATE_MS = 15 * 1000;

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { taskType, completed, day } = await request.json();
    if (!TASK_TYPES.includes(taskType)) return errorResponse('Invalid task type', 400);

    const supabase = getAdminClient();
    const userId = payload.userId;

    // Resolve the day being acted on.
    let dayNumber = day;
    if (!dayNumber) {
      const { data: prog } = await supabase.from('progress').select('current_day').eq('user_id', userId).single();
      dayNumber = prog?.current_day || 1;
    }

    // The task row must already exist — it is created when the day is opened
    // (roadmap/daily → ensureTasksExist). Refusing to create-on-complete blocks
    // completing arbitrary days/tasks the user never actually loaded.
    const { data: existing } = await supabase
      .from('tasks').select('*')
      .eq('user_id', userId).eq('day_number', dayNumber).eq('type', taskType)
      .single();

    if (!existing) {
      return errorResponse('Open this day before completing its tasks', 400);
    }

    const wasCompleted = existing.status === 'completed';

    if (completed && !wasCompleted) {
      // ── Enforce completion criteria server-side (Fix: "Mark as Completed" bypass) ──
      // Both activity gates counted ALL-TIME evidence, so one submission ever
      // made every future coding task tick instantly — the exact bypass these
      // gates exist to stop. Scope them to the current day.
      //
      // "Today" here is the app's streak day (resets 5AM IST), reused from
      // lib/streak.js rather than a second, conflicting definition of a day:
      // the student's day already means this everywhere else in the product.
      // Note the two tables stamp time under different names — coding_submissions
      // uses created_at, tests uses taken_at — verified against the live schema,
      // which lib/database.sql no longer matches.
      const dayStart = getStreakDayStart(getStreakDay()).toISOString();

      if (taskType === 'coding') {
        const { count } = await supabase
          .from('coding_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', dayStart);
        if (!count) return errorResponse('Submit your solution today before completing the coding task', 400);
      } else if (taskType === 'test') {
        const { count } = await supabase
          .from('tests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).neq('result', 'pending')
          .gte('taken_at', dayStart);
        if (!count) return errorResponse('Take today\'s test before completing it', 400);
      } else if (taskType === 'video' || taskType === 'resource') {
        // Passive read/watch — enforce a minimum dwell (notes are gated by the
        // AI generation itself, which cannot be faked instantly).
        const age = Date.now() - new Date(existing.created_at).getTime();
        if (Number.isFinite(age) && age < READ_GATE_MS) {
          return errorResponse('Spend a little more time on this step before marking it complete', 400);
        }
      }

      const { error: completeErr } = await supabase.from('tasks').update({
        status: 'completed', completed_at: new Date().toISOString(), score: TASK_POINTS,
      }).eq('id', existing.id);
      logWriteError('tasks/complete', 'tasks.update(complete)', completeErr);

      // Points live in the `scores` table (task_score + total_score) — the single
      // source every dashboard / leaderboard / mentor reads. They were previously
      // written to the dead users.total_score column, so they never showed up.
      const { data: cur } = await supabase
        .from('scores').select('total_score, task_score').eq('user_id', userId).single();
      if (cur) {
        const { error: awardErr } = await supabase.from('scores').update({
          total_score: (cur.total_score || 0) + TASK_POINTS,
          task_score: (cur.task_score || 0) + TASK_POINTS,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);
        logWriteError('tasks/complete', 'scores.update(award)', awardErr);
      } else {
        const { error: awardErr } = await supabase.from('scores').insert({
          user_id: userId, total_score: TASK_POINTS, task_score: TASK_POINTS,
        });
        logWriteError('tasks/complete', 'scores.insert(award)', awardErr);
      }

      const { error: eventErr } = await supabase.from('score_events').insert({
        user_id: userId, type: 'task', points: TASK_POINTS,
        reason: `Completed ${taskType} — day ${dayNumber}`,
      });
      logWriteError('tasks/complete', 'score_events.insert', eventErr);
      await updateStreak(userId);
    } else if (!completed && wasCompleted) {
      // Un-complete: reverse the award so points can't be farmed by toggling.
      const { error: uncompleteErr } = await supabase.from('tasks').update({
        status: 'pending', completed_at: null, score: 0,
      }).eq('id', existing.id);
      logWriteError('tasks/complete', 'tasks.update(uncomplete)', uncompleteErr);
      const { data: cur } = await supabase
        .from('scores').select('total_score, task_score').eq('user_id', userId).single();
      if (cur) {
        const { error: reverseErr } = await supabase.from('scores').update({
          total_score: Math.max(0, (cur.total_score || 0) - TASK_POINTS),
          task_score: Math.max(0, (cur.task_score || 0) - TASK_POINTS),
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId);
        logWriteError('tasks/complete', 'scores.update(reverse)', reverseErr);
      }
    }

    // Recompute the day's completion from the source of truth (tasks table).
    const { data: allTasks } = await supabase
      .from('tasks').select('status').eq('user_id', userId).eq('day_number', dayNumber);
    const completedCount = (allTasks || []).filter(t => t.status === 'completed').length;
    const allDone = completedCount >= TOTAL_TASKS;

    if (allDone) {
      const { data: prog } = await supabase.from('progress').select('current_day').eq('user_id', userId).single();
      if (prog && prog.current_day === dayNumber) {
        // Advance to the next day and RESET today's counter to 0 — the new day
        // starts with nothing done. (Leaving it at 5 made roadmap/daily's
        // "auto-advance when tasksToday >= 5" fire again and skip a whole day.)
        const { error: advanceErr } = await supabase.from('progress').update({
          current_day: dayNumber + 1,
          tasks_completed_today: 0,
          last_completed_date: new Date().toISOString(),
        }).eq('user_id', userId);
        logWriteError('tasks/complete', 'progress.update(advance-day)', advanceErr);
      } else {
        const { error: progressErr } = await supabase.from('progress').update({ tasks_completed_today: completedCount }).eq('user_id', userId);
        logWriteError('tasks/complete', 'progress.update(today-count)', progressErr);
      }
    } else {
      const { error: progressErr } = await supabase.from('progress').update({ tasks_completed_today: completedCount }).eq('user_id', userId);
      logWriteError('tasks/complete', 'progress.update(today-count)', progressErr);
    }

    return successResponse({ success: true, taskType, completed: !!completed, dayNumber, allDone, completedCount });
  } catch (error) {
    console.error('tasks/complete error:', error);
    return errorResponse('Internal server error', 500);
  }
}
