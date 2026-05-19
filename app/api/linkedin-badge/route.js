import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const [
      { data: score },
      { data: user },
      { data: progress },
    ] = await Promise.all([
      supabase.from('scores').select('total_score').eq('user_id', payload.userId).single(),
      supabase.from('users').select('name, college, domain_slug, linkedin_url').eq('id', payload.userId).single(),
      supabase.from('progress').select('current_day, streak').eq('user_id', payload.userId).single(),
    ]);

    const { data: allScores } = await supabase
      .from('scores')
      .select('total_score')
      .order('total_score', { ascending: false });

    const currentScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= currentScore) + 1 || 1;
    const total = allScores?.length || 1;
    const percentile = Math.round(((total - rank) / total) * 100);
    const isEligible = currentScore >= 1000;
    const pointsNeeded = Math.max(0, 1000 - currentScore);

    return successResponse({
      isEligible,
      currentScore,
      pointsNeeded,
      rank,
      total,
      percentile,
      name: user?.name,
      college: user?.college,
      domain: user?.domain_slug,
      streak: progress?.streak || 0,
      currentDay: progress?.current_day || 1,
      linkedinUrl: user?.linkedin_url || null,
      badgeText: `GENOIS Verified Engineer — Ranked Top ${100 - percentile}% of ${total} students. Real skills. Daily grind. No fake certificates.`,
      linkedinPostText: `Excited to share that I am now GENOIS Verified! 🏆\n\nGENOIS Score: ${currentScore} pts\nGlobal Rank: #${rank} of ${total} engineering students\nTop ${100 - percentile}% of engineers on GENOIS\n\nGENOIS ranks engineers on real daily performance — daily coding, timed tests, actual projects — not resumes or fake certificates.\n\nCheck out GENOIS: https://genois.in\n\n#GENOIS #Engineering #Skills #Placement #${user?.domain_slug?.toUpperCase()} #Verified`,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { linkedinUrl } = await request.json();
    const supabase = getAdminClient();
    await supabase.from('users').update({ linkedin_url: linkedinUrl }).eq('id', payload.userId);
    return successResponse({ message: 'LinkedIn URL saved' });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
