import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { isAuthorizedCron } from '@/lib/security';
import { loadOptOutSet, optOutUnknown, unsubscribeFooterHtml, unsubscribeHeaders } from '@/lib/emailOptOut';

export async function GET(request) {
  try {
    if (!isAuthorizedCron(request)) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const now = new Date();
    
    const day5From = new Date(now);
    day5From.setDate(day5From.getDate() + 5);
    day5From.setHours(0,0,0,0);
    const day5To = new Date(day5From);
    day5To.setHours(23,59,59,999);

    const day2From = new Date(now);
    day2From.setDate(day2From.getDate() + 2);
    day2From.setHours(0,0,0,0);
    const day2To = new Date(day2From);
    day2To.setHours(23,59,59,999);

    const { data: day5Users } = await supabase
      .from('users')
      .select('id, name, email, trial_ends_at')
      .eq('is_on_trial', true)
      .gte('trial_ends_at', day5From.toISOString())
      .lt('trial_ends_at', day5To.toISOString());

    const { data: day2Users } = await supabase
      .from('users')
      .select('id, name, email, trial_ends_at')
      .eq('is_on_trial', true)
      .gte('trial_ends_at', day2From.toISOString())
      .lt('trial_ends_at', day2To.toISOString());

    // Trial reminders are upsell mail ("Choose Your Plan"), not account notices,
    // so they are non-transactional and the opt-out flag gates them. Both
    // cohorts are resolved in one read.
    const allIds = [...(day5Users || []), ...(day2Users || [])].map(u => u.id);
    const { ids: optedOut, status: optOutStatus } = await loadOptOutSet(supabase, allIds);
    if (optOutUnknown(optOutStatus)) {
      return errorResponse('Could not read email opt-out state — no reminders sent', 503);
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent5 = 0;
    let sent2 = 0;
    let unsubscribed = 0;

    for (const user of (day5Users || [])) {
      if (optedOut.has(user.id)) { unsubscribed++; continue; }
      try {
        await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          headers: unsubscribeHeaders(user.id),
          subject: '5 days left in your GENOIS trial',
          html: `<div style="background:#0a0a0f;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
            <div style="font-size:28px;font-weight:800;"><span style="color:#00d9a3">GEN</span><span>OIS</span></div>
            <h2 style="color:#EF9F27">5 days left</h2>
            <p>Hi ${user.name?.split(' ')[0] || 'there'},</p>
            <p>Your 30-day Dominator trial expires in 5 days.</p>
            <p>You will lose access to DSA roadmap, AI mentor, interview simulator, and all premium features.</p>
            <a href="https://www.genois.in/subscription" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#00d9a3,#ff6b4a);color:#0a0a0f;text-decoration:none;border-radius:10px;font-weight:800;margin-top:24px;">Choose Your Plan</a>
            ${unsubscribeFooterHtml(user.id)}
          </div>`,
        });
        sent5++;
      } catch (e) { console.error('Failed for', user.email); }
    }

    for (const user of (day2Users || [])) {
      if (optedOut.has(user.id)) { unsubscribed++; continue; }
      try {
        await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          headers: unsubscribeHeaders(user.id),
          subject: 'Last 2 days of your GENOIS trial',
          html: `<div style="background:#0a0a0f;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
            <div style="font-size:28px;font-weight:800;"><span style="color:#ff2d78">GEN</span><span>OIS</span></div>
            <h2 style="color:#ff2d78">Final reminder</h2>
            <p>Hi ${user.name?.split(' ')[0] || 'there'},</p>
            <p>Your trial ends in 2 days. After that, your account becomes Spectator (free) and most features lock.</p>
            <p>Lock in your progress. Pick a plan now.</p>
            <a href="https://www.genois.in/subscription" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#ff2d78,#ff6b4a);color:#0a0a0f;text-decoration:none;border-radius:10px;font-weight:800;margin-top:24px;">Save My Access</a>
            ${unsubscribeFooterHtml(user.id)}
          </div>`,
        });
        sent2++;
      } catch (e) { console.error('Failed for', user.email); }
    }

    return successResponse({ day5Sent: sent5, day2Sent: sent2, unsubscribed });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
