/**
 * GET /api/study-sheets — the curated library index.
 *
 * Returns every sheet as a light summary row (no concept bodies — those come
 * from /api/study-sheets/[id]), plus an optional evidence overlay keyed by
 * sheet id.
 *
 * Serving this touches no AI provider and, when the evidence read fails, no
 * database either. The library is static content; the only thing that can be
 * unavailable is the personalisation on top of it, and that degrades to a plain
 * catalogue rather than an error.
 */

import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { listSheets, SHEET_GROUPS } from '@/lib/studySheets';
import { getSheetEvidence } from '@/lib/studySheets/evidence';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const sheets = listSheets();

    // Never fatal: a student with no evidence, or a database without the
    // evidence table, still gets the full library — just without the overlay.
    let evidence = { available: false, hasAnyEvidence: false, bySheet: {}, weakest: [] };
    try {
      evidence = await getSheetEvidence(payload.userId);
    } catch (e) {
      console.warn('[study-sheets] evidence overlay unavailable:', e.message);
    }

    return successResponse({
      sheets,
      groups: SHEET_GROUPS,
      evidence: {
        available: evidence.available,
        hasAnyEvidence: evidence.hasAnyEvidence,
        questionsScanned: evidence.questionsScanned || 0,
        bySheet: evidence.bySheet,
        weakest: evidence.weakest,
      },
    });
  } catch (error) {
    console.error('study-sheets index error:', error);
    return errorResponse('Internal server error', 500);
  }
}
