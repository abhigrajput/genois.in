'use client';
import Link from 'next/link';

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const MUTED = '#8b93a1';

const LOSE_CARDS = [
  {
    icon: '🧠',
    title: 'I fail at creativity',
    says: 'A new idea, an original solution, an "aha!" moment — those belong to humans alone. I find patterns; you break them.',
    challenge: 'Today, solve a coding problem in a way I never suggested.',
    btn: 'Accept Challenge →',
    href: '/coding',
  },
  {
    icon: '💪',
    title: 'I panic under pressure',
    says: 'In a real interview, when HR looks you in the eye and asks "Why should we hire you?" — I am not there. That moment is entirely yours.',
    challenge: 'Score 8/10 in a voice interview today. Prove you can handle the pressure.',
    btn: 'Take Voice Interview →',
    href: '/voice-interview',
  },
  {
    icon: '🔥',
    title: 'I am zero at consistency',
    says: 'I shut down, I update, I reset. Your 30-day streak — I can never build that. Only a human can.',
    challenge: "Complete today's task. I can't win a single day — you can.",
    btn: "Complete Today's Task →",
    href: '/roadmap',
  },
];

const AI_WINS = [
  '24/7 available — even a 3 AM doubt gets solved instantly',
  '1000 topics memorized — I never forget a single one',
  'No judgment — I never judge you for a wrong answer',
];

export default function AIvsHumanPage() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: 'Outfit,sans-serif', width: '100%' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 34, fontWeight: 800, color: '#f8fafc', margin: '0 0 10px' }}>
          AI vs Human 🤖
        </h1>
        <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
          I am the AI — and I'll be honest: there are some things I can never do.
        </p>
      </div>

      {/* Cards where AI loses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 44 }}>
        {LOSE_CARDS.map((c) => (
          <div key={c.title} style={{
            background: '#13131f', border: '1px solid rgba(99,102,241,0.16)', borderRadius: 18,
            padding: '24px 22px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{c.icon}</div>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 19, fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', lineHeight: 1.3 }}>
              {c.title}
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.65, margin: '0 0 16px', fontStyle: 'italic' }}>
              &ldquo;{c.says}&rdquo;
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
              padding: '12px 14px', marginBottom: 18, marginTop: 'auto',
            }}>
              <div style={{ fontSize: 10, color: PURPLE_LIGHT, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, marginBottom: 5 }}>CHALLENGE</div>
              <div style={{ color: '#e2e8f0', fontSize: 13.5, lineHeight: 1.55 }}>{c.challenge}</div>
            </div>
            <Link href={c.href} style={{
              display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, textDecoration: 'none',
              background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, color: '#fff',
              fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700,
            }}>
              {c.btn}
            </Link>
          </div>
        ))}
      </div>

      {/* Where AI wins */}
      <div style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#f8fafc', textAlign: 'center', margin: '0 0 20px' }}>
          But here's where I'm better than you 👇
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {AI_WINS.map((w, i) => (
            <div key={i} style={{
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 14,
              padding: '18px 18px', color: '#cbd5e1', fontSize: 14, lineHeight: 1.55, textAlign: 'center',
            }}>
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{
        textAlign: 'center', padding: '40px 24px', borderRadius: 20,
        background: 'linear-gradient(160deg, rgba(99,102,241,0.14), rgba(79,70,229,0.04))',
        border: '1px solid rgba(99,102,241,0.22)',
      }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 20px', lineHeight: 1.3 }}>
          You + Me = Unstoppable.<br />Shall we begin?
        </h2>
        <Link href="/dashboard" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 12, textDecoration: 'none',
          background: `linear-gradient(135deg, ${PURPLE}, #4f46e5)`, color: '#fff',
          fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700,
          boxShadow: '0 10px 30px rgba(99,102,241,0.34)',
        }}>
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}
