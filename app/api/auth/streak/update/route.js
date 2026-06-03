import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { updateStreak } from '@/lib/streak';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const result = await updateStreak(payload.userId);
    return successResponse(result);
  } catch (error) {
    console.error('streak/update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
