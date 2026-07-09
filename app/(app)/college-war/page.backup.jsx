'use client';
import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';

const G = '#00ff41';
const BG = '#000000';
const BG2 = '#050505';
const BG3 = '#0a0a0a';

export default function CollegeWarPage() {
  const { user } = useAuthStore();
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.college) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('genois_token');
    fetch('/api/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const all = d.data?.leaderboard || [];
        const filtered = all.filter(p => p.college === user.college);
        setPeers(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error('College war fetch error:', err);
        setError('Failed to load rankings');
        setLoading(false);
      });
  }, [user?.college]);

  if (!user?.college) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', padding: '48px 32px', borderRadius: 20, background: BG2, border: '1px solid rgba(0,255,65,0.15)', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Join College War
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>
            Set your college in Profile to join College War and see how you rank among your batchmates.
          </p>
          <a href="/profile" style={{
            display: 'inline-block', marginTop: 24, padding: '12px 28px', borderRadius: 10,
            background: G, color: '#000', textDecoration: 'none',
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14,
          }}>
            Go to Profile →
          </a>
        </div>
      </div>
    );
  }

  const myRank = peers.findIndex(p => p.id === user?.id) + 1;

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#e5e7eb', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(0,255,65,0.07)', border: '1px solid rgba(0,255,65,0.22)', color: G, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
            College War
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>
            College War 🏆
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
            See how you rank among your batchmates
          </p>
        </div>

        {/* College badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: BG2, border: '1px solid rgba(0,255,65,0.15)', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🏫
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{user.college}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{peers.length} student{peers.length !== 1 ? 's' : ''} on GENOIS</div>
          </div>
          {myRank > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: G }}>#{myRank}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>your rank</div>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ background: BG2, border: '1px solid rgba(0,255,65,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 120px 100px 110px', padding: '12px 20px', borderBottom: '1px solid rgba(0,255,65,0.08)', background: BG3 }}>
            {['Rank', 'Name', 'Score', 'Streak', 'Domain'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: '#4b5563', letterSpacing: 1.2, textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#4b5563', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Loading rankings...
            </div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>{error}</div>
          ) : peers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <div style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                You&apos;re the first from {user.college}!
              </div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Share GENOIS with your batchmates to start College War.</div>
            </div>
          ) : (
            peers.map((p, i) => {
              const isMe = p.id === user?.id;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr 120px 100px 110px',
                  padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: isMe ? 'rgba(0,255,65,0.04)' : 'transparent',
                  alignItems: 'center', transition: 'background 0.15s',
                }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: isMe ? G : '#4b5563', fontSize: 15 }}>
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: isMe ? G : '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.name}
                      {isMe && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,255,65,0.12)', border: '1px solid rgba(0,255,65,0.3)', color: G, fontFamily: 'var(--font-body)', fontWeight: 600 }}>YOU</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: isMe ? G : '#fff' }}>
                    {(p.score || 0).toLocaleString()}
                    <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 3, fontWeight: 400 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#ffb020' }}>
                    🔥 {p.streak || 0}d
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                    {(p.domain || 'general').replace(/_/g, ' ')}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 24, fontFamily: 'var(--font-body)' }}>
          Rankings update every minute · Score based on streak, completed days, and tests
        </p>
      </div>
    </div>
  );
}
