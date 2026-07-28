import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse, LIMITS } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`resend_verify_${payload.userId}`, LIMITS.authSlow.max, LIMITS.authSlow.windowMs)) return rateLimitResponse();

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, email_verified, name')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 404);
    if (user.email_verified) return errorResponse('Email already verified', 400);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({
        email_verify_token: token,
        email_verify_expires_at: expires,
      })
      .eq('id', user.id);

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.genois.in'}/api/auth/verify-email?token=${token}`;

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'GENOIS <noreply@genois.in>',
      to: user.email,
      subject: 'Verify your GENOIS account',
      html: `
        <div style="background:#0a0a0f;color:#e8e8ed;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
          <div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00d9a3">GEN</span><span>OIS</span></div>
          <div style="height:2px;background:linear-gradient(90deg,#00d9a3,transparent);margin-bottom:32px;"></div>
          <h2 style="color:#e8e8ed;margin-bottom:16px;">Verify your email address</h2>
          <p style="color:#8a9ab0;line-height:1.7;margin-bottom:24px;">Hi ${user.name?.split(' ')[0] || 'Student'}, click the button below to verify your email and unlock all features.</p>
          <a href="${verifyUrl}" style="display:block;text-align:center;padding:16px;background:linear-gradient(135deg,#00d9a3,#ff6b4a);color:#0a0a0f;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;margin-bottom:24px;">Verify Email →</a>
          <p style="color:#5a7a9a;font-size:12px;">Link expires in 24 hours. If you did not sign up, ignore this email.</p>
          <p style="color:#3a4a5a;font-size:11px;margin-top:8px;">Or copy: ${verifyUrl}</p>
        </div>
      `,
    });

    return successResponse({ sent: true });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
