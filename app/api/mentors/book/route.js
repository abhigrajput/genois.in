import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { mentorId, scheduledAt, notes, paymentId } = await request.json();
    const supabase = getAdminClient();

    if (mentorId === payload.userId) {
      return errorResponse('You cannot book yourself', 400);
    }

    const { data: mentor } = await supabase
      .from('mentor_profiles')
      .select('price')
      .eq('user_id', mentorId)
      .single();

    if (!mentor) return errorResponse('Mentor not found', 404);

    const { data: booking } = await supabase
      .from('mentor_bookings')
      .insert({
        mentor_id: mentorId,
        student_id: payload.userId,
        status: 'confirmed',
        scheduled_at: scheduledAt,
        amount: mentor.price,
        payment_id: paymentId,
        notes,
      })
      .select()
      .single();

    await supabase
      .from('mentor_profiles')
      .update({ total_sessions: supabase.sql`total_sessions + 1` })
      .eq('user_id', mentorId);

    return successResponse({ booking });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
