'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const GREEN = '#00ff41';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(0,0,0,0.90)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(0,255,65,0.15)' : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.25s ease',
      padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/landing" style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 24,
        textDecoration: 'none', color: GREEN,
        textShadow: scrolled ? '0 0 16px rgba(0,255,65,0.45)' : 'none',
        letterSpacing: 1.5, transition: 'text-shadow 0.25s ease',
      }}>GENOIS</Link>

      <div className="gen-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="#domains" className="gen-nav-link">Domains</a>
        <a href="#pricing" className="gen-nav-link">Pricing</a>
        <a href="#leaderboard" className="gen-nav-link">Leaderboard</a>
        <Link href="/blog" className="gen-nav-link">Blog</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/login" className="gen-nav-link gen-desktop-only" style={{ padding: '8px 14px' }}>Log in</Link>
        <Link href="/signup" style={{
          padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
          background: GREEN, color: '#000',
          fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 13,
          boxShadow: '0 0 16px rgba(0,255,65,0.3)',
          transition: 'box-shadow 0.2s ease',
        }}>Start Free Trial</Link>
      </div>
    </nav>
  );
}
