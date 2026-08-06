import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/security';

export async function GET(request) {
  try {
    const ip = getClientIp(request);
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

    const { error: writeErr } = await supabase
      .from('users')
      .update({
        email_verified: true,
      })
      .eq('id', user.id);
    // Fatal: a "verified!" page for an account still flagged unverified sends
    // the user away believing they are done, and the token is single-use from
    // their point of view. Fail so the link can be retried.
    if (writeErr) {
      console.error('DB write failed: users.update (email verification)', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
      return errorResponse('We could not verify your email just now. Please try the link again.', 500);
    }

    const { NextResponse } = await import('next/server');
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
