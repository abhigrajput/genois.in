import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getStreakDay } from '@/lib/streak';

export const dynamic = 'force-dynamic';

// Everything the /analytics page needs, in one round trip. Every widget reads a
// REAL table the app actually writes (the old daily-graph endpoint read the
// `analytics` table, which nothing populates — permanently empty charts):
//   streak        → progress.streak (maintained by lib/streak.js)
//   weekly        → tasks (status=completed, grouped by day_number week)
//   growth        → score_events (cumulative points) + tests (score over time)
//   assessments   → test_questions (the 20260715 review table)
//   topicMastery  → test_questions.topic_breakdown + coding_submissions
//   activity      → tasks.completed_at per streak-day (a count, NOT minutes —
//                   we don't track real time, so the UI labels it "activity")
// Each block degrades independently: a missing table (unapplied migration) or a
// failed query returns that widget's empty shape, never a 500.
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const userId = payload.userId;

    const [progressQ, tasksQ, testsQ, eventsQ, attemptsQ, codingQ, scoreQ] = await Promise.allSettled([
      supabase.from('progress')
        .select('streak, last_active_date, current_day')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('tasks')
        .select('day_number, completed_at')
        .eq('user_id', userId).eq('status', 'completed')
        .order('day_number', { ascending: true }).limit(2000),
      supabase.from('tests')
        .select('score, taken_at')
        .eq('user_id', userId)
        .order('taken_at', { ascending: true }).limit(500),
      supabase.from('score_events')
        .select('points, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }).limit(3000),
      supabase.from('test_questions')
        .select('id, attempt_type, topic, score, total_questions, correct_count, topic_breakdown, taken_at')
        .eq('user_id', userId)
        .order('taken_at', { ascending: false }).limit(50),
      supabase.from('coding_submissions')
        .select('status, submitted_at, coding_tests(title)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false }).limit(200),
      supabase.from('scores')
        .select('total_score')
        .eq('user_id', userId).maybeSingle(),
    ]);

    const val = (q) => (q.status === 'fulfilled' && !q.value.error ? q.value.data : null);

    // ── Streak ──────────────────────────────────────────────────────────────
    const progress = val(progressQ);
    const streak = {
      current: progress?.streak || 0,
      activeToday: progress?.last_active_date
        ? getStreakDay(new Date(progress.last_active_date)) === getStreakDay()
        : false,
      lastActiveDate: progress?.last_active_date || null,
    };

    // ── Weekly progress: completed tasks per roadmap week ───────────────────
    const tasks = val(tasksQ) || [];
    const weekly = [];
    if (tasks.length > 0) {
      const byWeek = new Map();
      let maxWeek = 1;
      for (const t of tasks) {
        const w = Math.max(1, Math.ceil((t.day_number || 1) / 7));
        byWeek.set(w, (byWeek.get(w) || 0) + 1);
        if (w > maxWeek) maxWeek = w;
      }
      for (let w = 1; w <= maxWeek; w++) weekly.push({ week: w, tasks: byWeek.get(w) || 0 });
    }

    // ── Skill growth: cumulative points by day + test scores over time ──────
    const events = val(eventsQ) || [];
    const pointsByDay = new Map();
    let running = 0;
    for (const e of events) {
      running += e.points || 0;
      pointsByDay.set(getStreakDay(new Date(e.created_at)), running);
    }
    const growthPoints = [...pointsByDay.entries()].map(([date, total]) => ({ date, total }));

    const tests = val(testsQ) || [];
    const growthTests = tests
      .filter(t => t.taken_at)
      .map(t => ({ date: String(t.taken_at).slice(0, 10), score: Math.round(t.score || 0) }));

    // ── Assessment history (test_questions — the review table) ──────────────
    // attemptsQ error usually means the 20260715 migration isn't applied:
    // report available:false so the UI shows a clean "not available yet" state.
    const attemptsOk = attemptsQ.status === 'fulfilled' && !attemptsQ.value.error;
    const attempts = attemptsOk ? (attemptsQ.value.data || []) : [];
    const assessments = {
      available: attemptsOk,
      attempts: attempts.map(a => ({
        id: a.id,
        attempt_type: a.attempt_type,
        topic: a.topic,
        score: a.score,
        total_questions: a.total_questions,
        correct_count: a.correct_count,
        taken_at: a.taken_at,
      })),
    };

    // ── Topic mastery: correct/total per topic ───────────────────────────────
    // Sources: every attempt's topic_breakdown ({ topic: { correct, total } })
    // merged, plus coding_submissions bucketed by problem title.
    const mastery = new Map();
    const bump = (topic, correct, total) => {
      if (!topic || !total) return;
      const cur = mastery.get(topic) || { correct: 0, total: 0 };
      cur.correct += correct;
      cur.total += total;
      mastery.set(topic, cur);
    };
    for (const a of attempts) {
      const bd = a.topic_breakdown;
      if (bd && typeof bd === 'object') {
        for (const [topic, agg] of Object.entries(bd)) {
          bump(topic, Number(agg?.correct) || 0, Number(agg?.total) || 0);
        }
      }
    }
    for (const s of (val(codingQ) || [])) {
      bump(s.coding_tests?.title || 'Coding practice', s.status === 'correct' ? 1 : 0, 1);
    }
    const topicMastery = [...mastery.entries()]
      .map(([topic, { correct, total }]) => ({
        topic, correct, total, pct: Math.round((correct / total) * 100),
      }))
      .sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic))
      .slice(0, 12);

    // ── Activity: task completions per streak-day, last 30 days ─────────────
    const completionsByDay = new Map();
    for (const t of tasks) {
      if (!t.completed_at) continue;
      const d = getStreakDay(new Date(t.completed_at));
      completionsByDay.set(d, (completionsByDay.get(d) || 0) + 1);
    }
    const activity = [];
    const todayStr = getStreakDay();
    const today = new Date(todayStr + 'T00:00:00Z');
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
      activity.push({ date: d, completions: completionsByDay.get(d) || 0 });
    }
    const hasActivity = completionsByDay.size > 0;

    return successResponse({
      streak,
      weekly,
      growth: { points: growthPoints, tests: growthTests },
      assessments,
      topicMastery,
      activity: hasActivity ? activity : [],
      totals: {
        tasksCompleted: tasks.length,
        testsTaken: tests.length,
        attempts: attempts.length,
        // scores.total_score is the single source of truth for points
        // (score_events may not reach back over the full account history).
        points: val(scoreQ)?.total_score ?? running,
      },
    });
  } catch (error) {
    console.error('[analytics/insights] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
