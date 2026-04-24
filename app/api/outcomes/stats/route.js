import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: outcomes } = await supabase
      .from('outcomes')
      .select('*');

    const total = outcomes?.length || 0;
    const interviews = outcomes?.filter(o => o.got_interview).length || 0;
    const passed = outcomes?.filter(o => o.passed_interview).length || 0;
    const hired = outcomes?.filter(o => o.got_job).length || 0;

    const avgCTC = hired > 0
      ? (outcomes.filter(o => o.got_job && o.ctc_lpa > 0).reduce((a, o) => a + o.ctc_lpa, 0) / hired).toFixed(1)
      : 0;

    const scoreRanges = [
      { min: 0, max: 300, label: '0-300' },
      { min: 300, max: 600, label: '300-600' },
      { min: 600, max: 900, label: '600-900' },
      { min: 900, max: 9999, label: '900+' },
    ];

    const correlationData = scoreRanges.map(range => {
      const inRange = outcomes?.filter(o => o.genois_score_at_time >= range.min && o.genois_score_at_time < range.max) || [];
      const interviewRate = inRange.length > 0
        ? Math.round((inRange.filter(o => o.got_interview).length / inRange.length) * 100)
        : 0;
      const hireRate = inRange.length > 0
        ? Math.round((inRange.filter(o => o.got_job).length / inRange.length) * 100)
        : 0;
      return {
        range: range.label,
        total: inRange.length,
        interviewRate,
        hireRate,
      };
    });

    const topCompanies = {};
    outcomes?.filter(o => o.got_job && o.company_name).forEach(o => {
      topCompanies[o.company_name] = (topCompanies[o.company_name] || 0) + 1;
    });

    const companiesList = Object.entries(topCompanies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return successResponse({
      total,
      interviews,
      passed,
      hired,
      avgCTC,
      interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
      hireRate: total > 0 ? Math.round((hired / total) * 100) : 0,
      correlationData,
      topCompanies: companiesList,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
