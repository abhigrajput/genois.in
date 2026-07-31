'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';

const TYPE_LABEL = {
  dsa_diagnostic: 'DSA Diagnostic', aptitude: 'Aptitude',
  daily: 'Daily Test', weekly: 'Weekly Test', monthly: 'Monthly Test',
  revision: 'Revision Test', voice_interview: 'Voice Interview',
};

const pctColor = (pct) => pct >= 60 ? 'var(--gx-success)' : pct >= 40 ? 'var(--gx-warning)' : 'var(--gx-danger)';

// Options arrive either as {A: "...", B: "..."} (diagnostic) or ["A) ...", ...]
// (daily tests / aptitude). Render either as labelled rows.
function optionRows(options) {
  if (!options) return [];
  if (Array.isArray(options)) return options.map((text, i) => ({ key: String.fromCharCode(65 + i), text }));
  return Object.entries(options).map(([key, text]) => ({ key, text }));
}

// user/correct answers may be a letter ("B") or full option text — match both.
function answerMatches(answer, optKey, optText) {
  if (answer == null) return false;
  const a = String(answer).trim();
  return a === optKey || a === String(optText).trim() || a.startsWith(`${optKey})`);
}

export default function ReviewDetailPage() {
  const { attemptId } = useParams();
  const { token, ready } = useToken();
  const [attempt, setAttempt] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready || !token || !attemptId) return;
    load();
  }, [ready, token, attemptId]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetch(`/api/review/${attemptId}`, token);
      setAvailable(r?.data?.available !== false);
      setAttempt(r?.data?.attempt || null);
    } catch (e) {
      setError(friendlyError(e, 'load this review'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <LoadingSkeleton variant="quiz" label="Loading your answers…" />;

  if (error) return (
    <ErrorCard title="Couldn't load this review" message={error} primaryLabel="↻ Retry" onPrimary={load} />
  );

  if (!available || !attempt) return (
    <ErrorCard
      icon="🗂"
      title="Review not available"
      message="Per-question review data isn't available for this attempt — older attempts (before the review feature) only stored the final score. New attempts are fully reviewable."
      secondaryLabel="← All attempts"
      onSecondary={() => { window.location.href = '/review'; }}
    />
  );

  const questions = attempt.questions || [];
  const breakdown = Object.entries(attempt.topic_breakdown || {});
  const isVerbal = attempt.attempt_type === 'voice_interview';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <Link href="/review" style={{ color: 'var(--gx-accent)', fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>← All attempts</Link>

      {/* Score header */}
      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, margin: '14px 0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 2, marginBottom: 6 }}>
          {(TYPE_LABEL[attempt.attempt_type] || attempt.attempt_type).toUpperCase()}{attempt.topic ? ` · ${attempt.topic.toUpperCase()}` : ''}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 800, color: pctColor(attempt.score), lineHeight: 1.1 }}>{attempt.score}%</div>
        <div style={{ color: 'var(--gx-text)', fontSize: 14, marginTop: 4 }}>{attempt.correct_count}/{attempt.total_questions} {isVerbal ? 'strong answers' : 'correct'}</div>
        <div style={{ color: 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{new Date(attempt.taken_at).toLocaleString()}</div>
      </div>

      {/* Topic-wise breakdown */}
      {breakdown.length > 1 && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2, fontFamily: 'var(--font-body)', marginBottom: 12 }}>TOPIC BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map(([topic, s]) => {
              const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--gx-text)', textTransform: 'capitalize' }}>{topic}</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: pctColor(pct) }}>{s.correct}/{s.total} · {pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--gx-surface)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pctColor(pct), transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-question review */}
      <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2, fontFamily: 'var(--font-body)', marginBottom: 12 }}>QUESTION BY QUESTION</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {questions.map((q, i) => {
          const opts = optionRows(q.options);
          return (
            <div key={i} style={{ background: 'var(--gx-bg)', border: `1px solid ${q.is_correct ? 'var(--gx-success-border)' : 'var(--gx-danger-border)'}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{q.is_correct ? '✅' : '❌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'var(--gx-text)', fontWeight: 500, lineHeight: 1.6 }}>Q{i + 1}. {q.question}</div>
                  {q.topic && <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>{q.topic}</span>}
                </div>
              </div>

              {q.code && (
                <pre style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 8, padding: 12, overflowX: 'auto', fontSize: 12, lineHeight: 1.6, color: 'var(--gx-text)', fontFamily: 'var(--font-mono)', margin: '0 0 12px' }}>{q.code}</pre>
              )}

              {opts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {opts.map(({ key, text }) => {
                    const isCorrect = answerMatches(q.correct_answer, key, text);
                    const isPicked = answerMatches(q.user_answer, key, text);
                    return (
                      <div key={key} style={{
                        display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                        border: `1px solid ${isCorrect ? 'var(--gx-success-border)' : isPicked ? 'var(--gx-danger-border)' : 'var(--gx-border)'}`,
                        background: isCorrect ? 'var(--gx-success-soft)' : isPicked ? 'var(--gx-danger-soft)' : 'transparent',
                        color: isCorrect ? 'var(--gx-success)' : isPicked ? 'var(--gx-danger)' : 'var(--gx-text-muted)',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{key}.</span>
                        <span style={{ flex: 1 }}>{text}</span>
                        {isCorrect && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>✓ correct</span>}
                        {isPicked && !isCorrect && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>your pick</span>}
                      </div>
                    );
                  })}
                  {q.user_answer == null && <div style={{ fontSize: 11, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)' }}>— skipped —</div>}
                </div>
              ) : (
                // Verbal / open answers (voice interview): show answer vs ideal.
                <div style={{ marginBottom: 10 }}>
                  {q.user_answer && (
                    <div style={{ fontSize: 13, color: 'var(--gx-text)', lineHeight: 1.6, padding: 10, background: 'var(--gx-surface)', borderLeft: '2px solid var(--gx-accent)', borderRadius: 6, marginBottom: 8 }}>🗣 {q.user_answer}</div>
                  )}
                  {q.correct_answer && (
                    <div style={{ fontSize: 12.5, color: 'var(--gx-success)', lineHeight: 1.6 }}><b>Ideal answer:</b> <span style={{ color: 'var(--gx-success)' }}>{q.correct_answer}</span></div>
                  )}
                </div>
              )}

              {q.explanation && (
                <div style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.65, padding: '10px 12px', background: 'var(--gx-surface-2)', borderRadius: 8 }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
