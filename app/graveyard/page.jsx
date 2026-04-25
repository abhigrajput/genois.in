'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicPageWrapper from '@/components/PublicPageWrapper';

export default function GraveyardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('genois_token'));
  }, []);

  useEffect(() => {
    fetch('/api/graveyard')
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PublicPageWrapper>
      <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,45,120,0.008) 1px,transparent 1px),linear-gradient(90deg,rgba(255,45,120,0.008) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

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
              { href: '/shame-board', label: '😴 Shame Board' },
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
            ☠️ THE GRAVEYARD
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.1 }}>
            They started.<br />
            <span style={{ color: '#ff2d78' }}>They quit.</span>
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            These students joined GENOIS, started their journey, and disappeared after 14+ days of inactivity.
            Every name here is a reminder. Don&apos;t end up here.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Loading the graveyard...</div>
        ) : (data?.students || []).length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: '#1D9E75', marginBottom: 8 }}>Graveyard is empty!</div>
            <div style={{ color: '#5a7a9a', fontSize: 14 }}>Every student is still active. Keep it that way.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.students || []).map((s, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.08)', borderRadius: 14, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,45,120,0.2),transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#5a7a9a', textDecoration: 'line-through' }}>{s.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,45,120,0.08)', color: '#ff2d78', fontFamily: 'JetBrains Mono,monospace' }}>
                        QUIT DAY {s.quitDay}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}>
                      {s.college} · {s.domain?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: '#5a7a9a', fontStyle: 'italic' }}>
                      &quot;{s.epitaph}&quot;
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#2a3a4a' }}>
                      {s.daysSinceActive}d
                    </div>
                    <div style={{ fontSize: 10, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>since last seen</div>
                    {s.streak > 0 && (
                      <div style={{ fontSize: 11, color: '#3a4a5a', marginTop: 4 }}>
                        🔥{s.streak} streak lost
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, padding: 24, background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
            Your name should not be here.
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 16 }}>
            Every student above started with the same potential as you. The difference is consistency.
          </div>
          <Link href="/onboarding" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            Start Your Journey →
          </Link>
        </div>
      </main>
    </div>
    </PublicPageWrapper>
  );
}
