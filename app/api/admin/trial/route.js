import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getAdminFromRequest(request);
    if (!payload) return errorResponse('Admin only', 403);

    const { userId, action, days } = await request.json();
    if (!userId || !action) return errorResponse('userId and action required', 400);

    const supabase = getAdminClient();

    if (action === 'extend') {
      const extDays = parseInt(days) || 30;
      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + extDays);
      
      await supabase.from('users').update({
        trial_ends_at: newEnd.toISOString(),
        is_on_trial: true,
      }).eq('id', userId);

      await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'extend_trial',
        details: { days: extDays },
      });

      return successResponse({ message: `Trial extended by ${extDays} days` });
    }

    if (action === 'revoke') {
      await supabase.from('users').update({
        trial_ends_at: new Date().toISOString(),
        is_on_trial: false,
      }).eq('id', userId);

      await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'revoke_trial',
      });

      return successResponse({ message: 'Trial revoked' });
    }

    if (action === 'set_plan') {
      const { plan } = await request.json();
      const validPlans = ['spectator', 'player', 'performer', 'dominator'];
      if (!validPlans.includes(plan)) return errorResponse('Invalid plan', 400);

      await supabase.from('users').update({
        subscription_plan: plan,
      }).eq('id', userId);

      await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'set_plan',
        details: { plan },
      });

      return successResponse({ message: `Plan set to ${plan}` });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
