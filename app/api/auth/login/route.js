import bcrypt from 'bcryptjs';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const allowed = rateLimit(`login_${ip}`, 10, 60000);
    if (!allowed) return rateLimitResponse();

    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }
    if (!email.includes('@') || email.length > 255 || password.length > 255) {
      return errorResponse('Invalid credentials format', 400);
    }

    const supabase = getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return errorResponse('Invalid email or password', 401);
    }

    if (user.plan === 'trial') {
      const now = new Date();
      const trialEnd = new Date(user.trial_end);
      if (now > trialEnd) {
        await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('id', user.id);
        user.plan = 'free';
      }
    }

    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progress) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActive = progress.last_active_date
        ? new Date(progress.last_active_date)
        : null;

      let newStreak = progress.streak || 0;
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        const diff = Math.floor((today - lastActive) / 86400000);
        if (diff === 1) newStreak = (progress.streak || 0) + 1;
        else if (diff === 0) newStreak = progress.streak || 1;
        else newStreak = 1;
      } else {
        newStreak = 1;
      }

      await supabase
        .from('progress')
        .update({ streak: newStreak, last_active_date: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    const { data: score } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: skill } = await supabase
      .from('skill_identity')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const token = await generateToken(user.id);
    const { password_hash: _, ...safeUser } = user;

    return successResponse({
      user: {
        ...safeUser,
        plan: user.subscription_plan || user.plan || 'spectator',
        planExpiresAt: user.plan_expires_at || null,
      },
      token,
      progress,
      score,
      skill,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}
