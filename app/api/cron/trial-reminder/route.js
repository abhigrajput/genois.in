import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const now = new Date();
    const day25Start = new Date(now);
    day25Start.setDate(day25Start.getDate() + 5);
    day25Start.setHours(0,0,0,0);
    const day25End = new Date(day25Start);
    day25End.setHours(23,59,59,999);

    const { data: usersToRemind } = await supabase
      .from('users')
      .select('id, name, email, trial_ends_at')
      .eq('is_on_trial', true)
      .gte('trial_ends_at', day25Start.toISOString())
      .lt('trial_ends_at', day25End.toISOString());

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    for (const user of (usersToRemind || [])) {
      try {
        await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          subject: '⏰ Your GENOIS trial ends in 5 days',
          html: `<div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
            <div style="font-size:28px;font-weight:800;"><span style="color:#00f0ff">GEN</span><span>OIS</span></div>
            <h2 style="color:#EF9F27">5 days left in your trial</h2>
            <p>Hi ${user.name?.split(' ')[0] || 'Student'},</p>
            <p>Your 30-day Dominator trial expires in 5 days.</p>
            <p>Don't lose access to your roadmap, AI mentor, and all features.</p>
            <a href="https://www.genois.in/subscription" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;margin-top:24px;">Choose Your Plan →</a>
          </div>`,
        });
        sent++;
      } catch (e) { console.error('Email failed for', user.email); }
    }

    return successResponse({ sent });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
