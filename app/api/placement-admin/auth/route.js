import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import {
  rateLimit, rateLimitResponse,
  isLockedOut, recordFailedLogin, clearFailedLogins, lockoutResponse,
  LIMITS,
} from '@/lib/rateLimit';
import { getClientIp, timingSafeEqualStr } from '@/lib/security';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

export async function POST(request) {
  const ip = getClientIp(request);

  // Brute-force lockout FIRST — before any comparison or body parse. Shares the
  // per-IP lockout counter with /api/auth/login (lib/rateLimit), so failures on
  // either endpoint contribute to the same 5-strike / 15-min lockout.
  const lockout = await isLockedOut(ip);
  if (lockout.locked) return lockoutResponse(lockout.remainingMs);

  // General throttle: 5 attempts / minute / IP. This is the real brute-force
  // defense — the middleware CSRF origin check only deters browsers, not curl.
  if (!await rateLimit(`placement_pin_${ip}`, LIMITS.auth.max, LIMITS.auth.windowMs)) return rateLimitResponse(60);

  try {
    // Fail closed: no hardcoded fallback PIN. If PLACEMENT_PIN (or the signing
    // secret) is unset, nobody gets in rather than everyone getting in with a
    // guessable default.
    const PLACEMENT_PIN = process.env.PLACEMENT_PIN;
    if (!PLACEMENT_PIN || !JWT_SECRET) {
      console.error('PLACEMENT_AUTH_CONFIG_ERROR: missing PLACEMENT_PIN or JWT_SECRET');
      return NextResponse.json(
        { success: false, message: 'Placement admin access is not configured.' },
        { status: 500 },
      );
    }

    let pin;
    try {
      ({ pin } = await request.json());
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
    }

    // Constant-time compare so response timing never reveals a matching prefix.
    if (!pin || !timingSafeEqualStr(pin, PLACEMENT_PIN)) {
      const attempt = await recordFailedLogin(ip);
      if (attempt.locked) return lockoutResponse(attempt.remainingMs);
      return NextResponse.json({ success: false, message: 'Invalid PIN' }, { status: 401 });
    }

    // Success — clear this IP's failure counter and mint a short-lived token.
    await clearFailedLogins(ip);
    const token = jwt.sign({ role: 'placement_admin' }, JWT_SECRET, { expiresIn: '24h' });
    return NextResponse.json({ success: true, token });
  } catch (e) {
    console.error('PLACEMENT_AUTH_ERROR:', e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
