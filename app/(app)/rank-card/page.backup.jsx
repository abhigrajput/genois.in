'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function RankCardPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    Promise.all([
      apiFetch('/api/auth/profile', token),
      apiFetch('/api/leaderboard?type=global', token),
    ]).then(([profile, lb]) => {
      const user = profile.data?.user || profile.data;
      const scores = lb.data?.leaderboard || lb.data?.entries || lb.data || [];
      const total = scores.length;
      const myScore = user?.totalScore || 0;
      const rank = scores.findIndex(s => s.totalScore <= myScore) + 1 || 1;
      const percentile = Math.round(((total - rank) / total) * 100);
      setData({
        name: user?.name || 'Student',
        domain: user?.domain || user?.domain_slug || 'Engineering',
        score: myScore,
        rank,
        total,
        percentile,
        streak: user?.streak || 0,
        currentDay: user?.currentDay || 1,
        college: user?.college || '',
        skillLevel: user?.skillLevel || 'Beginner',
        weeklyBadge: user?.weeklyBadge || null,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, token]);

  async function downloadCard() {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = 'genois-rank-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch (e) {
      toast.error('Download failed. Try screenshot instead.');
    }
    setDownloading(false);
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `I am ranked #${data?.rank} on GENOIS with a score of ${data?.score} pts. Top ${100 - data?.percentile}% of engineering students. Real skill. No fake certificates. Check it out: https://genois.in`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Generating your card...
    </div>
  );

  const domainColors = {
    cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75',
    ml: '#D85A30', ai: '#BA7517', ds: '#378ADD',
    cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7',
  };
  const domainColor = domainColors[data?.domain?.toLowerCase()] || '#00f0ff';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'var(--font-body)' }}>

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
        Your Rank Card
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 28 }}>
        Download and share on Instagram stories or WhatsApp status.
      </p>

      {/* CARD */}
      <div ref={cardRef} style={{
        background: 'linear-gradient(135deg, #020812 0%, #0a1628 50%, #020812 100%)',
        border: `2px solid ${domainColor}40`,
        borderRadius: 20,
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
        aspectRatio: '9/16',
        maxWidth: 360,
        margin: '0 auto 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${domainColor}08 1px,transparent 1px),linear-gradient(90deg,${domainColor}08 1px,transparent 1px)`, backgroundSize: '30px 30px' }} />

        {/* Glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `${domainColor}15`, filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,107,74,0.1)', filter: 'blur(60px)' }} />

        {/* TOP — Logo and badge */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
            </div>
            {data?.weeklyBadge === 'hire_ready' && (
              <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(29,158,117,0.2)', color: '#1D9E75', fontFamily: 'var(--font-mono)', fontWeight: 700, border: '1px solid rgba(29,158,117,0.4)' }}>
                ✓ HIRE-READY
              </span>
            )}
            {data?.weeklyBadge === 'not_ready' && (
              <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,45,120,0.1)', color: '#ff2d78', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                ✗ NOT READY
              </span>
            )}
          </div>

          {/* Name */}
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 4, lineHeight: 1.1 }}>
            {data?.name}
          </div>
          {data?.college && (
            <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
              {data.college}
            </div>
          )}

          {/* Domain */}
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: `${domainColor}15`, border: `1px solid ${domainColor}40`, color: domainColor, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 28 }}>
            {data?.domain}
          </div>
        </div>

        {/* MIDDLE — Score and rank */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 8 }}>
            GENOIS SCORE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 64, fontWeight: 800, color: domainColor, lineHeight: 1, marginBottom: 4 }}>
            {data?.score}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 1 }}>
            pts
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
            {[
              { label: 'RANK', value: `#${data?.rank}`, color: '#00f0ff' },
              { label: 'STREAK', value: `🔥${data?.streak}d`, color: '#EF9F27' },
              { label: 'DAY', value: `${data?.currentDay}/365`, color: '#ff6b4a' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: `1px solid ${s.color}15` }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5a7a9a', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Percentile line */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>TOP PERCENTILE</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: '#e8e8ed' }}>Top {100 - data?.percentile}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${data?.percentile}%`, background: `linear-gradient(90deg,${domainColor},#ff6b4a)`, borderRadius: 2 }} />
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>
              Can you beat me?
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a' }}>
              genois.in
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={downloadCard}
          disabled={downloading}
          style={{
            padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: downloading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#ff6b4a)',
            color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
          }}>
          {downloading ? 'Generating...' : '⬇ Download Card'}
        </button>
        <button
          onClick={shareWhatsApp}
          style={{
            padding: '14px 28px', borderRadius: 12,
            border: '1px solid rgba(37,211,102,0.3)',
            background: 'rgba(37,211,102,0.08)',
            color: '#25D366', cursor: 'pointer',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
          }}>
          📱 Share on WhatsApp
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`I am ranked #${data?.rank} on GENOIS — Top ${100 - data?.percentile}% of engineers. Real skill. Daily grind. No fake certs. genois.in`);
            toast.success('Caption copied for Instagram!');
          }}
          style={{
            padding: '14px 28px', borderRadius: 12,
            border: '1px solid rgba(193,53,132,0.3)',
            background: 'rgba(193,53,132,0.08)',
            color: '#C13584', cursor: 'pointer',
            fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
          }}>
          📸 Copy Instagram Caption
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 16 }}>
        Tip: Download the card and post it as your Instagram story or WhatsApp status
      </p>
    </div>
  );
}
