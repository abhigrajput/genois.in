'use client';
import Link from 'next/link';

// ─── GENOIS Green System — dark slate architecture ───────────────────────────
const BG900 = '#0f172a'; // slate-900 — master page background
const BG800 = '#1e293b'; // slate-800 — internal cards
const BORDER = 'rgba(148,163,184,0.18)'; // slate border
const GREEN = '#00d9a3'; // GENOIS green — primary action / accent
const ON_GREEN = '#0f172a'; // high-contrast dark text on green (WCAG AA ~10:1)
const TEXT = '#e2e8f0'; // slate-200
const TEXT_STRONG = '#f8fafc'; // slate-50
const MUTED = '#94a3b8'; // slate-400

// 4px spacing scale.
const SP = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };

// ─── RETAINED, INTENTIONALLY UNRENDERED ──────────────────────────────────────
// Paid tiers are switched OFF for the Placement Beta. We do NOT delete the plan
// data, Razorpay wiring (/api/payment/*), PermissionGate, or subscription logic —
// they stay intact and dormant so paid billing can be turned back on by simply
// re-rendering this matrix. When beta ends: map these back into a <PlanGrid/>.
//   Spectator ₹0 · Player ₹199 · Performer ₹299 · Dominator ₹499
const RETAINED_PLANS = [
  { id: 'free', name: 'Spectator', price: '₹0', period: '30 days free', ctaLink: '/onboarding' },
  { id: 'basic', name: 'Player', price: '₹199', period: '/month', ctaLink: '/onboarding' },
  { id: 'pro', name: 'Performer', price: '₹299', period: '/month', ctaLink: '/onboarding' },
  { id: 'elite', name: 'Dominator', price: '₹499', period: '/month', ctaLink: '/onboarding' },
];

// ─── What every beta tester gets — all four map to SHIPPED surfaces ──────────
// Live voice panel (/voice-interview), GitHub-verified sync (/api/github/sync),
// 6-axis skill identity (/api/analytics/skill-identity), recruiter profile
// (/u/[username]). No invented capabilities.
const BETA_INCLUDES = [
  {
    icon: '🎙️',
    title: 'Live AI voice mock interviews',
    body: 'A real spoken panel that grades accuracy, clarity and confidence — not a text box with a logo on it.',
  },
  {
    icon: '🔗',
    title: 'GitHub-verified commit sync',
    body: 'Connect GitHub and your real repos, stars and commits are pulled in as proof you shipped — not just studied.',
  },
  {
    icon: '📊',
    title: '6-axis skill identity',
    body: 'A mathematical profile built from your actual test, coding and project performance across the whole 90 days.',
  },
  {
    icon: '🪪',
    title: 'Recruiter-facing public profile',
    body: 'A shareable genois.in/u/ page a recruiter can open and trust — your verified skill identity, in the open.',
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG900, color: TEXT, fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
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
          padding: `0 ${SP[4]}px`,
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
            href="/login"
            style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, color: TEXT, textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            Sign In
          </Link>
          <Link
            href="/onboarding"
            style={{ padding: '7px 18px', borderRadius: 8, background: GREEN, color: ON_GREEN, textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 700 }}
          >
            Apply for Beta →
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 940, margin: '0 auto', padding: `${SP[8] + SP[6]}px ${SP[4]}px ${SP[8]}px` }}>
        {/* ─── Hero ───────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: SP[8] }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SP[2],
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: GREEN,
              letterSpacing: 1.5,
              background: 'rgba(0,217,163,0.08)',
              border: '1px solid rgba(0,217,163,0.25)',
              borderRadius: 999,
              padding: '6px 14px',
              marginBottom: SP[4],
            }}
          >
            🚀 GENOIS PLACEMENT BETA · FIRST 100 SEATS
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(30px,5.5vw,54px)', fontWeight: 800, margin: 0, marginBottom: SP[4], color: TEXT_STRONG, letterSpacing: -1.5, lineHeight: 1.02 }}>
            There is no price tag.<br />
            <span style={{ color: GREEN }}>Only a beta gate.</span>
          </h1>
          <p style={{ color: MUTED, fontSize: 'clamp(15px,2vw,17px)', margin: 0, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
            We&apos;re onboarding our first cohort of engineering students by hand. During the
            beta, <span style={{ color: TEXT_STRONG, fontWeight: 600 }}>every feature is fully unlocked, free</span> —
            no plans, no cards, no upsell. You&apos;re early, and that&apos;s the entire advantage.
          </p>
        </div>

        {/* ─── The gate ───────────────────────────────────────────────────────── */}
        <div
          style={{
            background: `linear-gradient(160deg, rgba(0,217,163,0.07), ${BG800})`,
            border: '1px solid rgba(0,217,163,0.4)',
            borderRadius: 20,
            padding: 'clamp(24px, 4vw, 40px)',
            textAlign: 'center',
            marginBottom: SP[8],
            boxShadow: '0 0 60px rgba(0,217,163,0.08)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: TEXT_STRONG, marginBottom: SP[2], letterSpacing: -0.5 }}>
            Claim your seat in the Placement Beta
          </div>
          <p style={{ color: MUTED, fontSize: 14, margin: `0 auto ${SP[6]}px`, maxWidth: 460, lineHeight: 1.6 }}>
            One click gets you the full engine — voice interviews, GitHub-verified proof, and a
            recruiter-ready skill identity. No payment now, and your progress is always safe.
          </p>
          {/* Solid GENOIS green + dark text CTA — routes into the beta onboarding flow. */}
          <Link
            href="/onboarding"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SP[2],
              padding: '16px 36px',
              borderRadius: 12,
              background: GREEN,
              color: ON_GREEN,
              textDecoration: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(15px,2vw,17px)',
              fontWeight: 800,
              boxShadow: '0 12px 34px rgba(0,217,163,0.32)',
            }}
          >
            Apply for Free Beta Access →
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 20px', marginTop: SP[6] }}>
            {['Set up in 60 seconds', 'No credit card', 'Every feature unlocked'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: SP[2], fontSize: 13, color: MUTED }}>
                <span style={{ color: GREEN }}>✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ─── What you get — the shipped moat, honestly ──────────────────────── */}
        <div style={{ marginBottom: SP[8] }}>
          <div style={{ textAlign: 'center', marginBottom: SP[6] }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: GREEN, letterSpacing: 2, marginBottom: SP[2] }}>
              WHAT&apos;S IN THE BETA
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, color: TEXT_STRONG, margin: 0, letterSpacing: -1 }}>
              Not a ChatGPT wrapper
            </h2>
            <p style={{ color: MUTED, fontSize: 14, margin: `${SP[3]}px auto 0`, maxWidth: 560, lineHeight: 1.6 }}>
              A single prompt can&apos;t run a live voice panel, verify your GitHub commits, or hand a
              recruiter a profile. That architecture is what a copy-paste can&apos;t clone — and in beta,
              it&apos;s all free.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 260px),1fr))', gap: SP[4] }}>
            {BETA_INCLUDES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: BG800,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16,
                  padding: SP[6],
                }}
              >
                <div style={{ fontSize: 26, marginBottom: SP[3] }} aria-hidden="true">{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: TEXT_STRONG, marginBottom: SP[2], lineHeight: 1.3 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Honest note on pricing ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: SP[3],
            background: 'rgba(0,217,163,0.05)',
            border: '1px solid rgba(0,217,163,0.2)',
            borderRadius: 14,
            padding: SP[6],
            maxWidth: 720,
            margin: '0 auto',
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }} aria-hidden="true">💬</span>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            <strong style={{ color: GREEN, fontFamily: 'var(--font-heading)' }}>Will it always be free?</strong>{' '}
            No — paid plans return after beta. But every beta tester keeps founder pricing, and nothing
            you build now gets locked away. We&apos;ll tell you well before anything changes.
          </div>
        </div>
      </div>
    </div>
  );
}
