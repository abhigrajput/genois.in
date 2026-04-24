'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function DuelPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const params = useParams();
  const duelId = params.id;

  const [duel, setDuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [polling, setPolling] = useState(false);

  const loadDuel = useCallback(async () => {
    if (!token) return;
    try {
      const r = await apiFetch(`/api/duels/${duelId}`, token);
      setDuel(r.data);
    } catch {}
  }, [token, duelId]);

  useEffect(() => {
    if (!ready || !token) return;
    loadDuel().then(() => setLoading(false));
  }, [ready, token, loadDuel]);

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) { nextQuestion(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, started, finished]);

  useEffect(() => {
    if (!duel?.iFinished && !finished) return;
    if (duel?.theyFinished) return;
    const interval = setInterval(async () => {
      const r = await apiFetch(`/api/duels/${duelId}`, token);
      if (r.data?.theyFinished || r.data?.duel?.status === 'completed') {
        setDuel(r.data);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [finished, duel?.iFinished]);

  function startDuel() {
    setStarted(true);
    setStartTime(Date.now());
    setTimeLeft(30);
  }

  function selectAnswer(opt) {
    if (selected !== null) return;
    setSelected(opt);
  }

  function nextQuestion() {
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 30;
    const q = duel.duel.questions[currentQ];
    const newAnswers = [...answers, { answer: selected, timeTaken, questionIndex: currentQ }];
    setAnswers(newAnswers);
    setSelected(null);
    setStartTime(Date.now());

    if (currentQ + 1 >= duel.duel.questions.length) {
      submitAnswers(newAnswers);
    } else {
      setCurrentQ(p => p + 1);
      setTimeLeft(30);
    }
  }

  async function submitAnswers(finalAnswers) {
    setSubmitting(true);
    try {
      const r = await apiFetch(`/api/duels/${duelId}`, token, 'POST', {
        action: 'submit',
        answers: finalAnswers,
      });
      setResult(r.data);
      setFinished(true);
      await loadDuel();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading duel...
    </div>
  );

  if (!duel) return (
    <div style={{ color: '#ff2d78', padding: 60, textAlign: 'center' }}>Duel not found.</div>
  );

  const questions = duel.duel?.questions || [];
  const q = questions[currentQ];

  // Show results
  if (finished || duel.iFinished) {
    const won = duel.duel?.winner_id === (duel.isChallenger ? duel.duel?.challenger_id : duel.duel?.opponent_id);
    const isDraw = !duel.duel?.winner_id && duel.duel?.status === 'completed';
    const waitingForOpponent = !duel.theyFinished && duel.duel?.status !== 'completed';

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif', textAlign: 'center', paddingTop: 40 }}>
        {waitingForOpponent ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
              Waiting for {duel.opponentName}...
            </h2>
            <p style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 24 }}>
              You scored {result?.scorePoints || duel.myScore} pts. Results will show when they finish.
            </p>
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#00f0ff', fontFamily: 'Syne,sans-serif' }}>
                {result?.scorePoints || duel.myScore}
              </div>
              <div style={{ color: '#5a7a9a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>YOUR SCORE</div>
            </div>
            <div style={{ color: '#3a4a5a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', animation: 'pulse 2s infinite' }}>
              Checking every 3 seconds...
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {isDraw ? '🤝' : won ? '🏆' : '😤'}
            </div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: isDraw ? '#EF9F27' : won ? '#1D9E75' : '#ff2d78', marginBottom: 8 }}>
              {isDraw ? 'Draw!' : won ? 'You Won!' : 'You Lost!'}
            </h2>
            {won && <p style={{ color: '#1D9E75', fontSize: 14, marginBottom: 16 }}>+50 points added to your GENOIS score!</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>YOUR SCORE</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#00f0ff' }}>{duel.myScore}</div>
              </div>
              <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>{duel.opponentName}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#ff2d78' }}>{duel.theirScore}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/duels')} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
                Back to Duels
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText(`I just ${won ? 'won' : 'had'} a duel on GENOIS! Score: ${duel.myScore} vs ${duel.theirScore}. genois.in/duels`);
                toast.success('Copied!');
              }} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25D366', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>
                Share Result
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Pre-start screen
  if (!started) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif', textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚔️</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
          Duel vs {duel.opponentName}
        </h2>
        <p style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 8 }}>{duel.opponentCollege}</p>
        <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 14, padding: 24, marginBottom: 28, textAlign: 'left' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 12 }}>DUEL RULES</div>
          {['10 questions from your domain', '30 seconds per question', '10 points per correct answer', 'Winner gets +50 GENOIS points', 'No going back to previous questions'].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 13, color: '#c8d8e8' }}>
              <span style={{ color: '#ff2d78', flexShrink: 0 }}>•</span> {r}
            </div>
          ))}
        </div>
        <button onClick={startDuel} style={{ padding: '16px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ff2d78,#EF9F27)', color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, boxShadow: '0 0 30px rgba(255,45,120,0.3)' }}>
          Start Duel ⚔️
        </button>
      </div>
    );
  }

  // Question screen
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#5a7a9a' }}>
          Question {currentQ + 1} of {questions.length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${timeLeft <= 10 ? '#ff2d78' : '#00f0ff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: timeLeft <= 10 ? '#ff2d78' : '#00f0ff' }}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24 }}>
        <div style={{ height: '100%', width: `${((currentQ) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#ff2d78,#EF9F27)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, color: '#e8f4ff', lineHeight: 1.6, fontWeight: 500 }}>
          {q?.question}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {(q?.options || []).map((opt, i) => {
          const letters = ['A', 'B', 'C', 'D'];
          const isSelected = selected === opt;
          return (
            <button key={i} onClick={() => selectAnswer(opt)} style={{
              padding: '14px 20px', borderRadius: 12, cursor: selected ? 'default' : 'pointer',
              border: `2px solid ${isSelected ? '#00f0ff' : 'rgba(0,240,255,0.08)'}`,
              background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.02)',
              color: isSelected ? '#00f0ff' : '#c8d8e8',
              textAlign: 'left', fontSize: 14, fontFamily: 'Outfit,sans-serif',
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: isSelected ? '#00f0ff' : '#5a7a9a', flexShrink: 0, width: 20, textAlign: 'center' }}>{letters[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      <button onClick={nextQuestion} disabled={!selected || submitting} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
        cursor: selected ? 'pointer' : 'not-allowed',
        background: selected ? 'linear-gradient(135deg,#ff2d78,#EF9F27)' : 'rgba(255,255,255,0.05)',
        color: selected ? '#fff' : '#3a4a5a',
        fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700,
      }}>
        {submitting ? 'Submitting...' : currentQ + 1 === questions.length ? 'Submit Answers ⚔️' : 'Next Question →'}
      </button>
    </div>
  );
}
