import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return errorResponse('Invalid verification link', 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('verification_token', token)
      .single();

    if (!user) return errorResponse('Invalid or expired verification link', 400);

    await supabase.from('users').update({
      email_verified: true,
      verification_token: null,
    }).eq('id', user.id);

    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard?verified=true' },
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
