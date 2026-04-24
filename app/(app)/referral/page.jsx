'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function ReferralPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/referral', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  function copyLink() {
    navigator.clipboard.writeText(data?.referralLink || '');
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(
      `Bhai sun — GENOIS pe join kar. Ye platform actually tumhara real skill measure karta hai, not fake resume. Mera referral link use kar dono ko 1 month free milega: ${data?.referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function shareInstagram() {
    navigator.clipboard.writeText(data?.referralLink || '');
    toast.success('Link copied! Paste it in your Instagram bio or story.');
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
        Refer & Earn
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 28 }}>
        Refer a friend. Both of you get 1 month free.
      </p>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Friends Referred', value: data?.totalReferrals || 0, color: '#00f0ff' },
          { label: 'Successful', value: data?.successfulReferrals || 0, color: '#1D9E75' },
          { label: 'Bonus Days Earned', value: data?.bonusDays || 0, color: '#7b5cff' },
          { label: 'Money Saved', value: `₹${data?.moneySaved || 0}`, color: '#EF9F27' },
        ].map(s => (
          <div key={s.label} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* REFERRAL LINK */}
      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 12 }}>
          YOUR REFERRAL LINK
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)', color: '#00f0ff', fontSize: 13, fontFamily: 'JetBrains Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data?.referralLink}
          </div>
          <button onClick={copyLink} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: copied ? '#1D9E75' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={shareWhatsApp} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25D366', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
            📱 Share on WhatsApp
          </button>
          <button onClick={shareInstagram} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(131,58,180,0.3)', background: 'rgba(131,58,180,0.08)', color: '#C13584', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
            📸 Copy for Instagram
          </button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
          HOW IT WORKS
        </div>
        {[
          { step: '1', text: 'Share your referral link with a friend', color: '#00f0ff' },
          { step: '2', text: 'Friend signs up using your link', color: '#7b5cff' },
          { step: '3', text: 'Both of you get 30 days added to your account automatically', color: '#1D9E75' },
          { step: '4', text: 'No limit — refer 10 friends get 10 months free', color: '#EF9F27' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${s.color}20`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 800, color: s.color }}>
              {s.step}
            </div>
            <div style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.6, paddingTop: 4 }}>{s.text}</div>
          </div>
        ))}
      </div>

      {/* REFERRAL HISTORY */}
      {data?.referrals?.length > 0 && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>
            REFERRAL HISTORY
          </div>
          {data.referrals.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 13, color: '#8a9ab0' }}>Friend #{i + 1}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                  {new Date(r.created_at).toLocaleDateString('en-IN')}
                </span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r.status === 'completed' ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.05)', color: r.status === 'completed' ? '#1D9E75' : '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                  {r.status === 'completed' ? '+30 days earned' : 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
