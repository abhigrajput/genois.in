'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';

const TABS = ['global', 'college', 'domain'];

export default function LeaderboardPage() {
  const { token, ready } = useToken();
  const [tab, setTab] = useState('global');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('genois_user') || '{}');
        setUserId(u.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    apiFetch(`/api/leaderboard?type=${tab}`, token)
      .then(r => {
        const entries = r.data?.leaderboard || r.data?.entries || r.data || [];
        setData(entries);
        const myIndex = entries.findIndex(e => e.userId === userId || e.id === userId);
        setMyRank(myIndex >= 0 ? myIndex + 1 : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab, ready, token, userId]);

  const badgeColor = (badge) => {
    if (badge === 'hire_ready') return { bg: 'rgba(29,158,117,0.15)', color: '#1D9E75', border: 'rgba(29,158,117,0.3)', label: '✓ HIRE-READY' };
    if (badge === 'not_ready') return { bg: 'rgba(255,45,120,0.1)', color: '#ff2d78', border: 'rgba(255,45,120,0.2)', label: '✗ NOT READY' };
    return null;
  };

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'var(--font-body)' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>
          🏆 Leaderboard
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Real rankings. Real skill. No fake certificates.
        </p>
      </div>

      {myRank && (
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#e8e8ed', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Your Rank</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#00f0ff' }}>#{myRank}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            background: tab === t ? '#00f0ff' : 'rgba(255,255,255,0.05)',
            color: tab === t ? '#020812' : '#5a7a9a',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,240,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>
            {tab.toUpperCase()} RANKING
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>
            {data.length} students
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Loading rankings...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontSize: 13 }}>
            No students ranked yet.
          </div>
        ) : (
          data.map((entry, i) => {
            const isMe = entry.userId === userId || entry.id === userId;
            const rank = i + 1;
            const badge = badgeColor(entry.weeklyBadge);

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: isMe ? 'rgba(0,240,255,0.04)' : 'transparent',
                borderLeft: isMe ? '3px solid #00f0ff' : '3px solid transparent',
              }}>
                <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                  {rank === 1 ? <span style={{ fontSize: 20 }}>🥇</span>
                    : rank === 2 ? <span style={{ fontSize: 20 }}>🥈</span>
                    : rank === 3 ? <span style={{ fontSize: 20 }}>🥉</span>
                    : <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#3a4a5a' }}>#{rank}</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isMe ? '#e8e8ed' : '#8a9ab0' }}>
                      {entry.name} {isMe && <span style={{ color: '#00f0ff', fontSize: 11 }}>(you)</span>}
                    </span>
                    {badge && (
                      <span style={{
                        fontSize: 9, padding: '2px 7px', borderRadius: 20,
                        background: badge.bg, color: badge.color,
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        border: `1px solid ${badge.border}`,
                      }}>{badge.label}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                    {entry.college || 'Unknown College'} · {entry.domain || entry.domainSlug}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: isMe ? '#00f0ff' : '#5a7a9a' }}>
                    {entry.totalScore || entry.score || 0}
                  </div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                    Day {entry.currentDay || 1} · 🔥{entry.streak || 0}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
