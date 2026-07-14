import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { invalidateUserRoadmap } from '@/lib/roadmapCache';

// Manual "Regenerate My Roadmap" — clears the user's cached roadmap so the next
// /api/roadmap/daily fetch rebuilds it from their current profile. The actual
// (expensive) AI generation happens lazily on that next read, so this stays
// cheap; the rate limit just stops someone from hammering the reset.
export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`regen_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    await invalidateUserRoadmap(payload.userId);
    return successResponse({ regenerated: true }, 'Roadmap cleared — regenerating from your latest profile');
  } catch (error) {
    console.error('Roadmap regenerate error:', error);
    return errorResponse('Internal server error', 500);
  }
}
