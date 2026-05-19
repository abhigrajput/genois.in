import { getAdminClient } from '@/lib/supabaseAdmin';
import { getCompanyFromRequest } from '@/lib/companyAuth';
import { successResponse, errorResponse } from '@/lib/response';
import { getSkillTierData } from '@/lib/skillLevel';

export async function GET(request) {
  try {
    const company = await getCompanyFromRequest(request);
    if (!company) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || null;
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const college = searchParams.get('college') || null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const tier = searchParams.get('tier') || null;

    const supabase = getAdminClient();

    let scoresQuery = supabase
      .from('scores')
      .select('user_id, total_score')
      .gte('total_score', minScore)
      .order('total_score', { ascending: false })
      .limit(limit);

    const { data: scores } = await scoresQuery;

    const students = await Promise.all((scores || []).map(async s => {
      const { data: user } = await supabase
        .from('users')
        .select('id, name, college, domain_slug, linkedin_url, created_at')
        .eq('id', s.user_id)
        .single();

      if (!user) return null;
      if (domain && user.domain_slug !== domain) return null;
      if (college && !user.college?.toLowerCase().includes(college.toLowerCase())) return null;

      const { data: progress } = await supabase
        .from('progress')
        .select('current_day, streak')
        .eq('user_id', s.user_id)
        .single();

      const { data: allScores } = await supabase
        .from('scores')
        .select('total_score')
        .order('total_score', { ascending: false });

      const rank = (allScores || []).findIndex(sc => sc.total_score <= s.total_score) + 1;

      return {
        userId: user.id,
        name: user.name,
        college: user.college,
        domain: user.domain_slug,
        score: s.total_score,
        rank,
        streak: progress?.streak || 0,
        currentDay: progress?.current_day || 1,
        linkedinUrl: user.linkedin_url,
        skillTier: getSkillTierData(s.total_score),
      };
    }));

    let filtered = students.filter(Boolean);
    if (tier) filtered = filtered.filter(s => s.skillTier?.tier === tier);

    await supabase.from('company_views').insert(
      filtered.slice(0, 10).map(s => ({
        company_id: company.companyId,
        student_user_id: s.userId,
      }))
    );

    return successResponse({ students: filtered, total: filtered.length });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
