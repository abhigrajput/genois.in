import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users').select('plan, trial_start, trial_end').eq('id', payload.userId).single();

    const { data: trial } = await supabase
      .from('trials').select('*').eq('user_id', payload.userId).single();

    const { data: subscription } = await supabase
      .from('subscriptions').select('*').eq('user_id', payload.userId).single();

    const now = new Date();

    if (user?.plan === 'trial') {
      const trialEnd = trial?.end_date ? new Date(trial.end_date) : null;
      const daysLeft = trialEnd
        ? Math.max(0, Math.ceil((trialEnd - now) / 86400000))
        : 0;

      if (daysLeft === 0 && trialEnd && now > trialEnd) {
        await supabase.from('users').update({ plan: 'free' }).eq('id', payload.userId);
        return successResponse({
          plan: 'free', isActive: false, daysLeft: 0,
          expired: true, message: 'Trial expired',
        });
      }

      return successResponse({
        plan: 'trial', isActive: true, daysLeft,
        trialEnd: trial?.end_date, expired: false,
      });
    }

    if (user?.plan === 'premium' && subscription) {
      return successResponse({
        plan: 'premium',
        isActive: subscription.status === 'active',
        subscription,
      });
    }

    return successResponse({ plan: 'free', isActive: false });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
