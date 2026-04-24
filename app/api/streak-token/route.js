import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('progress')
      .select('streak_tokens, token_used_date, streak, tasks_completed_today, last_completed_date')
      .eq('user_id', payload.userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastCompleted = progress?.last_completed_date;
    const missedYesterday = lastCompleted && lastCompleted < yesterday;

    return successResponse({
      tokens: progress?.streak_tokens || 0,
      streak: progress?.streak || 0,
      tokenUsedDate: progress?.token_used_date || null,
      canUseToken: (progress?.streak_tokens || 0) > 0 && missedYesterday,
      missedYesterday,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { action } = await request.json();
    const supabase = getAdminClient();

    const { data: progress } = await supabase
      .from('progress')
      .select('streak_tokens, streak, last_completed_date, token_used_date')
      .eq('user_id', payload.userId)
      .single();

    if (action === 'use_token') {
      if ((progress?.streak_tokens || 0) <= 0) {
        return errorResponse('No streak tokens available', 400);
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      await supabase.from('progress').update({
        streak_tokens: (progress.streak_tokens || 1) - 1,
        last_completed_date: yesterday,
        token_used_date: today,
      }).eq('user_id', payload.userId);

      return successResponse({
        message: 'Streak saved! Token used.',
        tokensLeft: (progress.streak_tokens || 1) - 1,
      });
    }

    if (action === 'earn_token') {
      const { data: recentTests } = await supabase
        .from('tests')
        .select('score, type')
        .eq('user_id', payload.userId)
        .eq('type', 'weekly')
        .order('taken_at', { ascending: false })
        .limit(1);

      const lastWeeklyTest = recentTests?.[0];
      if (!lastWeeklyTest) return errorResponse('No weekly test found', 400);
      if ((lastWeeklyTest.score || 0) < 100) {
        return errorResponse('Need 100% on weekly test to earn a token', 400);
      }

      await supabase.from('progress').update({
        streak_tokens: (progress?.streak_tokens || 0) + 1,
      }).eq('user_id', payload.userId);

      return successResponse({
        message: 'Token earned! You scored 100% on weekly test.',
        tokens: (progress?.streak_tokens || 0) + 1,
      });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
