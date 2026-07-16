'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';

// ─── Constants ─────────────────────────────────────────────────────────────
const TOTAL_TIME = 20 * 60; // 20 minutes in seconds
const MIN_TO_SUBMIT = 20;

const LEVEL_CONFIG = {
  BEGINNER:     { color: '#4f9cf9', bg: 'rgba(79,156,249,0.12)', emoji: '🌱', label: 'Beginner' },
  INTERMEDIATE: { color: '#EF9F27', bg: 'rgba(239,159,39,0.12)',  emoji: '⚡', label: 'Intermediate' },
  ADVANCED:     { color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',  emoji: '🔥', label: 'Advanced' },
};

const TOPIC_LABELS = {
  arrays: 'Arrays', strings: 'Strings', linkedlist: 'Linked List',
  stacks: 'Stacks', queues: 'Queues', trees: 'Trees',
  graphs: 'Graphs', dp: 'Dynamic Programming', greedy: 'Greedy',
  sorting: 'Sorting', recursion: 'Recursion',
};

// ─── Shared styles ──────────────────────────────────────────────────────────
const S = {
  page:     { fontFamily: 'var(--font-body)', minHeight: '100vh', background: '#020812', color: '#e8e8ed', padding: '32px 16px' },
  card:     { maxWidth: 780, margin: '0 auto', background: '#070f1f', border: '1px solid rgba(0,217,163,0.12)', borderRadius: 20, padding: 32 },
  h1:       { fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', margin: '0 0 8px' },
  sub:      { color: '#5a7a9a', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' },
  btn:      { padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812' },
  btnGhost: { padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.2)', background: 'transparent', cursor: 'pointer', color: '#00d9a3', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 },
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
              <div key={title} style={{ background: 'rgba(0,217,163,0.04)', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 12, padding: '14px 18px', flex: '1 1 180px', textAlign: 'left' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ed', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>{desc}</div>
              </div>
            ))}
          </div>

          {previousResult && (
            <div style={{ background: 'rgba(0,217,163,0.04)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 4, ...S.mono }}>PREVIOUS RESULT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{LEVEL_CONFIG[previousResult.level]?.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: LEVEL_CONFIG[previousResult.level]?.color }}>
                    {LEVEL_CONFIG[previousResult.level]?.label} · {previousResult.score}/100
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a9a' }}>
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
  const timerColor = timeLeft < 120 ? '#ff2d78' : timeLeft < 300 ? '#EF9F27' : '#00d9a3';

  const q = questions[current];
  const topicLabel = TOPIC_LABELS[q?.topic] || q?.topic;

  return (
    <div style={S.page}>
      {/* Top bar */}
      <div style={{ maxWidth: 780, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ ...S.mono, fontSize: 12, color: '#5a7a9a' }}>Q {current + 1}/{questions.length}</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,217,163,0.08)', color: '#00d9a3', ...S.mono }}>{topicLabel}</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: q?.type === 'code' ? 'rgba(255,107,74,0.12)' : 'rgba(29,158,117,0.1)', color: q?.type === 'code' ? '#ff6b4a' : '#1D9E75' }}>
            {q?.type === 'code' ? '💻 Code' : '📖 Theory'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ ...S.mono, fontSize: 16, fontWeight: 700, color: timerColor }}>⏱ {mm}:{ss}</span>
          <span style={{ fontSize: 12, color: '#5a7a9a' }}>{answeredCount}/{questions.length} answered</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 780, margin: '0 auto 16px', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${(answeredCount / questions.length) * 100}%`, background: 'linear-gradient(90deg,#00d9a3,#ff6b4a)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Question card */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 15, color: '#e8e8ed', lineHeight: 1.6, marginBottom: q?.code ? 16 : 24, fontWeight: 500 }}>
          {q?.question}
        </div>

        {q?.code && (
          <pre style={{ background: '#0a0f1e', border: '1px solid rgba(255,107,74,0.2)', borderRadius: 10, padding: 16, overflowX: 'auto', fontSize: 13, lineHeight: 1.6, color: '#c8d8e8', marginBottom: 20, ...S.mono }}>
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
                  borderRadius: 10, border: `1px solid ${selected ? '#00d9a3' : 'rgba(255,255,255,0.06)'}`,
                  background: selected ? 'rgba(0,217,163,0.08)' : 'rgba(255,255,255,0.02)',
                  color: selected ? '#00d9a3' : '#c8d8e8', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s', fontSize: 14, fontFamily: 'var(--font-body)',
                }}
              >
                <span style={{ ...S.mono, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2, width: 18, color: selected ? '#00d9a3' : '#5a7a9a' }}>{opt}.</span>
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
                background: i === current ? '#00d9a3' : answers[qs.id] ? '#1D9E75' : 'rgba(255,255,255,0.06)',
                color: i === current ? '#020812' : answers[qs.id] ? '#020812' : '#5a7a9a',
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: cfg.bg, border: `2px solid ${cfg.color}40`, borderRadius: 40, padding: '10px 28px', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#e8e8ed', ...S.mono, marginBottom: 4 }}>{result.score}<span style={{ fontSize: 18, color: '#5a7a9a' }}>/100</span></div>
          <div style={{ fontSize: 13, color: '#5a7a9a' }}>Your DSA diagnostic score</div>
        </div>

        {/* Topic breakdown */}
        {topics.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#5a7a9a', letterSpacing: 2, ...S.mono, marginBottom: 12 }}>TOPIC BREAKDOWN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topics.map(([topic, pct]) => (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#c8d8e8' }}>{TOPIC_LABELS[topic] || topic}</span>
                    <span style={{ fontSize: 12, ...S.mono, color: pct >= 60 ? '#1D9E75' : pct >= 40 ? '#EF9F27' : '#ff2d78' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 60 ? '#1D9E75' : pct >= 40 ? '#EF9F27' : '#ff2d78', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {result.strengths?.length > 0 && (
            <div style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#1D9E75', letterSpacing: 2, ...S.mono, marginBottom: 10 }}>✅ STRENGTHS</div>
              {result.strengths.map(s => (
                <div key={s} style={{ fontSize: 12, color: '#c8d8e8', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #1D9E75' }}>{TOPIC_LABELS[s] || s}</div>
              ))}
            </div>
          )}
          {result.weaknesses?.length > 0 && (
            <div style={{ background: 'rgba(255,45,120,0.06)', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#ff2d78', letterSpacing: 2, ...S.mono, marginBottom: 10 }}>📌 FOCUS AREAS</div>
              {result.weaknesses.map(w => (
                <div key={w} style={{ fontSize: 12, color: '#c8d8e8', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #ff2d78' }}>{TOPIC_LABELS[w] || w}</div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        {result.recommendation && (
          <div style={{ background: 'rgba(0,217,163,0.04)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#00d9a3', letterSpacing: 2, ...S.mono, marginBottom: 8 }}>🤖 AI RECOMMENDATION</div>
            <p style={{ fontSize: 13, color: '#c8d8e8', lineHeight: 1.7, margin: 0 }}>{result.recommendation}</p>
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
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#e8e8ed', marginBottom: 8 }}>GENOIS Engine is analyzing your answers...</h2>
          <p style={{ color: '#5a7a9a', fontSize: 14 }}>Evaluating topic mastery, code accuracy, and learning path. This takes ~10 seconds.</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#00d9a3', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
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
        <div style={{ maxWidth: 780, margin: '16px auto 0', padding: '12px 16px', background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 8, color: '#ff2d78', fontSize: 13 }}>
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
