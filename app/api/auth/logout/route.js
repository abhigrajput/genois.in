import { getUserFromRequest, verifyToken } from '@/lib/auth';
import { blacklistToken } from '@/lib/jwtBlacklist';
import { successResponse, errorResponse } from '@/lib/response';
import { csrfCheck } from '@/lib/security';

export async function POST(request) {
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const payload = verifyToken(token);
        if (payload?.exp) {
          // Blacklist until the token's natural expiry
          blacklistToken(token, payload.exp);
        }
      }
    }

    // Clear the httpOnly cookie as well
    const response = successResponse({ loggedOut: true }, 'Logged out successfully');
    response.headers.set(
      'Set-Cookie',
      'genois_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
