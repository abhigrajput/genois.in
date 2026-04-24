'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function LinkedInBadgePage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const badgeRef = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/linkedin-badge', token)
      .then(r => { setData(r.data); setLinkedinUrl(r.data?.linkedinUrl || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function saveLinkedIn() {
    if (!linkedinUrl.trim()) { toast.error('Enter your LinkedIn URL'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/linkedin-badge', token, 'POST', { linkedinUrl });
      toast.success('LinkedIn URL saved!');
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied!');
    setTimeout(() => setCopied(''), 2000);
  }

  async function downloadBadge() {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(badgeRef.current, { backgroundColor: '#020812', scale: 3, useCORS: true });
      const link = document.createElement('a');
      link.download = 'GENOIS-Verified-Badge.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Badge downloaded!');
    } catch { toast.error('Download failed. Try screenshot.'); }
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>Loading...</div>
  );

  if (!data?.isEligible) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 12 }}>
          LinkedIn Badge unlocks at 1000 pts
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 8 }}>
          Your score: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{data?.currentScore} pts</span>
        </p>
        <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 32 }}>
          {data?.pointsNeeded} more points needed.
        </p>
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((data?.currentScore / 1000) * 100))}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            <span>{data?.currentScore} pts</span>
            <span>1000 pts</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          💼 GENOIS Verified Badge
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>Share on LinkedIn. Let recruiters see your real skill.</p>
      </div>

      <div ref={badgeRef} style={{
        background: 'linear-gradient(135deg,#020812,#0a1628,#020812)',
        border: '2px solid rgba(0,119,181,0.4)',
        borderRadius: 16, padding: 28, marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#0077B5,transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,119,181,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,119,181,0.03) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff' }}>{data?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,119,181,0.15)', border: '1px solid rgba(0,119,181,0.4)', color: '#0077B5' }}>
                <span style={{ fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>GENOIS VERIFIED</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 12 }}>{data?.college}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { label: 'Score', value: data?.currentScore + ' pts', color: '#00f0ff' },
                { label: 'Rank', value: '#' + data?.rank, color: '#7b5cff' },
                { label: 'Top', value: (100 - data?.percentile) + '%', color: '#1D9E75' },
                { label: 'Domain', value: data?.domain?.toUpperCase(), color: '#EF9F27' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
              Verified by GENOIS · genois.in · Real skills. Daily grind.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={downloadBadge} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
          ⬇ Download Badge
        </button>
        <button onClick={() => window.open('https://www.linkedin.com/sharing/share-offsite/?url=https://genois.in', '_blank')} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(0,119,181,0.4)', background: 'rgba(0,119,181,0.08)', color: '#0077B5', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
          💼 Share on LinkedIn
        </button>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,119,181,0.2)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#0077B5', letterSpacing: 2 }}>LINKEDIN POST CAPTION</div>
          <button onClick={() => copyText(data?.linkedinPostText, 'post')} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(0,119,181,0.3)', background: copied === 'post' ? 'rgba(0,119,181,0.2)' : 'transparent', color: '#0077B5', cursor: 'pointer', fontSize: 12 }}>
            {copied === 'post' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#8a9ab0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{data?.linkedinPostText}</div>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2 }}>BADGE TEXT FOR LINKEDIN BIO</div>
          <button onClick={() => copyText(data?.badgeText, 'badge')} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: copied === 'badge' ? 'rgba(0,240,255,0.1)' : 'transparent', color: '#00f0ff', cursor: 'pointer', fontSize: 12 }}>
            {copied === 'badge' ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#8a9ab0', lineHeight: 1.6 }}>{data?.badgeText}</div>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12 }}>SAVE YOUR LINKEDIN URL</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 13, outline: 'none' }} />
          <button onClick={saveLinkedIn} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#0077B5,#00a0dc)', color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
