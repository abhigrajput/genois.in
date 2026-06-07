import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

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

    const supabase = getAdminClient();
    let query = supabase
      .from('knowledge_base')
      .select('content, category, company, domain, difficulty')
      .textSearch('content', q, { type: 'plain', config: 'english' })
      .limit(limit);

    if (domain) query = query.or(`domain.eq.${domain},domain.eq.general`);
    if (company) query = query.or(`company.eq.${company},company.is.null`);

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 400);

    return successResponse({ results: data || [] });
  } catch (error) {
    console.error('RAG search error:', error);
    return errorResponse('Internal server error', 500);
  }
}
