import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // 1 query: progress rows inactive for 14+ days
    const { data: staleProgress } = await supabase
      .from('progress')
      .select('user_id, current_day, streak, last_active_date')
      .not('last_active_date', 'is', null)
      .lt('last_active_date', fourteenDaysAgo);

    const userIds = (staleProgress || []).map(p => p.user_id);

    // 1 batched lookup for the matching users
    const { data: users } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, created_at')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
      .not('name', 'is', null);

    const userMap = {};
    for (const u of (users || [])) userMap[u.id] = u;

    const graveyard = [];
    for (const progress of (staleProgress || [])) {
      const user = userMap[progress.user_id];
      if (!user) continue;
      const lastActiveDate = new Date(progress.last_active_date);
      const daysSinceActive = Math.floor((Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24));
      const quitDay = progress.current_day || 1;

      graveyard.push({
        name: user.name,
        college: user.college || 'Unknown College',
        domain: user.domain_slug,
        quitDay,
        streak: progress.streak || 0,
        lastActive: progress.last_active_date,
        daysSinceActive,
        joinedAt: user.created_at,
        epitaph: getEpitaph(quitDay),
      });
    }

    graveyard.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));

    return successResponse({
      students: graveyard.slice(0, 100),
      total: graveyard.length,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

function getEpitaph(day) {
  if (day <= 1) return 'Started but never really began';
  if (day <= 3) return 'The first 3 days beat them';
  if (day <= 7) return 'Could not survive week 1';
  if (day <= 14) return 'Made it 2 weeks then disappeared';
  if (day <= 21) return 'So close to finishing week 3';
  return 'Almost made it to the end';
}
