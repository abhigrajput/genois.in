import { NextResponse } from 'next/server';
import { PLACEMENT_COOKIE, placementCookie, verifyPlacementToken } from '@/lib/placementAuth';
import { readCookie } from '@/lib/auth';
import { blacklistToken } from '@/lib/jwtBlacklist';
import { csrfCheck } from '@/lib/security';

// The placement token lives in an httpOnly cookie the page cannot clear itself.
// Revoke it until its natural expiry, then clear the cookie with the same
// attributes (path included) it was set with.
export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const token = readCookie(request, PLACEMENT_COOKIE);
    const payload = await verifyPlacementToken(token);
    if (payload?.exp) await blacklistToken(token, payload.exp);

    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', placementCookie('', 0));
    return res;
  } catch (e) {
    console.error('PLACEMENT_LOGOUT_ERROR:', e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
