import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    return successResponse({ outcomes: outcomes || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const body = await request.json();
    const { gotInterview, passedInterview, gotJob, companyName, ctcLpa, notes } = body;

    const { data: score } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug')
      .eq('id', payload.userId)
      .single();

    const { data: outcome, error: writeErr } = await supabase
      .from('outcomes')
      .insert({
        user_id: payload.userId,
        genois_score_at_time: score?.total_score || 0,
        got_interview: gotInterview || false,
        passed_interview: passedInterview || false,
        got_job: gotJob || false,
        company_name: companyName || null,
        ctc_lpa: ctcLpa || 0,
        domain_slug: user?.domain_slug,
        notes: notes || null,
      })
      .select()
      .single();
    if (writeErr) console.error('DB write failed: outcomes.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ outcome });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
