import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
import { sendStreakBreakEmail, sendDailyDigestEmail, sendTrialExpiryEmail } from '@/lib/email';
import { successResponse, errorResponse } from '@/lib/response';
import { loadOptOutSet, optOutUnknown } from '@/lib/emailOptOut';

export async function POST(request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) return errorResponse('Unauthorized', 401);
    const { type } = await request.json();
    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const { data: users } = await supabase.from('users').select('id, name, email, plan, trial_end').not('email', 'is', null);

    // All three email types below are non-transactional, so the opt-out flag
    // gates the whole run. `error` means we could not read the flag at all —
    // abort rather than risk mailing someone who unsubscribed.
    const { ids: optedOut, status: optOutStatus } = await loadOptOutSet(supabase, (users || []).map(u => u.id));
    if (optOutUnknown(optOutStatus)) {
      return errorResponse('Could not read email opt-out state — no email sent', 503);
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of (users || [])) {
      if (optedOut.has(user.id)) { skipped++; continue; }
      try {
        const { data: progress } = await supabase.from('progress').select('current_day, streak, tasks_completed_today, last_completed_date').eq('user_id', user.id).single();
        const { data: score } = await supabase.from('scores').select('total_score').eq('user_id', user.id).single();
        const { data: allScores } = await supabase.from('scores').select('total_score').order('total_score', { ascending: false });
        const myScore = score?.total_score || 0;
        const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1 || 1;
        const streak = progress?.streak || 0;
        const currentDay = progress?.current_day || 1;
        const completedToday = progress?.last_completed_date === today;
        const trialEnd = user.trial_end ? new Date(user.trial_end) : null;
        const trialDaysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const { data: roadmap } = await supabase.from('roadmap').select('topic').eq('domain_slug', 'cloud').eq('day_number', currentDay).single();

        if (type === 'streak_break' && !completedToday && streak > 0) {
          const ok = await sendStreakBreakEmail({ to: user.email, name: user.name || 'Student', streak, rank, dashboardUrl: 'https://genois.in/roadmap', userId: user.id });
          ok ? sent++ : failed++;
        }
        if (type === 'daily_digest') {
          const ok = await sendDailyDigestEmail({ to: user.email, name: user.name || 'Student', rank, score: myScore, streak, topic: roadmap?.topic || 'Continue your roadmap', currentDay, userId: user.id });
          ok ? sent++ : failed++;
        }
        if (type === 'trial_expiry' && trialDaysLeft !== null && [7, 3, 1].includes(trialDaysLeft)) {
          const ok = await sendTrialExpiryEmail({ to: user.email, name: user.name || 'Student', daysLeft: trialDaysLeft, score: myScore, rank, userId: user.id });
          ok ? sent++ : failed++;
        }
      } catch (e) {
        console.error('Email error for user', user.id, e.message);
        failed++;
      }
    }
    return successResponse({ sent, failed, skipped, total: users?.length || 0 });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
