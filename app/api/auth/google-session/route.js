import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyToken, sessionCookie } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

// Google sign-in hands back a genois token inside the NextAuth session. The
// callback page used to copy it into `document.cookie`, which cannot be
// httpOnly. This route moves that step server-side: the token is read from the
// server session (never from the request body) and set with the same
// sessionCookie() options login/signup/refresh use.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const token = session?.genoisToken;
    if (!token) return errorResponse('Not signed in', 401);

    // Signature, expiry and blacklist in one check.
    const payload = await verifyToken(token);
    if (!payload?.userId) return errorResponse('Invalid session', 401);

    // The token was minted at Google sign-in, so its remaining life can be
    // shorter than sessionCookie()'s 7-day default. A cookie that outlives its
    // token reads as "logged in" while every request 401s — match the token.
    const maxAge = Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
    if (maxAge <= 0) return errorResponse('Session expired', 401);

    const res = successResponse({ ok: true });
    res.headers.set('Set-Cookie', sessionCookie(token, maxAge));
    return res;
  } catch (error) {
    console.error('GOOGLE_SESSION_ERROR:', error?.message || error);
    return errorResponse('Internal server error', 500);
  }
}
