import jwt from 'jsonwebtoken';
import { isBlacklisted } from '@/lib/jwtBlacklist';
import { httpOnlyCookie, readCookie } from '@/lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

// Placement-admin sessions ride an httpOnly cookie scoped to the placement API —
// never localStorage, never a Bearer header. Lifetime matches the token's 24h exp.
export const PLACEMENT_COOKIE = 'placement_admin_token';
const PLACEMENT_COOKIE_PATH = '/api/placement-admin';
export const PLACEMENT_TOKEN_TTL = 24 * 3600;

export function placementCookie(token, maxAgeSec = PLACEMENT_TOKEN_TTL) {
  return httpOnlyCookie(PLACEMENT_COOKIE, token, maxAgeSec, PLACEMENT_COOKIE_PATH);
}

export function signPlacementToken() {
  return jwt.sign({ role: 'placement_admin' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: PLACEMENT_TOKEN_TTL });
}

// Signature, expiry, role and blacklist (so logout actually revokes). Returns
// the payload or null.
export async function verifyPlacementToken(token) {
  try {
    if (!token || !JWT_SECRET) return null;
    if (await isBlacklisted(token)) return null;
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return payload.role === 'placement_admin' ? payload : null;
  } catch {
    return null;
  }
}

export async function getPlacementAdminFromRequest(request) {
  return verifyPlacementToken(readCookie(request, PLACEMENT_COOKIE));
}
