import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: mentors } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false });

    const enriched = await Promise.all((mentors || []).map(async m => {
      const { data: user } = await supabase
        .from('users')
        .select('name, college, domain_slug')
        .eq('id', m.user_id)
        .single();

      const { data: score } = await supabase
        .from('scores')
        .select('total_score')
        .eq('user_id', m.user_id)
        .single();

      const { data: allScores } = await supabase
        .from('scores')
        .select('total_score')
        .order('total_score', { ascending: false });

      const myScore = score?.total_score || 0;
      const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1 || 1;

      return {
        ...m,
        name: user?.name,
        college: user?.college,
        domain: user?.domain_slug,
        score: myScore,
        rank,
      };
    }));

    return successResponse({ mentors: enriched });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: score } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    if ((score?.total_score || 0) < 500) {
      return errorResponse('You need at least 500 GENOIS points to become a mentor', 403);
    }

    const body = await request.json();
    const { bio, expertise, price } = body;

    const { data: existing } = await supabase
      .from('mentor_profiles')
      .select('id')
      .eq('user_id', payload.userId)
      .single();

    if (existing) {
      await supabase
        .from('mentor_profiles')
        .update({ bio, expertise, price: price || 299, is_available: true })
        .eq('user_id', payload.userId);
    } else {
      await supabase
        .from('mentor_profiles')
        .insert({ user_id: payload.userId, bio, expertise, price: price || 299 });
    }

    return successResponse({ message: 'Mentor profile saved' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
