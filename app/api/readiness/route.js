import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { getPlacementReadiness } from '@/lib/placementReadiness';

export const dynamic = 'force-dynamic';

/**
 * Placement Readiness — per-company score, computed on read.
 *
 * GET /api/readiness                      → score the user's profile targets
 * GET /api/readiness?companies=TCS,Google → score these instead (must exist in
 *                                           the COMPANY_PROFILES map)
 *
 * Everything is derived from existing tables (test_questions via the Phase 1
 * evidence bus, resume_analyses, interview_results) — there is no readiness
 * table and nothing is cached. Missing tables degrade to `measured: false` on
 * the affected dimension rather than failing the request.
 */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`readiness_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const raw = new URL(request.url).searchParams.get('companies');
    const companies = raw
      ? raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10)
      : null;

    return successResponse(await getPlacementReadiness(payload.userId, { companies }));
  } catch (error) {
    console.error('[readiness] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
