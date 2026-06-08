'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const MUTED = '#8b93a1';

export default function ComingSoonPage({ title, icon = '🚧', description, eta = 'Coming Soon' }) {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  const storageKey = `genois_notify_${(title || 'feature').toLowerCase().replace(/\s+/g, '_')}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(storageKey);
    if (existing) { setEmail(existing); setSaved(true); }
  }, [storageKey]);

  const notifyMe = (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v.includes('@')) return;
    localStorage.setItem(storageKey, v);
    setSaved(true);
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        <div style={{ fontSize: 64, marginBottom: 18, lineHeight: 1 }}>{icon}</div>

        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 30, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px' }}>
          {title}
        </h1>

        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.65, margin: '0 0 22px' }}>
          {description}
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 22,
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
          color: PURPLE_LIGHT, fontSize: 13, fontWeight: 600, marginBottom: 30,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: PURPLE_LIGHT, animation: 'cs-pulse 1.6s ease infinite' }} />
          {eta}
        </div>

        <div style={{ background: '#13131f', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 16, padding: '22px 20px', marginBottom: 22 }}>
          {saved ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <p style={{ color: '#f1f5f9', fontSize: 14.5, fontWeight: 600, margin: '0 0 4px' }}>You&apos;re on the list!</p>
              <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>We&apos;ll ping <strong style={{ color: PURPLE_LIGHT }}>{email}</strong> the moment it&apos;s live.</p>
            </div>
          ) : (
            <form onSubmit={notifyMe}>
              <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Notify me when ready</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)',
                    background: 'rgba(255,255,255,0.03)', color: '#f8fafc', fontSize: 14, fontFamily: 'Outfit,sans-serif', outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, color: '#fff',
                  fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  Notify me
                </button>
              </div>
            </form>
          )}
        </div>

        <Link href="/dashboard" style={{ color: MUTED, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
      </div>

      <style>{`@keyframes cs-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}
