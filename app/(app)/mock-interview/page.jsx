'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const VERDICT_COLORS = {
  Strong: '#1D9E75',
  Good: '#00f0ff',
  Weak: '#EF9F27',
  Poor: '#ff2d78',
};

export default function MockInterviewPage() {
  const { token, ready } = useToken();
  const [phase, setPhase] = useState('home');
  const [interview, setInterview] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(10);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/mock-interview', token)
      .then(r => setHistory(r.data?.interviews || []))
      .catch(() => {});
  }, [ready, token]);

  async function startInterview() {
    setLoading(true);
    try {
      const r = await apiFetch('/api/mock-interview', token, 'POST', { action: 'start' });
      setInterview(r.data.interview);
      setCurrentQ(r.data.firstQuestion);
      setCurrentQIndex(0);
      setTotalQuestions(r.data.interview.questions.length);
      setPhase('interview');
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  async function submitAnswer() {
    if (!answer.trim()) { toast.error('Write your answer first'); return; }
    if (answer.trim().length < 20) { toast.error('Answer too short. Elaborate more.'); return; }
    setLoading(true);
    try {
      const r = await apiFetch('/api/mock-interview', token, 'POST', {
        action: 'answer',
        interviewId: interview.id,
        answer: answer.trim(),
        questionIndex: currentQIndex,
      });
      setEvaluation(r.data.evaluation);
      setPhase('evaluation');
      if (r.data.isLast) {
        const updated = await apiFetch('/api/mock-interview', token);
        const done = (updated.data?.interviews || []).find(i => i.id === interview.id);
        if (done) setInterview(done);
        setHistory(updated.data?.interviews || []);
      } else {
        setCurrentQ(r.data.nextQuestion);
        setCurrentQIndex(r.data.questionIndex + 1);
      }
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  function nextQuestion() {
    setAnswer('');
    setEvaluation(null);
    if (currentQIndex >= totalQuestions - 1) {
      setPhase('results');
    } else {
      setPhase('interview');
    }
  }

  if (!ready) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>Loading...</div>
  );

  // RESULTS PAGE
  if (phase === 'results' && interview) {
    const evals = interview.evaluations || [];
    const avgScore = interview.overall_score || Math.round(evals.reduce((a, e) => a + (e.score || 0), 0) / (evals.length || 1));
    const readiness = interview.interview_readiness || avgScore * 10;

    return (
      <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>
            {readiness >= 70 ? '🏆' : readiness >= 50 ? '💪' : '📚'}
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
            Interview Complete
          </h1>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 48, fontWeight: 800, color: readiness >= 70 ? '#1D9E75' : readiness >= 50 ? '#00f0ff' : '#ff2d78', marginBottom: 4 }}>
            {readiness}%
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14 }}>Interview Readiness Score</div>
        </div>

        {interview.feedback && (
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 12 }}>OVERALL FEEDBACK</div>
            <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{interview.feedback}</p>
          </div>
        )}

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>QUESTION BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evals.map((e, i) => {
              const q = interview.questions[i];
              const color = VERDICT_COLORS[e.verdict] || '#5a7a9a';
              return (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}15` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#8a9ab0', flex: 1, marginRight: 12 }}>Q{i + 1}: {q?.question?.substring(0, 60)}...</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{e.verdict}</span>
                      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, color }}>{e.score}/10</span>
                    </div>
                  </div>
                  {e.tip && <div style={{ fontSize: 12, color: '#5a7a9a', fontStyle: 'italic' }}>💡 {e.tip}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setPhase('home'); setInterview(null); setAnswer(''); setEvaluation(null); setCurrentQIndex(0); }} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
            Practice Again
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(`Just completed a mock interview on GENOIS. Interview Readiness: ${readiness}%. Domain: ${interview.domain_slug?.toUpperCase()}. genois.in`);
            toast.success('Copied!');
          }} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25D366', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>
            Share Result
          </button>
        </div>
      </div>
    );
  }

  // EVALUATION PAGE
  if (phase === 'evaluation' && evaluation) {
    const color = VERDICT_COLORS[evaluation.verdict] || '#5a7a9a';
    const isLast = currentQIndex >= totalQuestions - 1;

    return (
      <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 48, fontWeight: 800, color, marginBottom: 4 }}>{evaluation.score}/10</div>
          <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, background: `${color}15`, color, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700 }}>
            {evaluation.verdict}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {evaluation.what_was_good && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 1, marginBottom: 8 }}>✓ WHAT WAS GOOD</div>
              <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{evaluation.what_was_good}</p>
            </div>
          )}
          {evaluation.what_was_missing && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 1, marginBottom: 8 }}>✗ WHAT WAS MISSING</div>
              <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{evaluation.what_was_missing}</p>
            </div>
          )}
          {evaluation.better_answer && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 1, marginBottom: 8 }}>💡 BETTER ANSWER</div>
              <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{evaluation.better_answer}</p>
            </div>
          )}
          {evaluation.tip && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(123,92,255,0.15)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 1, marginBottom: 8 }}>⚡ TIP FOR NEXT TIME</div>
              <p style={{ color: '#c8d8e8', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{evaluation.tip}</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#5a7a9a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', marginBottom: 16 }}>
            Question {currentQIndex} of {totalQuestions} complete
          </div>
          <button onClick={nextQuestion} style={{ padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            {isLast ? 'See Final Results →' : 'Next Question →'}
          </button>
        </div>
      </div>
    );
  }

  // INTERVIEW PAGE
  if (phase === 'interview' && currentQ) {
    const typeColors = { technical: '#00f0ff', conceptual: '#7b5cff', behavioral: '#1D9E75', situational: '#EF9F27', 'problem solving': '#D85A30' };
    const typeColor = typeColors[currentQ.type?.toLowerCase()] || '#5a7a9a';

    return (
      <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#5a7a9a' }}>
            Question {currentQIndex + 1} of {totalQuestions}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${typeColor}15`, color: typeColor, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase' }}>
              {currentQ.type}
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase' }}>
              {currentQ.difficulty}
            </span>
          </div>
        </div>

        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${(currentQIndex / totalQuestions) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 2 }} />
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12 }}>INTERVIEWER</div>
          <p style={{ fontSize: 17, color: '#e8f4ff', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
            {currentQ.question}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 10 }}>YOUR ANSWER</div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here. Speak as if you are in a real interview. Be specific, give examples, explain your thought process..."
            rows={6}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, fontFamily: 'Outfit,sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>{answer.length} chars</span>
            <span style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>Tip: {currentQ.hint}</span>
          </div>
        </div>

        <button onClick={submitAnswer} disabled={loading || answer.trim().length < 20} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: answer.trim().length >= 20 ? 'pointer' : 'not-allowed', background: answer.trim().length >= 20 ? 'linear-gradient(135deg,#00f0ff,#7b5cff)' : 'rgba(255,255,255,0.05)', color: answer.trim().length >= 20 ? '#020812' : '#3a4a5a', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
          {loading ? 'Evaluating your answer...' : 'Submit Answer →'}
        </button>
      </div>
    );
  }

  // HOME PAGE
  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          🎤 Mock Interview Coach
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          AI interviewer. Real questions. Honest feedback. No sugar coating.
        </p>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 16 }}>HOW IT WORKS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {[
            { step: '1', icon: '🎯', title: '10 real interview questions', desc: 'Generated specifically for your domain. Mix of technical, conceptual and behavioral questions.' },
            { step: '2', icon: '✍️', title: 'Answer each question in text', desc: 'Type your answer as if you are speaking in a real interview. Be detailed and give examples.' },
            { step: '3', icon: '🤖', title: 'AI evaluates every answer', desc: 'Claude rates each answer 0-10, tells you what was good, what was missing, and gives a better answer.' },
            { step: '4', icon: '📊', title: 'Get your Interview Readiness Score', desc: 'Final score out of 100% showing how ready you are for placement interviews right now.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f4ff', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#5a7a9a', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={startInterview} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: loading ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, boxShadow: '0 0 30px rgba(0,240,255,0.2)' }}>
          {loading ? 'Preparing your interview...' : 'Start Mock Interview →'}
        </button>
        <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', marginTop: 10 }}>
          Takes 15-20 minutes · 10 questions · Honest AI feedback
        </p>
      </div>

      {history.length > 0 && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 16 }}>PAST INTERVIEWS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.filter(i => i.status === 'completed').slice(0, 5).map((i, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8f4ff', fontWeight: 600, marginBottom: 2 }}>{i.domain_slug?.toUpperCase()} Interview</div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{new Date(i.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: i.interview_readiness >= 70 ? '#1D9E75' : i.interview_readiness >= 50 ? '#00f0ff' : '#ff2d78' }}>
                    {i.interview_readiness}%
                  </div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>readiness</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
