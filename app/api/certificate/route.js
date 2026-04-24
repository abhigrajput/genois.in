import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const [
      { data: user },
      { data: progress },
      { data: score },
    ] = await Promise.all([
      supabase.from('users').select('name, college, domain_slug, created_at').eq('id', payload.userId).single(),
      supabase.from('progress').select('current_day, streak, progress_percent').eq('user_id', payload.userId).single(),
      supabase.from('scores').select('total_score').eq('user_id', payload.userId).single(),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });

    const { data: projects } = await supabase
      .from('project_progress')
      .select('id')
      .eq('user_id', payload.userId)
      .eq('status', 'completed');

    const { data: tests } = await supabase
      .from('tests')
      .select('id')
      .eq('user_id', payload.userId);

    const currentDay = progress?.current_day || 1;
    const currentScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= currentScore) + 1 || 1;
    const total = allScores?.length || 1;
    const percentile = Math.round(((total - rank) / total) * 100);
    const isEligible = currentDay >= 30;

    const completionDate = isEligible
      ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return successResponse({
      name: user?.name,
      college: user?.college,
      domain: user?.domain_slug,
      currentDay,
      currentScore,
      rank,
      total,
      percentile,
      streak: progress?.streak || 0,
      projectsDone: projects?.length || 0,
      testsTaken: tests?.length || 0,
      isEligible,
      completionDate,
      certificateId: `GENOIS-${payload.userId.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}`,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
