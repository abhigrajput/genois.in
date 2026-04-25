import { COMPANIES } from '@/lib/companiesData';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`company_ai_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { slug } = await params;
    const company = COMPANIES.find(c => c.slug === slug);
    if (!company) return errorResponse('Company not found', 404);

    const cacheKey = buildCacheKey('company_questions', slug);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ questions: cached, fromCache: true });

    const prompt = `Generate 10 realistic interview questions asked at ${company.fullName}. Mix technical (DSA, system design, CS fundamentals) and behavioral. Return JSON array: [{"category":"technical|behavioral","difficulty":"easy|medium|hard","question":"..."}]. Only JSON no markdown.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
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
    const data = await r.json();
    let text = data.content?.[0]?.text || '[]';
    text = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(text);

    setCached(cacheKey, questions, 168);
    return successResponse({ questions });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
