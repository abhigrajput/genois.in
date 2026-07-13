import jwt from 'jsonwebtoken';
import { isBlacklisted } from './jwtBlacklist.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

// FIX P3: A short HS256 secret is brute-forceable → full token forgery. Enforce
// a length floor. In production we refuse to mint tokens under a weak secret
// (fail closed, surfaces the misconfig immediately) rather than issuing
// forgeable ones. Non-production is only warned, so the 2-char local stub works.
const MIN_SECRET_LENGTH = 32;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set');
} else {
  if (!process.env.JWT_SECRET) {
    console.warn('[Auth] JWT_SECRET not set, falling back to NEXTAUTH_SECRET. Set JWT_SECRET explicitly for production.');
  }
  if (JWT_SECRET.length < MIN_SECRET_LENGTH) {
    const msg = `[Auth] JWT signing secret is ${JWT_SECRET.length} chars — below the ${MIN_SECRET_LENGTH}-char minimum (brute-forceable).`;
    if (IS_PROD) console.error('CRITICAL: ' + msg + ' Token generation will be refused.');
    else console.warn(msg + ' Allowed in non-production only.');
  }
}

// FIX P6: single source of admin authority. lib/adminAuth.js re-exports from
// here instead of maintaining a divergent hardcoded list / check.
export const ADMIN_EMAILS = ['abhigrajput5@gmail.com'];

function assertUsableSecret() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  if (IS_PROD && JWT_SECRET.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET too weak for production (min ${MIN_SECRET_LENGTH} chars)`);
  }
}

export function generateToken(payload) {
  assertUsableSecret();
  // Include iat (issued-at) so blacklist can match by token hash
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET missing - cannot verify tokens');
    return null;
  }
  try {
    // FIX 02: Reject blacklisted tokens before verifying signature
    if (await isBlacklisted(token)) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    const token = parts[1];
    if (!token || token === 'null' || token === 'undefined' || token.length < 20) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;
    if (!payload.userId) return null;

    // Attach raw token so callers can blacklist it on logout
    return { ...payload, _token: token };
  } catch (e) {
    return null;
  }
}

export async function getAdminFromRequest(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) return null;

  try {
    const { getAdminClient } = await import('./supabaseAdmin.js');
    const supabase = getAdminClient();

    // Only guaranteed columns here — is_admin may not exist in every environment.
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', payload.userId)
      .single();

    if (!user) return null;

    // Authority A: static owner allow-list — always available (FIX P6). This is
    // the path the migrated admin routes depended on via lib/adminAuth.js.
    if (ADMIN_EMAILS.includes(user.email)) {
      return { ...payload, email: user.email, isAdmin: true };
    }

    // Authority B: DB-driven admin (defense in depth) — is_admin flag AND a row
    // in admin_users. Both are optional infra; their absence simply denies here.
    const { data: flagRow } = await supabase
      .from('users').select('is_admin').eq('id', payload.userId).single();
    if (flagRow?.is_admin) {
      const { data: adminRecord } = await supabase
        .from('admin_users').select('email').eq('email', user.email).single();
      if (adminRecord) return { ...payload, email: user.email, isAdmin: true };
    }

    return null;
  } catch {
    return null;
  }
}
