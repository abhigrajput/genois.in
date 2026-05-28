import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse, isLockedOut, recordFailedLogin, clearFailedLogins, lockoutResponse } from '@/lib/rateLimit';
import { csrfCheck, getClientIp } from '@/lib/security';

// FIX 08: Zod schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(255),
});

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  const ip = getClientIp(request);

  // FIX 01: Check IP lockout FIRST (before rate limiter, before any DB query)
  const lockout = await isLockedOut(ip);
  if (lockout.locked) return lockoutResponse(lockout.remainingMs);

  // General rate limit
  if (!await rateLimit(`login_${ip}`, 5, 60000)) return rateLimitResponse(60);

  try {
    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    // FIX 08: Zod validation
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse((parsed.error.issues?.[0]?.message || parsed.error.errors?.[0]?.message || "Validation failed"), 400);
    }
    const { email, password } = parsed.data;

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, domain_slug')
      .eq('email', email.toLowerCase())
      .single();

    // FIX 01: Track failed attempts on wrong email/password
    if (error || !user) {
      await recordFailedLogin(ip);
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // FIX 01: Record failed attempt — result tells us if now locked
      const fail = await recordFailedLogin(ip);
      if (fail.locked) return lockoutResponse(fail.remainingMs);
      return errorResponse('Invalid email or password', 401);
    }

    // Success — clear any lockout state for this IP
    await clearFailedLogins(ip);

    const token = await generateToken({ userId: user.id });
    const { password_hash: _, ...safeUser } = user;

    // Async update last_active (fire-and-forget)
    setTimeout(async () => {
      try {
        await supabase.from('progress').update({ last_active_date: new Date().toISOString() }).eq('user_id', user.id);
      } catch {}
    }, 0);

    // FIX 03: Set httpOnly secure cookie in addition to returning token
    const res = successResponse({
      user: {
        ...safeUser,
        plan: user.subscription_plan || 'spectator',
        planExpiresAt: user.plan_expires_at || null,
      },
      token,
    }, 'Login successful');

    const isProduction = process.env.NODE_ENV === 'production';
    res.headers.set(
      'Set-Cookie',
      `genois_token=${token}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${7 * 24 * 3600}`
    );

    return res;
  } catch (error) {
    // FIX 09: Never leak internal error details
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
