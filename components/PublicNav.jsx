'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  // Two bugs here, and the token read was only the smaller one.
  //
  // 1. isLoggedIn was computed and then never read — the Login / Sign Up pair
  //    below rendered unconditionally, so a signed-in user browsing a public
  //    page was invited to log in again. The bare fragments are the fossil of
  //    a conditional that got deleted.
  // 2. The signal itself was localStorage.getItem('genois_token'), which is
  //    null for a cookie session, so it would have been wrong for most
  //    logged-in users even once it was wired up.
  //
  // The fix reads the persisted auth store instead. useToken() is NOT usable
  // here: its COOKIE_SESSION sentinel is truthy for everyone, and on a public
  // page "everyone" includes anonymous visitors, who would then be shown a
  // Dashboard link they cannot use. The store's isAuthenticated is written by
  // every login path (login, signup, google-callback) and cleared by logout,
  // survives in localStorage under `genois_auth` independently of the httpOnly
  // token, and costs no network round-trip on a page anonymous visitors hit.
  //
  // Read via getState() inside the effect rather than subscribing, so the
  // server-rendered markup (always logged-out) matches the first client render
  // and there is no hydration mismatch. Worst case is a stale true after the
  // cookie expires: the user sees a Dashboard link and AppLayout's auth gate
  // redirects them to /login on arrival, which is where the old code sent them
  // anyway.
  useEffect(() => {
    setIsLoggedIn(useAuthStore.getState().isAuthenticated);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--gx-bg)',
      borderBottom: '1px solid var(--gx-border)',
      backdropFilter: 'blur(20px)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>

      <Link href="/landing" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLeaderOpen(!leaderOpen)}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Explore ▾
          </button>
          {leaderOpen && (
            <div
              onMouseLeave={() => setLeaderOpen(false)}
              style={{
                position: 'absolute', top: 38, right: 0,
                background: 'var(--gx-bg)',
                border: '1px solid var(--gx-border)',
                borderRadius: 12, padding: 8,
                minWidth: 180, zIndex: 200,
                boxShadow: 'var(--gx-shadow-sm)',
              }}>
              {[
                { href: '/domain-explorer', icon: '🎯', label: 'Explore Domains', desc: 'Find your career path' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setLeaderOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    textDecoration: 'none',
                    background: pathname === item.href ? 'var(--gx-accent-soft)' : 'transparent',
                  }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)', fontFamily: 'var(--font-heading)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gx-text-muted)' }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <Link href="/dashboard" style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
            Dashboard →
          </Link>
        ) : (
          <>
            <Link href="/login" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gx-border)', color: 'var(--gx-text)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              Login
            </Link>
            <Link href="/onboarding" style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              Sign Up Free →
            </Link>
          </>
        )}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gx-text)', fontSize: 20, padding: 4, display: 'none' }}
          id="mobile-btn">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0,
          background: 'var(--gx-bg)',
          borderBottom: '1px solid var(--gx-border)',
          padding: '12px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 99,
        }}>
          {[
            { href: '/domain-explorer', label: '🎯 Explore Domains' },
          ].map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, color: 'var(--gx-text-muted)', textDecoration: 'none', fontSize: 15, fontFamily: 'var(--font-heading)', fontWeight: 600, background: 'var(--gx-surface)' }}>
              {n.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ padding: '11px 14px', borderRadius: 8, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontSize: 15, fontFamily: 'var(--font-heading)', fontWeight: 700, textAlign: 'center' }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', color: 'var(--gx-text)', textDecoration: 'none', fontSize: 15, fontFamily: 'var(--font-heading)', fontWeight: 600, textAlign: 'center' }}>
                Login
              </Link>
              <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{ padding: '11px 14px', borderRadius: 8, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontSize: 15, fontFamily: 'var(--font-heading)', fontWeight: 700, textAlign: 'center' }}>
                Sign Up Free →
              </Link>
            </>
          )}
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
