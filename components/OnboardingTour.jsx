'use client';
import { useState, useEffect } from 'react';
import { useToken } from '@/lib/useApi';

const TOUR_STEPS = [
  {
    title: 'Welcome to GENOIS! 🎉',
    description: 'You are in the placement beta — every feature is unlocked, free, with no card and no countdown. Let me show you around.',
    cta: 'Start Tour',
  },
  {
    title: '🗺️ Daily Roadmap',
    description: 'Your personalized day-by-day learning plan. Complete tasks, earn points, build skills systematically.',
    cta: 'Got it',
  },
  {
    title: '📘 DSA Roadmap',
    description: 'Take a 20-question diagnostic test. Get assigned to Beginner / Intermediate / Advanced level. Then 90-day adaptive plan.',
    cta: 'Continue',
  },
  {
    title: '🎯 Mentor',
    description: '5 modes: General, Coding, Domain, Project, Career. Use them when stuck.',
    cta: 'Continue',
  },
  // A Leaderboard step lived here, promising "global rankings across every
  // domain". /leaderboard is a Coming Soon stub, so the tour was selling a
  // screen that does not exist. Removed until it does.
  {
    title: '🎁 While you are in the beta',
    description: 'Everything is unlocked and free — no card, no trial clock, nothing to downgrade to. Paid plans may return later, and beta testers keep founder pricing.',
    cta: 'I am ready',
  },
];

export default function OnboardingTour() {
  const { token, ready } = useToken();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  // The session usually lives in the httpOnly cookie, so a raw
  // localStorage.getItem('genois_token') read was null for most logged-in users
  // and the tour never fired for anyone but pre-migration accounts. useToken()
  // returns the COOKIE_SESSION sentinel in that case — truthy, which is what we
  // want here. Safe because this component only mounts on /dashboard, behind
  // AppLayout's auth gate; a logged-out visitor never reaches it.
  useEffect(() => {
    if (!ready || !token) return;
    if (localStorage.getItem('onboarding_seen')) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [ready, token]);

  const next = () => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
      return;
    }
    setStep(step + 1);
  };

  const skip = () => finish();

  const finish = () => {
    localStorage.setItem('onboarding_seen', '1');
    setShow(false);
  };

  if (!show) return null;
  const current = TOUR_STEPS[step];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--gx-bg)',
      backdropFilter: 'blur(10px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 460,
        width: '100%',
        background: 'var(--gx-bg)',
        border: '1px solid var(--gx-accent-border)',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 6, height: 6, borderRadius: 3, background: i <= step ? 'var(--gx-accent)' : 'var(--gx-surface)', transition: 'all 0.3s' }} />
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12 }}>
          {current.title}
        </h2>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          {current.description}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0 && (
            <button onClick={skip} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600 }}>
              Skip Tour
            </button>
          )}
          <button onClick={next} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
            {current.cta} →
          </button>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>
          {step + 1} / {TOUR_STEPS.length}
        </div>
      </div>
    </div>
  );
}
