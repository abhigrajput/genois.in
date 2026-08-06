import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 20, 60000)) return rateLimitResponse();

    // Next.js 15 requires awaiting params
    const params = await context.params;
    const projectId = params?.id;

    if (!projectId || projectId === 'undefined') {
      return errorResponse('Invalid project ID', 400);
    }

    const body = await request.json();
    const stepNumber = parseInt(body.stepNumber);

    if (isNaN(stepNumber) || stepNumber < 0) {
      return errorResponse('Invalid step number', 400);
    }

    const supabase = getAdminClient();

    // Get or create progress
    let { data: progress } = await supabase
      .from('project_progress')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (!progress) {
      const { data: created, error: createError } = await supabase
        .from('project_progress')
        .insert({
          user_id: payload.userId,
          project_id: projectId,
          current_step: 0,
          total_steps: 4,
          status: 'in_progress',
        })
        .select()
        .single();

      if (createError) {
        return errorResponse('Failed to create progress: ' + createError.message, 500);
      }
      progress = created;
    }

    // Always move forward, never backward
    const newStep = Math.max(progress.current_step, stepNumber + 1);
    const isComplete = newStep >= 4;

    const { data: updated, error: updateError } = await supabase
      .from('project_progress')
      .update({
        current_step: newStep,
        status: isComplete ? 'completed' : 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', payload.userId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return errorResponse('Failed to update progress: ' + updateError.message, 500);
    }

    // Award points — don't let score failure block step
    try {
      const { error: writeErr } = await supabase.from('score_events').insert({
        user_id: payload.userId,
        event_type: 'project_step',
        points: 8,
        description: 'Completed project step ' + (stepNumber + 1),
      });
      if (writeErr) console.error('DB write failed: score_events.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
    } catch (e) {
      console.error('Score event error:', e.message);
    }

    return successResponse({
      progress: updated,
      message: isComplete ? 'All steps done! Submit your project.' : 'Step ' + (stepNumber + 1) + ' completed!',
    });
  } catch (error) {
    console.error('Project step error:', error);
    return errorResponse('Internal server error', 500);
  }
}
