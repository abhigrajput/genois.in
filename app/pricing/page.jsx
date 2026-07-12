'use client';
import Link from 'next/link';
import { useState } from 'react';

const PLANS = [
  {
    id: 'free',
    name: 'Spectator',
    tagline: 'Just checking things out? Start here.',
    price: '₹0',
    period: '30 days free',
    color: '#1D9E75',
    badge: null,
    cta: 'Start Free →',
    ctaLink: '/onboarding',
    features: [
      '30-day full access trial — no credit card',
      'Pick 1 domain from 10 career paths',
      'Full 30-day AI-powered daily roadmap',
      'Daily coding challenge with AI code review',
      'Daily test — 5 AI-generated questions',
      'AI Chatbot — ask anything about your domain',
      'AI Notes — auto-generated bullet point study notes',
      'Project guide — build real projects step by step',
      'Basic analytics — track your daily progress',
      '2AM Anxiety Chat — support when you panic',
    ],
    locked: [
      'AI Mentor (5 expert modes)',
      'Weekly and monthly tests',
      'All 10 domains access',
      'Leaderboard ranking',
    ],
  },
  {
    id: 'basic',
    name: 'Player',
    tagline: 'You showed up. Time to grind.',
    price: '₹99',
    period: '/month',
    color: '#378ADD',
    badge: null,
    cta: 'Go Player →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Spectator',
      'Access to 3 domains simultaneously',
      'Daily + Weekly tests (10 Qs every Monday)',
      'AI Chatbot with full conversation history',
      '2AM Anxiety Chat — unlimited sessions',
      'AI Notes for every topic (4 note types)',
      'Daily coding challenges with hints',
      'Project guides for all 3 domains',
      'Skill identity tracking',
      'Activity streak tracker',
      'Progress analytics — weekly report',
      'College leaderboard — see your rank',
    ],
    locked: [
      'AI Mentor (5 expert modes)',
      'Monthly tests',
      'All 10 domains',
      'Global leaderboard rank',
      'Resume AI review',
    ],
  },
  {
    id: 'pro',
    name: 'Performer',
    tagline: 'Main character arc. Full access. Get placed.',
    price: '₹199',
    period: '/month',
    color: '#00d9a3',
    featured: true,
    badge: '🔥 Most Popular',
    cta: 'Go Performer →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Player',
      'All 10 domains — switch anytime',
      'AI Mentor — 5 expert modes',
      'Daily + Weekly + Monthly tests',
      'Full AI Notes — 4 types per topic',
      'Advanced skill identity — 6-axis radar',
      'Full analytics — score breakdown + graphs',
      'Global + College + Domain leaderboard',
      'Public profile link for recruiters',
      'Job Ready Badge at 70% score',
      'Hire-Ready rank visible to recruiters',
      'Project AI feedback after submission',
      'Revision test — targets your weak topics',
      '26 unique projects per domain — full year',
      'Priority support',
    ],
    locked: [],
  },
  {
    id: 'elite',
    name: 'Dominator',
    tagline: 'Built different. Placement mode activated.',
    price: '₹499',
    period: '/month',
    color: '#ff6b4a',
    badge: '👑 Best Value',
    cta: 'Go Dominator →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Performer',
      'AI Resume Reviewer — line by line feedback',
      'Mock Interview Coach — full AI mock interview',
      'Job Readiness Certificate — downloadable PDF',
      'Placement Strategy — personalised AI roadmap',
      'Company-specific prep — TCS Infosys startups',
      'Referral system — refer a friend get 1 month free',
      'Early access to all new features',
      'Private community — top performers only',
      'Extended AI review on all 26 projects',
      'Annual performance report — shareable PDF',
      'LinkedIn recommendation template by AI',
      'Direct mentor escalation for tough doubts',
    ],
    locked: [],
  },
];

export default function PricingPage() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,217,163,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,8,18,0.95)', borderBottom: '1px solid rgba(0,217,163,0.08)', backdropFilter: 'blur(20px)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/landing" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, letterSpacing: -1, textDecoration: 'none' }}>
          <span style={{ color: '#00d9a3' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/college-war" style={{ padding: '6px 14px', borderRadius: 7, color: '#5a7a9a', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>College War</Link>
          <Link href="/login" style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.2)', color: '#e8e8ed', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Sign In</Link>
          <Link href="/onboarding" style={{ padding: '7px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Start Free →</Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d9a3', letterSpacing: 2, marginBottom: 12 }}>PRICING</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, marginBottom: 12 }}>
            Pick your level.<br />
            <span style={{ background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start proving yourself.</span>
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 16 }}>30-day free trial on all plans. No credit card required to start.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: plan.featured ? 'rgba(0,217,163,0.03)' : '#070f1f',
                border: plan.featured ? '2px solid rgba(0,217,163,0.4)' : `1px solid ${plan.color}20`,
                borderRadius: 16,
                padding: '28px 24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: hovered === plan.id ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: plan.featured ? '0 0 40px rgba(0,217,163,0.12)' : hovered === plan.id ? `0 8px 30px ${plan.color}20` : 'none',
              }}>

              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${plan.color},transparent)` }} />

              {plan.badge && (
                <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: `${plan.color}20`, color: plan.color, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 14 }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: plan.color, letterSpacing: 3, marginBottom: 4, textTransform: 'uppercase' }}>{plan.name}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: plan.color, lineHeight: 1 }}>{plan.price}</div>
              <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 6 }}>{plan.period}</div>
              <div style={{ fontSize: 13, color: '#5a7a9a', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.5 }}>{plan.tagline}</div>

              <div style={{ padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#3a4a5a', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
                🔧 Coming Soon
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#c8d8e8', lineHeight: 1.5 }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </div>
                ))}
                {plan.locked?.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#2a3a4a', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48, padding: '32px', background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>
            Still not sure? Start as Spectator.
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 20 }}>
            30 days free. Full access. No credit card. Upgrade anytime.
          </div>
          <Link href="/onboarding" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
            Start Free — No Card Needed →
          </Link>
        </div>

      </div>
    </div>
  );
}
