import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { generateProjectFeedback } from '@/lib/claudeHelpers';

export async function POST(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const projectId = params.id;
    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('project_progress').select('*')
      .eq('user_id', payload.userId)
      .eq('project_id', projectId)
      .single();

    if (!progress) return errorResponse('Project not found', 404);
    if (progress.current_step < 4) {
      return errorResponse('Complete all 4 steps before submitting', 400);
    }

    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).single();

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const aiFeedback = await generateProjectFeedback(
      project.title, project.description,
      user.domain_slug, user.level
    );

    const score = 30;
    await supabase.from('project_progress').update({
      status: 'completed',
      score,
      ai_feedback: aiFeedback,
      submitted_at: new Date().toISOString(),
    }).eq('user_id', payload.userId).eq('project_id', projectId);

    const { data: currentScore } = await supabase
      .from('scores').select('total_score, project_score').eq('user_id', payload.userId).single();

    if (currentScore) {
      await supabase.from('scores').update({
        total_score: (currentScore.total_score || 0) + score,
        project_score: (currentScore.project_score || 0) + score,
      }).eq('user_id', payload.userId);
    }

    await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'project',
      points: score,
      reason: `Completed project: ${project.title}`,
    });

    return successResponse({ score, aiFeedback, message: 'Project submitted!' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
