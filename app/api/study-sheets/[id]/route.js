/**
 * GET /api/study-sheets/[id] — one full curated sheet.
 *
 * Also returns `markdown`, the exact text the "Save to my notes" button posts to
 * the existing /api/notes endpoint. Rendering it here rather than in the browser
 * keeps one definition of what a saved sheet looks like, and means the client
 * never has to reassemble the sheet it was just given.
 */

import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getSheet, sheetDetail, sheetToMarkdown } from '@/lib/studySheets';
import { getSheetEvidence } from '@/lib/studySheets/evidence';

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    // `params` is a Promise in this Next.js version — see
    // node_modules/next/dist/docs on dynamic APIs.
    const { id } = await params;
    const sheet = getSheet(id);
    if (!sheet) return errorResponse('Study sheet not found', 404);

    // Per-sheet evidence, same anti-fabrication rules as the index. A missing
    // overlay renders the sheet exactly as it reads for a brand-new account.
    let mine = null;
    try {
      const evidence = await getSheetEvidence(payload.userId);
      if (evidence.available) mine = evidence.bySheet[sheet.id] || null;
    } catch (e) {
      console.warn('[study-sheets] evidence unavailable:', e.message);
    }

    return successResponse({
      sheet: sheetDetail(sheet),
      markdown: sheetToMarkdown(sheet),
      evidence: mine,
    });
  } catch (error) {
    console.error('study-sheet detail error:', error);
    return errorResponse('Internal server error', 500);
  }
}
