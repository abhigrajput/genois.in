import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'job-readiness';

    const supabase = getAdminClient();

    // Try to get score from scores table, fall back to user record
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, college, domain_slug, created_at')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 404);

    const { data: scoreRow } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    const { data: progressRow } = await supabase
      .from('progress')
      .select('current_day, streak')
      .eq('user_id', payload.userId)
      .single();

    const score = scoreRow?.total_score || 0;
    const day = progressRow?.current_day || 0;
    const streak = progressRow?.streak || 0;

    if (type === 'job-readiness' && score < 700) {
      return errorResponse(`You need 700+ score for Job Readiness Certificate. Current: ${score}`, 400);
    }

    if (type === 'completion' && day < 90) {
      return errorResponse(`Complete all 90 days for Completion Certificate. Current: Day ${day}`, 400);
    }

    const cert = {
      type,
      recipientName: user.name,
      college: user.college || 'Engineering College',
      domain: (user.domain_slug || 'Full Stack').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      score,
      day,
      streak,
      issueDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      certId: `GENOIS-${type === 'job-readiness' ? 'JR' : 'CP'}-${payload.userId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      verifyUrl: `https://www.genois.in/verify/${payload.userId.substring(0, 8)}`,
    };

    return successResponse({ certificate: cert });
  } catch (error) {
    console.error('Certificate error:', error);
    return errorResponse('Internal server error', 500);
  }
}
