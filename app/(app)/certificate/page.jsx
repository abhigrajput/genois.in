'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { usePermission } from '@/lib/usePermission';
import PermissionGate from '@/components/PermissionGate';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const { token } = useToken();
  const { effectivePlan } = usePermission();
  const [score, setScore] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/analytics/dashboard', token).then(r => {
      const s = r.data?.score;
      setScore(typeof s === 'number' ? s : s?.total_score || 0);
    });
  }, [token]);

  async function downloadCertificate() {
    setDownloading(true);
    try {
      const res = await fetch('/api/certificate', {
        headers: { Authorization: 'Bearer ' + token },
      });
      
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || 'Download failed');
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GENOIS_Certificate_${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!');
    } catch (e) {
      toast.error(e.message);
    }
    setDownloading(false);
  }

  return (
    <PermissionGate feature="job_certificate">
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#e8f4ff', marginBottom: 6 }}>
            🏆 Job Ready Certificate
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 13 }}>Earn a verifiable PDF certificate. Add to LinkedIn. Show recruiters.</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.05),rgba(123,92,255,0.05))', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 14, padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f4ff', marginBottom: 12 }}>
            GENOIS Certified
          </div>
          <div style={{ fontSize: 14, color: '#8a9ab0', marginBottom: 20 }}>
            Your current score: <strong style={{ color: '#00f0ff' }}>{score} pts</strong>
          </div>
          {score >= 500 ? (
            <button onClick={downloadCertificate} disabled={downloading} style={{ padding: '14px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              {downloading ? 'Generating...' : '⬇️  Download Certificate (PDF)'}
            </button>
          ) : (
            <div style={{ padding: 16, background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 10, color: '#EF9F27', fontSize: 13 }}>
              You need <strong>500+ points</strong> to earn certificate. Keep grinding! ({500 - score} more to go)
            </div>
          )}
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 16 }}>
            Why this certificate matters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#8a9ab0' }}>✅ Verifiable via unique ID at genois.in/verify</div>
            <div style={{ fontSize: 13, color: '#8a9ab0' }}>✅ Add to LinkedIn profile</div>
            <div style={{ fontSize: 13, color: '#8a9ab0' }}>✅ Show in resume</div>
            <div style={{ fontSize: 13, color: '#8a9ab0' }}>✅ Proves consistent skill mastery</div>
            <div style={{ fontSize: 13, color: '#8a9ab0' }}>✅ Recruiter-ready format</div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
