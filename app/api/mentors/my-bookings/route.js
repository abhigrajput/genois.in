import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: asStudent } = await supabase
      .from('mentor_bookings')
      .select('*')
      .eq('student_id', payload.userId)
      .order('created_at', { ascending: false });

    const { data: asMentor } = await supabase
      .from('mentor_bookings')
      .select('*')
      .eq('mentor_id', payload.userId)
      .order('created_at', { ascending: false });

    const { data: myProfile } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    const { data: myScore } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', payload.userId)
      .single();

    return successResponse({
      asStudent: asStudent || [],
      asMentor: asMentor || [],
      myProfile: myProfile || null,
      myScore: myScore?.total_score || 0,
      canBeMentor: (myScore?.total_score || 0) >= 500,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
