import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const supabase = getAdminClient();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: users } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, created_at')
      .not('name', 'is', null);

    const results = [];

    for (const user of (users || [])) {
      const { data: progress } = await supabase
        .from('progress')
        .select('current_day, streak, last_active_date, tasks_completed_today')
        .eq('user_id', user.id)
        .single();

      const lastActive = progress?.last_active_date;
      if (!lastActive) continue;

      const lastActiveDate = new Date(lastActive);
      const threeDaysAgoDate = new Date(threeDaysAgo);

      if (lastActiveDate < threeDaysAgoDate) {
        const { data: score } = await supabase
          .from('scores')
          .select('total_score')
          .eq('user_id', user.id)
          .single();

        const daysSinceActive = Math.floor((Date.now() - lastActiveDate) / (1000 * 60 * 60 * 24));

        results.push({
          name: user.name,
          college: user.college || 'Unknown College',
          domain: user.domain_slug,
          currentDay: progress?.current_day || 1,
          streak: progress?.streak || 0,
          score: score?.total_score || 0,
          lastActive: progress.last_active_date,
          daysSinceActive,
          joinedAt: user.created_at,
        });
      }
    }

    results.sort((a, b) => b.daysSinceActive - a.daysSinceActive);

    return successResponse({ students: results.slice(0, 50), total: results.length });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
