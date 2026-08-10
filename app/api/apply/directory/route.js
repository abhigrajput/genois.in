import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { buildApplyDirectory } from '@/lib/applyDirectory';
import { getPlacementReadiness } from '@/lib/placementReadiness';

export const dynamic = 'force-dynamic';

/**
 * GET /api/apply/directory
 *
 * The Apply directory (lib/applyDirectory.js), joined to the student's own
 * readiness where one exists.
 *
 * The directory itself is static hand-curated data and identical for every
 * user; it is served from an API route rather than imported by the page because
 * lib/applyDirectory.js reaches into lib/curriculumGenerator.js for the company
 * list, and importing that from a client component would ship the whole AI
 * day-generator to the browser.
 *
 * READINESS IS ATTACHED, NEVER INVENTED. getPlacementReadiness is called with
 * no `companies` override, so it scores exactly the targets on the student's
 * own profile — the same set /readiness shows. A directory company the student
 * has not targeted gets `readiness: null`, and a targeted company without
 * enough evidence gets `{ scored: false }`. Neither case produces a percentage.
 */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`apply_directory_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const directory = buildApplyDirectory();

    // Readiness is a bonus overlay: if it fails for any reason the directory —
    // which is the actual point of the page — must still render.
    let readiness = null;
    try {
      readiness = await getPlacementReadiness(payload.userId);
    } catch (e) {
      console.error('[apply/directory] readiness overlay failed:', e?.message);
    }

    const scores = new Map(
      (readiness?.companies || []).map(c => [c.company, {
        scored: !!c.scored,
        overall: c.scored ? c.overall : null,
        unscoredReason: c.scored ? null : c.unscoredReason || null,
      }]),
    );

    return successResponse({
      ...directory,
      companies: directory.companies.map(c => ({ ...c, readiness: scores.get(c.company) || null })),
      targets: readiness?.targets || [],
      hasTargets: !!readiness?.hasTargets,
      readinessAvailable: !!readiness?.available,
    });
  } catch (error) {
    console.error('[apply/directory] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
