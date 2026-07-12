'use client';
import Link from 'next/link';
import { useState } from 'react';

// ─── GENOIS Green System — dark slate architecture ───────────────────────────
const BG900 = '#0f172a'; // slate-900 — master page background
const BG800 = '#1e293b'; // slate-800 — internal plan cards
const BORDER = 'rgba(148,163,184,0.18)'; // slate border
const GREEN = '#00d9a3'; // GENOIS green — primary action / accent
const ON_GREEN = '#0f172a'; // high-contrast dark text on green (WCAG AA)
const TEXT = '#e2e8f0'; // slate-200
const TEXT_STRONG = '#f8fafc'; // slate-50
const MUTED = '#94a3b8'; // slate-400
const LOCKED = '#475569'; // slate-600 — struck / unavailable

// 4px spacing scale.
const SP = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };

// ─── Plans ───────────────────────────────────────────────────────────────────
// Prices, ids and CTA links PRESERVED as wired: /onboarding · free/basic/pro/elite.
// Canonical billing tiers: Spectator ₹0 · Player ₹199 · Performer ₹299 · Dominator ₹499.
// Feature copy re-engineered around shipped moat surfaces (voice interview,
// GitHub-verified sync, 6-axis skill identity, recruiter profile) — no invented
// capabilities (dropped the unshipped "AI Resume Reviewer").
const PLANS = [
  {
    id: 'free',
    name: 'Spectator',
    tagline: 'Just checking things out? Start here.',
    price: '₹0',
    period: '30 days free',
    badge: null,
    cta: 'Start Free →',
    ctaLink: '/onboarding',
    features: [
      'The full engine, unlocked 30 days — no card',
      'Pick 1 of 10 career domains',
      'AI-generated 30-day daily roadmap',
      'Daily coding challenge with instant AI code review',
      'Daily test — 5 AI-generated questions',
      'Domain AI chatbot + auto-generated AI notes',
      'Guided, step-by-step real-project builder',
      '2AM Anxiety Chat — we answer when you panic',
    ],
    locked: [
      'Real-time AI voice mock interviews',
      '6-axis skill identity radar',
      'All 10 domains access',
      'Leaderboard ranking',
    ],
  },
  {
    id: 'basic',
    name: 'Player',
    tagline: 'You showed up. Time to grind.',
    price: '₹199',
    period: '/month',
    badge: null,
    cta: 'Go Player →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Spectator',
      '3 domains active simultaneously',
      'Daily + weekly adaptive tests',
      'Coding challenges with guided hints',
      'Skill-identity tracking — a profile, not a chat log',
      'Full AI notes for every topic (4 note types)',
      'Streak tracker + weekly progress analytics',
      'College leaderboard ranking',
    ],
    locked: [
      'Real-time AI voice mock interviews',
      'GitHub-verified commit sync',
      'AI Mentor — 5 expert modes',
      'Public recruiter profile',
    ],
  },
  {
    id: 'pro',
    name: 'Performer',
    tagline: 'Main character arc. Full access. Get placed.',
    price: '₹299',
    period: '/month',
    featured: true,
    badge: '🔥 Most Popular',
    cta: 'Go Performer →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Player',
      'All 10 domains — switch anytime',
      'Real-time AI Voice Mock Interviews — graded on how you actually speak',
      '6-axis Skill Identity radar from your real performance',
      'AI Mentor — 5 expert modes reading your actual scores',
      'Public recruiter profile + verifiable Job-Ready badge',
      'Global + College + Domain leaderboards',
      'Project AI feedback + weak-topic revision tests',
      '26 unique projects per domain — full year',
    ],
    locked: [],
  },
  {
    id: 'elite',
    name: 'Dominator',
    tagline: 'Built different. Placement mode activated.',
    price: '₹499',
    period: '/month',
    badge: '👑 Best Value',
    cta: 'Go Dominator →',
    ctaLink: '/onboarding',
    features: [
      'Everything in Performer',
      'GitHub-verified commit sync — proof you shipped, not just studied',
      'AI placement-strategy session, personalised to you',
      'Company-specific prep — TCS, Infosys, Wipro & more',
      'Job-Readiness Certificate — downloadable PDF',
      'Referral rewards — refer a friend, get a free month',
      'Private top-performer community + direct mentor escalation',
      'Extended AI review across all 26 projects',
      'Shareable annual report + AI LinkedIn recommendation',
    ],
    locked: [],
  },
];

export default function PricingPage() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: BG900, color: TEXT, fontFamily: 'var(--font-body)' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(0,217,163,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.02) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ─── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,0.95)',
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: 'blur(20px)',
          padding: `0 ${SP[6]}px`,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/landing"
          style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, letterSpacing: -1, textDecoration: 'none' }}
        >
          <span style={{ color: GREEN }}>GEN</span>
          <span style={{ color: TEXT_STRONG }}>OIS</span>
        </Link>
        <div style={{ display: 'flex', gap: SP[2], alignItems: 'center' }}>
          <Link
            href="/college-war"
            style={{ padding: '6px 14px', borderRadius: 8, color: MUTED, textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            College War
          </Link>
          <Link
            href="/login"
            style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, color: TEXT, textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            Sign In
          </Link>
          <Link
            href="/onboarding"
            style={{ padding: '7px 18px', borderRadius: 8, background: GREEN, color: ON_GREEN, textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 700 }}
          >
            Start Free →
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: `${SP[8] + SP[6]}px ${SP[4]}px` }}>
        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: SP[8] }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: GREEN, letterSpacing: 2, marginBottom: SP[3] }}>PRICING</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, margin: 0, marginBottom: SP[3], color: TEXT_STRONG, letterSpacing: -1 }}>
            Pick your level.<br />
            <span style={{ color: GREEN }}>Start proving yourself.</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 16, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Every tier runs on the same engine — live AI voice interviews, GitHub-verified
            commits, a 6-axis skill identity. Not a prompt with a logo on it.
          </p>
        </div>

        {/* ─── Beta note — honest operational state ───────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: SP[3],
            background: 'rgba(0,217,163,0.06)',
            border: '1px solid rgba(0,217,163,0.22)',
            borderRadius: 14,
            padding: SP[4],
            marginBottom: SP[8],
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }} aria-hidden="true">🚀</span>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            <strong style={{ color: GREEN, fontFamily: 'var(--font-heading)' }}>Free beta.</strong> Paid billing is
            being upgraded before launch — until it’s live, every feature across all four plans is fully unlocked
            at no cost, and your progress is safe.
          </div>
        </div>

        {/* ─── Plan grid — mobile-first, no clipping down to 360px ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 240px),1fr))', gap: SP[4], alignItems: 'start' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: BG800,
                border: `1px solid ${plan.featured ? 'rgba(0,217,163,0.55)' : BORDER}`,
                borderRadius: 16,
                padding: SP[6],
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
                transform: hovered === plan.id ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'rgba(0,217,163,0.12)',
                    color: GREEN,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 1,
                    marginBottom: SP[3],
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: GREEN, letterSpacing: 3, marginBottom: SP[1], textTransform: 'uppercase' }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: TEXT_STRONG, lineHeight: 1, letterSpacing: -1 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: SP[2] }}>{plan.period}</div>
              <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic', marginBottom: SP[6], lineHeight: 1.5 }}>{plan.tagline}</div>

              {/* Action — solid GENOIS green + dark text (WCAG AA). Existing /onboarding wiring. */}
              <Link
                href={plan.ctaLink}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: GREEN,
                  color: ON_GREEN,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 800,
                  marginBottom: SP[6],
                }}
              >
                {plan.cta}
              </Link>

              <div style={{ display: 'flex', flexDirection: 'column', gap: SP[2] }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: SP[2], alignItems: 'flex-start', fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
                    <span style={{ color: GREEN, flexShrink: 0, marginTop: 1 }} aria-hidden="true">✓</span>
                    <span style={{ wordBreak: 'break-word' }}>{f}</span>
                  </div>
                ))}
                {plan.locked?.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: SP[2], alignItems: 'flex-start', fontSize: 13, color: LOCKED, lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">✗</span>
                    <span style={{ wordBreak: 'break-word' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Footer CTA ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: SP[8], padding: SP[8], background: BG800, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: TEXT_STRONG, marginBottom: SP[2] }}>
            Still not sure? Start as Spectator.
          </div>
          <div style={{ color: MUTED, fontSize: 14, marginBottom: SP[6] }}>
            30 days free. Full access. No credit card. Upgrade anytime.
          </div>
          <Link
            href="/onboarding"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              borderRadius: 12,
              background: GREEN,
              color: ON_GREEN,
              textDecoration: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            Start Free — No Card Needed →
          </Link>
        </div>
      </div>
    </div>
  );
}
