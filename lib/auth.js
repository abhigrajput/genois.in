import jwt from 'jsonwebtoken';
import { isBlacklisted } from './jwtBlacklist.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set');
}

export function generateToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
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

    // Gate 1: is_admin flag in users table
    const { data: user } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('id', payload.userId)
      .single();

    if (!user || !user.is_admin) return null;

    // Gate 2: must exist in admin_users allow-list
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!adminRecord) return null;
    return { ...payload, email: user.email, isAdmin: true };
  } catch {
    return null;
  }
}
