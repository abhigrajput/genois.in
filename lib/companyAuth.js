import jwt from 'jsonwebtoken';
import { isBlacklisted } from '@/lib/jwtBlacklist';
import { httpOnlyCookie, readCookie } from '@/lib/auth';

// FIX P5: mirror the user secret resolution. Company tokens are SIGNED with
// `JWT_SECRET || NEXTAUTH_SECRET`, so verifying with only JWT_SECRET silently
// rejected every token whenever JWT_SECRET was unset. Use the same fallback.
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

// Company sessions ride an httpOnly cookie scoped to the company API — never
// localStorage, never a Bearer header. Lifetime matches the token's 7d exp.
export const COMPANY_COOKIE = 'genois_company_token';
const COMPANY_COOKIE_PATH = '/api/company';
export const COMPANY_TOKEN_TTL = 7 * 24 * 3600;

export function companyCookie(token, maxAgeSec = COMPANY_TOKEN_TTL) {
  return httpOnlyCookie(COMPANY_COOKIE, token, maxAgeSec, COMPANY_COOKIE_PATH);
}

// Signature, expiry, type and blacklist in one check. Returns the payload or null.
export async function verifyCompanyToken(token) {
  try {
    if (!token || !JWT_SECRET) return null;
    // FIX P5: honor logout / revocation for company tokens too (was skipped).
    if (await isBlacklisted(token)) return null;
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (payload.type !== 'company') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCompanyFromRequest(request) {
  return verifyCompanyToken(readCookie(request, COMPANY_COOKIE));
}
