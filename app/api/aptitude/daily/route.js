import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`aptitude_daily_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Generate exactly 3 daily aptitude questions — 1 quantitative, 1 logical reasoning, 1 verbal ability.
These should be typical TCS/Infosys/Wipro placement test level.
Difficulty: medium.

Return ONLY valid JSON array of exactly 3 questions:
[
  {
    "category": "quant|logical|verbal",
    "question": "full question",
    "options": ["A option", "B option", "C option", "D option"],
    "correct": "A option",
    "explanation": "step by step solution",
    "topic": "topic name"
  }
]`;

    const cacheKey = buildCacheKey('daily_aptitude', today);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ questions: cached, date: today, fromCache: true });

    const text = await callClaude(prompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      setCached(cacheKey, questions, 24);
    } catch {
      return errorResponse('Failed to generate daily questions', 500);
    }

    return successResponse({ questions, date: today });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
