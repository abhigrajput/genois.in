import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { getSkillTierData } from '@/lib/skillLevel';

export async function GET(request, context) {
  try {
    const { username } = await context.params;
    const supabase = getAdminClient();
    const decoded = decodeURIComponent(username);

    const { data: users } = await supabase
      .from('users')
      .select('id, name, college, domain_slug, linkedin_url, github_username, github_url, github_repos, github_stars, github_languages, created_at');

    if (!users || users.length === 0) return errorResponse('Profile not found', 404);

    const user = users.find(u =>
      u.name?.toLowerCase() === decoded.toLowerCase() ||
      u.name?.toLowerCase().replace(/\s+/g, '-') === decoded.toLowerCase() ||
      u.name?.toLowerCase().replace(/\s+/g, '') === decoded.toLowerCase()
    );

    if (!user) return errorResponse('Profile not found', 404);

    return await buildProfile(user, supabase);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

async function buildProfile(user, supabase) {
  const [
    { data: score },
    { data: progress },
    { data: allScores },
    { data: tests },
    { data: diagnostic },
    { data: outcomes },
    { data: verifiedSkills },
  ] = await Promise.all([
    supabase.from('scores').select('total_score').eq('user_id', user.id).single(),
    supabase.from('progress').select('current_day, streak, diagnostic_score, diagnostic_taken').eq('user_id', user.id).single(),
    supabase.from('scores').select('total_score').order('total_score', { ascending: false }),
    supabase.from('tests').select('score, type, taken_at').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(10),
    supabase.from('diagnostic_tests').select('score, skill_level').eq('user_id', user.id).single(),
    supabase.from('outcomes').select('got_job, got_interview, company_name, ctc_lpa').eq('user_id', user.id),
    supabase.from('skill_verifications').select('skill_name, skill_slug, level, score, badge, expires_at, status').eq('user_id', user.id).eq('status', 'verified'),
  ]);

  const myScore = score?.total_score || 0;
  const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1 || 1;
  const total = allScores?.length || 1;
  const percentile = Math.round(((total - rank) / total) * 100);
  const avgTestScore = tests?.length > 0
    ? Math.round(tests.reduce((a, t) => a + (t.score || 0), 0) / tests.length)
    : 0;
  const hired = outcomes?.some(o => o.got_job);
  const jobData = outcomes?.find(o => o.got_job);

  return successResponse({
    name: user.name,
    college: user.college,
    domain: user.domain_slug,
    linkedinUrl: user.linkedin_url,
    githubUsername: user.github_username,
    githubUrl: user.github_url,
    githubRepos: user.github_repos || 0,
    githubStars: user.github_stars || 0,
    githubLanguages: user.github_languages || [],
    joinedAt: user.created_at,
    score: myScore,
    rank,
    total,
    percentile,
    currentDay: progress?.current_day || 1,
    streak: progress?.streak || 0,
    avgTestScore,
    diagnosticScore: diagnostic?.score || null,
    skillLevel: diagnostic?.skill_level || null,
    hired,
    company: jobData?.company_name || null,
    ctc: jobData?.ctc_lpa || null,
    skillTier: getSkillTierData(myScore),
    verifiedSkills: (verifiedSkills || []).filter(s => !s.expires_at || new Date(s.expires_at) > new Date()),
  });
}
