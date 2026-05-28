import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { generateDayContent } from '@/lib/curriculumGenerator';

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
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

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

    let { data: roadmapItem, error: roadmapError } = await supabase
      .from('roadmap')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .eq('day_number', displayDay)
      .single();

    // Get enriched day content from curriculum generator
    const dayContent = await generateDayContent(user.domain_slug, displayDay, user.level || 'beginner');

    if (roadmapError || !roadmapItem) {
      console.log(`Roadmap item for day ${displayDay} in domain ${user.domain_slug} not found. Caching to database...`);
      
      const { data: inserted } = await supabase.from('roadmap').insert({
        domain_slug: user.domain_slug,
        week_number: Math.ceil(displayDay / 7),
        day_number: displayDay,
        topic: dayContent.topic,
        description: dayContent.description,
        video_url: dayContent.video_url,
        resource_url: dayContent.resource_url,
        article_url: dayContent.article_url,
        doc_url: dayContent.coding_problem_url,
        difficulty: dayContent.generated_by === 'static_fallback' ? 'beginner' : (user.level || 'beginner'),
        estimated_min: dayContent.estimated_minutes || 90
      }).select().single();

      if (inserted) {
        roadmapItem = inserted;
      } else {
        // Fallback in-memory
        roadmapItem = {
          id: 'dummy-roadmap-id-' + displayDay,
          domain_slug: user.domain_slug,
          week_number: Math.ceil(displayDay / 7),
          day_number: displayDay,
          topic: dayContent.topic,
          description: dayContent.description,
          video_url: dayContent.video_url,
          resource_url: dayContent.resource_url,
          article_url: dayContent.article_url,
          doc_url: dayContent.coding_problem_url,
          difficulty: 'beginner',
          estimated_min: dayContent.estimated_minutes || 90
        };
      }
    }

    // Upsert project into 'projects' table if project day
    if (dayContent.is_project_day && dayContent.project) {
      let { data: dbProj } = await supabase
        .from('projects')
        .select('id')
        .eq('domain_slug', user.domain_slug)
        .eq('week_number', Math.ceil(displayDay / 7))
        .eq('title', dayContent.project.title)
        .maybeSingle();

      if (!dbProj) {
        const { data: newProj } = await supabase
          .from('projects')
          .insert({
            domain_slug: user.domain_slug,
            week_number: Math.ceil(displayDay / 7),
            title: dayContent.project.title,
            description: dayContent.project.description,
            difficulty: dayContent.project.difficulty || 'intermediate',
            steps: dayContent.project.steps || [],
            tech_stack: dayContent.project.resources || [],
            resources: dayContent.project.resources || []
          })
          .select('id')
          .single();
        dbProj = newProj;
      }
      
      if (dbProj) {
        dayContent.project.id = dbProj.id;
      }
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

    // Query project progress if applicable
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
      isComplete,
      currentDay: displayDay,
      currentWeek: Math.ceil(displayDay / 7),
      codingTest: codingTest || null,
      objectives: dayContent.objectives,
      keyConcepts: dayContent.key_concepts,
      codingProblem: dayContent.coding_problem,
      codingProblemUrl: dayContent.coding_problem_url,
      isProjectDay: dayContent.is_project_day,
      project: dayContent.project || null,
      projectProgress,
      generatedBy: dayContent.generated_by
    });
  } catch (error) {
    console.error('Daily roadmap error:', error);
    return errorResponse('Internal server error', 500);
  }
}
