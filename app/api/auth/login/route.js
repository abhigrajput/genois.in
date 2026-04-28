import bcrypt from 'bcryptjs';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`login_${ip}`, 10, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    
    const { email, password } = body || {};
    if (!email || !password) return errorResponse('Email and password are required', 400);
    if (!email.includes('@') || email.length > 255 || password.length > 255) {
      return errorResponse('Invalid credentials format', 400);
    }

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, name, subscription_plan, plan_expires_at, trial_ends_at, is_on_trial, domain_slug')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) return errorResponse('Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return errorResponse('Invalid email or password', 401);

    const token = await generateToken({ userId: user.id });
    const { password_hash: _, ...safeUser } = user;

    setTimeout(async () => {
      try {
        await supabase
          .from('users')
          .update({ last_active_date: new Date().toISOString() })
          .eq('id', user.id);
      } catch {}
    }, 0);

    return successResponse({
      user: {
        ...safeUser,
        plan: user.subscription_plan || 'spectator',
        planExpiresAt: user.plan_expires_at || null,
      },
      token,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}
