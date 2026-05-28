import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/security';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { type, subject, message, email } = body || {};

    if (!await rateLimit(`feedback_${payload?.userId || getClientIp(request)}`, 5, 3600000)) return rateLimitResponse();

    if (!message || message.trim().length < 10) {
      return errorResponse('Message must be at least 10 characters', 400);
    }
    if (message.length > 5000) {
      return errorResponse('Message too long (max 5000 characters)', 400);
    }
    const VALID_TYPES = ['bug', 'feature', 'question', 'praise', 'general', 'complaint'];
    if (type && !VALID_TYPES.includes(type)) {
      return errorResponse('Invalid feedback type', 400);
    }

    const supabase = getAdminClient();

    await supabase.from('feedback').insert({
      user_id: payload?.userId || null,
      type: type || 'general',
      subject: subject || 'No subject',
      message: message.trim(),
      email: email || null,
      status: 'new',
      created_at: new Date().toISOString(),
    });

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const safeType = escapeHtml(type || 'general');
    const safeSubject = escapeHtml(subject || 'N/A');
    const safeEmail = escapeHtml(email || 'Anonymous');
    const safeUserId = escapeHtml(payload?.userId || 'Not logged in');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    await resend.emails.send({
      from: 'GENOIS Feedback <noreply@genois.in>',
      to: 'abhigrajput5@gmail.com',
      subject: `[${(type || 'FEEDBACK').toString().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32)}] ${(subject || 'New feedback from student').toString().slice(0, 120)}`,
      html: `
        <div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;">
          <div style="font-size:24px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8f4ff">OIS</span></div>
          <div style="height:2px;background:linear-gradient(90deg,#00f0ff,transparent);margin-bottom:24px;"></div>
          <h2 style="color:#00f0ff;margin-bottom:16px;">New Feedback Received</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px 0;color:#5a7a9a;width:120px;">From:</td><td style="color:#e8f4ff;">${safeEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#5a7a9a;">User ID:</td><td style="color:#e8f4ff;">${safeUserId}</td></tr>
            <tr><td style="padding:8px 0;color:#5a7a9a;">Type:</td><td style="color:#00f0ff;font-weight:700;">${safeType}</td></tr>
            <tr><td style="padding:8px 0;color:#5a7a9a;">Subject:</td><td style="color:#e8f4ff;">${safeSubject}</td></tr>
          </table>
          <div style="background:#070f1f;border:1px solid rgba(0,240,255,0.15);border-radius:10px;padding:20px;margin-bottom:20px;">
            <div style="font-size:12px;color:#5a7a9a;margin-bottom:8px;letter-spacing:2px;">MESSAGE</div>
            <div style="color:#e8f4ff;font-size:15px;line-height:1.7;">${safeMessage}</div>
          </div>
          <div style="color:#3a4a5a;font-size:12px;">GENOIS · genois.in</div>
        </div>
      `,
    });

    return successResponse({ sent: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return errorResponse('Internal server error', 500);
  }
}
