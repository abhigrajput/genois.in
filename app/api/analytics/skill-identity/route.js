import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const [
      { data: skill },
      { data: weak },
      { data: strong },
      { data: score },
      { data: progress },
    ] = await Promise.all([
      supabase.from('skill_identity').select('*').eq('user_id', payload.userId).single(),
      supabase.from('weak_topics').select('*').eq('user_id', payload.userId).order('avg_score', { ascending: true }),
      supabase.from('strong_topics').select('*').eq('user_id', payload.userId).order('avg_score', { ascending: false }),
      supabase.from('scores').select('*').eq('user_id', payload.userId).single(),
      supabase.from('progress').select('*').eq('user_id', payload.userId).single(),
    ]);

    const { data: completedProjects } = await supabase
      .from('project_progress').select('id')
      .eq('user_id', payload.userId).eq('status', 'completed');

    const { data: tests } = await supabase
      .from('tests').select('score')
      .eq('user_id', payload.userId)
      .order('taken_at', { ascending: false }).limit(20);

    const avgTestScore = tests && tests.length > 0
      ? Math.round(tests.reduce((a, t) => a + (t.score || 0), 0) / tests.length)
      : 0;

    const progressPct = skill?.progress_percent || 0;
    const streak = progress?.streak || 0;
    const projectsDone = completedProjects?.length || 0;

    // The 6 "skill areas" and job_ready_score used to be derived from arbitrary
    // constants (coding_score/5, coding_score/8, streak*5, projects*25) while
    // job_ready_score is never actually written — so both were presented as a
    // measured profile without measuring anything. Until a real Readiness system
    // exists we return no axes and no readiness number, and clients render an
    // empty state. The DB columns are untouched; we simply stop inventing values.
    return successResponse({
      skillLevel: skill?.skill_level || 'beginner',
      progressPercent: Math.round(progressPct),
      domainLevel: skill?.domain_level || 'beginner',
      weakTopics: weak || [],
      strongTopics: strong || [],
      readinessAvailable: false,
      skillAreas: null,
      stats: {
        totalTests: tests?.length || 0,
        avgTestScore,
        completedProjects: projectsDone,
        streak,
        currentDay: progress?.current_day || 1,
        totalScore: score?.total_score || 0,
      },
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
