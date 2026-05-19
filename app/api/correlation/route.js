import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAdminFromRequest } from '@/lib/adminAuth';
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

    const { data: allScores } = await supabase
      .from('scores')
      .select('user_id, total_score')
      .order('total_score', { ascending: false });

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, domain_slug, college');

    const { data: allProgress } = await supabase
      .from('progress')
      .select('user_id, current_day, streak, diagnostic_score');

    const total = outcomes?.length || 0;
    const interviews = outcomes?.filter(o => o.got_interview).length || 0;
    const hired = outcomes?.filter(o => o.got_job).length || 0;

    const scoreRanges = [
      { min: 0, max: 200, label: '0-200' },
      { min: 200, max: 400, label: '200-400' },
      { min: 400, max: 600, label: '400-600' },
      { min: 600, max: 900, label: '600-900' },
      { min: 900, max: 9999, label: '900+' },
    ];

    const correlationData = scoreRanges.map(range => {
      const inRange = outcomes?.filter(o =>
        o.genois_score_at_time >= range.min &&
        o.genois_score_at_time < range.max
      ) || [];
      const interviewRate = inRange.length > 0
        ? Math.round((inRange.filter(o => o.got_interview).length / inRange.length) * 100)
        : 0;
      const hireRate = inRange.length > 0
        ? Math.round((inRange.filter(o => o.got_job).length / inRange.length) * 100)
        : 0;
      const avgCTC = inRange.filter(o => o.got_job && o.ctc_lpa > 0).length > 0
        ? (inRange.filter(o => o.got_job).reduce((a, o) => a + (o.ctc_lpa || 0), 0) / inRange.filter(o => o.got_job && o.ctc_lpa > 0).length).toFixed(1)
        : 0;
      return {
        range: range.label,
        total: inRange.length,
        interviewRate,
        hireRate,
        avgCTC: parseFloat(avgCTC),
      };
    });

    const domainStats = {};
    outcomes?.forEach(o => {
      const domain = o.domain_slug || 'unknown';
      if (!domainStats[domain]) {
        domainStats[domain] = { total: 0, interviews: 0, hired: 0, totalCTC: 0, hiredWithCTC: 0 };
      }
      domainStats[domain].total++;
      if (o.got_interview) domainStats[domain].interviews++;
      if (o.got_job) {
        domainStats[domain].hired++;
        if (o.ctc_lpa > 0) {
          domainStats[domain].totalCTC += o.ctc_lpa;
          domainStats[domain].hiredWithCTC++;
        }
      }
    });

    const domainBreakdown = Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      total: stats.total,
      interviewRate: stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0,
      hireRate: stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0,
      avgCTC: stats.hiredWithCTC > 0 ? (stats.totalCTC / stats.hiredWithCTC).toFixed(1) : 0,
    })).sort((a, b) => b.hireRate - a.hireRate);

    const topCompanies = {};
    outcomes?.filter(o => o.got_job && o.company_name).forEach(o => {
      if (!topCompanies[o.company_name]) topCompanies[o.company_name] = { count: 0, totalCTC: 0, ctcCount: 0 };
      topCompanies[o.company_name].count++;
      if (o.ctc_lpa > 0) {
        topCompanies[o.company_name].totalCTC += o.ctc_lpa;
        topCompanies[o.company_name].ctcCount++;
      }
    });

    const companiesList = Object.entries(topCompanies)
      .map(([name, data]) => ({
        name,
        hires: data.count,
        avgCTC: data.ctcCount > 0 ? (data.totalCTC / data.ctcCount).toFixed(1) : 0,
      }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 10);

    const skillLiftData = [];
    if (allProgress) {
      const withDiagnostic = allProgress.filter(p => p.diagnostic_score > 0);
      withDiagnostic.forEach(p => {
        const score = allScores?.find(s => s.user_id === p.user_id);
        if (score) {
          skillLiftData.push({
            diagnosticScore: p.diagnostic_score,
            currentScore: score.total_score,
            currentDay: p.current_day,
            lift: score.total_score > p.diagnostic_score
              ? Math.round(((score.total_score - p.diagnostic_score) / Math.max(p.diagnostic_score, 1)) * 100)
              : 0,
          });
        }
      });
    }

    const avgSkillLift = skillLiftData.length > 0
      ? Math.round(skillLiftData.reduce((a, s) => a + s.lift, 0) / skillLiftData.length)
      : 0;

    return successResponse({
      summary: {
        totalOutcomes: total,
        totalInterviews: interviews,
        totalHired: hired,
        interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
        hireRate: total > 0 ? Math.round((hired / total) * 100) : 0,
        avgCTC: hired > 0
          ? (outcomes.filter(o => o.got_job && o.ctc_lpa > 0).reduce((a, o) => a + o.ctc_lpa, 0) / Math.max(outcomes.filter(o => o.got_job && o.ctc_lpa > 0).length, 1)).toFixed(1)
          : 0,
        totalStudents: allScores?.length || 0,
        avgSkillLift,
        skillLiftSamples: skillLiftData.length,
      },
      correlationData,
      domainBreakdown,
      topCompanies: companiesList,
      skillLiftData: skillLiftData.slice(0, 20),
      keyInsight: interviews > 0 && total > 0
        ? `Students with GENOIS score 600+ have a ${correlationData.find(d => d.range === '600-900')?.interviewRate || 0}% interview success rate`
        : 'Collecting data — report your outcomes to build this graph',
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
