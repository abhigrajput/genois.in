import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const supabase = getAdminClient();

    const { data: users } = await supabase
      .from('users')
      .select('id, college, domain_slug')
      .not('college', 'is', null)
      .neq('college', '');

    const { data: scores } = await supabase
      .from('scores')
      .select('user_id, total_score');

    const { data: progress } = await supabase
      .from('progress')
      .select('user_id, streak, current_day');

    const scoreMap = {};
    (scores || []).forEach(s => { scoreMap[s.user_id] = s.total_score || 0; });

    const progressMap = {};
    (progress || []).forEach(p => { progressMap[p.user_id] = p; });

    const collegeMap = {};
    (users || []).forEach(u => {
      if (!u.college) return;
      const college = u.college.trim();
      if (!collegeMap[college]) {
        collegeMap[college] = {
          college,
          students: 0,
          totalScore: 0,
          avgScore: 0,
          totalStreak: 0,
          avgStreak: 0,
          topScore: 0,
          domains: {},
        };
      }
      const s = scoreMap[u.user_id] || scoreMap[u.id] || 0;
      const p = progressMap[u.user_id] || progressMap[u.id] || {};
      collegeMap[college].students++;
      collegeMap[college].totalScore += s;
      collegeMap[college].totalStreak += p.streak || 0;
      if (s > collegeMap[college].topScore) collegeMap[college].topScore = s;
      if (u.domain_slug) {
        collegeMap[college].domains[u.domain_slug] = (collegeMap[college].domains[u.domain_slug] || 0) + 1;
      }
    });

    const colleges = Object.values(collegeMap)
      .map(c => ({
        college: c.college,
        students: c.students,
        avgScore: c.students > 0 ? Math.round(c.totalScore / c.students) : 0,
        totalScore: c.totalScore,
        topScore: c.topScore,
        avgStreak: c.students > 0 ? Math.round(c.totalStreak / c.students) : 0,
        topDomain: Object.entries(c.domains).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed',
      }))
      .filter(c => c.students > 0)
      .sort((a, b) => b.avgScore - a.avgScore);

    return successResponse({ colleges, total: colleges.length });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
