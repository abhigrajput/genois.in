import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { searchKnowledgeBase } from '@/lib/ragSearch';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) return errorResponse('Query param "q" is required', 400);

    const domain = searchParams.get('domain') || null;
    const company = searchParams.get('company') || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10) || 5, 20);

    const results = await searchKnowledgeBase(q, domain, company, limit);
    return successResponse({ results });
  } catch (error) {
    console.error('RAG search error:', error);
    return errorResponse('Internal server error', 500);
  }
}
