import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';

// Streak day resets at 5AM IST. IST = UTC+5:30, so 5AM IST = UTC+0:30 (previous UTC calendar day).
// Normalise: add 30min to UTC, then take the date portion → "streak day" YYYY-MM-DD string.
export function getStreakDay(date = new Date()) {
  const normalized = new Date(date.getTime() + 30 * 60 * 1000);
  return normalized.toISOString().split('T')[0];
}

// UTC timestamp when a streak day began (= streakDayStr at 00:00 UTC - 30min = prev day 23:30 UTC)
export function getStreakDayStart(streakDayStr) {
  const d = new Date(streakDayStr + 'T00:00:00Z');
  return new Date(d.getTime() - 30 * 60 * 1000);
}

export async function updateStreak(userId) {
  const supabase = getAdminClient();
  const { data: progress } = await supabase
    .from('progress')
    .select('streak, last_active_date')
    .eq('user_id', userId)
    .single();

  const now = new Date();
  const todayStr = getStreakDay(now);
  const lastStr = progress?.last_active_date
    ? getStreakDay(new Date(progress.last_active_date))
    : null;

  // Already counted today — idempotent
  if (lastStr === todayStr) return { streak: progress.streak, changed: false };

  let newStreak;
  if (!lastStr) {
    newStreak = 1;
  } else {
    const dayGap = Math.round(
      (new Date(todayStr + 'T00:00:00Z') - new Date(lastStr + 'T00:00:00Z')) /
      (24 * 60 * 60 * 1000)
    );
    // Consecutive day → increment; any gap → hard reset to 1
    newStreak = dayGap === 1 ? (progress.streak || 0) + 1 : 1;
  }

  const { error: streakErr } = await supabase
    .from('progress')
    .update({ streak: newStreak, last_active_date: now.toISOString() })
    .eq('user_id', userId);
  logWriteError('lib/streak', 'progress.update(streak)', streakErr);

  return { streak: newStreak, changed: true };
}
