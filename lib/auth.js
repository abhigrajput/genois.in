import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set');
}

export function generateToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET missing - cannot verify tokens');
    return null;
  }
  try {
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
    
    const payload = verifyToken(token);
    if (!payload) return null;
    if (!payload.userId) return null;
    
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getAdminFromRequest(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) return null;
  
  try {
    const { getAdminClient } = await import('./supabaseAdmin');
    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', payload.userId)
      .single();
    
    if (!user) return null;
    
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();
    
    if (!admin) return null;
    return { ...payload, email: user.email, isAdmin: true };
  } catch {
    return null;
  }
}
