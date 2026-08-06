import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { recordOptOut, clearOptOut } from '@/lib/emailOptOut';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    return successResponse({ preferences: data || {
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      morning_time: '07:00',
      evening_time: '19:00',
    } });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const prefs = await request.json();
    const supabase = getAdminClient();

    const emailEnabled = prefs.email_enabled ?? true;

    const { error: writeErr } = await supabase.from('notification_preferences').upsert({
      user_id: payload.userId,
      email_enabled: emailEnabled,
      push_enabled: prefs.push_enabled ?? true,
      in_app_enabled: prefs.in_app_enabled ?? true,
      morning_time: prefs.morning_time || '07:00',
      evening_time: prefs.evening_time || '19:00',
      push_subscription: prefs.push_subscription || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (writeErr) console.error('DB write failed: notification_preferences.upsert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    // Keep this toggle and the unsubscribe flag in lockstep. Without this, a
    // user who unsubscribed from an email footer and later switched email back
    // on here would see the toggle read "on" while every digest kept skipping
    // them — and turning the toggle off would still leave the crons sending,
    // since only /notifications-v2/send ever consulted email_enabled.
    if (emailEnabled) await clearOptOut(supabase, payload.userId);
    else              await recordOptOut(supabase, payload.userId);

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
