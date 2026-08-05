'use client';
/**
 * Flashcard drill over a sheet's `recall` items.
 *
 * Deliberately NOT spaced repetition: that needs a schedule, per-card state and
 * a migration, and none of that was asked for. This is a revision aid — shuffle,
 * reveal, self-grade, see a tally — and it stores nothing. When the user asks
 * for retention tracking, the card ids and a review table are the natural next
 * step, and no data written now would have to be thrown away.
 */
import { useState, useMemo, useEffect } from 'react';

function shuffled(cards) {
  const a = [...cards];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardDrill({ title, cards, onClose }) {
  const [order, setOrder] = useState(() => shuffled(cards));
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ got: 0, missed: 0 });

  const card = order[i];
  const done = i >= order.length;
  const total = order.length;

  const progress = useMemo(
    () => (total ? Math.round((Math.min(i, total) / total) * 100) : 0),
    [i, total],
  );

  function grade(got) {
    setScore(s => ({ got: s.got + (got ? 1 : 0), missed: s.missed + (got ? 0 : 1) }));
    setRevealed(false);
    setI(n => n + 1);
  }

  function restart() {
    setOrder(shuffled(cards));
    setI(0);
    setRevealed(false);
    setScore({ got: 0, missed: 0 });
  }

  // Space reveals, 1/2 grade — keyboard is how anyone actually drills.
  useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.code === 'Space') { e.preventDefault(); setRevealed(true); }
      else if (revealed && e.key === '1') grade(true);
      else if (revealed && e.key === '2') grade(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, revealed]);

  if (!cards?.length) return null;

  return (
    <div className="gx-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <span className="gx-section-label">Flashcards — {title}</span>
        <button className="gx-btn gx-btn--ghost gx-btn--sm" onClick={onClose}>Close</button>
      </div>

      <div className="gx-progress" style={{ marginBottom: 16 }}>
        <div className="gx-progress__fill" style={{ width: `${progress}%` }} />
      </div>

      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gx-text)' }}>
            {score.got} / {total}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gx-text-muted)', margin: '8px 0 18px' }}>
            {score.missed === 0
              ? 'Every card recalled. Move on to the next sheet.'
              : `${score.missed} to revisit. Self-graded — this is not recorded anywhere.`}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="gx-btn gx-btn--primary" onClick={restart}>Shuffle and go again</button>
            <button className="gx-btn gx-btn--outline" onClick={onClose}>Back to the sheet</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', marginBottom: 8 }}>
            Card {i + 1} of {total}
          </div>

          <div
            className="gx-well"
            style={{ padding: 22, minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}
          >
            <div style={{ fontSize: 16, fontWeight: 650, color: 'var(--gx-text)', lineHeight: 1.5 }}>
              {card.q}
            </div>
            {revealed && (
              <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.65, borderTop: '1px solid var(--gx-border)', paddingTop: 14 }}>
                {card.a}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {!revealed ? (
              <button className="gx-btn gx-btn--primary" onClick={() => setRevealed(true)}>
                Reveal answer <span style={{ opacity: 0.6, marginLeft: 6 }}>space</span>
              </button>
            ) : (
              <>
                <button className="gx-btn gx-btn--secondary" onClick={() => grade(true)}>
                  I knew it <span style={{ opacity: 0.6, marginLeft: 6 }}>1</span>
                </button>
                <button className="gx-btn gx-btn--outline" onClick={() => grade(false)}>
                  Revisit <span style={{ opacity: 0.6, marginLeft: 6 }}>2</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
