import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse, LIMITS } from '@/lib/rateLimit';
import { csrfCheck, checkPasswordStrength, getClientIp } from '@/lib/security';
import bcrypt from 'bcryptjs';

// FIX 08: Zod schema
const ResetSchema = z.object({
  token:    z.string().min(10, 'Token is required').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be at most 128 characters'),
});

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const ip = getClientIp(request);
    if (!await rateLimit(`reset_pwd_${ip}`, LIMITS.authSlow.max, LIMITS.authSlow.windowMs)) return rateLimitResponse(3600);

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    // FIX 08: Zod validation
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse((parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || "Validation failed"), 400);
    }
    const { token, password } = parsed.data;

    // FIX 12: Password strength check
    const pwdError = checkPasswordStrength(password);
    if (pwdError) return errorResponse(pwdError, 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!user) return errorResponse('Invalid or expired reset link', 400);

    const expires = new Date(user.reset_token_expires);
    if (expires < new Date()) return errorResponse('Reset link has expired. Request a new one.', 400);

    const hashedPassword = await bcrypt.hash(password, 12);

    await supabase.from('users').update({
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    }).eq('id', user.id);

    return successResponse({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    // FIX 09: Sanitize errors
    console.error('Reset password error:', error);
    return errorResponse('Internal server error', 500);
  }
}
