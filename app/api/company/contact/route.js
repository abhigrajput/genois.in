import { getAdminClient } from '@/lib/supabaseAdmin';
import { getCompanyFromRequest } from '@/lib/companyAuth';
import { successResponse, errorResponse } from '@/lib/response';
import { Resend } from 'resend';

export async function POST(request) {
  try {
    const company = await getCompanyFromRequest(request);
    if (!company) return errorResponse('Unauthorized', 401);

    const { studentUserId, message } = await request.json();
    if (!studentUserId) return errorResponse('Student ID required', 400);

    const supabase = getAdminClient();

    const { data: companyData } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', company.companyId)
      .single();

    const { data: student } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', studentUserId)
      .single();

    if (!student) return errorResponse('Student not found', 404);

    await supabase.from('company_contacts').insert({
      company_id: company.companyId,
      student_user_id: studentUserId,
      message: message || null,
      status: 'sent',
    });

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GENOIS <onboarding@resend.dev>',
        to: student.email,
        subject: `🎉 ${companyData.name} wants to connect with you on GENOIS`,
        html: `<div style="background:#020812;color:#e8f4ff;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;border-radius:12px;"><div style="font-size:28px;font-weight:800;margin-bottom:8px;"><span style="color:#00f0ff">GEN</span><span style="color:#e8f4ff">OIS</span></div><div style="height:2px;background:linear-gradient(90deg,#1D9E75,transparent);margin-bottom:32px;"></div><div style="font-size:48px;margin-bottom:16px;">🎉</div><h1 style="font-size:22px;font-weight:800;color:#e8f4ff;margin-bottom:12px;">A company wants to hire you!</h1><p style="color:#8a9ab0;font-size:15px;line-height:1.7;margin-bottom:16px;">Hey ${student.name}, <strong style="color:#00f0ff">${companyData.name}</strong> found your GENOIS profile and wants to connect with you.</p>${message ? `<div style="background:#070f1f;border:1px solid rgba(0,240,255,0.1);border-radius:10px;padding:16px;margin-bottom:20px;"><div style="font-size:11px;color:#5a7a9a;letter-spacing:2px;margin-bottom:8px;">MESSAGE FROM ${companyData.name.toUpperCase()}</div><p style="color:#c8d8e8;font-size:14px;line-height:1.7;margin:0;">${message}</p></div>` : ''}<p style="color:#5a7a9a;font-size:13px;margin-bottom:24px;">Reply to this email to connect with ${companyData.name} directly.</p><a href="https://genois.in/dashboard" style="display:block;text-align:center;padding:14px 32px;background:linear-gradient(135deg,#00f0ff,#7b5cff);color:#020812;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;">View Your Profile →</a><div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);color:#3a4a5a;font-size:12px;">GENOIS · genois.in · Reply to: ${companyData.email}</div></div>`,
        replyTo: companyData.email,
      });
    } catch (e) {
      console.error('Contact email error:', e.message);
    }

    return successResponse({ message: 'Contact request sent to student' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
