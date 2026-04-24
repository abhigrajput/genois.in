import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { Resend } from 'resend';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit('forgot_' + ip, 5, 60000)) return rateLimitResponse();

    const { email } = await request.json();
    if (!email) return errorResponse('Email required', 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!user) {
      return successResponse({ message: 'If this email exists you will receive a reset link.' });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from('users').update({
      reset_token: token,
      reset_token_expires: expires,
    }).eq('id', user.id);

    const resetUrl = `https://www.genois.in/reset-password?token=${token}`;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'GENOIS <noreply@genois.in>',
      to: user.email,
      subject: '🔑 Reset your GENOIS password',
      html: `<div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8f4ff">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:32px;"></div><h1 style="font-size:22px;font-weight:800;color:#e8f4ff;margin-bottom:12px;">Reset your password</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:24px;">Hey ${user.name || 'Student'}, click below to reset your GENOIS password. This link expires in 1 hour.</p><a href="${resetUrl}" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;margin-bottom:24px;">Reset My Password</a><p style="color:#5a7a9a;font-size:13px;">If you did not request this ignore this email.</p><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div></div>`,
    });

    if (emailError) {
      console.error('Reset email error:', JSON.stringify(emailError));
    }

    return successResponse({ message: 'If this email exists you will receive a reset link.' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
