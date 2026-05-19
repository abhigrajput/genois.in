import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { DIAGNOSTIC_THEORY, DIAGNOSTIC_CODING } from '@/lib/dsaCurriculumLevels';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: progress } = await supabase
      .from('dsa_roadmap_progress')
      .select('level, diagnostic_taken_at, next_diagnostic_date')
      .eq('user_id', payload.userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const canRetake = !progress?.next_diagnostic_date || progress.next_diagnostic_date <= today;

    return successResponse({
      level: progress?.level || null,
      lastTaken: progress?.diagnostic_taken_at,
      nextRetakeDate: progress?.next_diagnostic_date,
      canRetake,
      theoryQuestions: DIAGNOSTIC_THEORY,
      codingQuestions: DIAGNOSTIC_CODING,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`dsa_diag_submit_${payload.userId}`, 2, 3600000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { theoryAnswers, codingAnswers } = body || {};
    if (!Array.isArray(theoryAnswers) || !Array.isArray(codingAnswers)) {
      return errorResponse('Invalid answers', 400);
    }

    let theoryCorrect = 0;
    DIAGNOSTIC_THEORY.forEach((q, i) => {
      if (theoryAnswers[i] === q.correct) theoryCorrect++;
    });
    const theoryScore = Math.round((theoryCorrect / DIAGNOSTIC_THEORY.length) * 100);

    let codingCorrect = 0;
    codingAnswers.forEach(a => {
      if (a && a.length > 20) codingCorrect++;
    });
    const codingScore = Math.round((codingCorrect / DIAGNOSTIC_CODING.length) * 100);

    const totalScore = Math.round((theoryScore + codingScore) / 2);

    let level;
    if (totalScore < 30) level = 'beginner';
    else if (totalScore < 70) level = 'intermediate';
    else level = 'advanced';

    const supabase = getAdminClient();
    const nextRetake = new Date();
    nextRetake.setDate(nextRetake.getDate() + 30);

    await supabase.from('dsa_diagnostic_tests').insert({
      user_id: payload.userId,
      theory_score: theoryScore,
      coding_score: codingScore,
      total_score: totalScore,
      determined_level: level,
    });

    await supabase.from('dsa_roadmap_progress').upsert({
      user_id: payload.userId,
      level,
      current_day: 1,
      diagnostic_score: totalScore,
      diagnostic_taken_at: new Date().toISOString(),
      next_diagnostic_date: nextRetake.toISOString().split('T')[0],
      last_active_date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id' });

    return successResponse({
      theoryScore,
      codingScore,
      totalScore,
      level,
      message: `You scored ${totalScore}%. Starting at ${level} level. Next retake available in 30 days.`,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
