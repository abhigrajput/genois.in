import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { csrfCheck } from '@/lib/security';
import { getRoadmapTargeting } from '@/lib/roadmapTargeting';
import { getPatternPlan, setProblemSolved } from '@/lib/dsaPatternProgress';
import { isDsaTrack } from '@/lib/curriculumGenerator';

/**
 * Pattern-based DSA roadmap.
 *
 * GET  → the student's whole pattern board: which pattern is current, why it's
 *        current, what unlocks the next one, and the pace their remaining
 *        runway demands.
 * POST → tick / untick one problem in a pattern's list.
 *
 * The plan is computed live rather than cached: it is a rollup of rows that
 * already exist (evidence bus + the pattern progress table), costs no AI call,
 * and MUST reflect a problem the student ticked two seconds ago. The expensive
 * thing — day content generation — keeps its own cache in /api/roadmap/daily.
 */

async function loadUser(supabase, userId) {
  const { data } = await supabase
    .from('users')
    .select('id, name, domain_slug, level, target_companies, weak_subjects, months_to_placement')
    .eq('id', userId)
    .single();
  return data;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();
    const user = await loadUser(supabase, payload.userId);
    if (!user) return errorResponse('User not found', 404);

    const { data: progress } = await supabase
      .from('progress')
      .select('current_day')
      .eq('user_id', payload.userId)
      .maybeSingle();

    // One readiness read, shared with the plan — same discipline as
    // /api/roadmap/daily. Never fatal: no evidence just means an untargeted plan.
    let targeting = null;
    try {
      targeting = await getRoadmapTargeting(payload.userId, {
        dayNumber: progress?.current_day || 1,
      });
    } catch (e) {
      console.warn('[roadmap/patterns] targeting unavailable:', e.message);
    }

    const plan = await getPatternPlan(payload.userId, {
      user,
      targeting,
      currentDay: progress?.current_day || 1,
      // `level: 'advanced'` is what POST /api/roadmap/skip-basics writes, so the
      // toggle keeps meaning the same thing here: skip the foundations pattern.
      skipBasics: user.level === 'advanced',
    });

    return successResponse({
      plan,
      // Rigid track routing (DOMAIN_TRACKS): the pattern board belongs to the
      // DSA track. An AI/ML student still gets the response — the page just
      // doesn't render a C++ DSA syllabus into their Python roadmap.
      dsaTrack: isDsaTrack(user.domain_slug),
      domainSlug: user.domain_slug,
      currentDay: progress?.current_day || 1,
    });
  } catch (error) {
    console.error('Pattern roadmap GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`patterns_post_${payload.userId}`, 60, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const { patternId, problemId, solved } = body || {};
    if (typeof patternId !== 'string' || typeof problemId !== 'string') {
      return errorResponse('patternId and problemId are required', 400);
    }
    if (typeof solved !== 'boolean') {
      return errorResponse('solved must be a boolean', 400);
    }

    const result = await setProblemSolved(payload.userId, patternId, problemId, solved);

    if (!result.ok && result.reason === 'unknown_pattern') {
      return errorResponse('Unknown pattern', 400);
    }
    if (!result.ok && result.reason === 'unknown_problem') {
      return errorResponse('Unknown problem for this pattern', 400);
    }

    // The 20260803 migration isn't applied — say so plainly rather than
    // pretending the tick was saved.
    if (!result.ok) {
      return successResponse(
        { saved: false, solved: result.solved },
        'Per-problem tracking is unavailable on this database'
      );
    }

    return successResponse({ saved: true, patternId, solved: result.solved });
  } catch (error) {
    console.error('Pattern roadmap POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}
