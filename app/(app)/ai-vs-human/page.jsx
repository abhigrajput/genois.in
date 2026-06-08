'use client';
import Link from 'next/link';

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const MUTED = '#8b93a1';

const LOSE_CARDS = [
  {
    icon: '🧠',
    title: 'Creativity mein main fail hoon',
    says: 'Ek naya idea, ek original solution, ek "aha!" moment — yeh sirf insaan ke paas hota hai. Main patterns dhundta hoon, tum patterns todte ho.',
    challenge: 'Aaj ek coding problem aisa solve karo jo maine suggest nahi kiya tha.',
    btn: 'Accept Challenge →',
    href: '/coding',
  },
  {
    icon: '💪',
    title: 'Pressure mein main ghabra jaata hoon',
    says: 'Real interview mein, jab HR tumse ghoor ke poochhe "Why should we hire you?" — main wahan nahi hoon. Woh moment sirf tumhara hai.',
    challenge: 'Aaj voice interview mein 8/10 score karo. Prove karo pressure handle kar sakte ho.',
    btn: 'Take Voice Interview →',
    href: '/voice-interview',
  },
  {
    icon: '🔥',
    title: 'Consistency mein main zero hoon',
    says: 'Main shutdown ho jaata hoon, update ho jaata hoon, reset ho jaata hoon. Tumhari 30-day streak — woh main kabhi nahi bana sakta. Sirf insaan yeh kar sakta hai.',
    challenge: 'Aaj ka task complete karo. Ek din main nahi jeet sakta — tu jeet sakta hai.',
    btn: "Complete Today's Task →",
    href: '/roadmap',
  },
];

const AI_WINS = [
  '24/7 available — 3 AM ka doubt bhi instant solve',
  '1000 topics yaad — koi bhi topic kabhi forget nahi hota',
  'No judgment — galat answer pe main kabhi judge nahi karta',
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
          Main (AI) hoon — aur main honestly bolunga: kuch cheezein main kabhi nahi kar sakta.
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
          Lekin jahan main tumse better hoon 👇
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
          Tum + Main = Unstoppable.<br />Shuru karte hain?
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
