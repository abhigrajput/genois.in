'use client';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const router = useRouter();

  const plans = [
    {
      name: 'Spectator',
      price: '₹0',
      period: '/forever',
      color: '#5a7a9a',
      features: [
        '30-day full access trial',
        'Pick 1 domain from 10 career paths',
        'Full 30-day AI-powered daily roadmap',
        'Daily coding challenge with AI code review',
        'Daily test — 5 AI-generated questions',
        'AI Chatbot — ask anything about your domain',
        'AI Notes — auto-generated study notes',
        'Project guide — build real projects step by step',
        '2AM Anxiety Chat — we are here when you panic',
      ],
    },
    {
      name: 'Player',
      price: '₹199',
      period: '/month',
      color: '#00d9a3',
      badge: null,
      features: [
        'Everything in Spectator',
        'Access 3 domains simultaneously',
        'Daily + weekly tests',
        'Daily coding challenges with hints',
        'Project guides for all 3 domains',
        'Basic skill identity tracking',
        'Activity streak tracker',
        'Progress analytics — weekly report',
        'College leaderboard — see your rank',
      ],
    },
    {
      name: 'Performer',
      price: '₹299',
      period: '/month',
      color: '#ff6b4a',
      badge: 'MOST POPULAR',
      features: [
        'Everything in Player plan',
        'All 10 domains — switch anytime',
        'AI Mentor — 5 expert modes',
        'Daily + Weekly + Monthly tests',
        'Full AI Notes — theory, coding, revision',
        'Advanced skill identity — 6-axis radar',
        'Full analytics — daily graph, score breakdown',
        'Global + College + Domain leaderboard',
        'Public profile link for recruiters',
        'Job Ready Badge when score crosses 70%',
        '26 unique projects per domain',
      ],
    },
    {
      name: 'Dominator',
      price: '₹499',
      period: '/month',
      color: '#EF9F27',
      badge: 'BEST VALUE',
      features: [
        'Everything in Performer plan',
        'Placement Strategy Session — AI personalised',
        'Company-specific prep — TCS, Infosys, Wipro',
        'Referral system — refer a friend get 1 month free',
        'Early access to new features',
        'Private community access — top performers only',
        'Direct mentor escalation',
        'All 26 projects with extended AI review',
        'Annual performance report — shareable PDF',
        'LinkedIn recommendation template by AI',
      ],
    },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%', paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>
          Subscription Plans
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 14 }}>Pick your level. Cancel anytime.</p>
      </div>

      <div style={{ background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 32, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🔧</span>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#EF9F27', marginBottom: 6 }}>
            Payments Temporarily Suspended
          </div>
          <div style={{ fontSize: 13, color: '#8a9ab0', lineHeight: 1.7 }}>
            We are upgrading our payment infrastructure to serve you better.
            All features remain fully accessible during this time — your progress is safe.
            Paid plans will be available again soon. We will notify you when payments are live.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ background: '#070f1f', border: `1px solid ${plan.color}30`, borderRadius: 16, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {plan.badge && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: 20, background: plan.color, color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 800, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                {plan.badge}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 900, color: '#e8e8ed' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: '#5a7a9a' }}>{plan.period}</span>
              </div>
            </div>
            <div style={{ flex: 1, marginBottom: 20 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#3a4a5a', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
              PAYMENTS SUSPENDED
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
          Back to Dashboard →
        </button>
      </div>
    </div>
  );
}
