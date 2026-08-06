import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { pickMessage } from '@/lib/notificationMessages';
import { Resend } from 'resend';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isOptedOut, unsubscribeFooterHtml, unsubscribeHeaders } from '@/lib/emailOptOut';

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`notif_send_${payload.userId}`, 10, 3600000)) return rateLimitResponse();
    const { type = 'morning' } = await request.json();
    const supabase = getAdminClient();

    const [{ data: user }, { data: score }, { data: progress }, { data: prefs }] = await Promise.all([
      supabase.from('users').select('name, email').eq('id', payload.userId).single(),
      supabase.from('scores').select('total_score').eq('user_id', payload.userId).single(),
      supabase.from('progress').select('current_day, streak').eq('user_id', payload.userId).single(),
      supabase.from('notification_preferences').select('*').eq('user_id', payload.userId).single(),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });
    const rank = (allScores || []).findIndex(s => s.total_score <= (score?.total_score || 0)) + 1 || 1;

    const context = {
      name: user?.name?.split(' ')[0] || 'Student',
      day: progress?.current_day || 1,
      streak: progress?.streak || 0,
      rank,
    };
    const notif = pickMessage(type, context);

    const { error: writeErr } = await supabase.from('notifications_log').insert({
      user_id: payload.userId,
      type,
      channel: 'in_app',
      title: notif.title,
      message: notif.message,
      icon: notif.icon,
    });
    if (writeErr) console.error('DB write failed: notifications_log.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    // Two gates, deliberately. `email_enabled` is the in-app settings toggle;
    // the opt-out flag is the unsubscribe link, which has to work for a user
    // who has no notification_preferences row at all. The in-app notification
    // above is unaffected either way — opting out of email is not opting out
    // of the product.
    const optedOut = user?.email ? await isOptedOut(supabase, payload.userId) : false;

    if (prefs?.email_enabled !== false && !optedOut && user?.email) {
      try {
        await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          headers: unsubscribeHeaders(payload.userId),
          subject: `${notif.icon} ${notif.title}`,
          html: `<div style="background:#0a0a0f;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00d9a3">GEN</span><span style="color:#e8e8ed">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00d9a3,transparent);margin-bottom:32px;"></div><div style="font-size:56px;margin-bottom:16px;">${notif.icon}</div><h1 style="font-size:22px;font-weight:800;color:#e8e8ed;margin-bottom:12px;">${notif.title}</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">${notif.message}</p><a href="https://genois.in/dashboard" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00d9a3,#ff6b4a);color:#0a0a0f;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;">Open GENOIS →</a><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div>${unsubscribeFooterHtml(payload.userId)}</div>`,
        });
      } catch (e) { console.error('Email notif error:', e.message); }
    }

    return successResponse({ notification: notif });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
