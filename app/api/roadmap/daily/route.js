import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { generateDayContent, buildDayMeta, isDsaTrack } from '@/lib/curriculumGenerator';
import { roadmapTotalDays } from '@/lib/roadmapCache';
import { youtubeSearchUrl } from '@/lib/youtubeEmbed';
import { getRoadmapTargeting, isFocusStale, targetingForClient } from '@/lib/roadmapTargeting';
import { getPatternPlan } from '@/lib/dsaPatternProgress';

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
    const { error: writeErr } = await supabase.from('tasks').insert(
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
    if (writeErr) console.error('DB write failed: tasks.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('day_number', dayNumber)
    .order('id');

  return tasks || [];
}

// A cached roadmap row is complete when it has topic, video URL, and at least
// one objective. Rows that predate the enrichment migration will have
// objectives = null and will be regenerated once to backfill.
function isComplete(row) {
  return !!(
    row &&
    row.topic &&
    row.video_url &&
    row.objectives &&
    Array.isArray(row.objectives) &&
    row.objectives.length > 0
  );
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, name, domain_slug, level, college, college_tier, cgpa, target_companies, weak_subjects, months_to_placement, year')
      .eq('id', payload.userId)
      .single();

    // Smart day advancement — only advance if yesterday completed all 5
    const { data: progress } = await supabase
      .from('progress')
      .select('current_day, current_week, progress_percent, tasks_completed_today, last_completed_date, streak')
      .eq('user_id', payload.userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = progress?.last_completed_date;
    const tasksToday = progress?.tasks_completed_today || 0;
    const currentDay = progress?.current_day || 1;

    // The roadmap length follows the student's placement timeline: a 1-3 month
    // runway caps at a compressed 60-day plan, a full runway at 365.
    const totalDays = roadmapTotalDays(user.months_to_placement);

    let displayDay = currentDay;
    if (lastCompleted && lastCompleted < today && tasksToday >= 5) {
      displayDay = Math.min(currentDay + 1, totalDays);
      const newWeek = Math.ceil(displayDay / 7);
      const newProgressPercent = Math.min(100, Math.round(((displayDay - 1) / 30) * 100));
      const { error: writeErr2 } = await supabase
        .from('progress')
        .update({
          current_day: displayDay,
          current_week: newWeek,
          progress_percent: newProgressPercent,
          tasks_completed_today: 0,
          last_completed_date: today,
        })
        .eq('user_id', payload.userId);
      if (writeErr2) console.error('DB write failed: progress.update', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });
    }

    const level = user.level || 'beginner';
    const week = Math.ceil(displayDay / 7);

    // ── 1. Try cache first ─────────────────────────────────────────────────
    // Keyed PER USER (not per domain) so each student's roadmap reflects their
    // own target companies / weak subjects / timeline. Pre-migration (no user_id
    // column yet) this errors → roadmapItem null → miss → we regenerate against
    // THIS user every time, which is still correct, just uncached.
    let { data: roadmapItem } = await supabase
      .from('roadmap')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('day_number', displayDay)
      .maybeSingle();

    // A row from a previous domain (user switched domains) is stale even if it
    // looks complete — regenerate rather than serve the wrong track.
    const domainMatches = !roadmapItem || roadmapItem.domain_slug === user.domain_slug;

    // ── Evidence-driven targeting (Phase 3) ────────────────────────────────
    // Which readiness gap today should work on. Computed once here and handed
    // to the generator, so a cache-miss day doesn't pay for the readiness read
    // a second time. Never throws — no evidence just means targeted: false and
    // the day generates exactly as it did before.
    let targeting;
    try {
      targeting = await getRoadmapTargeting(payload.userId, { dayNumber: displayDay });
    } catch (e) {
      console.warn('[roadmap/daily] targeting unavailable:', e.message);
      targeting = null;
    }

    // ── Pattern-based organization ─────────────────────────────────────────
    // WHICH pattern the student is working through, and why. Rigid track
    // routing: DSA only (see isDsaTrack) — a pattern plan must never reshape an
    // AI/ML or DevOps day. Never fatal; a null plan generates the day exactly as
    // it did before the pattern roadmap existed.
    let patternPlan = null;
    if (isDsaTrack(user.domain_slug)) {
      try {
        patternPlan = await getPatternPlan(payload.userId, {
          user,
          targeting,
          currentDay: displayDay,
          skipBasics: level === 'advanced',
        });
      } catch (e) {
        console.warn('[roadmap/daily] pattern plan unavailable:', e.message);
      }
    }

    // A cached day planned against a gap set that has since changed is stale:
    // the student may have closed the very gap it was built to fix. Keyed on
    // the gap SET, not on scores, so ordinary practice doesn't churn the cache.
    const cachedFocus = roadmapItem?.meta?.focus || null;
    const focusStale = isFocusStale(cachedFocus, targeting);

    // A cached day belonging to a pattern the student has since ADVANCED PAST is
    // stale for the same reason — it teaches a pattern they no longer sit in.
    // Deliberately keyed on the pattern ID only, not on solved counts: ticking a
    // problem must not burn an AI generation, exactly as scores don't (rule 4 in
    // lib/roadmapTargeting.js). A day cached before patterns existed has no
    // meta.pattern and is only stale once a plan actually exists, so legacy rows
    // don't all regenerate at once.
    const cachedPattern = roadmapItem?.meta?.pattern || null;
    const patternStale = !!patternPlan?.current
      && (!cachedPattern || cachedPattern.id !== patternPlan.current.id);

    let dayContent;
    let cacheHit = false;

    if (domainMatches && !focusStale && !patternStale && isComplete(roadmapItem)) {
      // Hydrate dayContent shape from the cached row — no AI call.
      cacheHit = true;
      dayContent = {
        topic: roadmapItem.topic,
        description: roadmapItem.description,
        video_url: roadmapItem.video_url,
        resource_url: roadmapItem.resource_url,
        article_url: roadmapItem.article_url,
        coding_problem_url: roadmapItem.coding_problem_url || roadmapItem.doc_url,
        objectives: roadmapItem.objectives || [],
        key_concepts: roadmapItem.key_concepts || [],
        coding_problem: roadmapItem.coding_problem || '',
        estimated_minutes: roadmapItem.estimated_min || 90,
        is_project_day: !!roadmapItem.is_project_day,
        project: roadmapItem.project || null,
        generated_by: roadmapItem.generated_by || 'cache',
        // Old rows (pre-20260716) have no meta — page renders without badges.
        meta: roadmapItem.meta || null,
      };
    } else {
      // ── 2. Cache miss — call AI then persist for next time ──────────────
      dayContent = await generateDayContent(user.domain_slug, displayDay, level, user, { targeting, patternPlan });
      dayContent.meta = buildDayMeta(dayContent);

      // The model is asked for a "best YouTube URL" but hallucinates video ids
      // that embed as "Video unavailable". Never trust an AI-produced video URL:
      // store a topic search link instead, which always resolves to real videos.
      dayContent.video_url = youtubeSearchUrl(dayContent.topic);

      const cachePayload = {
        user_id: payload.userId,
        domain_slug: user.domain_slug,
        week_number: week,
        day_number: displayDay,
        topic: dayContent.topic,
        description: dayContent.description,
        video_url: dayContent.video_url,
        resource_url: dayContent.resource_url,
        article_url: dayContent.article_url,
        doc_url: dayContent.coding_problem_url,
        coding_problem: dayContent.coding_problem || null,
        coding_problem_url: dayContent.coding_problem_url || null,
        objectives: dayContent.objectives || null,
        key_concepts: dayContent.key_concepts || null,
        is_project_day: !!dayContent.is_project_day,
        project: dayContent.project || null,
        generated_by: dayContent.generated_by || null,
        cached_at: new Date().toISOString(),
        difficulty: dayContent.generated_by === 'static_fallback' ? 'beginner' : level,
        estimated_min: dayContent.estimated_minutes || 90,
        meta: dayContent.meta,
      };

      let { data: upserted, error: upsertErr } = await supabase
        .from('roadmap')
        .upsert(cachePayload, { onConflict: 'user_id,day_number' })
        .select()
        .single();

      // The meta column may not exist yet (20260716 migration). Retry the
      // per-user upsert WITHOUT it before touching the legacy path, so an
      // unapplied meta migration can't silently undo per-user caching.
      if (upsertErr) {
        const noMeta = { ...cachePayload };
        delete noMeta.meta;
        const retryNoMeta = await supabase
          .from('roadmap')
          .upsert(noMeta, { onConflict: 'user_id,day_number' })
          .select()
          .single();
        upserted = retryNoMeta.data;
        upsertErr = retryNoMeta.error;
      }

      // If the per-user / enrichment migration hasn't been applied yet, fall back
      // to the legacy domain-keyed column set so we still cache *something* and
      // don't 500 the user. (Legacy path is domain-global — pre-migration only.)
      if (upsertErr) {
        const legacy = {
          domain_slug: cachePayload.domain_slug,
          week_number: cachePayload.week_number,
          day_number: cachePayload.day_number,
          topic: cachePayload.topic,
          description: cachePayload.description,
          video_url: cachePayload.video_url,
          resource_url: cachePayload.resource_url,
          article_url: cachePayload.article_url,
          doc_url: cachePayload.doc_url,
          difficulty: cachePayload.difficulty,
          estimated_min: cachePayload.estimated_min,
        };
        const retry = await supabase
          .from('roadmap')
          .upsert(legacy, { onConflict: 'domain_slug,day_number' })
          .select()
          .single();
        upserted = retry.data;
      }

      roadmapItem = upserted || roadmapItem || {
        id: 'dummy-roadmap-id-' + displayDay,
        ...cachePayload,
      };
    }

    // ── 3. Upsert project into 'projects' table if project day ───────────
    if (dayContent.is_project_day && dayContent.project) {
      let { data: dbProj } = await supabase
        .from('projects')
        .select('id')
        .eq('domain_slug', user.domain_slug)
        .eq('week_number', week)
        .eq('title', dayContent.project.title)
        .maybeSingle();

      if (!dbProj) {
        const { data: newProj } = await supabase
          .from('projects')
          .insert({
            domain_slug: user.domain_slug,
            week_number: week,
            title: dayContent.project.title,
            description: dayContent.project.description,
            difficulty: dayContent.project.difficulty || 'intermediate',
            steps: dayContent.project.steps || [],
            tech_stack: dayContent.project.resources || [],
            resources: dayContent.project.resources || [],
          })
          .select('id')
          .single();
        dbProj = newProj;
      }

      if (dbProj) dayContent.project.id = dbProj.id;
    }

    const tasks = await ensureTasksExist(
      supabase,
      payload.userId,
      displayDay,
      roadmapItem.id,
      user.domain_slug,
      roadmapItem.topic
    );

    // Neutralize any hallucinated/stale video URL persisted in older cache rows.
    // Every read returns a guaranteed-working topic search link (see helper).
    if (roadmapItem) roadmapItem.video_url = youtubeSearchUrl(roadmapItem.topic);

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const isCompleteDay = completedCount >= TOTAL_TASKS;

    const { data: codingTest } = await supabase
      .from('coding_tests')
      .select('id, title, problem, input_desc, output_desc, example_input, example_output, hints, difficulty')
      .eq('domain_slug', user.domain_slug)
      .limit(1)
      .single();

    let projectProgress = null;
    if (dayContent.is_project_day && dayContent.project?.id) {
      const { data: prog } = await supabase
        .from('project_progress')
        .select('*')
        .eq('user_id', payload.userId)
        .eq('project_id', dayContent.project.id)
        .maybeSingle();
      projectProgress = prog || null;
    }

    return successResponse({
      roadmapItem,
      tasks,
      completedCount,
      totalTasks: TOTAL_TASKS,
      isComplete: isCompleteDay,
      currentDay: displayDay,
      currentWeek: week,
      codingTest: codingTest || null,
      objectives: dayContent.objectives,
      keyConcepts: dayContent.key_concepts,
      codingProblem: dayContent.coding_problem,
      codingProblemUrl: dayContent.coding_problem_url,
      isProjectDay: dayContent.is_project_day,
      project: dayContent.project || null,
      projectProgress,
      generatedBy: dayContent.generated_by,
      cacheHit,
      // Why today looks like this. `targeted: false` (fresh account, no target
      // company, or nothing left to close) means the UI shows no claims at all.
      targeting: targetingForClient(targeting),
      // The gap THIS day was actually generated against, which on a cache hit
      // is the one stored at generation time — not today's recomputed pick.
      dayFocus: (cacheHit ? roadmapItem?.meta?.focus : dayContent?.focus) || null,
      // The pattern-based plan (DSA track only; null everywhere else). The page
      // renders the pattern board from this — no second request.
      patternPlan: patternPlan || null,
      // Same discipline as dayFocus: the pattern THIS day was built for, read
      // from the stored row on a cache hit. Null on every pre-pattern row.
      dayPattern: (cacheHit ? roadmapItem?.meta?.pattern : dayContent?.pattern) || null,
      // Roadmap depth metadata. Old cached rows fall back to their stored
      // estimated_min (real, previously generated) — never invented fields.
      dayMeta: buildDayMeta(dayContent.meta) || buildDayMeta({ estimated_time: roadmapItem?.estimated_min }),
    });
  } catch (error) {
    console.error('Daily roadmap error:', error);
    return errorResponse('Internal server error', 500);
  }
}
