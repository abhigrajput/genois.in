import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse } from '@/lib/response';
import { hasPermission } from '@/lib/permissions';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('name, email, domain_slug, subscription_plan, trial_ends_at, is_on_trial, total_score')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 404);

    const allowed = hasPermission(user.subscription_plan, 'job_certificate', user.trial_ends_at, user.is_on_trial);
    if (!allowed) return errorResponse('Job Certificate is a Dominator plan feature', 403);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('current_day, total_score, streak')
      .eq('user_id', payload.userId)
      .single();

    const score = progress?.total_score || user.total_score || 0;
    const day = progress?.current_day || 1;

    if (score < 500) {
      return errorResponse(`You need 500+ points to earn a certificate. Current: ${score}`, 400);
    }

    const certId = `GEN-${Date.now().toString(36).toUpperCase()}-${payload.userId.substring(0, 6).toUpperCase()}`;

    await supabase.from('certificates').insert({
      user_id: payload.userId,
      certificate_type: 'job_ready',
      score_at_issue: score,
      domain: user.domain_slug,
      certificate_id: certId,
    });

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    doc.rect(0, 0, 842, 595).fill('#020812');

    doc.lineWidth(3).strokeColor('#00f0ff').rect(30, 30, 782, 535).stroke();
    doc.lineWidth(1).strokeColor('#7b5cff').rect(45, 45, 752, 505).stroke();

    doc.fillColor('#00f0ff').font('Helvetica-Bold').fontSize(36).text('GENOIS', 0, 70, { align: 'center', width: 842 });
    doc.fillColor('#5a7a9a').fontSize(10).text('CAREER OS FOR ENGINEERING STUDENTS', 0, 115, { align: 'center', width: 842, characterSpacing: 3 });

    doc.fillColor('#EF9F27').font('Helvetica').fontSize(14).text('CERTIFICATE OF ACHIEVEMENT', 0, 170, { align: 'center', width: 842, characterSpacing: 4 });

    doc.fillColor('#5a7a9a').fontSize(11).text('This certifies that', 0, 220, { align: 'center', width: 842 });
    doc.fillColor('#e8f4ff').font('Helvetica-Bold').fontSize(32).text(user.name || 'Student', 0, 245, { align: 'center', width: 842 });

    doc.fillColor('#5a7a9a').font('Helvetica').fontSize(11).text('has successfully earned the', 0, 295, { align: 'center', width: 842 });
    doc.fillColor('#1D9E75').font('Helvetica-Bold').fontSize(20).text('JOB READY CERTIFICATE', 0, 318, { align: 'center', width: 842 });

    doc.fillColor('#8a9ab0').font('Helvetica').fontSize(11).text(
      `By demonstrating consistent skill mastery in ${(user.domain_slug || 'engineering').toUpperCase()}`,
      0, 360, { align: 'center', width: 842 }
    );
    doc.text(`with a verified score of ${score} GENOIS Points on Day ${day}`, 0, 378, { align: 'center', width: 842 });

    doc.fillColor('#5a7a9a').fontSize(9).text(`Certificate ID: ${certId}`, 60, 510);
    doc.text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 60, 525);
    doc.text(`Verify at genois.in/verify/${certId}`, 60, 540);

    doc.fillColor('#00f0ff').font('Helvetica-Bold').fontSize(11).text('GENOIS', 700, 510, { width: 100, align: 'right' });
    doc.fillColor('#5a7a9a').font('Helvetica').fontSize(8).text('Founder & CEO', 700, 525, { width: 100, align: 'right' });
    doc.text('Laxshu Rajput', 700, 538, { width: 100, align: 'right' });

    doc.end();

    await new Promise(resolve => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="GENOIS_Certificate_${certId}.pdf"`,
      },
    });
  } catch (error) {
    return errorResponse('Certificate generation failed: ' + error.message, 500);
  }
}
