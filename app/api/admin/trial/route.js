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
      
      const { error: writeErr } = await supabase.from('users').update({
        trial_ends_at: newEnd.toISOString(),
        is_on_trial: true,
      }).eq('id', userId);
      if (writeErr) console.error('DB write failed: users.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

      const { error: writeErr2 } = await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'extend_trial',
        details: { days: extDays },
      });
      if (writeErr2) console.error('DB write failed: admin_actions.insert', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });

      return successResponse({ message: `Trial extended by ${extDays} days` });
    }

    if (action === 'revoke') {
      const { error: writeErr3 } = await supabase.from('users').update({
        trial_ends_at: new Date().toISOString(),
        is_on_trial: false,
      }).eq('id', userId);
      if (writeErr3) console.error('DB write failed: users.update', { code: writeErr3.code, message: writeErr3.message, details: writeErr3.details });

      const { error: writeErr4 } = await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'revoke_trial',
      });
      if (writeErr4) console.error('DB write failed: admin_actions.insert', { code: writeErr4.code, message: writeErr4.message, details: writeErr4.details });

      return successResponse({ message: 'Trial revoked' });
    }

    if (action === 'set_plan') {
      const { plan } = await request.json();
      const validPlans = ['spectator', 'player', 'performer', 'dominator'];
      if (!validPlans.includes(plan)) return errorResponse('Invalid plan', 400);

      const { error: writeErr5 } = await supabase.from('users').update({
        subscription_plan: plan,
      }).eq('id', userId);
      if (writeErr5) console.error('DB write failed: users.update', { code: writeErr5.code, message: writeErr5.message, details: writeErr5.details });

      const { error: writeErr6 } = await supabase.from('admin_actions').insert({
        admin_email: payload.email,
        target_user_id: userId,
        action_type: 'set_plan',
        details: { plan },
      });
      if (writeErr6) console.error('DB write failed: admin_actions.insert', { code: writeErr6.code, message: writeErr6.message, details: writeErr6.details });

      return successResponse({ message: `Plan set to ${plan}` });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
