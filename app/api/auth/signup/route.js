import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Resend } from 'resend';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck, checkPasswordStrength } from '@/lib/security';

// FIX 08: Zod schema
const SignupSchema = z.object({
  name:          z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').trim(),
  email:         z.string().email('Invalid email format').max(255),
  password:      z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be at most 128 characters'),
  college:       z.string().max(200).optional().nullable(),
  year:          z.string().max(20).optional().nullable(),
  domainSlug:    z.string().max(50).optional().nullable(),
  level:         z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  learningSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  referralCode:  z.string().max(50).optional().nullable(),
});

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!await rateLimit(`signup_${ip}`, 5, 3600000)) return rateLimitResponse(3600);

    // FIX 08: Zod validation
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }
    const { name, email, password, college, year, domainSlug, level, learningSpeed, referralCode } = parsed.data;

    // FIX 12: Password strength
    const pwdError = checkPasswordStrength(password);
    if (pwdError) return errorResponse(pwdError, 400);

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

    if (userError) {
      // FIX 09: Don't expose DB error message
      console.error('Signup DB error:', userError);
      throw new Error('Account creation failed');
    }

    // FIX: Use crypto.randomBytes for verification token (CSPRNG, not Math.random)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await supabase.from('users').update({ verification_token: verificationToken }).eq('id', user.id);

    const verifyUrl = 'https://genois.in/api/auth/verify-email?token=' + verificationToken;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
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
        await supabase.from('users').update({
          referred_by_code: referralCode,
          referral_count: (referrer.referral_count || 0) + 1,
        }).eq('id', referrer.id);
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
    // FIX 09: Sanitize errors
    console.error('Signup error:', error);
    return errorResponse('Internal server error', 500);
  }
}
