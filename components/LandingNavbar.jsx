'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const PURPLE = '#00d9a3';
const PURPLE_DARK = '#00b389';

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
      background: scrolled ? 'rgba(13,13,20,0.85)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(0,217,163,0.18)' : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.25s ease',
      padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/landing" style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 23,
        textDecoration: 'none', letterSpacing: 0.5,
      }}>
        <span style={{ color: PURPLE }}>GEN</span><span style={{ color: '#f8fafc' }}>OIS</span>
      </Link>

      <div className="gen-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="#how" className="gen-nav-link">How it works</a>
        <a href="#features" className="gen-nav-link">Features</a>
        <a href="#pricing" className="gen-nav-link">Pricing</a>
        <Link href="/blog" className="gen-nav-link">Blog</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/login" className="gen-nav-link gen-desktop-only" style={{ padding: '8px 14px' }}>Log in</Link>
        <Link href="/signup" className="gen-press" style={{
          padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
          background: PURPLE, color: '#0a0a0f',
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
          boxShadow: '0 6px 20px rgba(0,217,163,0.32)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        }}>Start Free</Link>
      </div>
    </nav>
  );
}
