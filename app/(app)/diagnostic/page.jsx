'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SKILL_COLORS = {
  novice: 'var(--gx-danger)',
  beginner: 'var(--gx-warning)',
  intermediate: 'var(--gx-accent)',
  advanced: 'var(--gx-success)',
};

const SKILL_LABELS = {
  novice: 'Novice — Starting from scratch',
  beginner: 'Beginner — Know the basics',
  intermediate: 'Intermediate — Solid foundation',
  advanced: 'Advanced — Ready to build',
};

export default function DiagnosticPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [phase, setPhase] = useState('intro');
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/diagnostic', token)
      .then(r => {
        if (r.data.alreadyTaken) {
          setDiagnostic(r.data.diagnostic);
          setResult({
            score: r.data.diagnostic.score,
            skillLevel: r.data.diagnostic.skill_level,
            totalQuestions: r.data.diagnostic.questions?.length || 15,
            correctAnswers: Math.round((r.data.diagnostic.score / 100) * (r.data.diagnostic.questions?.length || 15)),
          });
          setPhase('result');
        } else {
          setDiagnostic(r.data.diagnostic);
          setPhase('intro');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function startTest() {
    if (!diagnostic) {
      setGenerating(true);
      try {
        const r = await apiFetch('/api/diagnostic', token);
        setDiagnostic(r.data.diagnostic);
      } catch (e) { toast.error(e.message); setGenerating(false); return; }
      setGenerating(false);
    }
    setPhase('test');
    setCurrentQ(0);
  }

  async function submitTest() {
    const questions = diagnostic?.questions || [];
    if (Object.keys(answers).length < questions.length) {
      toast.error('Answer all questions first'); return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/diagnostic', token, 'POST', { answers });
      setResult(r.data);
      setPhase('result');
      toast.success('Diagnostic complete!');
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{ color: 'var(--gx-text-muted)', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>
  );

  const questions = diagnostic?.questions || [];
  const q = questions[currentQ];

  if (phase === 'result' && result) {
    const color = SKILL_COLORS[result.skillLevel] || 'var(--gx-accent)';
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 12 }}>
            DIAGNOSTIC COMPLETE
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 64, fontWeight: 800, color, marginBottom: 8 }}>
            {result.score}%
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color, marginBottom: 8 }}>
            {SKILL_LABELS[result.skillLevel]}
          </div>
          <div style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>
            {result.correctAnswers} of {result.totalQuestions} questions correct
          </div>
        </div>

        <div style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${color} 13%, transparent)`, borderRadius: 14, padding: 24, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 16 }}>WHAT THIS MEANS</div>
          <div style={{ fontSize: 14, color: 'var(--gx-text)', lineHeight: 1.8 }}>
            {result.skillLevel === 'novice' && 'You are starting from zero. That is perfectly fine. Your 30-day roadmap will build your foundation step by step. By Day 30 you will be a completely different engineer.'}
            {result.skillLevel === 'beginner' && 'You know the basics but there are gaps. Your roadmap will fill those gaps systematically. By Day 30 you will have a solid foundation ready for interviews.'}
            {result.skillLevel === 'intermediate' && 'You have a solid foundation. Your roadmap will push you to advanced concepts and real projects. By Day 30 you will be interview ready.'}
            {result.skillLevel === 'advanced' && 'You already know a lot. Your roadmap will focus on advanced concepts, system design, and project depth. By Day 30 you will be in the top 10% of engineers on GENOIS.'}
          </div>
        </div>

        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 12 }}>YOUR BASELINE SCORE</div>
          <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.7 }}>
            This is your Day 0 score: <span style={{ color, fontWeight: 700 }}>{result.score}%</span>.<br />
            After 30 days of GENOIS we will compare this to your Day 30 score.<br />
            The difference is your <span style={{ color: 'var(--gx-success)', fontWeight: 600 }}>measurable skill lift</span>.
          </div>
        </div>

        <button onClick={() => router.push('/roadmap')} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>
          Start Day 1 — Let us Go 🚀
        </button>
      </div>
    );
  }

  if (phase === 'test' && q) {
    const letters = ['A', 'B', 'C', 'D'];
    const diffColors = { easy: 'var(--gx-success)', medium: 'var(--gx-warning)', hard: 'var(--gx-danger)' };

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gx-text-muted)' }}>
            Question {currentQ + 1} of {questions.length}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `color-mix(in srgb, ${diffColors[q.difficulty]} 8%, transparent)`, color: diffColors[q.difficulty], fontFamily: 'var(--font-mono)' }}>
              {q.difficulty?.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-surface)', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {q.points} pts
            </span>
          </div>
        </div>

        <div style={{ height: 4, background: 'var(--gx-surface)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'var(--gx-accent)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 10 }}>
            {q.topic?.toUpperCase()}
          </div>
          <div style={{ fontSize: 17, color: 'var(--gx-text)', lineHeight: 1.7, fontWeight: 500 }}>{q.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {(q.options || []).map((opt, oi) => {
            const isSelected = answers[currentQ] === opt;
            return (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1px solid ${isSelected ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`,
                background: isSelected ? 'var(--gx-accent-soft)' : 'var(--gx-surface)',
                color: isSelected ? 'var(--gx-accent)' : 'var(--gx-text)', fontSize: 14, transition: 'all 0.15s',
              }}>
                <span style={{ color: isSelected ? 'var(--gx-accent)' : 'var(--gx-text-muted)', marginRight: 10, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{letters[oi]}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && (
            <button onClick={() => setCurrentQ(q => q - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 }}>← Back</button>
          )}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => { if (!answers[currentQ]) { toast.error('Select an answer first'); return; } setCurrentQ(q => q + 1); }} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: answers[currentQ] ? 'var(--gx-accent)' : 'var(--gx-surface)', color: answers[currentQ] ? 'var(--gx-text-inverse)' : 'var(--gx-text-subtle)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              Next →
            </button>
          ) : (
            <button onClick={submitTest} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: submitting ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Calculating...' : 'Submit Test →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12 }}>
          Baseline Diagnostic Test
        </h1>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 15, lineHeight: 1.8, marginBottom: 8 }}>
          Before you start your 30-day journey we need to know where you stand today.
        </p>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 15, lineHeight: 1.8 }}>
          This score becomes your <span style={{ color: 'var(--gx-accent)', fontWeight: 600 }}>Day 0 baseline</span>. After 30 days we compare it to show your exact skill lift.
        </p>
      </div>

      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 28, textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 16 }}>WHAT TO EXPECT</div>
        {[
          { icon: '📝', text: '15 questions on your chosen domain' },
          { icon: '⏱️', text: 'Takes about 10-15 minutes' },
          { icon: '🎯', text: 'Mix of easy, medium and hard questions' },
          { icon: '📊', text: 'No wrong answers — honest score helps us personalize your roadmap' },
          { icon: '🔒', text: 'One attempt only — your baseline is permanent' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--gx-text)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      <button onClick={startTest} disabled={generating} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: generating ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, marginBottom: 12, boxShadow: 'var(--gx-shadow-sm)' }}>
        {generating ? 'Generating your questions...' : 'Start Diagnostic Test →'}
      </button>
      <p style={{ color: 'var(--gx-text-subtle)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        One attempt only · Results saved permanently · Used to track your progress
      </p>
    </div>
  );
}
