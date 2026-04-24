import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !user) return errorResponse('User not found', 404);

    const [
      { data: progress },
      { data: score },
      { data: skill },
      { data: trial },
      { data: weakTopics },
      { data: strongTopics },
    ] = await Promise.all([
      supabase.from('progress').select('*').eq('user_id', user.id).single(),
      supabase.from('scores').select('*').eq('user_id', user.id).single(),
      supabase.from('skill_identity').select('*').eq('user_id', user.id).single(),
      supabase.from('trials').select('*').eq('user_id', user.id).single(),
      supabase.from('weak_topics').select('*').eq('user_id', user.id).order('avg_score', { ascending: true }).limit(10),
      supabase.from('strong_topics').select('*').eq('user_id', user.id).order('avg_score', { ascending: false }).limit(10),
    ]);

    const { password_hash: _, ...safeUser } = user;
    safeUser.weeklyBadge = safeUser.weekly_badge || null;

    return successResponse({
      user: safeUser,
      progress,
      score,
      skill,
      trial,
      weakTopics: weakTopics || [],
      strongTopics: strongTopics || [],
    });
  } catch (error) {
    return errorResponse(error.message || 'Failed to get profile', 500);
  }
}

export async function PUT(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const { name, college, year, learningSpeed } = body;

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        college,
        year,
        learning_speed: learningSpeed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { password_hash: _, ...safeUser } = user;
    return successResponse({ user: safeUser }, 'Profile updated');
  } catch (error) {
    return errorResponse(error.message || 'Update failed', 500);
  }
}
