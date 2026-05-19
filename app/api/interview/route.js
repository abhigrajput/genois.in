import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { COMPANY_TYPES, ROUND_CONFIG } from '@/lib/interviewConfig';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: sessions } = await supabase
      .from('interview_sessions')
      .select('id, company_type, company_name, overall_score, verdict, completed, started_at, completed_at')
      .eq('user_id', payload.userId)
      .order('started_at', { ascending: false })
      .limit(10);

    return successResponse({
      companyTypes: COMPANY_TYPES,
      roundConfig: ROUND_CONFIG,
      sessions: sessions || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { companyType, companyName, role } = await request.json();
    const config = COMPANY_TYPES[companyType];
    if (!config) return errorResponse('Invalid company type', 400);

    const supabase = getAdminClient();
    const { data: session } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: payload.userId,
        company_type: companyType,
        company_name: companyName || config.examples[0],
        role: role || 'Software Engineer',
        rounds: config.rounds.map(r => ({ type: r, status: 'pending' })),
        current_round: 0,
      })
      .select()
      .single();

    return successResponse({ session, config });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
