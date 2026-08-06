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
      // Fatal: "Trial extended" is what the admin acts on. A silent no-op here
      // leaves them believing a user has access that the user does not have.
      if (writeErr) {
        console.error('ADMIN_TRIAL_EXTEND_FAILED:', { targetUserId: userId, code: writeErr.code, message: writeErr.message, details: writeErr.details });
        return errorResponse('Could not extend the trial. Nothing was changed.', 500);
      }

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
      // Fatal: a revoke that silently no-ops leaves access in place while the
      // admin is told it is gone — the worst direction for this to fail in.
      if (writeErr3) {
        console.error('ADMIN_TRIAL_REVOKE_FAILED:', { targetUserId: userId, code: writeErr3.code, message: writeErr3.message, details: writeErr3.details });
        return errorResponse('Could not revoke the trial. Nothing was changed.', 500);
      }

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
      // Fatal: same reasoning — the reported plan must match the stored plan.
      if (writeErr5) {
        console.error('ADMIN_SET_PLAN_FAILED:', { targetUserId: userId, plan, code: writeErr5.code, message: writeErr5.message, details: writeErr5.details });
        return errorResponse('Could not set the plan. Nothing was changed.', 500);
      }

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
