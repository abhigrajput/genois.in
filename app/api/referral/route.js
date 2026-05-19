import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

function generateCode(name) {
  const clean = (name || 'USER').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${random}`;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('name, referral_code, referral_count')
      .eq('id', payload.userId)
      .single();

    let code = user?.referral_code;
    if (!code) {
      code = generateCode(user?.name);
      await supabase.from('users').update({ referral_code: code }).eq('id', payload.userId);
    }

    const { data: referrals } = await supabase
      .from('referrals')
      .select('referred_email, status, created_at, converted_at')
      .eq('referrer_id', payload.userId)
      .order('created_at', { ascending: false });

    const { data: leaderboard } = await supabase
      .from('users')
      .select('name, referral_count')
      .order('referral_count', { ascending: false })
      .limit(10);

    return successResponse({
      referralCode: code,
      shareUrl: `https://www.genois.in/onboarding?ref=${code}`,
      referrals: referrals || [],
      stats: {
        total: referrals?.length || 0,
        converted: referrals?.filter(r => r.status === 'converted').length || 0,
        pending: referrals?.filter(r => r.status === 'pending').length || 0,
      },
      leaderboard: leaderboard || [],
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
