'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicPageWrapper from '@/components/PublicPageWrapper';

export default function CollegeWarPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('genois_token'));
  }, []);

  useEffect(() => {
    fetch('/api/college-war')
      .then(r => r.json())
      .then(d => {
        setColleges(d.data?.colleges || []);
        setLastUpdated(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = colleges.filter(c =>
    !search || c.college.toLowerCase().includes(search.toLowerCase())
  );

  const top = filtered[0];

  return (
    <PublicPageWrapper>
      <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif' }}>
        <main style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,240,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

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
            ].map(l => (
              <a key={l.href} href={l.href} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(0,240,255,0.06)', color: '#00f0ff', textDecoration: 'none', fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
                {l.label}
              </a>
            ))}
          </div>
        )}

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>
            ⚔️ COLLEGE WAR
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.1 }}>
            Which college has the<br />
            <span style={{ background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              most skilled engineers?
            </span>
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 8 }}>
            Ranked by average GENOIS score. Updated daily. No fake rankings.
          </p>
          <p style={{ color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* TOP COLLEGE BANNER */}
        {!loading && top && (
          <div style={{ background: 'linear-gradient(135deg,rgba(239,159,39,0.1),rgba(186,117,23,0.05))', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, padding: 24, marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#EF9F27,transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 8 }}>
                  🏆 THIS WEEK&apos;S TOP COLLEGE
                </div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
                  {top.college}
                </div>
                <div style={{ fontSize: 13, color: '#5a7a9a' }}>
                  {top.students} students · Avg score {top.avgScore} · Top domain: {top.topDomain?.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 40, fontWeight: 800, color: '#EF9F27' }}>{top.avgScore}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>avg score</div>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your college..."
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 14, fontFamily: 'Outfit,sans-serif', outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
        />

        {/* COLLEGES LIST */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,240,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>COLLEGE RANKINGS</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a' }}>{filtered.length} colleges</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Loading rankings...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontSize: 13 }}>No colleges found yet. Be the first from your college!</div>
          ) : (
            filtered.map((c, i) => {
              const rank = colleges.indexOf(c) + 1;
              const isTop = rank === 1;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: isTop ? 'rgba(239,159,39,0.03)' : 'transparent' }}>
                  <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                    {rank === 1 ? <span style={{ fontSize: 22 }}>🥇</span>
                      : rank === 2 ? <span style={{ fontSize: 22 }}>🥈</span>
                      : rank === 3 ? <span style={{ fontSize: 22 }}>🥉</span>
                      : <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#3a4a5a' }}>#{rank}</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: isTop ? '#EF9F27' : '#e8f4ff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.college}
                    </div>
                    <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                      {c.students} student{c.students > 1 ? 's' : ''} · Top domain: {c.topDomain?.toUpperCase()} · Avg streak: 🔥{c.avgStreak}d
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: isTop ? '#EF9F27' : '#5a7a9a' }}>{c.avgScore}</div>
                    <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>avg score</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40, padding: 32, background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 16 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
            Is your college on this list?
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 20 }}>
            Join GENOIS and represent your college. Every student you bring improves your college ranking.
          </div>
          <Link href="/onboarding" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            Join Free →
          </Link>
        </div>

      </main>
    </div>
    </PublicPageWrapper>
  );
}
