'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#8b5cf6';
const CYAN = '#06b6d4';

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
      background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.25s ease',
      padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/landing" style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 24, textDecoration: 'none',
        backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        letterSpacing: 1.5,
      }}>GENOIS</Link>

      <div className="gen-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="#features" className="gen-nav-link">Features</a>
        <a href="#pricing" className="gen-nav-link">Pricing</a>
        <Link href="/leaderboard" className="gen-nav-link">Leaderboard</Link>
        <Link href="/blog" className="gen-nav-link">Blog</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/login" className="gen-nav-link gen-desktop-only" style={{ padding: '8px 14px' }}>Log in</Link>
        <Link href="/signup" style={{
          padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
          backgroundImage: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
          color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
        }}>Start Free Trial</Link>
        <button
          aria-label="Menu"
          style={{
            display: 'none', background: 'transparent', border: 'none',
            color: '#fff', fontSize: 22, cursor: 'pointer',
          }}
        >☰</button>
      </div>
    </nav>
  );
}
