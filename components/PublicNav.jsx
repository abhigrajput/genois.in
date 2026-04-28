'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (token) setIsLoggedIn(true);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(2,8,18,0.96)',
      borderBottom: '1px solid rgba(0,240,255,0.08)',
      backdropFilter: 'blur(20px)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>

      <Link href="/landing" style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLeaderOpen(!leaderOpen)}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Rankings ▾
          </button>
          {leaderOpen && (
            <div
              onMouseLeave={() => setLeaderOpen(false)}
              style={{
                position: 'absolute', top: 38, right: 0,
                background: '#070f1f',
                border: '1px solid rgba(0,240,255,0.15)',
                borderRadius: 12, padding: 8,
                minWidth: 180, zIndex: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
              {[
                { href: '/domain-explorer', icon: '🎯', label: 'Explore Domains', desc: 'Find your career path' },
                { href: '/college-war', icon: '⚔️', label: 'College War', desc: 'Top colleges ranked' },
                { href: '/shame-board', icon: '😴', label: 'Shame Board', desc: 'Inactive 3+ days' },
                { href: '/graveyard', icon: '☠️', label: 'Graveyard', desc: 'Students who quit' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setLeaderOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    textDecoration: 'none',
                    background: pathname === item.href ? 'rgba(0,240,255,0.06)' : 'transparent',
                  }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4ff', fontFamily: 'Syne,sans-serif' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#5a7a9a' }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <>
          <Link href="/login" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#e8f4ff', textDecoration: 'none', fontSize: 14, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            Login
          </Link>
          <Link href="/onboarding" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontSize: 14, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
            Sign Up Free →
          </Link>
        </>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e8f4ff', fontSize: 20, padding: 4, display: 'none' }}
          id="mobile-btn">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0,
          background: 'rgba(2,8,18,0.98)',
          borderBottom: '1px solid rgba(0,240,255,0.08)',
          padding: '12px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 99,
        }}>
          {[
            { href: '/domain-explorer', label: '🎯 Explore Domains' },
            { href: '/college-war', label: '⚔️ College War' },
            { href: '/shame-board', label: '😴 Shame Board' },
            { href: '/graveyard', label: '☠️ Graveyard' },
          ].map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, color: '#8a9ab0', textDecoration: 'none', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 600, background: 'rgba(255,255,255,0.02)' }}>
              {n.label}
            </Link>
          ))}
          <>
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#e8f4ff', textDecoration: 'none', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 600, textAlign: 'center' }}>
              Login
            </Link>
            <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{ padding: '11px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 700, textAlign: 'center' }}>
              Sign Up Free →
            </Link>
          </>
        </div>
      )}

      <style>{`
        @media (max-width: 580px) {
          #mobile-btn { display: block !important; }
          #desktop-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
