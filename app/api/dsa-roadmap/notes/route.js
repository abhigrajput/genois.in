import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { askClaude } from '@/lib/claude';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`dsa_notes_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { day, topic } = await request.json();
    if (!topic) return errorResponse('Topic required', 400);

    const cacheKey = buildCacheKey('dsa_notes', topic);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ notes: cached.notes, fromCache: true });

    const prompt = `Create comprehensive study notes for the DSA topic "${topic}" for Day ${day} of a 90-day roadmap.

Include:
1. Brief introduction (2-3 lines)
2. Key concepts (3-5 bullet points)
3. Time/space complexity if applicable
4. Code example in C++ or Python with comments
5. Common mistakes to avoid
6. Practice problems to try

Format as clean markdown. Be concise, clear, and student-friendly.`;

    const result = await askClaude(prompt, 1500);
    const notes = result.text || result;

    await setCached(cacheKey, { notes }, 168);

    return successResponse({ notes });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
