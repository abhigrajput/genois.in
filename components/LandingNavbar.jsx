'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

/**
 * Landing header — LIGHT theme (app/design-tokens.css).
 * Flat, bordered, no blur/glow. The border only appears once the page scrolls,
 * so the hero starts clean.
 */
export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--gx-bg)',
        borderBottom: `1px solid ${scrolled ? 'var(--gx-border)' : 'transparent'}`,
        transition: 'border-color var(--gx-transition)',
        padding: '12px clamp(16px, 5vw, 28px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}
    >
      <Link
        href="/landing"
        style={{
          fontFamily: 'var(--gx-font-display)', fontWeight: 700, fontSize: 21,
          textDecoration: 'none', letterSpacing: -0.5, lineHeight: 1,
        }}
      >
        <span style={{ color: 'var(--gx-accent)' }}>GEN</span>
        <span style={{ color: 'var(--gx-text)' }}>OIS</span>
      </Link>

      <div className="gen-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
        <a href="#how" className="gx-nav-link">How it works</a>
        <a href="#features" className="gx-nav-link">Features</a>
        <a href="#beta" className="gx-nav-link">Beta access</a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/login" className="gx-nav-link gen-desktop-only" style={{ padding: '8px 10px' }}>Log in</Link>
        <Button href="/signup" size="sm">Start free</Button>
      </div>
    </nav>
  );
}
