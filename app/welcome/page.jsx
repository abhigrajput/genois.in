'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('genois_user') || '{}');
      setUser(u);
    } catch {}
    const timer = setTimeout(() => setStep(1), 500);
    return () => clearTimeout(timer);
  }, []);

  const STEPS = [
    { icon: '👋', title: `Welcome to GENOIS!`, desc: 'You just made a decision that most engineers never make — to prove your skill instead of just claiming it.' },
    { icon: '📅', title: 'Your 30-day journey starts today', desc: 'Every morning you get 5 tasks. Video, Resource, Coding Challenge, Daily Test, AI Notes. Complete all 5 and your day advances.' },
    { icon: '🏆', title: 'You will be ranked', desc: 'After each daily test your GENOIS score updates and you get ranked against students from across India. This rank is real. You cannot fake it.' },
    { icon: '🎯', title: 'One rule', desc: 'Show up every day. Miss a day and your streak breaks. Miss too many days and you fall in rank. The grind is the point.' },
  ];

  const current = STEPS[step] || STEPS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, marginBottom: 32 }}>
          <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
        </div>

        <div style={{ fontSize: 64, marginBottom: 20, transition: 'all 0.3s' }}>{current.icon}</div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 16, lineHeight: 1.2 }}>
          {current.title}
        </h1>

        <p style={{ color: '#5a7a9a', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? '#00f0ff' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
            Next →
          </button>
        ) : (
          <Link href="/diagnostic" style={{ display: 'block', width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
            Start Day 1 — Let us Go 🚀
          </Link>
        )}

        <p style={{ marginTop: 16, color: '#3a4a5a', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          {user?.name ? `${user.name} · ` : ''}{user?.domain_slug?.toUpperCase()} · 30 days free
        </p>
      </div>
    </div>
  );
}
