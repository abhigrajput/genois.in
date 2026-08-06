import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken, sessionCookie } from '@/lib/auth';
import { successResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse, isLockedOut, recordFailedLogin, clearFailedLogins, lockoutResponse, LIMITS } from '@/lib/rateLimit';
import { csrfCheck, getClientIp } from '@/lib/security';

// FIX 08: Zod schema
const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255),
  password: z.string().min(1, 'Please enter your password').max(255),
});

/**
 * Uniform error envelope. Every failure path returns
 *   { success: false, code, message }
 * with a specific, human-readable `message` — never a bare 500, never a raw
 * stack. `code` is a stable machine key for the client to branch on without
 * string-matching. The client currently maps on `message` (lib/api.js throws
 * `Error(data.message)`), so `message` MUST stay user-presentable.
 */
function fail(code, message, status) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  const ip = getClientIp(request);

  // FIX 01: Check IP lockout FIRST (before rate limiter, before any DB query)
  const lockout = await isLockedOut(ip);
  if (lockout.locked) return lockoutResponse(lockout.remainingMs);

  // General rate limit
  if (!await rateLimit(`login_${ip}`, LIMITS.auth.max, LIMITS.auth.windowMs)) return rateLimitResponse(60);

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail('invalid_body', 'We could not read your request. Please try again.', 400);
    }

    // FIX 08: Zod validation — surface the first specific field message.
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message
        || parsed.error.errors?.[0]?.message
        || 'Please enter a valid email and password.';
      return fail('validation', msg, 400);
    }
    const { email, password } = parsed.data;

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, domain_slug')
      .eq('email', email.toLowerCase())
      .single();

    // FIX 01: Track failed attempts on wrong email/password.
    // We deliberately return the SAME message/code for "no such user" and "wrong
    // password" so the endpoint never reveals which emails are registered.
    if (error || !user) {
      // FIX P7: run a dummy bcrypt compare so the no-such-user path costs the
      // same as a wrong-password path — closes the email-enumeration timing
      // oracle. The hash is a valid cost-12 dummy; the result is discarded.
      await bcrypt.compare(password, '$2b$12$yqaegrOo1.IpaTnX7Us5u.jMeu5C9pOXAjwlV3IY0zsXcMLjrjz3e');
      await recordFailedLogin(ip);
      return fail('invalid_credentials', 'That email or password is incorrect.', 401);
    }

    // Google-only accounts have a sentinel hash and no usable password. Tell the
    // user how to get in instead of looping them on "incorrect password".
    if (user.password_hash === 'google_oauth_no_password') {
      return fail('use_google', 'This account was created with Google. Please use “Continue with Google” to sign in.', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // FIX 01: Record failed attempt — result tells us if now locked
      const attempt = await recordFailedLogin(ip);
      if (attempt.locked) return lockoutResponse(attempt.remainingMs);
      return fail('invalid_credentials', 'That email or password is incorrect.', 401);
    }

    // Success — clear any lockout state for this IP
    await clearFailedLogins(ip);

    const token = await generateToken({ userId: user.id });
    const { password_hash: _drop, ...safeUser } = user;

    // Async update last_active (fire-and-forget)
    setTimeout(async () => {
      try {
        const { error: writeErr } = await supabase.from('progress').update({ last_active_date: new Date().toISOString() }).eq('user_id', user.id);
        if (writeErr) console.error('DB write failed: progress.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
      } catch {}
    }, 0);

    // FIX 03: Set httpOnly secure cookie in addition to returning the token in
    // the body. The body token is what the client persists to localStorage +
    // the (non-httpOnly) middleware cookie; this httpOnly cookie is the
    // tamper-resistant server-trusted copy.
    const res = successResponse({
      user: {
        ...safeUser,
        plan: user.subscription_plan || 'spectator',
        planExpiresAt: user.plan_expires_at || null,
      },
      token,
    }, 'Login successful');

    res.headers.set('Set-Cookie', sessionCookie(token));

    return res;
  } catch (error) {
    // FIX 09: Never leak internal error details — but never a bare/opaque 500
    // either. Log the real cause, return a specific human-readable reason.
    console.error('LOGIN_ERROR:', error);
    return fail('server_error', 'We hit a snag on our end and could not sign you in. Please try again in a moment.', 500);
  }
}
