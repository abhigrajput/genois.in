import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const params = await context.params;
    const weekNumber = parseInt(params?.week) || 1;
    const projectWeek = Math.ceil(weekNumber / 2) || 1;
    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 404);

    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('domain_slug', user.domain_slug)
      .eq('week_number', projectWeek)
      .order('created_at', { ascending: true })
      .limit(1);

    if (projError) return errorResponse(projError.message, 500);
    if (!projects || projects.length === 0) {
      return errorResponse('No project found for this week', 404);
    }

    const project = projects[0];

    // Get or create progress using maybeSingle
    let { data: progress, error: progressError } = await supabase
      .from('project_progress')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('project_id', project.id)
      .maybeSingle();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Progress fetch error:', progressError);
    }

    if (!progress) {
      const { data: created, error: createError } = await supabase
        .from('project_progress')
        .insert({
          user_id: payload.userId,
          project_id: project.id,
          current_step: 0,
          total_steps: 4,
          status: 'not_started',
        })
        .select()
        .single();

      if (createError) {
        console.error('Create progress error:', createError);
        progress = { current_step: 0, total_steps: 4, status: 'not_started' };
      } else {
        progress = created;
      }
    }

    return successResponse({ project, progress });
  } catch (error) {
    console.error('Projects week error:', error);
    return errorResponse('Internal server error', 500);
  }
}
