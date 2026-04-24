import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');

    const supabase = getAdminClient();
    let query = supabase
      .from('tests')
      .select('id, topic, type, score, result, total_questions, correct_answers, taken_at, domain_slug')
      .eq('user_id', payload.userId)
      .order('taken_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);

    if (type) query = query.eq('type', type);
    const { data: tests } = await query;

    return successResponse({ tests: tests || [], page });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
