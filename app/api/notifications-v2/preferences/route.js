import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

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

    await supabase.from('notification_preferences').upsert({
      user_id: payload.userId,
      email_enabled: prefs.email_enabled ?? true,
      push_enabled: prefs.push_enabled ?? true,
      in_app_enabled: prefs.in_app_enabled ?? true,
      morning_time: prefs.morning_time || '07:00',
      evening_time: prefs.evening_time || '19:00',
      push_subscription: prefs.push_subscription || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
