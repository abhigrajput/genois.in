import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await rateLimit(`verify_email_${ip}`, 5, 3600000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return errorResponse('Invalid verification link', 400);

    const supabase = getAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, email_verify_expires_at')
      .eq('email_verify_token', token)
      .single();

    if (error || !user) return errorResponse('Invalid or expired verification link', 400);

    if (new Date(user.email_verify_expires_at) < new Date()) {
      return errorResponse('Verification link expired. Please request a new one.', 400);
    }

    await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verify_token: null,
        email_verify_expires_at: null,
      })
      .eq('id', user.id);

    const { NextResponse } = await import('next/server');
    return NextResponse.redirect(new URL('/dashboard?verified=true', request.url));
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
