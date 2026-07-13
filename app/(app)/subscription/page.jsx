'use client';
import { useRouter } from 'next/navigation';

// ─── GENOIS Green System — dark slate architecture ───────────────────────────
const BG900 = '#0f172a'; // slate-900 — master page background
const BG800 = '#1e293b'; // slate-800 — internal cards
const BORDER = 'rgba(148,163,184,0.18)'; // slate-400 @ low alpha — clean borders
const GREEN = '#00d9a3'; // GENOIS green — primary action / accent
const ON_GREEN = '#0f172a'; // high-contrast dark text on green (WCAG AA ~10:1)
const TEXT = '#e2e8f0'; // slate-200 — primary copy
const TEXT_STRONG = '#f8fafc'; // slate-50 — headings
const MUTED = '#94a3b8'; // slate-400 — secondary copy

// 4px-based spacing scale.
const SP = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };

// ─── RETAINED, INTENTIONALLY UNRENDERED ──────────────────────────────────────
// Paid tiers are OFF for the Placement Beta. The plan data, Razorpay wiring
// (/api/payment/*), PermissionGate and subscription status/activate/cancel APIs
// are all left intact and dormant — nothing here deletes the ability to charge.
// Re-enabling paid billing = re-rendering a plan matrix from this constant.
//   Spectator ₹0 · Player ₹199 · Performer ₹299 · Dominator ₹499
const RETAINED_PLANS = [
  { name: 'Spectator', price: '₹0', period: '/forever' },
  { name: 'Player', price: '₹199', period: '/month' },
  { name: 'Performer', price: '₹299', period: '/month' },
  { name: 'Dominator', price: '₹499', period: '/month' },
];

// The four proof points a plain chatbot structurally cannot replicate — each maps
// to a SHIPPED surface (/voice-interview, /api/github/sync,
// /api/analytics/skill-identity, /u/[username]).
const BETA_INCLUDES = [
  { icon: '🎙️', title: 'Live AI voice mock interviews', body: 'A spoken panel that grades how you actually speak — accuracy, clarity, confidence.' },
  { icon: '🔗', title: 'GitHub-verified commit sync', body: 'Your real repos, stars and commits, pulled in as proof you shipped.' },
  { icon: '📊', title: '6-axis skill identity', body: 'A mathematical profile built from your real test, coding and project scores.' },
  { icon: '🪪', title: 'Recruiter-facing public profile', body: 'A shareable genois.in/u/ page a recruiter can open and trust.' },
];

export default function SubscriptionPage() {
  const router = useRouter();

  // Only backend trigger on this page — preserved exactly as originally wired.
  const goToDashboard = () => router.push('/dashboard');

  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        background: BG900,
        width: '100%',
        borderRadius: 20,
        padding: 'clamp(16px, 3vw, 24px)',
        paddingBottom: SP[8] + SP[6],
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: SP[6] }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: GREEN, letterSpacing: 1.5, marginBottom: SP[2] }}>
          GENOIS PLACEMENT BETA
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 800,
            color: TEXT_STRONG,
            margin: 0,
            marginBottom: SP[2],
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          You&apos;re early. Everything is unlocked.
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
          There are no plans to pick and nothing to pay during the beta. Every feature below is
          already active on your account — this page just confirms it.
        </p>
      </div>

      {/* ─── The gate ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(160deg, rgba(0,217,163,0.07), ${BG800})`,
          border: '1px solid rgba(0,217,163,0.4)',
          borderRadius: 18,
          padding: 'clamp(20px, 4vw, 32px)',
          marginBottom: SP[6],
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: TEXT_STRONG, marginBottom: SP[2], letterSpacing: -0.5 }}>
          GENOIS Placement Beta — full access, ₹0
        </div>
        <p style={{ color: MUTED, fontSize: 13.5, margin: `0 0 ${SP[6]}px`, maxWidth: 560, lineHeight: 1.6 }}>
          We&apos;re upgrading payment infrastructure before launch. Until it&apos;s live, all four tiers
          are fully unlocked at no cost and your progress is safe. Keep building — we&apos;ll notify you
          well before paid billing returns.
        </p>
        {/* Solid GENOIS green + high-contrast dark text (WCAG AA). Preserves the only
            existing backend trigger: router → /dashboard. */}
        <button
          onClick={goToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SP[2],
            padding: '15px 32px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: GREEN,
            color: ON_GREEN,
            fontFamily: 'var(--font-heading)',
            fontSize: 15,
            fontWeight: 800,
            boxShadow: '0 12px 34px rgba(0,217,163,0.28)',
          }}
        >
          Apply for Free Beta Access →
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: SP[6] }}>
          {['Every feature unlocked', 'No credit card', 'Progress always safe'].map((t) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: SP[2], fontSize: 12.5, color: MUTED }}>
              <span style={{ color: GREEN }}>✓</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Anti-"wrapper" proof grid — mobile-first, no clipping to 360px ──── */}
      <div
        style={{
          background: BG800,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: 'clamp(16px, 3vw, 24px)',
          marginBottom: SP[6],
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: GREEN, marginBottom: SP[4] }}>
          Not a ChatGPT wrapper — what your seat includes
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: SP[4] }}>
          {BETA_INCLUDES.map((f) => (
            <div key={f.title} style={{ display: 'flex', gap: SP[3], alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }} aria-hidden="true">{f.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: TEXT_STRONG, marginBottom: SP[1], lineHeight: 1.35 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, wordBreak: 'break-word' }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer action ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
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
