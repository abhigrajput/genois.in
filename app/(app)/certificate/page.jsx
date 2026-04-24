'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function CertificatePage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/certificate', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function downloadCertificate() {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certRef.current, {
        backgroundColor: '#020812',
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `GENOIS-Certificate-${data?.name?.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Certificate downloaded!');
    } catch (e) {
      toast.error('Download failed. Try screenshot instead.');
    }
    setDownloading(false);
  }

  function shareLinkedIn() {
    const text = encodeURIComponent(
      `Excited to share that I have completed the 30-day ${data?.domain?.toUpperCase()} mastery challenge on GENOIS!\n\nGENOIS Score: ${data?.currentScore} pts\nGlobal Rank: #${data?.rank} of ${data?.total} engineers\nProjects Built: ${data?.projectsDone}\nTests Taken: ${data?.testsTaken}\n\nGENOIS ranks engineers on real daily performance — not resumes or certificates. This is proof of actual skill.\n\nCertificate ID: ${data?.certificateId}\n\n#GENOIS #Engineering #Skills #Placement #${data?.domain?.toUpperCase()}`
    );
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://genois.in&summary=${text}`, '_blank');
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading certificate...
    </div>
  );

  const domainColors = {
    cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75',
    ml: '#D85A30', ai: '#BA7517', ds: '#378ADD',
    cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7',
  };
  const domainColor = domainColors[data?.domain?.toLowerCase()] || '#00f0ff';

  if (!data?.isEligible) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 12 }}>
          Certificate unlocks at Day 30
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 8 }}>
          You are on Day {data?.currentDay}. {30 - (data?.currentDay || 0)} more days to go.
        </p>
        <p style={{ color: '#3a4a5a', fontSize: 13, fontFamily: 'JetBrains Mono,monospace', marginBottom: 32 }}>
          Complete all 30 days to earn your GENOIS certificate.
        </p>
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>PROGRESS TO CERTIFICATE</div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${Math.round((data?.currentDay / 30) * 100)}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            <span>Day {data?.currentDay}</span>
            <span>Day 30</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
        🎓 Your Certificate
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 28 }}>
        You completed 30 days. Download and share on LinkedIn.
      </p>

      {/* CERTIFICATE */}
      <div ref={certRef} style={{
        background: 'linear-gradient(135deg,#020812 0%,#0a1628 50%,#020812 100%)',
        border: `3px solid ${domainColor}40`,
        borderRadius: 20,
        padding: 40,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '1.414',
      }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${domainColor}05 1px,transparent 1px),linear-gradient(90deg,${domainColor}05 1px,transparent 1px)`, backgroundSize: '32px 32px' }} />

        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, border: `2px solid ${domainColor}40`, borderRight: 'none', borderBottom: 'none', borderRadius: '4px 0 0 0' }} />
        <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, border: `2px solid ${domainColor}40`, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 4px 0 0' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, width: 40, height: 40, border: `2px solid ${domainColor}40`, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 4px' }} />
        <div style={{ position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, border: `2px solid ${domainColor}40`, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 4px 0' }} />

        {/* Glow */}
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, borderRadius: '50%', background: `${domainColor}08`, filter: 'blur(60px)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

          {/* Header */}
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 3 }}>
              CAREER OS FOR ENGINEERS
            </div>
          </div>

          {/* Main content */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
              THIS IS TO CERTIFY THAT
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#e8f4ff', marginBottom: 8, letterSpacing: -0.5 }}>
              {data?.name}
            </div>
            {data?.college && (
              <div style={{ fontSize: 14, color: '#5a7a9a', marginBottom: 24, fontFamily: 'JetBrains Mono,monospace' }}>
                {data.college}
              </div>
            )}
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12 }}>
              HAS SUCCESSFULLY COMPLETED
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: domainColor, marginBottom: 4 }}>
              30-Day {data?.domain?.toUpperCase()} Mastery Challenge
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 1, marginBottom: 28 }}>
              Through daily grind, real projects, and verified skill assessment
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
              {[
                { label: 'GENOIS SCORE', value: data?.currentScore, color: domainColor },
                { label: 'GLOBAL RANK', value: `#${data?.rank}`, color: '#00f0ff' },
                { label: 'PROJECTS', value: data?.projectsDone, color: '#7b5cff' },
                { label: 'TESTS', value: data?.testsTaken, color: '#1D9E75' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#5a7a9a', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>ISSUED ON</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: '#e8f4ff' }}>{data?.completionDate}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: `2px solid ${domainColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', background: `${domainColor}08` }}>
                <span style={{ fontSize: 24 }}>🏆</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#5a7a9a' }}>VERIFIED</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>CERTIFICATE ID</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: domainColor }}>{data?.certificateId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={downloadCertificate} disabled={downloading} style={{ padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: downloading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
          {downloading ? 'Generating...' : '⬇ Download Certificate'}
        </button>
        <button onClick={shareLinkedIn} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid rgba(0,119,181,0.4)', background: 'rgba(0,119,181,0.1)', color: '#0077B5', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600 }}>
          💼 Share on LinkedIn
        </button>
        <button onClick={() => {
          navigator.clipboard.writeText(
            `Just completed the 30-day ${data?.domain?.toUpperCase()} challenge on GENOIS. Score: ${data?.currentScore} pts. Rank: #${data?.rank} of ${data?.total} engineers. Certificate ID: ${data?.certificateId}. genois.in`
          );
          toast.success('Caption copied!');
        }} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25D366', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600 }}>
          📱 Copy for WhatsApp
        </button>
      </div>
      <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
        Certificate ID: {data?.certificateId} · Verifiable at genois.in
      </p>
    </div>
  );
}
