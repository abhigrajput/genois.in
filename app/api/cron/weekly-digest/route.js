import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { isAuthorizedCron } from '@/lib/security';

export async function GET(request) {
  try {
    if (!isAuthorizedCron(request)) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, domain_slug')
      .not('email', 'is', null);

    const { data: leaderboard } = await supabase
      .from('user_progress')
      .select('user_id, total_score, current_day, streak, users(name)')
      .order('total_score', { ascending: false })
      .limit(10);

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    let skipped = 0;

    for (const user of (users || [])) {
      try {
        const { data: alreadySent } = await supabase
          .from('weekly_email_log')
          .select('id')
          .eq('user_id', user.id)
          .eq('week_of', today)
          .single();

        if (alreadySent) { skipped++; continue; }

        const { data: progress } = await supabase
          .from('user_progress')
          .select('total_score, current_day, streak')
          .eq('user_id', user.id)
          .single();

        const userRank = leaderboard?.findIndex(l => l.user_id === user.id) + 1 || null;

        const aiPrompt = `User: ${user.name}, Domain: ${user.domain_slug}, Day: ${progress?.current_day || 0}, Score: ${progress?.total_score || 0}, Streak: ${progress?.streak || 0}. Generate 3 short personalized actionable tips for next week. Return JSON: {"tips":["tip1","tip2","tip3"]}. Keep each tip under 80 chars. Only JSON.`;

        let tips = ['Keep your streak alive', 'Complete one project this week', 'Practice 5 DSA problems daily'];
        try {
          const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5',
              max_tokens: 500,
              messages: [{ role: 'user', content: aiPrompt }],
            }),
          });
          const data = await r.json();
          const text = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(text);
          if (parsed.tips?.length === 3) tips = parsed.tips;
        } catch {}

        await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          subject: `📊 Your weekly GENOIS report — Day ${progress?.current_day || 0}`,
          html: `
            <div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
              <div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span>OIS</div>
              <div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:24px;"></div>
              <h2 style="color:#00f0ff;margin-bottom:16px;">Hi ${user.name?.split(' ')[0] || 'Student'} 👋</h2>
              <p style="color:#8a9ab0;margin-bottom:20px;">Here's how you did this week:</p>
              
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px;">
                <div style="background:#070f1f;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#7b5cff;">${progress?.total_score || 0}</div>
                  <div style="font-size:10px;color:#5a7a9a;">SCORE</div>
                </div>
                <div style="background:#070f1f;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#1D9E75;">${progress?.current_day || 0}</div>
                  <div style="font-size:10px;color:#5a7a9a;">DAY</div>
                </div>
                <div style="background:#070f1f;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#EF9F27;">${progress?.streak || 0}d</div>
                  <div style="font-size:10px;color:#5a7a9a;">STREAK</div>
                </div>
              </div>

              ${userRank ? `<div style="background:linear-gradient(135deg,#00f0ff20,#7b5cff10);border:1px solid #00f0ff40;border-radius:10px;padding:14px;margin-bottom:20px;text-align:center;">
                <div style="font-size:11px;color:#5a7a9a;letter-spacing:2px;">YOUR RANK</div>
                <div style="font-size:24px;font-weight:800;color:#00f0ff;">#${userRank}</div>
              </div>` : ''}

              <div style="background:#070f1f;border-radius:10px;padding:18px;margin-bottom:20px;">
                <div style="color:#1D9E75;font-size:11px;letter-spacing:2px;margin-bottom:10px;">🎯 TIPS FOR NEXT WEEK</div>
                ${tips.map((t, i) => `<div style="padding:6px 0;color:#e8f4ff;font-size:13px;">${i+1}. ${t}</div>`).join('')}
              </div>

              <div style="background:#070f1f;border-radius:10px;padding:18px;margin-bottom:20px;">
                <div style="color:#EF9F27;font-size:11px;letter-spacing:2px;margin-bottom:10px;">🏆 TOP 5 THIS WEEK</div>
                ${(leaderboard || []).slice(0, 5).map((l, i) => `<div style="padding:5px 0;font-size:12px;color:${l.user_id === user.id ? '#00f0ff' : '#e8f4ff'};">#${i+1} ${l.users?.name || 'Anonymous'} — ${l.total_score} pts</div>`).join('')}
              </div>

              <a href="https://www.genois.in/dashboard" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:14px;">Continue Your Journey →</a>

              <div style="color:#3a4a5a;font-size:11px;margin-top:24px;text-align:center;">GENOIS · Built for Tier 2/3 Engineers · genois.in</div>
            </div>
          `,
        });

        await supabase.from('weekly_email_log').insert({
          user_id: user.id,
          week_of: today,
        });
        sent++;
      } catch (e) { 
        console.error('Failed for', user.email, e.message);
      }
    }

    return successResponse({ sent, skipped, total: users?.length || 0 });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
