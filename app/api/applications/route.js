import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { STAGE_IDS, SOURCE_IDS } from '@/lib/applyDirectory';
import {
  isMissingTable, boundedText, isoDate,
  serializeApplication, APPLICATION_COLUMNS, MAX_APPLICATIONS,
} from '@/lib/applicationRecords';

export const dynamic = 'force-dynamic';

/**
 * The student's own application tracker. Placement Journey, Part 2.
 *
 * SCOPING. Every row belongs to exactly one user and there is no shared or
 * public view of this table anywhere. The list query filters on
 * `user_id = payload.userId` taken from the verified token — never from the
 * request body or a query parameter — so there is no id a caller could supply
 * to widen the read. Creates hard-assign the same value, so a body carrying its
 * own `user_id` is ignored rather than honoured. Per-row edit and delete live
 * in ./[id]/route.js and re-check ownership before writing.
 */

/** GET /api/applications — this user's board, newest application first. */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`applications_read_${payload.userId}`, 60, 60000)) return rateLimitResponse();

    const { data, error } = await getAdminClient()
      .from('job_applications')
      .select(APPLICATION_COLUMNS)
      .eq('user_id', payload.userId)
      .order('applied_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(MAX_APPLICATIONS);

    if (error) {
      // The tracker table is the only storage this feature has. Returning an
      // empty board on a real DB error would look identical to "you haven't
      // applied anywhere yet", so the UI is told which one it is.
      console.warn('[applications] read failed:', error.code, error.message);
      return successResponse({
        available: false,
        applications: [],
        reason: isMissingTable(error) ? 'not_migrated' : 'unavailable',
      });
    }

    return successResponse({ available: true, applications: (data || []).map(serializeApplication) });
  } catch (error) {
    console.error('[applications] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/** POST /api/applications — log one application. */
export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`applications_write_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const company = boundedText(body?.company, 120);
    if (!company) return errorResponse('Company is required', 400);

    const stage = STAGE_IDS.includes(body?.stage) ? body.stage : 'applied';
    const source = SOURCE_IDS.includes(body?.source) ? body.source : null;
    const appliedOn = isoDate(body?.appliedOn);

    const supabase = getAdminClient();

    const { count, error: countErr } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', payload.userId);

    if (countErr && isMissingTable(countErr)) {
      return errorResponse(
        'The application tracker isn\'t set up on this environment yet — the 20260808 migration hasn\'t been applied.',
        503,
      );
    }
    if ((count || 0) >= MAX_APPLICATIONS) {
      return errorResponse(
        `You've reached the ${MAX_APPLICATIONS}-application limit. Delete an old entry to add a new one.`,
        400,
      );
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: payload.userId,   // from the verified token, never from the body
        company,
        role: boundedText(body?.role, 120),
        applied_on: appliedOn,
        stage,
        source,
        notes: boundedText(body?.notes, 2000),
      })
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      console.error('DB write failed: job_applications.insert', { code: error.code, message: error.message, details: error.details });
      if (isMissingTable(error)) {
        return errorResponse(
          'The application tracker isn\'t set up on this environment yet — the 20260808 migration hasn\'t been applied.',
          503,
        );
      }
      return errorResponse('Could not save this application', 500);
    }

    return successResponse({ application: serializeApplication(data) }, 'Application logged', 201);
  } catch (error) {
    console.error('[applications] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
