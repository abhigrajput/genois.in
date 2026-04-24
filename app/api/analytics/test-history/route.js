import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: tests } = await supabase
      .from('tests')
      .select('id, topic, type, score, result, total_questions, correct_answers, taken_at')
      .eq('user_id', payload.userId)
      .order('taken_at', { ascending: false })
      .limit(50);

    const byType = {};
    (tests || []).forEach(t => {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push(t);
    });

    const avgByType = {};
    Object.keys(byType).forEach(type => {
      const typeTests = byType[type];
      avgByType[type] = {
        count: typeTests.length,
        avgScore: Math.round(
          typeTests.reduce((a, t) => a + (t.score || 0), 0) / typeTests.length
        ),
        tests: typeTests,
      };
    });

    return successResponse({ byType: avgByType, total: tests?.length || 0 });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
