import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { generateDayContent } from '@/lib/curriculumGenerator';
import { youtubeSearchUrl } from '@/lib/youtubeEmbed';

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

    let displayDay = currentDay;
    if (lastCompleted && lastCompleted < today && tasksToday >= 5) {
      displayDay = Math.min(currentDay + 1, 365);
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

    const level = user.level || 'beginner';
    const week = Math.ceil(displayDay / 7);

    // ── 1. Try cache first ─────────────────────────────────────────────────
    let { data: roadmapItem } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .eq('day_number', displayDay)
      .maybeSingle();

    let dayContent;
    let cacheHit = false;

    if (isComplete(roadmapItem)) {
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
      };
    } else {
      // ── 2. Cache miss — call AI then persist for next time ──────────────
      dayContent = await generateDayContent(user.domain_slug, displayDay, level, user);

      // The model is asked for a "best YouTube URL" but hallucinates video ids
      // that embed as "Video unavailable". Never trust an AI-produced video URL:
      // store a topic search link instead, which always resolves to real videos.
      dayContent.video_url = youtubeSearchUrl(dayContent.topic);

      const cachePayload = {
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
      };

      let { data: upserted, error: upsertErr } = await supabase
        .from('roadmap')
        .upsert(cachePayload, { onConflict: 'domain_slug,day_number' })
        .select()
        .single();

      // If the enrichment migration hasn't been applied yet, fall back to the
      // legacy column set so we still cache *something* and don't 500 the user.
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
    });
  } catch (error) {
    console.error('Daily roadmap error:', error);
    return errorResponse('Internal server error', 500);
  }
}
