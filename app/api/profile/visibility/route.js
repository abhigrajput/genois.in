import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

// PATCH /api/profile/visibility — opt in/out of the public /u/<name> page.
// Degrades to `available: false` (503) until the 20260812 opt-in migration is
// applied, rather than 500-ing.
const MISSING_COLUMN = new Set(['42703', 'PGRST204']);

export async function PATCH(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    // Hand-validated: zod isn't a dependency in this repo yet.
    if (typeof body?.profile_public !== 'boolean') {
      return errorResponse('profile_public must be a boolean', 400);
    }

    const { data, error } = await getAdminClient()
      .from('users')
      .update({ profile_public: body.profile_public })
      .eq('id', payload.userId)
      .select('profile_public')
      .maybeSingle();

    if (error) {
      if (MISSING_COLUMN.has(error.code)) {
        console.warn('[profile/visibility] column missing:', error.code);
        return successResponse(
          { available: false, reason: 'migration not applied' },
          'Profile visibility is not available yet',
          503
        );
      }
      console.error('[profile/visibility] update failed:', error.code, error.message);
      return errorResponse('Internal server error', 500);
    }

    return successResponse({ success: true, profile_public: data?.profile_public ?? body.profile_public });
  } catch (error) {
    console.error('[profile/visibility] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
