import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { name, email, password, college, year, domainSlug, level, learningSpeed, referralCode } = body || {};

    if (!rateLimit(`signup_${request.headers.get('x-forwarded-for') || 'unknown'}`, 5, 3600000)) return rateLimitResponse();

    if (!name || !email || !password) {
      return errorResponse('Name, email and password are required', 400);
    }
    if (!email.includes('@') || email.length > 255) {
      return errorResponse('Invalid email address', 400);
    }
    if (name.trim().length < 2 || name.length > 100) {
      return errorResponse('Name must be 2-100 characters', 400);
    }
    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }
    if (password.length > 255) {
      return errorResponse('Password too long', 400);
    }

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + parseInt(process.env.TRIAL_DAYS || '30'));

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        college: college || null,
        year: year || '1st Year',
        domain_slug: domainSlug || 'fullstack',
        level: level || 'beginner',
        learning_speed: learningSpeed || 'normal',
        subscription_plan: 'spectator',
        is_on_trial: true,
        trial_ends_at: trialEnd.toISOString(),
      })
      .select()
      .single();

    if (userError) throw new Error(userError.message);

    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await supabase.from('users').update({ verification_token: verificationToken }).eq('id', user.id);

    const verifyUrl = 'https://genois.in/api/auth/verify-email?token=' + verificationToken;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'GENOIS <noreply@genois.in>',
      to: user.email,
      subject: '✅ Verify your GENOIS email',
      html: `<div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8f4ff">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:32px;"></div><h1 style="font-size:22px;font-weight:800;color:#e8f4ff;margin-bottom:12px;">Verify your email</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Welcome to GENOIS! Click the button below to verify your email and activate your account.</p><a href="${verifyUrl}" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Verify My Email →</a><p style="color:#5a7a9a;font-size:13px;">If you did not sign up for GENOIS ignore this email.</p><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · Career OS for Engineers · genois.in</div></div>`,
    });
    if (emailError) {
      console.error('Verification email error:', JSON.stringify(emailError));
    }

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id, referral_count')
        .eq('referral_code', referralCode)
        .single();

      if (referrer) {
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: user.id,
          referred_email: email,
          status: 'pending',
        });

        await supabase
          .from('users')
          .update({ 
            referred_by_code: referralCode,
            referral_count: (referrer.referral_count || 0) + 1,
          })
          .eq('id', referrer.id);
      }
    }
    await supabase.from('scores').insert({ user_id: user.id });
    await supabase.from('progress').insert({
      user_id: user.id,
      last_active_date: new Date().toISOString(),
      streak: 1,
    });
    await supabase.from('skill_identity').insert({ user_id: user.id });
    await supabase.from('trials').insert({
      user_id: user.id,
      start_date: trialStart.toISOString(),
      end_date: trialEnd.toISOString(),
      is_active: true,
    });

    const token = await generateToken({ userId: user.id });
    const { password_hash: _, ...safeUser } = user;

    return successResponse({ user: safeUser, token }, 'Account created successfully', 201);
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse(error.message || 'Signup failed', 500);
  }
}
