'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';

export default function AptitudePage() {
  const { token, ready } = useToken();
  const { userPlan } = usePermission();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('list');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [level, setLevel] = useState(null);
  const [showPlacement, setShowPlacement] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    try {
      const r = await apiFetch('/api/aptitude', token);
      setData(r.data);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function startTopic(category, topic) {
    setActiveCategory(category);
    setActiveTopic(topic);
    setPhase('loading');
    try {
      const r = await apiFetch(`/api/aptitude/session?category=${category}&topic=${topic.slug}&difficulty=${level || 'medium'}`, token);
      setSession(r.data.session);
      setQuestions(r.data.questions);
      setAnswers({});
      setCurrentQ(0);
      setStartTime(Date.now());
      setResult(null);
      setPhase('test');
    } catch (e) { toast.error(e.message); setPhase('list'); }
  }

  async function submitSession() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/aptitude/session', token, 'POST', {
        sessionId: session.id,
        answers,
        timeTaken,
      });
      setResult(r.data);
      setPhase('result');
      loadData();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>Loading aptitude...</div>;

  if (phase === 'loading') return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <div style={{ fontSize: 16, color: '#e8f4ff', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>Generating 10 {activeTopic?.name} questions...</div>
    </div>
  );

  if (phase === 'result' && result) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ background: '#070f1f', border: `1px solid ${result.score >= 70 ? 'rgba(29,158,117,0.3)' : 'rgba(239,159,39,0.3)'}`, borderRadius: 14, padding: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{result.score >= 85 ? '🏆' : result.score >= 70 ? '✅' : '💪'}</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 48, fontWeight: 800, color: result.score >= 70 ? '#1D9E75' : '#EF9F27', lineHeight: 1, marginBottom: 6 }}>{result.score}%</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, color: '#e8f4ff', marginBottom: 8 }}>{result.correct}/{result.total} correct</div>
          {result.pointsEarned > 0 && (
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 20, background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>+{result.pointsEarned} pts earned</div>
          )}
        </div>

        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>ANSWER REVIEW</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.results.map((r, i) => (
            <div key={i} style={{ background: '#070f1f', border: `1px solid ${r.isCorrect ? 'rgba(29,158,117,0.15)' : 'rgba(255,45,120,0.15)'}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{r.isCorrect ? '✅' : '❌'}</span>
                <div style={{ fontSize: 13, color: '#c8d8e8', fontWeight: 500 }}>Q{i + 1}: {r.question}</div>
              </div>
              {!r.isCorrect && (
                <>
                  <div style={{ fontSize: 12, color: '#ff2d78', marginLeft: 22 }}>Your: {r.yourAnswer}</div>
                  <div style={{ fontSize: 12, color: '#1D9E75', marginLeft: 22, marginBottom: 6 }}>Correct: {r.correct}</div>
                  <div style={{ fontSize: 12, color: '#8a9ab0', marginLeft: 22, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, lineHeight: 1.6 }}>💡 {r.explanation}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => { setPhase('list'); setActiveTopic(null); setResult(null); }} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, marginTop: 20 }}>
          Back to Topics →
        </button>
      </div>
    );
  }

  if (phase === 'test' && questions.length > 0) {
    const q = questions[currentQ];
    const letters = ['A', 'B', 'C', 'D'];
    const answeredCount = Object.keys(answers).length;

    return (
      <div style={{ maxWidth: 740, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { if (confirm('Exit? Progress lost.')) setPhase('list'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a7a9a', fontSize: 18 }}>←</button>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff' }}>{activeTopic?.name}</div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Q{currentQ + 1}/{questions.length} · {answeredCount} answered</div>
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 16, color: '#e8f4ff', lineHeight: 1.75, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{q.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {(q.options || []).map((opt, oi) => {
            const isSelected = answers[currentQ] === opt;
            return (
              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{ padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.01)', color: isSelected ? '#00f0ff' : '#c8d8e8', fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: isSelected ? '#00f0ff' : '#5a7a9a', marginRight: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{letters[oi]}.</span>{opt}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && <button onClick={() => setCurrentQ(c => c - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Prev</button>}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(c => c + 1)} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>Next →</button>
          ) : (
            <button onClick={submitSession} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Scoring...' : `Submit ${answeredCount}/${questions.length} →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading...</div>;

  const { progress = {}, categories = {} } = data;

  return (
  <PermissionGate feature="aptitude_training">
  <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>🧠 Aptitude Training</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13 }}>Quant, Logical, Verbal. Crack TCS, Infosys, Wipro placement tests.</p>
    </div>

    {!level ? (
      <div style={{ background: 'linear-gradient(135deg,rgba(0,240,255,0.06),rgba(123,92,255,0.03))', border: '2px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
          Pick your aptitude level
        </div>
        <div style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>
          Questions will match your level.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {[
            { key: 'easy', label: '🌱 Basics', desc: 'Starting from zero', color: '#1D9E75' },
            { key: 'medium', label: '⚡ Intermediate', desc: 'Know basics well', color: '#EF9F27' },
            { key: 'hard', label: '🔥 Advanced', desc: 'Company-level', color: '#ff2d78' },
          ].map(l => (
            <button key={l.key} onClick={() => setLevel(l.key)} style={{ padding: '18px', borderRadius: 10, border: `1px solid ${l.color}30`, background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 6, color: l.color, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 12, color: '#5a7a9a' }}>{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            LEVEL: <span style={{ color: level === 'easy' ? '#1D9E75' : level === 'medium' ? '#EF9F27' : '#ff2d78', fontWeight: 700 }}>{level.toUpperCase()}</span>
          </div>
          <button onClick={() => setLevel(null)} style={{ background: 'transparent', border: 'none', color: '#00f0ff', cursor: 'pointer', fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            Change →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sessions', value: progress?.total_sessions ?? 0, color: '#00f0ff' },
            { label: 'Streak', value: '🔥' + (progress?.current_streak ?? 0), color: '#EF9F27' },
            { label: 'Best Quant', value: (progress?.quant_score ?? 0) + '%', color: '#1D9E75' },
            { label: 'Best Logical', value: (progress?.logical_score ?? 0) + '%', color: '#7b5cff' },
            { label: 'Best Verbal', value: (progress?.verbal_score ?? 0) + '%', color: '#EF9F27' },
          ].map(s => (
            <div key={s.label} style={{ background: '#070f1f', border: `1px solid ${s.color}15`, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#5a7a9a', marginTop: 4, fontFamily: 'JetBrains Mono,monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(categories).map(([slug, cat]) => (
          <div key={slug} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>{cat.description}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {cat.topics.map(topic => (
                <div key={topic.slug} onClick={() => startTopic(slug, topic)} style={{ background: '#070f1f', border: `1px solid ${cat.color}15`, borderRadius: 10, padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: '#e8f4ff' }}>{topic.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>10 Q · Start →</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    )}
  </div>
  </PermissionGate>
);
}
