import crypto from 'crypto';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { Resend } from 'resend';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck } from '@/lib/security';

// FIX 08: Zod schema
const ForgotSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
});

// FIX: CSPRNG token (replaces Math.random)
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

// FIX 11: Constant-time ~500ms response to prevent email enumeration via timing
const RESPONSE_DELAY_MS = 500;

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const start = Date.now();

  // Always return the same message regardless of outcome (FIX 11)
  const SAFE_MESSAGE = 'If this email exists, you will receive a reset link.';

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!await rateLimit('forgot_' + ip, 3, 3600000)) return rateLimitResponse(3600);

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    // FIX 08: Zod validation
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      // FIX 11: Delay even on validation failure to prevent timing enumeration
      await new Promise(r => setTimeout(r, RESPONSE_DELAY_MS));
      return errorResponse(parsed.error.errors[0].message, 400);
    }
    const { email } = parsed.data;

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    // FIX 11: Whether user exists or not, do the same work to prevent timing attacks
    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    if (user) {
      await supabase.from('users').update({
        reset_token: token,
        reset_token_expires: expires,
      }).eq('id', user.id);

      const resetUrl = `https://www.genois.in/reset-password?token=${token}`;

      const { error: emailError } = await resend.emails.send({
        from: 'GENOIS <noreply@genois.in>',
        to: user.email,
        subject: '🔑 Reset your GENOIS password',
        html: `<div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8f4ff">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:32px;"></div><h1 style="font-size:22px;font-weight:800;color:#e8f4ff;margin-bottom:12px;">Reset your password</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Hey ${user.name || 'Student'}, click below to reset your GENOIS password. This link expires in 1 hour.</p><a href="${resetUrl}" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Reset My Password</a><p style="color:#5a7a9a;font-size:13px;">If you did not request this ignore this email.</p><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div></div>`,
      });
      if (emailError) {
        console.error('Reset email error:', JSON.stringify(emailError));
      }
    }

    // FIX 11: Enforce minimum 500ms response time to prevent timing-based enumeration
    const elapsed = Date.now() - start;
    if (elapsed < RESPONSE_DELAY_MS) {
      await new Promise(r => setTimeout(r, RESPONSE_DELAY_MS - elapsed));
    }

    return successResponse({ message: SAFE_MESSAGE });
  } catch (error) {
    // FIX 09: Sanitize errors
    console.error('Forgot password error:', error);
    // Still apply delay even on error
    const elapsed = Date.now() - start;
    if (elapsed < RESPONSE_DELAY_MS) {
      await new Promise(r => setTimeout(r, RESPONSE_DELAY_MS - elapsed));
    }
    return successResponse({ message: SAFE_MESSAGE });
  }
}
