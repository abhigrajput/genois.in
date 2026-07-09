import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = 'GENOIS <noreply@genois.in>';

export async function sendStreakBreakEmail({ to, name, streak, rank, dashboardUrl }) {
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `🔥 ${name}, your ${streak}-day streak breaks in 2 hours`,
    html: `<div style="background:#020812;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8e8ed">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#ff2d78,transparent);margin-bottom:32px;"></div><div style="font-size:48px;margin-bottom:16px;">🔥</div><h1 style="font-size:24px;font-weight:800;color:#ff2d78;margin-bottom:12px;">Your ${streak}-day streak breaks in 2 hours</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Hey ${name}, you have not completed today tasks yet. Your ${streak}-day streak is about to be lost. You are currently ranked <strong style="color:#00f0ff">#${rank}</strong>.</p><a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#ff6b4a);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Save My Streak Now</a><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div></div>`,
  });
  if (error) { console.error('Streak email error:', error); return false; }
  return true;
}

export async function sendDailyDigestEmail({ to, name, rank, score, streak, topic, currentDay }) {
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ Day ${currentDay} — ${topic} | Your rank: #${rank}`,
    html: `<div style="background:#020812;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8e8ed">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:32px;"></div><h1 style="font-size:22px;font-weight:800;color:#e8e8ed;margin-bottom:8px;">Good morning, ${name} 👋</h1><p style="color:#5a7a9a;font-size:14px;margin-bottom:28px;">Today is Day ${currentDay}. Here is your morning briefing.</p><div style="background:#070f1f;border:1px solid rgba(0,240,255,0.1);border-radius:12px;padding:20px;margin-bottom:20px;"><div style="display:flex;gap:20px;"><div style="text-align:center;flex:1;"><div style="font-size:24px;font-weight:800;color:#00f0ff;">#${rank}</div><div style="font-size:11px;color:#5a7a9a;margin-top:4px;">RANK</div></div><div style="text-align:center;flex:1;"><div style="font-size:24px;font-weight:800;color:#ff6b4a;">${score}</div><div style="font-size:11px;color:#5a7a9a;margin-top:4px;">SCORE</div></div><div style="text-align:center;flex:1;"><div style="font-size:24px;font-weight:800;color:#EF9F27;">🔥${streak}</div><div style="font-size:11px;color:#5a7a9a;margin-top:4px;">STREAK</div></div></div></div><div style="background:#070f1f;border:1px solid rgba(0,240,255,0.1);border-radius:12px;padding:20px;margin-bottom:24px;"><div style="font-size:11px;color:#5a7a9a;letter-spacing:2px;margin-bottom:8px;">TODAY TOPIC</div><div style="font-size:18px;font-weight:700;color:#e8e8ed;">${topic}</div></div><a href="https://genois.in/roadmap" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#ff6b4a);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Start Day ${currentDay}</a><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div></div>`,
  });
  if (error) { console.error('Digest email error:', error); return false; }
  return true;
}

export async function sendTrialExpiryEmail({ to, name, daysLeft, score, rank }) {
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠️ ${daysLeft} day${daysLeft > 1 ? 's' : ''} left on your GENOIS trial — Keep rank #${rank}`,
    html: `<div style="background:#020812;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8e8ed">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#EF9F27,transparent);margin-bottom:32px;"></div><h1 style="font-size:24px;font-weight:800;color:#EF9F27;margin-bottom:12px;">Your free trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Hey ${name}, your trial is ending soon. You have scored <strong style="color:#00f0ff">${score} pts</strong> and reached rank <strong style="color:#ff6b4a">#${rank}</strong>.</p><a href="https://genois.in/subscription" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#ff6b4a);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Upgrade Now from Rs 199 per month</a><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div></div>`,
  });
  if (error) { console.error('Trial expiry email error:', error); return false; }
  return true;
}
