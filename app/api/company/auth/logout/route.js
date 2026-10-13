import { COMPANY_COOKIE, companyCookie, verifyCompanyToken } from '@/lib/companyAuth';
import { readCookie } from '@/lib/auth';
import { blacklistToken } from '@/lib/jwtBlacklist';
import { successResponse, errorResponse } from '@/lib/response';
import { csrfCheck } from '@/lib/security';

// The company token lives in an httpOnly cookie the page cannot clear itself.
// Revoke it until its natural expiry, then clear the cookie with the same
// attributes (path included) it was set with.
export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const token = readCookie(request, COMPANY_COOKIE);
    const payload = await verifyCompanyToken(token);
    if (payload?.exp) await blacklistToken(token, payload.exp);

    const res = successResponse({ loggedOut: true }, 'Logged out successfully');
    res.headers.set('Set-Cookie', companyCookie('', 0));
    return res;
  } catch (error) {
    console.error('Company logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
