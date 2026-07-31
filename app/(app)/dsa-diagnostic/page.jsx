'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

// ─── Constants ─────────────────────────────────────────────────────────────
const TOTAL_TIME = 20 * 60; // 20 minutes in seconds
const MIN_TO_SUBMIT = 20;

const LEVEL_CONFIG = {
  BEGINNER:     { color: 'var(--gx-info)', bg: 'var(--gx-info-soft)', emoji: '🌱', label: 'Beginner' },
  INTERMEDIATE: { color: 'var(--gx-warning)', bg: 'var(--gx-warning-soft)',  emoji: '⚡', label: 'Intermediate' },
  ADVANCED:     { color: 'var(--gx-success)', bg: 'var(--gx-success-soft)',  emoji: '🔥', label: 'Advanced' },
};

const TOPIC_LABELS = {
  arrays: 'Arrays', strings: 'Strings', linkedlist: 'Linked List',
  stacks: 'Stacks', queues: 'Queues', trees: 'Trees',
  graphs: 'Graphs', dp: 'Dynamic Programming', greedy: 'Greedy',
  sorting: 'Sorting', recursion: 'Recursion',
};

// ─── Shared styles ──────────────────────────────────────────────────────────
const S = {
  page:     { fontFamily: 'var(--font-body)', minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', padding: '32px 16px' },
  card:     { maxWidth: 780, margin: '0 auto', background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 20, padding: 32 },
  h1:       { fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-text)', margin: '0 0 8px' },
  sub:      { color: 'var(--gx-text-muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' },
  btn:      { padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)' },
  btnGhost: { padding: '10px 20px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'transparent', cursor: 'pointer', color: 'var(--gx-accent)', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 },
  mono:     { fontFamily: 'var(--font-mono)' },
};

// ─── Screen 1: Intro ────────────────────────────────────────────────────────
function IntroScreen({ onStart, loading, previousResult }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
          <h1 style={S.h1}>DSA Level Check</h1>
          <p style={S.sub}>
            25 questions · 20 minutes · AI-powered evaluation<br />
            We'll assess your C++ and DSA skills to place you on the right learning path.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {[['📺', '10 Code Snippets', 'Predict output & find errors'],
              ['📖', '15 Theory MCQs', 'DSA concepts & logic'],
              ['🤖', 'AI Evaluation', 'GENOIS Engine analyzes your strengths']].map(([icon, title, desc]) => (
              <div key={title} style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', flex: '1 1 180px', textAlign: 'left' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>

          {previousResult && (
            <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginBottom: 4, ...S.mono }}>PREVIOUS RESULT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{LEVEL_CONFIG[previousResult.level]?.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: LEVEL_CONFIG[previousResult.level]?.color }}>
                    {LEVEL_CONFIG[previousResult.level]?.label} · {previousResult.score}/100
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)' }}>
                    Taken {new Date(previousResult.taken_at).toLocaleDateString()} · Retake available in 30 days
                  </div>
                </div>
              </div>
            </div>
          )}

          <button onClick={onStart} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading Questions...' : previousResult ? 'Retake Test →' : 'Start Diagnostic Test →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Test ─────────────────────────────────────────────────────────
function TestScreen({ questions, onSubmit, submitting }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: 'A'|'B'|'C'|'D' }
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = useCallback((autoSubmit = false) => {
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const builtAnswers = questions.map(q => ({
      questionId: q.id,
      selected: answers[q.id] || null,
      correct: answers[q.id] === q.correct,
      topic: q.topic,
      type: q.type,
      difficulty: q.difficulty,
    }));
    onSubmit(builtAnswers, timeTaken);
  }, [answers, questions, startTime, onSubmit]);

  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount >= MIN_TO_SUBMIT;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerColor = timeLeft < 120 ? 'var(--gx-danger)' : timeLeft < 300 ? 'var(--gx-warning)' : 'var(--gx-accent)';

  const q = questions[current];
  const topicLabel = TOPIC_LABELS[q?.topic] || q?.topic;

  return (
    <div style={S.page}>
      {/* Top bar */}
      <div style={{ maxWidth: 780, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...S.mono, fontSize: 12, color: 'var(--gx-text-muted)' }}>Q {current + 1}/{questions.length}</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', ...S.mono }}>{topicLabel}</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: q?.type === 'code' ? 'var(--gx-warning-soft)' : 'var(--gx-success-soft)', color: q?.type === 'code' ? 'var(--gx-warning)' : 'var(--gx-success)' }}>
            {q?.type === 'code' ? '💻 Code' : '📖 Theory'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ ...S.mono, fontSize: 16, fontWeight: 700, color: timerColor }}>⏱ {mm}:{ss}</span>
          <span style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>{answeredCount}/{questions.length} answered</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 780, margin: '0 auto 16px', height: 3, background: 'var(--gx-surface)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${(answeredCount / questions.length) * 100}%`, background: 'var(--gx-accent)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Question card */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: 'var(--gx-text)', lineHeight: 1.6, marginBottom: q?.code ? 16 : 24, fontWeight: 500 }}>
          {q?.question}
        </div>

        {q?.code && (
          <pre style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-warning-border)', borderRadius: 10, padding: 16, overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: 'var(--gx-text)', marginBottom: 20, ...S.mono }}>
            {q.code}
          </pre>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['A', 'B', 'C', 'D'].map(opt => {
            const selected = answers[q?.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                  borderRadius: 10, border: `1px solid ${selected ? 'var(--gx-accent)' : 'var(--gx-border)'}`,
                  background: selected ? 'var(--gx-accent-soft)' : 'var(--gx-surface)',
                  color: selected ? 'var(--gx-accent)' : 'var(--gx-text)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s', fontSize: 14, fontFamily: 'var(--font-body)',
                }}
              >
                <span style={{ ...S.mono, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2, width: 18, color: selected ? 'var(--gx-accent)' : 'var(--gx-text-muted)' }}>{opt}.</span>
                <span>{q?.options?.[opt]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ ...S.btnGhost, opacity: current === 0 ? 0.3 : 1 }}>← Prev</button>

        {/* Question palette */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', flex: 1 }}>
          {questions.map((qs, i) => (
            <button
              key={qs.id}
              onClick={() => setCurrent(i)}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10,
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                background: i === current ? 'var(--gx-accent)' : answers[qs.id] ? 'var(--gx-success)' : 'var(--gx-surface)',
                color: i === current ? 'var(--gx-text-inverse)' : answers[qs.id] ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < questions.length - 1
          ? <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} style={S.btnGhost}>Next →</button>
          : <button onClick={() => handleSubmit(false)} disabled={!canSubmit || submitting} style={{ ...S.btn, fontSize: 13, padding: '10px 20px', opacity: (!canSubmit || submitting) ? 0.5 : 1 }}>
              {submitting ? 'Evaluating...' : canSubmit ? 'Submit Test →' : `Answer ${MIN_TO_SUBMIT - answeredCount} more`}
            </button>
        }
      </div>

      {/* Submit from anywhere if all answered */}
      {canSubmit && current < questions.length - 1 && (
        <div style={{ maxWidth: 780, margin: '12px auto 0', textAlign: 'right' }}>
          <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ ...S.btn, fontSize: 13, padding: '10px 24px' }}>
            {submitting ? 'Evaluating...' : 'Submit Test →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Screen 3: Result ────────────────────────────────────────────────────────
function ResultScreen({ result, onStartRoadmap }) {
  const cfg = LEVEL_CONFIG[result.level] || LEVEL_CONFIG.BEGINNER;
  const topics = Object.entries(result.topicBreakdown || {});

  return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 700 }}>

        {/* Level badge */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{cfg.emoji}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: cfg.bg, border: `2px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`, borderRadius: 40, padding: '10px 28px', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--gx-text)', ...S.mono, marginBottom: 4 }}>{result.score}<span style={{ fontSize: 18, color: 'var(--gx-text-muted)' }}>/100</span></div>
          <div style={{ fontSize: 13, color: 'var(--gx-text-muted)' }}>Your DSA diagnostic score</div>
        </div>

        {/* Topic breakdown */}
        {topics.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2, ...S.mono, marginBottom: 12 }}>TOPIC BREAKDOWN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topics.map(([topic, pct]) => (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--gx-text)' }}>{TOPIC_LABELS[topic] || topic}</span>
                    <span style={{ fontSize: 12, ...S.mono, color: pct >= 60 ? 'var(--gx-success)' : pct >= 40 ? 'var(--gx-warning)' : 'var(--gx-danger)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--gx-surface)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 60 ? 'var(--gx-success)' : pct >= 40 ? 'var(--gx-warning)' : 'var(--gx-danger)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {result.strengths?.length > 0 && (
            <div style={{ background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-success)', letterSpacing: 2, ...S.mono, marginBottom: 10 }}>✅ STRENGTHS</div>
              {result.strengths.map(s => (
                <div key={s} style={{ fontSize: 12, color: 'var(--gx-text)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid var(--gx-success)' }}>{TOPIC_LABELS[s] || s}</div>
              ))}
            </div>
          )}
          {result.weaknesses?.length > 0 && (
            <div style={{ background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-danger)', letterSpacing: 2, ...S.mono, marginBottom: 10 }}>📌 FOCUS AREAS</div>
              {result.weaknesses.map(w => (
                <div key={w} style={{ fontSize: 12, color: 'var(--gx-text)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid var(--gx-danger)' }}>{TOPIC_LABELS[w] || w}</div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        {result.recommendation && (
          <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: 'var(--gx-accent)', letterSpacing: 2, ...S.mono, marginBottom: 8 }}>🤖 AI RECOMMENDATION</div>
            <p style={{ fontSize: 13, color: 'var(--gx-text)', lineHeight: 1.7, margin: 0 }}>{result.recommendation}</p>
          </div>
        )}

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button onClick={onStartRoadmap} style={{ ...S.btn, fontSize: 16, padding: '16px 40px' }}>
            Start Your {cfg.label} Roadmap →
          </button>
          {result.attemptId && (
            <a href={`/review/${result.attemptId}`} style={{ ...S.btnGhost, textDecoration: 'none', display: 'inline-block' }}>
              📋 Review your answers — see what was wrong &amp; why
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DSADiagnosticPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [screen, setScreen] = useState('intro'); // intro | test | evaluating | result
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for previous result on mount
  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/dsa-diagnostic/evaluate', token)
      .then(r => {
        if (r?.data?.level) setPreviousResult(r.data);
      })
      .catch(() => {});
  }, [ready, token]);

  async function handleStart() {
    setLoadingQuestions(true);
    setError('');
    try {
      const r = await apiFetch('/api/dsa-diagnostic/generate', token);
      setQuestions(r.data.questions);
      setScreen('test');
    } catch (e) {
      setError(e.message || 'Failed to load questions. Please try again.');
    }
    setLoadingQuestions(false);
  }

  async function handleSubmit(answers, timeTaken) {
    setSubmitting(true);
    setScreen('evaluating');
    try {
      // `questions` rides along so the server can persist the full set
      // (text/options/correct/explanation) for the post-test review page.
      const r = await apiFetch('/api/dsa-diagnostic/evaluate', token, 'POST', { answers, timeTaken, questions });
      setResult(r.data);
      setScreen('result');
    } catch (e) {
      setError(e.message || 'Evaluation failed. Please try again.');
      setScreen('intro');
    }
    setSubmitting(false);
  }

  function handleStartRoadmap() {
    router.push('/dsa-roadmap');
  }

  if (screen === 'evaluating') {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: 'var(--gx-text)', marginBottom: 8 }}>GENOIS Engine is analyzing your answers...</h2>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>Evaluating topic mastery, code accuracy, and learning path. This takes ~10 seconds.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gx-accent)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'result' && result) {
    return <ResultScreen result={result} onStartRoadmap={handleStartRoadmap} />;
  }

  if (screen === 'test' && questions.length > 0) {
    return <TestScreen questions={questions} onSubmit={handleSubmit} submitting={submitting} />;
  }

  return (
    <>
      {error && (
        <div style={{ maxWidth: 780, margin: '16px auto 0', padding: '12px 16px', background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', borderRadius: 8, color: 'var(--gx-danger)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
      <IntroScreen onStart={handleStart} loading={loadingQuestions} previousResult={previousResult} />
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </>
  );
}
