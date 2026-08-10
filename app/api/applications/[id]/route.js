import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { STAGE_IDS, SOURCE_IDS } from '@/lib/applyDirectory';
import {
  isMissingTable, boundedText, isoDate,
  serializeApplication, APPLICATION_COLUMNS,
} from '@/lib/applicationRecords';

export const dynamic = 'force-dynamic';

/**
 * Per-application edit and delete.
 *
 * NO IDOR. `id` is attacker-controlled, so it is never trusted on its own: both
 * handlers first read the row's `user_id` and compare it to the userId on the
 * verified token, and the mutation itself is additionally constrained with
 * `.eq('user_id', payload.userId)` so even a race between the check and the
 * write cannot touch another student's row. A row belonging to someone else
 * returns 404 — byte-identical to the response for a row that does not exist —
 * so this endpoint cannot be used to probe which application ids are real.
 */

/** Read the row and confirm it belongs to this user. Returns null otherwise. */
async function ownedRow(supabase, id, userId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data.user_id === userId ? data : null;
}

/** PATCH /api/applications/:id — update only the fields present in the body. */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`applications_write_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const supabase = getAdminClient();
    if (!await ownedRow(supabase, id, payload.userId)) return errorResponse('Application not found', 404);

    const updates = { updated_at: new Date().toISOString() };

    if (body.company !== undefined) {
      const company = boundedText(body.company, 120);
      if (!company) return errorResponse('Company cannot be empty', 400);
      updates.company = company;
    }
    if (body.role !== undefined)  updates.role  = boundedText(body.role, 120);
    if (body.notes !== undefined) updates.notes = boundedText(body.notes, 2000);

    if (body.stage !== undefined) {
      if (!STAGE_IDS.includes(body.stage)) return errorResponse('Unknown stage', 400);
      updates.stage = body.stage;
    }
    if (body.source !== undefined) {
      if (body.source !== null && body.source !== '' && !SOURCE_IDS.includes(body.source)) {
        return errorResponse('Unknown source', 400);
      }
      updates.source = body.source === '' ? null : body.source;
    }
    if (body.appliedOn !== undefined) {
      // An explicit null clears the date; a malformed string is an error rather
      // than a silent clear, so a typo cannot erase what the student recorded.
      if (body.appliedOn === null || body.appliedOn === '') {
        updates.applied_on = null;
      } else {
        const d = isoDate(body.appliedOn);
        if (!d) return errorResponse('Date must be YYYY-MM-DD', 400);
        updates.applied_on = d;
      }
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', payload.userId)   // belt and braces alongside ownedRow()
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      console.error('DB write failed: job_applications.update', { code: error.code, message: error.message, details: error.details });
      if (isMissingTable(error)) return errorResponse('The application tracker isn\'t set up on this environment yet.', 503);
      return errorResponse('Could not update this application', 500);
    }

    return successResponse({ application: serializeApplication(data) }, 'Application updated');
  } catch (error) {
    console.error('[applications/:id] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/** DELETE /api/applications/:id */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`applications_write_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();
    if (!await ownedRow(supabase, id, payload.userId)) return errorResponse('Application not found', 404);

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', payload.userId);

    if (error) {
      console.error('DB write failed: job_applications.delete', { code: error.code, message: error.message, details: error.details });
      return errorResponse('Could not delete this application', 500);
    }

    return successResponse({ deleted: true }, 'Application deleted');
  } catch (error) {
    console.error('[applications/:id] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
