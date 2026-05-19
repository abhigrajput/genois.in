import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: notifs } = await supabase
      .from('notifications_log')
      .select('*')
      .eq('user_id', payload.userId)
      .order('sent_at', { ascending: false })
      .limit(30);

    const unread = notifs?.filter(n => !n.read).length || 0;
    return successResponse({ notifications: notifs || [], unread });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { action, notificationId } = await request.json();
    const supabase = getAdminClient();

    if (action === 'mark_read' && notificationId) {
      await supabase.from('notifications_log').update({
        read: true,
        read_at: new Date().toISOString(),
      }).eq('id', notificationId).eq('user_id', payload.userId);
    }
    if (action === 'mark_all_read') {
      await supabase.from('notifications_log').update({
        read: true,
        read_at: new Date().toISOString(),
      }).eq('user_id', payload.userId).eq('read', false);
    }
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
