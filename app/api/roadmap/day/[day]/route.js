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

function isComplete(row) {
  return !!(row && row.topic && row.video_url && Array.isArray(row.objectives) && row.objectives.length > 0);
}

// View ANY day of the roadmap without advancing the user's official progress.
// This backs free navigation (jump ahead / revisit). The day-status flag lets
// the UI mark days as completed / current / upcoming.
export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 60, 60000)) return rateLimitResponse();

    const { day } = await params;
    const dayNumber = parseInt(day, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 365) {
      return errorResponse('Invalid day number', 400);
    }

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, name, domain_slug, level, college, college_tier, cgpa, target_companies, weak_subjects, months_to_placement, year')
      .eq('id', payload.userId)
      .single();
    if (!user) return errorResponse('User not found', 404);

    const { data: progress } = await supabase
      .from('progress')
      .select('current_day')
      .eq('user_id', payload.userId)
      .single();

    const officialDay = progress?.current_day || 1;
    const week = Math.ceil(dayNumber / 7);
    const level = user.level || 'beginner';

    // ── Cache first, then AI on miss (never advances progress) ──────────────
    let { data: roadmapItem } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .eq('day_number', dayNumber)
      .maybeSingle();

    let dayContent;
    if (isComplete(roadmapItem)) {
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
      dayContent = await generateDayContent(user.domain_slug, dayNumber, level, user);

      const cachePayload = {
        domain_slug: user.domain_slug,
        week_number: week,
        day_number: dayNumber,
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

      roadmapItem = upserted || roadmapItem || { id: 'dummy-roadmap-id-' + dayNumber, ...cachePayload };
    }

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

    // Neutralize hallucinated/stale video URLs from older cache rows with a
    // guaranteed-working topic search link (mirrors /api/roadmap/daily).
    if (roadmapItem) roadmapItem.video_url = youtubeSearchUrl(roadmapItem.topic);

    const tasks = await ensureTasksExist(
      supabase, payload.userId, dayNumber, roadmapItem.id, user.domain_slug, roadmapItem.topic
    );

    const completedCount = tasks.filter(t => t.status === 'completed').length;

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

    // Where does the requested day sit relative to the user's official day?
    const dayStatus = dayNumber < officialDay ? 'completed'
      : dayNumber === officialDay ? 'current'
      : 'upcoming';

    return successResponse({
      roadmapItem,
      tasks,
      completedCount,
      totalTasks: TOTAL_TASKS,
      isComplete: completedCount >= TOTAL_TASKS,
      currentDay: dayNumber,
      officialDay,
      dayStatus,
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
    });
  } catch (error) {
    console.error('Roadmap day view error:', error);
    return errorResponse('Internal server error', 500);
  }
}
