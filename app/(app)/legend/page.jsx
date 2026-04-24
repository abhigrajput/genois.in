'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const LEGEND_FEATURES = [
  { icon: '👑', title: 'Everything in Dominator', desc: 'All features from all plans included.' },
  { icon: '🎯', title: 'Direct Recruiter Introductions', desc: 'We personally introduce you to hiring managers at top startups and product companies.' },
  { icon: '⚡', title: 'Priority Placement Support', desc: 'Dedicated placement support. We help you with resume, interview prep and job search.' },
  { icon: '🔒', title: 'Exclusive Job Listings', desc: 'Access to job listings not posted anywhere else. Direct from companies who trust GENOIS scores.' },
  { icon: '🏆', title: 'GENOIS Legend Badge', desc: 'A permanent badge on your profile showing you reached Legend status. Recruiters notice this.' },
  { icon: '📊', title: 'Annual Performance Report', desc: 'Detailed yearly report of your growth. Shareable PDF for LinkedIn and interviews.' },
  { icon: '🤝', title: 'Private Legend Community', desc: 'Access to private WhatsApp group of top 1% students. Network that actually helps each other.' },
  { icon: '🚀', title: 'Early Access Forever', desc: 'First access to every new GENOIS feature before anyone else. Always.' },
];

export default function LegendPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/legend', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function buyLegend() {
    setBuying(true);
    try {
      const orderRes = await apiFetch('/api/payment/create-order', token, 'POST', {
        planId: 'legend',
        amount: 999,
        description: 'GENOIS Legend Access',
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 99900,
        currency: 'INR',
        name: 'GENOIS',
        description: 'Legend Access — You earned this',
        order_id: orderRes.data?.orderId,
        handler: async (response) => {
          toast.success('Welcome to Legend! 👑');
          router.push('/dashboard');
        },
        prefill: { name: '', email: '' },
        theme: { color: '#7b5cff' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      toast.error('Payment failed. Try again.');
    }
    setBuying(false);
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Checking eligibility...
    </div>
  );

  // NOT ELIGIBLE — show locked page with progress
  if (!data?.isEligible && !data?.isLegend) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#7b5cff', letterSpacing: 2, marginBottom: 12 }}>
            HIDDEN PLAN — INVITE ONLY
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
            Legend Access
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 4 }}>
            This plan is not shown on the pricing page.
          </p>
          <p style={{ color: '#5a7a9a', fontSize: 15 }}>
            It unlocks only when you reach a GENOIS score of <span style={{ color: '#7b5cff', fontWeight: 700 }}>1500 points</span>.
          </p>
        </div>

        {/* Progress to unlock */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(123,92,255,0.2)', borderRadius: 16, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7b5cff,transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 6 }}>YOUR PROGRESS TO LEGEND</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#e8f4ff' }}>
                {data?.currentScore} <span style={{ fontSize: 16, color: '#5a7a9a', fontWeight: 400 }}>/ 1500 pts</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 40, fontWeight: 800, color: '#7b5cff' }}>
                {data?.progressPercent}%
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>complete</div>
            </div>
          </div>

          <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${data?.progressPercent}%`, background: 'linear-gradient(90deg,#7b5cff,#00f0ff)', borderRadius: 5, transition: 'width 0.5s', boxShadow: '0 0 10px rgba(123,92,255,0.5)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            <span>Current: {data?.currentScore} pts</span>
            <span>{data?.pointsNeeded} pts to unlock</span>
          </div>
        </div>

        {/* How to earn points fast */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 14 }}>HOW TO REACH 1500 FASTER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { action: 'Complete all 5 daily tasks', points: '+80 pts/day', color: '#00f0ff' },
              { action: 'Score 100% on daily test', points: '+30 pts', color: '#1D9E75' },
              { action: 'Win a duel', points: '+50 pts', color: '#ff2d78' },
              { action: 'Complete a project', points: '+40 pts', color: '#7b5cff' },
              { action: 'Maintain 7 day streak', points: '+bonus pts', color: '#EF9F27' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#c8d8e8' }}>{s.action}</span>
                <span style={{ fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 700, color: s.color }}>{s.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preview of legend features — blurred */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(123,92,255,0.1)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,18,0.7)', backdropFilter: 'blur(4px)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#7b5cff' }}>
                Reach 1500 pts to unlock
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>LEGEND FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {LEGEND_FEATURES.slice(0, 4).map((f, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4ff' }}>{f.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => router.push('/roadmap')} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7b5cff,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            Start Grinding →
          </button>
        </div>
      </div>
    );
  }

  // ELIGIBLE — show unlock page
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>👑</div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#7b5cff', letterSpacing: 2, marginBottom: 12 }}>
          YOU EARNED THIS
        </div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg,#7b5cff,#00f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Legend Access Unlocked
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 4 }}>
          Your GENOIS score is <span style={{ color: '#7b5cff', fontWeight: 700 }}>{data?.currentScore} pts</span>.
        </p>
        <p style={{ color: '#5a7a9a', fontSize: 15 }}>
          You are in the top 1% of engineers on GENOIS.
        </p>
      </div>

      {/* Legend features */}
      <div style={{ background: 'linear-gradient(135deg,rgba(123,92,255,0.06),rgba(0,240,255,0.03))', border: '1px solid rgba(123,92,255,0.25)', borderRadius: 16, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#7b5cff,#00f0ff,transparent)' }} />

        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 20 }}>LEGEND PLAN INCLUDES</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 28 }}>
          {LEGEND_FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(123,92,255,0.1)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: '#e8f4ff', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(123,92,255,0.06)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#7b5cff', marginBottom: 4 }}>₹999</div>
          <div style={{ fontSize: 13, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>/month</div>
          <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>Only available to students with 1500+ GENOIS score</div>
        </div>

        <button
          onClick={buyLegend}
          disabled={buying || data?.isLegend}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            cursor: data?.isLegend ? 'default' : 'pointer',
            background: data?.isLegend
              ? 'rgba(29,158,117,0.2)'
              : buying
              ? 'rgba(123,92,255,0.3)'
              : 'linear-gradient(135deg,#7b5cff,#00f0ff)',
            color: data?.isLegend ? '#1D9E75' : '#020812',
            fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800,
            boxShadow: data?.isLegend ? 'none' : '0 0 30px rgba(123,92,255,0.3)',
          }}>
          {data?.isLegend
            ? '✓ You are a Legend'
            : buying
            ? 'Processing...'
            : 'Unlock Legend Access — ₹999/month →'}
        </button>
      </div>

      <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
        This plan is never advertised publicly. You found it by grinding.
      </p>
    </div>
  );
}
