import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Resend } from 'resend';
import crypto from 'crypto';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { generateToken, sessionCookie } from '@/lib/auth';
import { successResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck, checkPasswordStrength, getClientIp } from '@/lib/security';

// FIX 08: Zod schema
const SignupSchema = z.object({
  name:          z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').trim(),
  email:         z.string().email('Please enter a valid email address').max(255),
  password:      z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be at most 128 characters'),
  college:       z.string().max(200).optional().nullable(),
  year:          z.string().max(20).optional().nullable(),
  domainSlug:    z.string().max(50).optional().nullable(),
  level:         z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  learningSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
});

/**
 * Uniform error envelope. Every failure path returns
 *   { success: false, code, message }
 * with a specific, human-readable `message` and a stable `code`. The signup
 * client branches on `code` (e.g. 'email_exists' → route to login) and shows
 * `message` verbatim, so both MUST stay meaningful — never a bare 500.
 */
function fail(code, message, status) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail('invalid_body', 'We could not read your request. Please try again.', 400);
    }

    // Rate limit by IP
    const ip = getClientIp(request);
    if (!await rateLimit(`signup_${ip}`, 5, 3600000)) return rateLimitResponse(3600);

    // FIX 08: Zod validation
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message
        || parsed.error.errors?.[0]?.message
        || 'Please check the form and try again.';
      return fail('validation', msg, 400);
    }
    const { name, email, password, college, year, domainSlug, level, learningSpeed } = parsed.data;

    const validDomains = ['fullstack','dsa','cybersecurity','aiml','devops','android','datascience','blockchain','gamedev','systemdesign'];
    const resolvedDomain = validDomains.includes(domainSlug) ? domainSlug : 'fullstack';

    // FIX 12: Password strength (mirrors the client-side check in signup/page.jsx)
    const pwdError = checkPasswordStrength(password);
    if (pwdError) return fail('weak_password', pwdError, 400);

    // Fail loud (and logged) if the service-role config is missing — otherwise
    // createClient throws a cryptic error that surfaces as a generic 500.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SIGNUP_CONFIG_ERROR: missing Supabase env vars', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return fail('config_error', 'Sign-up is temporarily unavailable due to a server configuration issue. Please try again shortly.', 500);
    }

    const supabase = getAdminClient();

    // `.maybeSingle()` returns null (not a PGRST116 "no rows" error) when the
    // email is free, so a fresh signup doesn't log spurious errors. A friendly,
    // actionable message + a `code: 'email_exists'` flag lets the client route
    // the user to login instead of looping them back to the password step.
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return fail('email_exists', 'This email is already registered. Try logging in instead.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + parseInt(process.env.TRIAL_DAYS || '30'));

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email:             email.toLowerCase(),
        password_hash:     passwordHash,
        college:           college || null,
        domain_slug:       resolvedDomain,
        level:             level || 'beginner',
        subscription_plan: 'spectator',
        is_on_trial:       true,
        trial_ends_at:     trialEnd.toISOString(),
        is_active:         true,
        email_verified:    false,
      })
      .select()
      .single();

    if (userError) {
      // Log full PostgREST error detail so the real cause (missing column, RLS
      // policy, bad enum value, etc.) is visible in Vercel logs instead of a
      // bare code. Never returned to the client.
      console.error('SIGNUP_DB_ERROR:', JSON.stringify({
        code:    userError.code,
        message: userError.message,
        details: userError.details,
        hint:    userError.hint,
      }));
      return fail('db_error', 'We could not create your account just now. Please try again in a moment.', 500);
    }

    // Use email_verify_token column (actual column name in users table)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const { error: writeErr } = await supabase.from('users').update({
      email_verify_token:      verificationToken,
      email_verify_expires_at: verifyExpires.toISOString(),
    }).eq('id', user.id);
    if (writeErr) console.error('DB write failed: users.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    const verifyUrl = 'https://genois.in/api/auth/verify-email?token=' + verificationToken;

    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: emailError } = await resend.emails.send({
          from: 'GENOIS <noreply@genois.in>',
          to: user.email,
          subject: '✅ Verify your GENOIS email',
          html: `<div style="background:#0a0a0f;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00d9a3">GEN</span><span style="color:#e8e8ed">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00d9a3,transparent);margin-bottom:32px;"></div><h1 style="font-size:22px;font-weight:800;color:#e8e8ed;margin-bottom:12px;">Verify your email</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Welcome to GENOIS! Click the button below to verify your email and activate your account.</p><a href="${verifyUrl}" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00d9a3,#ff6b4a);color:#0a0a0f;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Verify My Email →</a><p style="color:#5a7a9a;font-size:13px;">If you did not sign up for GENOIS ignore this email.</p><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · Career OS for Engineers · genois.in</div></div>`,
        });
        if (emailError) {
          console.error('Verification email error:', JSON.stringify(emailError));
        }
      } else {
        console.warn('RESEND_API_KEY not configured, skipping email.');
      }
    } catch (e) {
      // A failed verification email must NEVER fail the signup — the account
      // exists and the user can request a resend later.
      console.error('Failed to send verification email:', e);
    }

    // Seed companion records. Supabase query builders are thenables with NO
    // `.catch()` method, so the previous `builder.catch(...)` calls threw
    // `TypeError: ...catch is not a function` synchronously — AFTER the user row
    // was already inserted above — which the outer catch turned into a generic
    // 500. That was the real "Internal server error". Await with allSettled so
    // (a) the writes actually complete before the serverless function freezes,
    // and (b) a failing seed is logged but never fails the signup.
    const seeds = await Promise.allSettled([
      supabase.from('scores').insert({ user_id: user.id }),
      supabase.from('progress').insert({
        user_id: user.id,
        // Advanced students skip the 3 foundation days and start at the BUILD
        // phase (day 4). Everyone else begins at day 1. Mirrors the roadmap
        // skip-basics endpoint and curriculumGenerator.difficultyPhase.
        current_day: level === 'advanced' ? 4 : 1,
        current_week: 1,
        last_active_date: new Date().toISOString(),
        streak: 0,
      }),
      supabase.from('skill_identity').insert({ user_id: user.id }),
      supabase.from('trials').insert({
        user_id: user.id,
        start_date: trialStart.toISOString(),
        end_date: trialEnd.toISOString(),
        is_active: true,
      }),
    ]);
    const seedNames = ['scores', 'progress', 'skill_identity', 'trials'];
    seeds.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`${seedNames[i]} seed error:`, r.reason);
      else if (r.value?.error) console.error(`${seedNames[i]} seed error:`, JSON.stringify(r.value.error));
    });

    const token = await generateToken({ userId: user.id });
    const { password_hash: _drop, ...safeUser } = user;

    // FIX P4: set the httpOnly session cookie so post-signup requests and
    // middleware gating ride the XSS-inaccessible cookie, not just the body
    // token the client copies into localStorage.
    const res = successResponse({ user: safeUser, token }, 'Account created successfully', 201);
    res.headers.set('Set-Cookie', sessionCookie(token));
    return res;
  } catch (error) {
    // FIX 09: Sanitize errors — log the real cause, return a specific,
    // human-readable reason. Never a bare 500, never a raw stack.
    console.error('SIGNUP_ERROR:', error);
    return fail('server_error', 'Something went wrong on our end while creating your account. Please try again in a moment.', 500);
  }
}
