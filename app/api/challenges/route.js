import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: challenges } = await supabase
      .from('company_challenges')
      .select('*, companies(name, location)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const { data: myAttempts } = await supabase
      .from('challenge_attempts')
      .select('challenge_id, score, completed')
      .eq('user_id', payload.userId);

    const enriched = (challenges || []).map(c => ({
      ...c,
      companyName: c.companies?.name,
      companyLocation: c.companies?.location,
      myAttempt: myAttempts?.find(a => a.challenge_id === c.id) || null,
    }));

    return successResponse({ challenges: enriched });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
