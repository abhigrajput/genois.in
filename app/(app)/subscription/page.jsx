'use client';
import { useRouter } from 'next/navigation';

// ─── GENOIS Green System — dark slate architecture ───────────────────────────
// Single-accent green on a slate-900 / slate-800 surface stack. No per-plan
// rainbow colors, no raw gradients, no legacy indigo/purple leftovers.
const BG900 = '#0f172a'; // slate-900 — master page background
const BG800 = '#1e293b'; // slate-800 — internal plan cards
const BORDER = 'rgba(148,163,184,0.18)'; // slate-400 @ low alpha — clean borders
const GREEN = '#00d9a3'; // GENOIS green — primary action / accent
const ON_GREEN = '#0f172a'; // high-contrast dark text on green (WCAG AA ~10:1)
const TEXT = '#e2e8f0'; // slate-200 — primary copy
const TEXT_STRONG = '#f8fafc'; // slate-50 — headings / moat features
const MUTED = '#94a3b8'; // slate-400 — secondary copy

// 4px-based spacing scale (p-4 / p-6 / space-y-4 / space-y-6 equivalents).
const SP = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };

// ─── Plans ───────────────────────────────────────────────────────────────────
// PRESERVED EXACTLY as wired to billing/webhooks: names + prices + periods.
//   Spectator ₹0 · Player ₹199 · Performer ₹299 · Dominator ₹499
// Only the feature copy (anti-"ChatGPT wrapper" proof) and visuals changed.
// Every claim below maps to a shipped surface: /voice-interview, /github (sync),
// /analytics/skill-identity, /certificate, /u/[username] recruiter profiles,
// /mentors, /companies (TCS/Infosys/Wipro), /projects, /referral.
const plans = [
  {
    name: 'Spectator',
    price: '₹0',
    period: '/forever',
    highlight: false,
    features: [
      { label: 'The full engine, unlocked for 30 days — no card', moat: true },
      { label: 'Pick 1 of 10 career domains' },
      { label: 'AI-generated 30-day daily roadmap' },
      { label: 'Daily coding challenge with instant AI code review', moat: true },
      { label: 'Daily test — 5 AI-generated questions' },
      { label: 'Domain AI chatbot + auto-generated AI notes' },
      { label: 'Guided, step-by-step real-project builder' },
      { label: '2AM Anxiety Chat — we answer when you panic' },
    ],
  },
  {
    name: 'Player',
    price: '₹199',
    period: '/month',
    highlight: false,
    features: [
      { label: 'Everything in Spectator' },
      { label: '3 domains active simultaneously' },
      { label: 'Daily + weekly adaptive tests' },
      { label: 'Coding challenges with guided hints' },
      { label: 'Skill-identity tracking — a profile, not a chat log', moat: true },
      { label: 'Streak tracker + weekly progress analytics' },
      { label: 'College leaderboard ranking' },
    ],
  },
  {
    name: 'Performer',
    price: '₹299',
    period: '/month',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      { label: 'Everything in Player' },
      { label: 'All 10 domains — switch anytime' },
      { label: 'Real-time AI Voice Mock Interviews — a prompt can’t grade how you speak', moat: true },
      { label: '6-axis Skill Identity radar built from your real performance', moat: true },
      { label: 'AI Mentor — 5 expert modes that read your actual scores' },
      { label: 'Public recruiter profile + verifiable Job-Ready badge', moat: true },
      { label: 'Global + college + domain leaderboards' },
      { label: '26 unique projects per domain' },
    ],
  },
  {
    name: 'Dominator',
    price: '₹499',
    period: '/month',
    highlight: false,
    badge: 'BEST VALUE',
    features: [
      { label: 'Everything in Performer' },
      { label: 'GitHub-verified commit sync — proof you shipped, not just studied', moat: true },
      { label: 'AI placement-strategy session, personalised to you', moat: true },
      { label: 'Company-specific prep — TCS, Infosys, Wipro & more' },
      { label: 'Referral rewards — refer a friend, get a free month' },
      { label: 'Private top-performer community + direct mentor escalation' },
      { label: 'Extended AI review across all 26 projects' },
      { label: 'Shareable annual report + AI LinkedIn recommendation' },
    ],
  },
];

// The four proof points that a plain chatbot structurally cannot replicate.
const PROOF_CHIPS = [
  'Live AI voice interview panel',
  'GitHub-verified commit sync',
  '6-axis skill identity',
  'Recruiter-facing public profile',
];

export default function SubscriptionPage() {
  const router = useRouter();

  // Every backend trigger on this page — preserved exactly as originally wired.
  const goToDashboard = () => router.push('/dashboard');

  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        background: BG900,
        width: '100%',
        borderRadius: 20,
        padding: SP[6],
        paddingBottom: SP[8] + SP[6],
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: SP[6] }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(24px, 5vw, 30px)',
            fontWeight: 800,
            color: TEXT_STRONG,
            margin: 0,
            marginBottom: SP[2],
            letterSpacing: -0.5,
          }}
        >
          Subscription Plans
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Pick your level. Cancel anytime. Every plan is built on the engine below —
          not a prompt with a logo on it.
        </p>
      </div>

      {/* ─── Anti-"wrapper" proof strip ─────────────────────────────────────── */}
      <div
        style={{
          background: BG800,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: SP[6],
          marginBottom: SP[6],
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: GREEN,
            marginBottom: SP[3],
          }}
        >
          Not a ChatGPT wrapper
        </div>
        <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.7, margin: 0, marginBottom: SP[4], maxWidth: 620 }}>
          A single prompt can’t run a live voice-interview panel, verify your GitHub
          commits, track a 6-axis skill identity across 90 days, or hand a recruiter a
          public profile. GENOIS is the architecture around the model — that’s the part
          a copy-paste can’t clone.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SP[2] }}>
          {PROOF_CHIPS.map((chip) => (
            <span
              key={chip}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: SP[2],
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                color: TEXT,
                background: 'rgba(0,217,163,0.08)',
                border: `1px solid rgba(0,217,163,0.28)`,
                borderRadius: 999,
                padding: '6px 12px',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: GREEN }}>✓</span>
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Beta notice — honest operational state ─────────────────────────── */}
      <div
        style={{
          background: 'rgba(0,217,163,0.06)',
          border: `1px solid rgba(0,217,163,0.22)`,
          borderRadius: 16,
          padding: SP[6],
          marginBottom: SP[8],
          display: 'flex',
          alignItems: 'flex-start',
          gap: SP[4],
        }}
      >
        <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }} aria-hidden="true">
          🚀
        </span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 700,
              color: GREEN,
              marginBottom: SP[2],
            }}
          >
            Free beta — every tier is unlocked right now
          </div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            We’re upgrading our payment infrastructure before launch. Until it goes live,
            every feature across all four plans is fully accessible at no cost, and your
            progress is safe. We’ll notify you the moment paid billing returns.
          </div>
        </div>
      </div>

      {/* ─── Plan grid — mobile-first, no horizontal clipping down to 360px ──── */}
      {/* min(100%, 260px) collapses tracks to a single clean column on narrow
          viewports instead of overflowing the row. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: SP[4],
        }}
      >
        {plans.map((plan) => {
          const isPremium = plan.name !== 'Spectator';
          return (
            <div
              key={plan.name}
              style={{
                background: BG800,
                border: `1px solid ${plan.highlight ? 'rgba(0,217,163,0.55)' : BORDER}`,
                borderRadius: 16,
                padding: SP[6],
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -11,
                    left: SP[6],
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: GREEN,
                    color: ON_GREEN,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Name + price */}
              <div style={{ marginBottom: SP[4] }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 19,
                    fontWeight: 800,
                    color: TEXT_STRONG,
                    marginBottom: SP[1],
                  }}
                >
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: SP[1], flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 32,
                      fontWeight: 900,
                      color: TEXT_STRONG,
                      letterSpacing: -1,
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: MUTED }}>{plan.period}</span>
                </div>
              </div>

              {/* Features — moat items are brighter + heavier */}
              <div style={{ flex: 1, marginBottom: SP[6], display: 'flex', flexDirection: 'column', gap: SP[3] }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: SP[2] }}>
                    <span style={{ color: GREEN, flexShrink: 0, marginTop: 1, fontSize: 13 }} aria-hidden="true">
                      ✓
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: f.moat ? TEXT_STRONG : MUTED,
                        fontWeight: f.moat ? 600 : 400,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action — solid GENOIS green + high-contrast dark text (WCAG AA).
                  Preserves the only existing backend trigger: router → /dashboard. */}
              <button
                onClick={goToDashboard}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: GREEN,
                  color: ON_GREEN,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {isPremium ? 'Unlock Free in Beta →' : 'Start Free →'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Footer action ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: SP[8], textAlign: 'center' }}>
        <button
          onClick={goToDashboard}
          style={{
            padding: '13px 28px',
            borderRadius: 12,
            border: `1px solid ${BORDER}`,
            cursor: 'pointer',
            background: 'transparent',
            color: TEXT,
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Back to Dashboard →
        </button>
      </div>
    </div>
  );
}
