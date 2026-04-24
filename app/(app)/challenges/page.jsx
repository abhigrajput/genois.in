'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ChallengesPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/challenges', token)
      .then(r => { setChallenges(r.data?.challenges || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function openChallenge(id) {
    try {
      const r = await apiFetch(`/api/challenges/${id}`, token);
      setChallengeData(r.data);
      setActiveChallenge(id);
      setAnswers({});
      setSubmitted(false);
      setResult(null);
    } catch (e) { toast.error(e.message); }
  }

  async function submitChallenge() {
    const questions = challengeData?.challenge?.questions || [];
    if (Object.keys(answers).length < questions.length) {
      toast.error('Answer all questions before submitting'); return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch(`/api/challenges/${activeChallenge}`, token, 'POST', { answers });
      setResult(r.data);
      setSubmitted(true);
      toast.success(`Score: ${r.data.score}% — Rank #${r.data.rank}`);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  const DIFF_COLORS = { easy: '#1D9E75', medium: '#EF9F27', hard: '#ff2d78' };

  if (activeChallenge && challengeData) {
    const challenge = challengeData.challenge;
    const questions = challenge.questions || [];

    return (
      <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setActiveChallenge(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00f0ff', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#e8f4ff', margin: 0, marginBottom: 2 }}>{challenge.title}</h1>
            <div style={{ fontSize: 12, color: '#5a7a9a' }}>{challenge.companyName} · {questions.length} questions</div>
          </div>
        </div>

        {submitted && result ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{result.score >= 80 ? '🏆' : result.score >= 60 ? '💪' : '📚'}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 52, fontWeight: 800, color: result.score >= 80 ? '#1D9E75' : result.score >= 60 ? '#00f0ff' : '#ff2d78', marginBottom: 8 }}>
              {result.score}%
            </div>
            <div style={{ fontSize: 15, color: '#5a7a9a', marginBottom: 12 }}>Your Score</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: '#EF9F27', marginBottom: 28 }}>
              Rank #{result.rank} of {result.totalAttempts} students
            </div>
            {result.score >= 80 && (
              <div style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: '#1D9E75', maxWidth: 420, margin: '0 auto 24px' }}>
                🎉 You scored 80%+! +50 GENOIS points awarded. The company may reach out!
              </div>
            )}
            <button onClick={() => setActiveChallenge(null)} style={{ padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              Back to Challenges →
            </button>
          </div>
        ) : challengeData.myAttempt ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: '#1D9E75', marginBottom: 8 }}>Already Attempted</div>
            <div style={{ color: '#5a7a9a', fontSize: 14 }}>Your score: {challengeData.myAttempt.score}% · Rank #{challengeData.myRank}</div>
          </div>
        ) : (
          <div>
            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#8a9ab0', lineHeight: 1.7 }}>{challenge.description}</div>
            </div>

            {questions.map((q, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4ff', marginBottom: 12 }}>
                  Q{i + 1}. {q.question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(q.options || []).map((opt, oi) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = answers[i] === opt;
                    return (
                      <button key={oi} onClick={() => setAnswers(p => ({ ...p, [i]: opt }))} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,240,255,0.06)' : 'transparent', color: isSelected ? '#00f0ff' : '#c8d8e8', fontSize: 13 }}>
                        <span style={{ color: '#5a7a9a', marginRight: 8, fontFamily: 'JetBrains Mono,monospace' }}>{letters[oi]}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
                  {q.points || 20} points
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 12, fontSize: 13, color: '#5a7a9a', textAlign: 'center' }}>
              {Object.keys(answers).length}/{questions.length} answered
            </div>
            <button onClick={submitChallenge} disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: submitting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
              {submitting ? 'Submitting...' : `Submit Challenge →`}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          🏢 Company Challenges
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Real challenges from companies hiring on GENOIS. Score 80%+ to get noticed and earn +50 pts.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>No challenges yet</div>
          <div style={{ color: '#5a7a9a', fontSize: 14 }}>Companies will post challenges here soon. Check back daily.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {challenges.map((c, i) => (
            <div key={i} style={{ background: '#070f1f', border: `1px solid ${c.myAttempt ? 'rgba(29,158,117,0.2)' : 'rgba(0,240,255,0.08)'}`, borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
              {c.myAttempt && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#1D9E75,transparent)' }} />}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff' }}>{c.title}</div>
                    {c.myAttempt && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontFamily: 'JetBrains Mono,monospace' }}>✓ ATTEMPTED</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 10 }}>{c.companyName} · {c.companyLocation}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,240,255,0.06)', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace' }}>{c.domain?.toUpperCase()}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${DIFF_COLORS[c.difficulty] || '#EF9F27'}15`, color: DIFF_COLORS[c.difficulty] || '#EF9F27', fontFamily: 'JetBrains Mono,monospace' }}>{c.difficulty?.toUpperCase()}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{c.questions?.length || 5} QUESTIONS</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {c.myAttempt ? (
                    <div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#1D9E75' }}>{c.myAttempt.score}%</div>
                      <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>your score</div>
                    </div>
                  ) : (
                    <button onClick={() => openChallenge(c.id)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                      Attempt →
                    </button>
                  )}
                </div>
              </div>
              {c.deadline && (
                <div style={{ marginTop: 10, fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
                  Deadline: {new Date(c.deadline).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
