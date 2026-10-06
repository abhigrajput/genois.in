import { getUserFromRequest, verifyToken, sessionCookie } from '@/lib/auth';
import { blacklistToken } from '@/lib/jwtBlacklist';
import { successResponse, errorResponse } from '@/lib/response';
import { csrfCheck } from '@/lib/security';

export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    // A session can be carried by the Authorization header, by the httpOnly
    // genois_token cookie, or both. Only the header was ever blacklisted, so a
    // cookie-only logout cleared the cookie and left the token itself valid —
    // anyone who had captured it could keep using it until natural expiry.
    // Collect both, dedupe, and revoke whatever is actually present.
    const tokens = new Set();

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') tokens.add(parts[1]);
    }

    const cookieToken = request.cookies?.get?.('genois_token')?.value;
    if (cookieToken) tokens.add(cookieToken);

    for (const token of tokens) {
      const payload = await verifyToken(token);
      if (payload?.exp) {
        // Blacklist until the token's natural expiry
        await blacklistToken(token, payload.exp);
      }
    }

    // Clear the httpOnly cookie with the same attributes it was set with. A
    // hand-written `Secure` here also broke clearing over plain http in dev:
    // browsers that refuse Secure cookies on http dropped the deletion.
    const response = successResponse({ loggedOut: true }, 'Logged out successfully');
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
