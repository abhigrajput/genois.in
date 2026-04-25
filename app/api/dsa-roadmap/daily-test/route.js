import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { askClaude } from '@/lib/claude';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`dsa_test_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { day, topic } = await request.json();
    if (!topic) return errorResponse('Topic required', 400);

    const cacheKey = buildCacheKey('dsa_test', topic);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ questions: cached.questions, fromCache: true });

    const prompt = `Generate 10 MCQ questions on the DSA topic "${topic}" for Day ${day}.

Return ONLY valid JSON array (no markdown, no extra text):
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "Option A",
    "explanation": "Why this is correct"
  }
]

Mix easy and medium difficulty. Test conceptual understanding.`;

    const result = await askClaude(prompt, 2000);
    const text = (result.text || result).trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleaned);

    await setCached(cacheKey, { questions }, 168);

    return successResponse({ questions });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
