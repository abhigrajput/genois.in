import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { APTITUDE_CATEGORIES, APTITUDE_ROADMAP } from '@/lib/aptitudeConfig';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('aptitude_progress')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    const { data: sessions } = await supabase
      .from('aptitude_sessions')
      .select('category, topic, score, total_questions, completed_at')
      .eq('user_id', payload.userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(10);

    return successResponse({
      progress: progress || {
        total_sessions: 0,
        total_correct: 0,
        total_attempted: 0,
        quant_score: 0,
        logical_score: 0,
        verbal_score: 0,
        current_streak: 0,
      },
      recentSessions: sessions || [],
      categories: APTITUDE_CATEGORIES,
      roadmap: APTITUDE_ROADMAP,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
