import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return errorResponse('User ID required', 400);

    const supabase = getAdminClient();

    const [
      { data: user },
      { data: score },
      { data: progress },
      aptitudeResult,
      interviewResult,
      subResult,
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('scores').select('*').eq('user_id', userId).single(),
      supabase.from('progress').select('*').eq('user_id', userId).single(),
      supabase.from('aptitude_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10).catch(() => ({ data: [] })),
      supabase.from('interview_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(5).catch(() => ({ data: [] })),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single().catch(() => ({ data: null })),
    ]);

    const { password_hash: _, ...safeUser } = user || {};

    return successResponse({
      user: safeUser,
      score,
      progress,
      subscription: subResult.data || null,
      aptitudeSessions: aptitudeResult.data || [],
      interviewSessions: interviewResult.data || [],
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
