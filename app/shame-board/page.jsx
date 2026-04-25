'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicPageWrapper from '@/components/PublicPageWrapper';

export default function ShameBoardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('genois_token'));
  }, []);

  useEffect(() => {
    fetch('/api/shame-board')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = (data?.students || []).filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicPageWrapper>
      <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,45,120,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,45,120,0.01) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

        <main style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        <button onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = '/dashboard'; }} style={{ background: 'transparent', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff', cursor: 'pointer', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 600, marginBottom: 20 }}>
          ← Back
        </button>

        {isLoggedIn && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(0,240,255,0.08)' }}>
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', alignSelf: 'center', marginRight: 4 }}>QUICK ACCESS:</span>
            {[
              { href: '/dashboard', label: '📊 Dashboard' },
              { href: '/roadmap', label: '🗺️ Roadmap' },
              { href: '/anxiety', label: '🌙 2AM Chat' },
              { href: '/graveyard', label: '☠️ Graveyard' },
              { href: '/college-war', label: '⚔️ College War' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(0,240,255,0.06)', color: '#00f0ff', textDecoration: 'none', fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#ff2d78', letterSpacing: 2, marginBottom: 12 }}>
            😴 SHAME BOARD
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.1 }}>
            Students who<br />
            <span style={{ color: '#ff2d78' }}>stopped showing up.</span>
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
            These students have not logged in for 3+ days. Their rank is dropping every single day. Don&apos;t end up here.
          </p>
        </div>

        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Gone AWOL', value: data.total, color: '#ff2d78' },
              { label: 'Avg Days Gone', value: filtered.length > 0 ? Math.round(filtered.reduce((a, s) => a + s.daysSinceActive, 0) / filtered.length) : 0, color: '#EF9F27' },
              { label: 'Longest Streak Lost', value: filtered.length > 0 ? Math.max(...filtered.map(s => s.streak)) : 0, color: '#7b5cff' },
            ].map(s => (
              <div key={s.label} style={{ background: '#070f1f', border: `1px solid ${s.color}20`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or college..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,45,120,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />

        <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,45,120,0.08)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 1 }}>INACTIVE FOR 3+ DAYS</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a' }}>{filtered.length} students</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a' }}>
              {data?.total === 0 ? '🎉 Everyone is active! No one on the shame board.' : 'No results found.'}
            </div>
          ) : (
            filtered.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#3a4a5a' }}>#{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#8a9ab0', marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                    {s.college} · {s.domain?.toUpperCase()} · Day {s.currentDay}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, color: '#ff2d78' }}>
                    {s.daysSinceActive}d
                  </div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>gone</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, padding: 24, background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
            Do not end up here.
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 16 }}>
            Start your 30-day challenge today. Show up every day. Get ranked.
          </div>
          <Link href="/onboarding" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            Start Free →
          </Link>
        </div>
      </main>
    </div>
    </PublicPageWrapper>
  );
}
