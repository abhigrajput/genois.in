'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicPageSidebar({ currentPath }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    setIsLoggedIn(!!token);
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!isLoggedIn) return null;

  const NAV_GROUPS = [
    { title: 'MAIN', items: [
      { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/roadmap', label: 'Daily Roadmap', icon: '🗺️' },
    ]},
    { title: 'LEARN', items: [
      { href: '/tests', label: 'Tests', icon: '📝' },
      { href: '/coding', label: 'Coding', icon: '💻' },
      { href: '/aptitude', label: 'Aptitude', icon: '🧠' },
      { href: '/dsa-guide', label: 'DSA Guide', icon: '📘' },
      { href: '/dsa-roadmap', label: 'DSA Roadmap', icon: '📙' },
    ]},
    { title: 'AI TOOLS', items: [
      { href: '/mentor', label: 'AI Mentor', icon: '🎯' },
      { href: '/chatbot', label: 'Chatbot', icon: '💬' },
      { href: '/anxiety', label: '2AM Chat', icon: '🌙' },
    ]},
    { title: 'COMPETE', items: [
      { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    ]},
  ];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ position: 'fixed', top: 70, left: 10, zIndex: 90, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'var(--gx-bg)', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
        ☰ Menu
      </button>
    );
  }

  return (
    <aside style={{ position: 'fixed', top: 56, left: 0, bottom: 0, width: 240, background: 'var(--gx-bg)', borderRight: '1px solid var(--gx-border)', overflowY: 'auto', zIndex: 90, padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 16px 12px' }}>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
      {NAV_GROUPS.map(g => (
        <div key={g.title} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-subtle)', letterSpacing: 2, padding: '6px 16px' }}>{g.title}</div>
          {g.items.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', color: currentPath === item.href ? 'var(--gx-accent)' : 'var(--gx-text-muted)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-body)', background: currentPath === item.href ? 'var(--gx-accent-soft)' : 'transparent' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
