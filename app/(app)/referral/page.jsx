'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function ReferralPage() {
  const { token } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/referral', token).then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  function copyLink() {
    navigator.clipboard.writeText(data?.shareUrl);
    toast.success('Link copied!');
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(`Hey, I am using GENOIS to crack placements. Join with my code ${data?.referralCode} and we both get 1 month free Dominator! ${data?.shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`);
  }

  if (loading) return <div style={{ padding: 40, color: '#5a7a9a' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 6 }}>
        🎁 Refer & Earn
      </h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 24 }}>
        Refer friends. Both get 1 month free Dominator when they subscribe.
      </p>

      <div style={{ background: 'linear-gradient(135deg,rgba(29,158,117,0.1),rgba(0,240,255,0.05))', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'var(--font-mono)', letterSpacing: 2, marginBottom: 8 }}>YOUR REFERRAL CODE</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: '#1D9E75', letterSpacing: 3, marginBottom: 16 }}>
          {data?.referralCode}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={copyLink} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.3)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
            🔗 Copy Link
          </button>
          <button onClick={shareWhatsApp} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#25D366', color: '#020812', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            📱 Share WhatsApp
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#00f0ff' }}>{data?.stats?.total || 0}</div>
          <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>TOTAL REFS</div>
        </div>
        <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.1)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#1D9E75' }}>{data?.stats?.converted || 0}</div>
          <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>CONVERTED</div>
        </div>
        <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.1)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#EF9F27' }}>{data?.stats?.pending || 0}</div>
          <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>PENDING</div>
        </div>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 16 }}>
          🏆 Top Referrers
        </div>
        {data?.leaderboard?.length > 0 ? data.leaderboard.map((u, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? 'linear-gradient(135deg,#EF9F27,#D85A30)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i < 3 ? '#020812' : '#5a7a9a' }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: '#e8e8ed' }}>{u.name || 'Student'}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#1D9E75' }}>
              {u.referral_count} refs
            </div>
          </div>
        )) : (
          <div style={{ color: '#5a7a9a', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Be the first to refer!
          </div>
        )}
      </div>
    </div>
  );
}
