'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function GlowUpPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/glow-up', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function downloadCard() {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#020812',
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `genois-glow-up-day${data?.currentDay}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Glow Up card downloaded!');
    } catch (e) {
      toast.error('Download failed. Try screenshot instead.');
    }
    setDownloading(false);
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `${data?.currentDay} days on GENOIS. My score went from ${data?.day1Score} to ${data?.currentScore} pts. I am now ranked #${data?.currentRank} out of ${data?.totalStudents} engineering students. This is what daily grind looks like. genois.in`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Calculating your glow up...
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
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 12 }}>
          Glow Up unlocks at Day 15
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 8 }}>
          You are on Day {data?.currentDay}. Keep grinding for {15 - (data?.currentDay || 0)} more days.
        </p>
        <p style={{ color: '#3a4a5a', fontSize: 13, fontFamily: 'JetBrains Mono,monospace' }}>
          At Day 15 and Day 30 your transformation card is generated automatically.
        </p>
        <div style={{ marginTop: 32, background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>YOUR PROGRESS SO FAR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Current Day', value: data?.currentDay, color: '#00f0ff' },
              { label: 'Score', value: data?.currentScore, color: '#7b5cff' },
              { label: 'Streak', value: `🔥${data?.streak}`, color: '#EF9F27' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
        Your Glow Up 🔥
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 28 }}>
        Day {data?.currentDay} transformation card. Share it and make your batchmates jealous.
      </p>

      {/* CARD */}
      <div ref={cardRef} style={{
        background: 'linear-gradient(135deg,#020812 0%,#0a1628 60%,#020812 100%)',
        border: `2px solid ${domainColor}30`,
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${domainColor}06 1px,transparent 1px),linear-gradient(90deg,${domainColor}06 1px,transparent 1px)`, backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `${domainColor}10`, filter: 'blur(50px)' }} />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
          </div>
          <div style={{ padding: '4px 12px', borderRadius: 20, background: `${domainColor}15`, border: `1px solid ${domainColor}30`, color: domainColor, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>
            DAY {data?.currentDay} GLOW UP
          </div>
        </div>

        {/* Name */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>{data?.name}</div>
          {data?.college && <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{data.college}</div>}
        </div>

        {/* Score transformation */}
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>SCORE TRANSFORMATION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 4 }}>DAY 1</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#3a4a5a' }}>{data?.day1Score}</div>
              <div style={{ fontSize: 10, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>pts</div>
            </div>
            <div style={{ fontSize: 24, color: domainColor }}>→</div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 4 }}>DAY {data?.currentDay}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: domainColor }}>{data?.currentScore}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>pts</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', marginBottom: 4 }}>GROWTH</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#1D9E75' }}>+{data?.scoreImprovement}</div>
              <div style={{ fontSize: 10, color: '#1D9E75', fontFamily: 'JetBrains Mono,monospace' }}>pts gained</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Global Rank', value: `#${data?.currentRank}`, sub: `of ${data?.totalStudents}`, color: '#00f0ff' },
            { label: 'Day Streak', value: `🔥${data?.streak}`, sub: 'days', color: '#EF9F27' },
            { label: 'Topics Covered', value: data?.topicsCovered, sub: 'topics', color: '#7b5cff' },
            { label: 'Tests Taken', value: data?.testsTaken, sub: `avg ${data?.avgTestScore}%`, color: '#1D9E75' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}15` }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#5a7a9a', letterSpacing: 1, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '16px', background: `${domainColor}08`, borderRadius: 10, border: `1px solid ${domainColor}15` }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>
            {data?.currentDay >= 30
              ? `30 days. Real skill. No shortcuts.`
              : `${data?.currentDay} days down. ${30 - data?.currentDay} days to master ${data?.domain?.toUpperCase()}.`}
          </div>
          <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>genois.in</div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={downloadCard} disabled={downloading} style={{ padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: downloading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
          {downloading ? 'Generating...' : '⬇ Download Card'}
        </button>
        <button onClick={shareWhatsApp} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25D366', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600 }}>
          📱 Share on WhatsApp
        </button>
        <button onClick={() => {
          navigator.clipboard.writeText(
            `${data?.currentDay} days on GENOIS. Score: ${data?.day1Score} → ${data?.currentScore} pts. Rank: #${data?.currentRank} of ${data?.totalStudents} engineers. Daily grind hits different. genois.in`
          );
          toast.success('Caption copied!');
        }} style={{ padding: '13px 24px', borderRadius: 12, border: '1px solid rgba(193,53,132,0.3)', background: 'rgba(193,53,132,0.08)', color: '#C13584', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600 }}>
          📸 Copy Caption
        </button>
      </div>
      <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
        Download and post as Instagram story or WhatsApp status
      </p>
    </div>
  );
}
