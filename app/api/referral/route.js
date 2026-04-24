import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('referral_code, referral_count, bonus_days')
      .eq('id', payload.userId)
      .single();

    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, status, reward_given, created_at, referred_id')
      .eq('referrer_id', payload.userId)
      .order('created_at', { ascending: false });

    const referralLink = `https://genois.in/onboarding?ref=${user?.referral_code}`;
    const totalReferrals = referrals?.length || 0;
    const successfulReferrals = (referrals || []).filter(r => r.status === 'completed').length;
    const moneySaved = successfulReferrals * 199;

    return successResponse({
      referralCode: user?.referral_code,
      referralLink,
      totalReferrals,
      successfulReferrals,
      bonusDays: user?.bonus_days || 0,
      moneySaved,
      referrals: referrals || [],
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
