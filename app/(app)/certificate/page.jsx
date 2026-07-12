'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const { token, ready } = useToken();
  const [jobCert, setJobCert] = useState(null);
  const [jobError, setJobError] = useState('');
  const [completionCert, setCompletionCert] = useState(null);
  const [completionError, setCompletionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [userDay, setUserDay] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    loadCertificates();
  }, [ready, token]);

  async function loadCertificates() {
    try {
      const [r1, r2, rMe] = await Promise.all([
        apiFetch('/api/certificate?type=job-readiness', token).catch(e => ({ error: e.message })),
        apiFetch('/api/certificate?type=completion', token).catch(e => ({ error: e.message })),
        apiFetch('/api/user/me', token).catch(() => ({})),
      ]);

      if (r1?.data?.certificate) setJobCert(r1.data.certificate);
      else setJobError(r1?.error || r1?.data?.message || 'Need 700+ score');

      if (r2?.data?.certificate) setCompletionCert(r2.data.certificate);
      else setCompletionError(r2?.error || r2?.data?.message || 'Need 90 days');

      // Get current stats for progress display
      const u = rMe?.data?.user;
      if (u) {
        setUserScore(u.total_score || 0);
        setUserDay(u.current_day || 0);
      }
      // Prefer from cert data since it fetches from scores table
      if (r1?.data?.certificate?.score) setUserScore(r1.data.certificate.score);
      if (r2?.data?.certificate?.day || r1?.data?.certificate?.day) setUserDay(r2?.data?.certificate?.day || r1?.data?.certificate?.day);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function generatePDF(cert) {
    setGenerating(cert.type);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Background
      doc.setFillColor(2, 8, 18);
      doc.rect(0, 0, 297, 210, 'F');

      // Border accents
      doc.setFillColor(0, 217, 163);
      doc.rect(0, 0, 297, 3, 'F');
      doc.rect(0, 207, 297, 3, 'F');
      doc.rect(0, 0, 3, 210, 'F');
      doc.rect(294, 0, 3, 210, 'F');

      // Logo
      doc.setTextColor(0, 217, 163);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('GENOIS', 148.5, 22, { align: 'center' });

      doc.setTextColor(90, 122, 154);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Career OS for Engineering Students · genois.in', 148.5, 29, { align: 'center' });

      // Divider
      doc.setDrawColor(0, 217, 163);
      doc.setLineWidth(0.3);
      doc.line(40, 33, 257, 33);

      // Subtitle
      doc.setTextColor(200, 216, 232);
      doc.setFontSize(8);
      doc.text('THIS IS TO CERTIFY THAT', 148.5, 42, { align: 'center' });

      // Recipient Name
      doc.setTextColor(0, 217, 163);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(cert.recipientName, 148.5, 58, { align: 'center' });

      // Underline name
      doc.setDrawColor(0, 217, 163);
      doc.setLineWidth(0.2);
      doc.line(60, 62, 237, 62);

      // College
      doc.setTextColor(90, 122, 154);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(cert.college, 148.5, 69, { align: 'center' });

      // Certificate title
      const certTitle = cert.type === 'job-readiness'
        ? 'JOB READINESS CERTIFICATE'
        : 'DOMAIN COMPLETION CERTIFICATE';
      doc.setTextColor(239, 159, 39);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(certTitle, 148.5, 83, { align: 'center' });

      // Description
      const line1 = cert.type === 'job-readiness'
        ? `Has demonstrated exceptional skill and dedication in the domain of ${cert.domain},`
        : `Has successfully completed the 90-Day ${cert.domain} Career Roadmap,`;
      const line2 = cert.type === 'job-readiness'
        ? `achieving a GENOIS Score of ${cert.score} points and demonstrating industry-ready capabilities.`
        : `completing ${cert.day} days of structured learning with a cumulative score of ${cert.score} points.`;

      doc.setTextColor(200, 216, 232);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(line1, 148.5, 94, { align: 'center' });
      doc.text(line2, 148.5, 101, { align: 'center' });

      // Stats boxes
      const boxes = [
        { label: 'GENOIS SCORE', value: String(cert.score), x: 49 },
        { label: 'DAYS COMPLETED', value: String(cert.day), x: 121 },
        { label: 'STREAK RECORD', value: String(cert.streak), x: 193 },
      ];
      boxes.forEach(b => {
        doc.setFillColor(7, 15, 31);
        doc.roundedRect(b.x, 110, 55, 24, 2, 2, 'F');
        doc.setDrawColor(0, 217, 163);
        doc.setLineWidth(0.2);
        doc.roundedRect(b.x, 110, 55, 24, 2, 2, 'S');

        doc.setTextColor(0, 217, 163);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(b.value, b.x + 27.5, 122, { align: 'center' });

        doc.setTextColor(90, 122, 154);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(b.label, b.x + 27.5, 130, { align: 'center' });
      });

      // Divider
      doc.setDrawColor(0, 217, 163);
      doc.setLineWidth(0.2);
      doc.line(40, 144, 257, 144);

      // Footer info
      doc.setTextColor(90, 122, 154);
      doc.setFontSize(6.5);
      doc.text(`Issued: ${cert.issueDate}`, 60, 152, { align: 'center' });
      doc.text(`Certificate ID: ${cert.certId}`, 148.5, 152, { align: 'center' });
      doc.text(`Verify at: ${cert.verifyUrl}`, 237, 152, { align: 'center' });

      // Signature line
      doc.setDrawColor(0, 217, 163);
      doc.line(60, 165, 120, 165);
      doc.setTextColor(0, 217, 163);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('GENOIS', 90, 172, { align: 'center' });
      doc.setTextColor(90, 122, 154);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Founder & CEO, GENOIS Career OS', 90, 177, { align: 'center' });

      doc.save(`GENOIS-${cert.type}-${cert.recipientName.replace(/\s+/g, '-')}.pdf`);
      toast.success('🎉 Certificate downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF: ' + e.message);
    }
    setGenerating('');
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      Loading certificates...
    </div>
  );

  const CertCard = ({ cert, certErr, title, desc, threshold, current, unit, type }) => {
    const pct = Math.min(100, Math.round((current / threshold) * 100));
    return (
      <div style={{ background: '#070f1f', border: `1px solid ${cert ? 'rgba(239,159,39,0.35)' : 'rgba(0,217,163,0.08)'}`, borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {cert && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#EF9F27,#D85A30)' }} />}
        {!cert && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(0,217,163,0.3),transparent)' }} />}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{cert ? '🏆' : '🔒'}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#8a9ab0', lineHeight: 1.6 }}>{desc}</div>
          </div>
          {cert && (
            <button
              onClick={() => generatePDF(cert)}
              disabled={generating === cert.type}
              style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: generating === cert.type ? 'rgba(239,159,39,0.3)' : 'linear-gradient(135deg,#EF9F27,#D85A30)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' }}
            >
              {generating === cert.type ? '⏳ Generating...' : '⬇ Download PDF'}
            </button>
          )}
        </div>

        {cert ? (
          <div style={{ background: 'rgba(239,159,39,0.06)', border: '1px solid rgba(239,159,39,0.15)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>CERTIFICATE DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { label: 'RECIPIENT', value: cert.recipientName },
                { label: 'COLLEGE', value: cert.college },
                { label: 'DOMAIN', value: cert.domain },
                { label: 'SCORE', value: `${cert.score} pts` },
                { label: 'ISSUED', value: cert.issueDate },
                { label: 'CERT ID', value: (cert.certId || '').substring(0, 20) + '...' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>PROGRESS TO UNLOCK</span>
              <span style={{ fontSize: 11, color: '#00d9a3', fontFamily: 'var(--font-mono)' }}>{current}/{threshold} {unit}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 8, marginBottom: 10 }}>
              <div style={{ background: 'linear-gradient(90deg,#00d9a3,#ff6b4a)', borderRadius: 99, height: 8, width: `${pct}%`, transition: 'width 1s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: '#5a7a9a' }}>
              {threshold - current > 0
                ? `Need ${Math.max(0, threshold - current)} more ${unit} to unlock`
                : 'Criteria met — certificate available!'}
            </div>
            {certErr && <div style={{ fontSize: 11, color: '#ff2d78', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{certErr}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%', paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 8 }}>ACHIEVEMENTS</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 8, margin: 0 }}>
          My Certificates
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
          Earn certificates by hitting milestones. Download and share on LinkedIn to attract recruiters.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 32 }}>
        <CertCard
          cert={jobCert}
          certErr={jobError}
          type="job-readiness"
          title="Job Readiness Certificate"
          desc="Awarded when you achieve 700+ GENOIS Score. Proves to recruiters you are placement-ready."
          threshold={700}
          current={userScore}
          unit="points"
        />
        <CertCard
          cert={completionCert}
          certErr={completionError}
          type="completion"
          title="Domain Completion Certificate"
          desc="Awarded when you complete all 90 days of your domain roadmap. Shows commitment and consistency."
          threshold={90}
          current={userDay}
          unit="days"
        />
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed', marginBottom: 16 }}>
          💡 How to earn certificates faster
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { icon: '📅', text: 'Complete daily roadmap every day' },
            { icon: '🧠', text: 'Pass aptitude tests to earn points' },
            { icon: '💻', text: 'Finish DSA roadmap daily tests' },
            { icon: '🎯', text: 'Complete mock interviews' },
            { icon: '⚡', text: 'Maintain your activity streak' },
            { icon: '🏆', text: 'Rank high on the leaderboard' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
              <span style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.4 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
