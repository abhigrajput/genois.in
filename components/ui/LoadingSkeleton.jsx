'use client';

const shimmer = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(0,217,163,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'gskel-shimmer 1.4s ease-in-out infinite',
  borderRadius: 10,
};

function Block({ h = 16, w = '100%', style }) {
  return <div style={{ ...shimmer, height: h, width: w, ...style }} />;
}

/**
 * Shared loading skeleton for async-heavy pages.
 * variant:
 *  - "page"  — heading + text lines + card grid (roadmap/dashboard shape)
 *  - "cards" — a grid of card placeholders (topic lists, review list)
 *  - "quiz"  — one question card + option rows (test/aptitude/review detail)
 * `label` renders under the skeleton so users know WHAT is loading
 * (e.g. "GENOIS Engine is generating questions…").
 */
export default function LoadingSkeleton({ variant = 'page', label = '' }) {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-body)' }}>
      {variant === 'page' && (
        <>
          <Block h={28} w="45%" style={{ marginBottom: 10 }} />
          <Block h={14} w="70%" style={{ marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
            {[0, 1, 2].map(i => <Block key={i} h={84} />)}
          </div>
          <Block h={180} style={{ marginBottom: 12 }} />
          <Block h={120} />
        </>
      )}

      {variant === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {[0, 1, 2, 3, 4, 5].map(i => <Block key={i} h={92} />)}
        </div>
      )}

      {variant === 'quiz' && (
        <>
          <Block h={12} w="30%" style={{ marginBottom: 16 }} />
          <Block h={110} style={{ marginBottom: 18 }} />
          {[0, 1, 2, 3].map(i => <Block key={i} h={48} style={{ marginBottom: 10 }} />)}
        </>
      )}

      {label && (
        <div style={{ textAlign: 'center', marginTop: 22, color: '#5a7a9a', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          {label}
        </div>
      )}

      <style>{`@keyframes gskel-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
