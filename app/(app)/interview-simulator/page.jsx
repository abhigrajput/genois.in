'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';

export default function InterviewSimulatorPage() {
  const { token, ready } = useToken();
  const { userPlan } = usePermission();
  const [phase, setPhase] = useState('select');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [session, setSession] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [roundConfig, setRoundConfig] = useState(null);
  const [companyConfig, setCompanyConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [roundResult, setRoundResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    try {
      const r = await apiFetch('/api/interview', token);
      setData(r.data);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function startInterview() {
    if (!selectedType || !selectedCompany) { toast.error('Pick company type and name'); return; }
    setPhase('loading');
    try {
      const r = await apiFetch('/api/interview', token, 'POST', {
        companyType: selectedType,
        companyName: selectedCompany,
        role: 'Software Engineer',
      });
      setSession(r.data.session);
      await loadRound(r.data.session.id);
    } catch (e) { toast.error(e.message); setPhase('select'); }
  }

  async function loadRound(sessionId) {
    setPhase('loading');
    try {
      const r = await apiFetch(`/api/interview/round?sessionId=${sessionId}`, token);
      setCurrentRound(r.data.round);
      setRoundIndex(r.data.roundIndex);
      setTotalRounds(r.data.totalRounds);
      setRoundConfig(r.data.roundConfig);
      setCompanyConfig(r.data.companyConfig);
      setAnswers({});
      setCurrentQ(0);
      setRoundResult(null);
      setPhase('round');
    } catch (e) { toast.error(e.message); setPhase('select'); }
  }

  async function submitRound() {
    setSubmitting(true);
    try {
      const r = await apiFetch('/api/interview/round', token, 'POST', {
        sessionId: session.id,
        roundIndex,
        answers,
      });
      setRoundResult(r.data.evaluation);
      if (r.data.isLastRound) {
        setFinalResult(r.data.overallFeedback);
        setPhase('final');
      } else {
        setPhase('round_result');
      }
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  async function nextRound() {
    await loadRound(session.id);
  }

  if (loading) return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading...</div>;

  if (phase === 'loading') return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
      <div style={{ fontSize: 16, color: '#e8f4ff', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>Preparing your interview...</div>
      <div style={{ fontSize: 13, marginTop: 8 }}>AI is generating realistic questions</div>
    </div>
  );

  if (phase === 'final' && finalResult) {
    const isPass = finalResult.verdict === 'SELECTED';
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

        <div style={{ background: `linear-gradient(135deg,${isPass ? 'rgba(29,158,117,0.1)' : 'rgba(255,45,120,0.08)'},transparent)`, border: `2px solid ${isPass ? 'rgba(29,158,117,0.3)' : 'rgba(255,45,120,0.2)'}`, borderRadius: 16, padding: 32, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${isPass ? '#1D9E75' : '#ff2d78'},transparent)` }} />
          <div style={{ fontSize: 72, marginBottom: 12 }}>{isPass ? '🎉' : '😔'}</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: isPass ? '#1D9E75' : '#ff2d78', marginBottom: 8 }}>
            {isPass ? 'YOU ARE SELECTED' : 'NOT SELECTED'}
          </div>
          <div style={{ fontSize: 15, color: '#8a9ab0' }}>{selectedCompany} · {roundConfig?.label}</div>
          <div style={{ marginTop: 16, display: 'inline-block', padding: '10px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: isPass ? '#1D9E75' : '#ff2d78' }}>{finalResult.overallScore}%</span>
            <span style={{ fontSize: 12, color: '#5a7a9a', marginLeft: 6, fontFamily: 'JetBrains Mono,monospace' }}>overall</span>
          </div>
          {isPass && <div style={{ marginTop: 14, fontSize: 13, color: '#1D9E75', fontFamily: 'JetBrains Mono,monospace' }}>+100 GENOIS points earned</div>}
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>ROUND BREAKDOWN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {finalResult.roundBreakdown?.map((r, i) => {
              const color = r.score >= 70 ? '#1D9E75' : r.score >= 50 ? '#EF9F27' : '#ff2d78';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#e8f4ff', fontWeight: 600, flex: 1 }}>{r.round}</div>
                  <div style={{ flex: 2, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.score}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color, width: 50, textAlign: 'right' }}>{r.score}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 16 }}>
          {finalResult.topStrengths?.length > 0 && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 10 }}>✓ STRENGTHS</div>
              {finalResult.topStrengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>• {s}</div>)}
            </div>
          )}
          {finalResult.topWeaknesses?.length > 0 && (
            <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 10 }}>✗ IMPROVE</div>
              {finalResult.topWeaknesses.map((s, i) => <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>• {s}</div>)}
            </div>
          )}
        </div>

        {finalResult.actionItems?.length > 0 && (
          <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.15)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>ACTION ITEMS — WORK ON THESE</div>
            {finalResult.actionItems.map((a, i) => (
              <div key={i} style={{ padding: '8px 12px', marginBottom: 6, background: 'rgba(239,159,39,0.04)', borderRadius: 8, fontSize: 13, color: '#c8d8e8' }}>{i + 1}. {a}</div>
            ))}
          </div>
        )}

        <button onClick={() => { setPhase('select'); setSession(null); setFinalResult(null); setSelectedCompany(null); setSelectedType(null); loadData(); }} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
          Take Another Interview →
        </button>
      </div>
    );
  }

  if (phase === 'round_result' && roundResult) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{roundConfig?.icon}</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>{roundConfig?.label} Complete</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 42, fontWeight: 800, color: roundResult.roundScore >= 70 ? '#1D9E75' : roundResult.roundScore >= 50 ? '#EF9F27' : '#ff2d78', lineHeight: 1, marginBottom: 10 }}>{roundResult.roundScore}%</div>
          <div style={{ fontSize: 13, color: '#5a7a9a' }}>Round {roundIndex + 1} of {totalRounds}</div>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 10 }}>INTERVIEWER FEEDBACK</div>
          <div style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.7 }}>{roundResult.detailedFeedback}</div>
        </div>

        {(roundResult.strengths?.length > 0 || roundResult.weaknesses?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginBottom: 20 }}>
            {roundResult.strengths?.length > 0 && (
              <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#1D9E75', marginBottom: 8, fontFamily: 'JetBrains Mono,monospace' }}>WHAT WORKED</div>
                {roundResult.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: '#c8d8e8', padding: '3px 0' }}>• {s}</div>)}
              </div>
            )}
            {roundResult.weaknesses?.length > 0 && (
              <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.15)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#ff2d78', marginBottom: 8, fontFamily: 'JetBrains Mono,monospace' }}>WHAT DID NOT</div>
                {roundResult.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 12, color: '#c8d8e8', padding: '3px 0' }}>• {s}</div>)}
              </div>
            )}
          </div>
        )}

        <button onClick={nextRound} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
          Continue to Round {roundIndex + 2} →
        </button>
      </div>
    );
  }

  if (phase === 'round' && currentRound) {
    const questions = currentRound.questions || [];
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const isTextAnswer = currentRound.type === 'hr' || currentRound.type === 'system_design' || currentRound.type.includes('coding') || currentRound.type === 'project_deep_dive' || currentRound.type === 'technical_practical' || currentRound.type === 'technical_deep';

    return (
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

        <div style={{ background: `linear-gradient(135deg,${companyConfig?.color}10,transparent)`, border: `1px solid ${companyConfig?.color}25`, borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 4 }}>
              {selectedCompany} · INTERVIEW SIMULATION
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: companyConfig?.color }}>
              {roundConfig?.icon} {roundConfig?.label}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            Round {roundIndex + 1}/{totalRounds}
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: `linear-gradient(90deg,${companyConfig?.color},#7b5cff)`, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>

        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12 }}>
          QUESTION {currentQ + 1} OF {questions.length}
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 16, color: '#e8f4ff', lineHeight: 1.75, fontWeight: 500 }}>{q?.question}</div>
          {q?.constraints && <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,240,255,0.04)', borderRadius: 8, fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Constraints: {q.constraints}</div>}
          {q?.hints?.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#5a7a9a' }}>💡 Hints available if needed</div>
          )}
        </div>

        {isTextAnswer ? (
          <textarea value={answers[currentQ] || ''} onChange={e => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))} rows={8} placeholder="Type your answer here. Be specific. Think out loud. Show your approach." style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.12)', background: '#050d1a', color: '#e8f4ff', fontSize: 14, fontFamily: 'Outfit,sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, marginBottom: 16 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {(q?.options || []).map((opt, oi) => {
              const letters = ['A', 'B', 'C', 'D'];
              const isSelected = answers[currentQ] === opt;
              return (
                <button key={oi} onClick={() => setAnswers(p => ({ ...p, [currentQ]: opt }))} style={{ padding: '13px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${isSelected ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.01)', color: isSelected ? '#00f0ff' : '#c8d8e8', fontSize: 14 }}>
                  <span style={{ marginRight: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{letters[oi]}.</span>{opt}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {currentQ > 0 && <button onClick={() => setCurrentQ(c => c - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>← Prev</button>}
          {currentQ < questions.length - 1 ? (
            <button onClick={() => setCurrentQ(c => c + 1)} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>Next Question →</button>
          ) : (
            <button onClick={submitRound} disabled={submitting} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              {submitting ? 'Interviewer evaluating...' : `Submit Round (${answeredCount}/${questions.length}) →`}
            </button>
          )}
        </div>
      </div>
    );
  }

  const types = data?.companyTypes || {};

  return (
    <PermissionGate feature="interview_simulator">
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>🎯 Interview Simulator</h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Full company-style interviews with 4 rounds. AI asks real questions. Evaluates like a real interviewer. Gives detailed feedback.
        </p>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff', letterSpacing: 2, marginBottom: 14 }}>PICK COMPANY TYPE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 24 }}>
        {Object.entries(types).map(([key, c]) => {
          const selected = selectedType === key;
          return (
            <div key={key} onClick={() => { setSelectedType(key); setSelectedCompany(c.examples[0]); }} style={{ background: '#070f1f', border: `2px solid ${selected ? c.color + '50' : c.color + '15'}`, borderRadius: 14, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              {selected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c.color},transparent)` }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: c.color }}>{c.label}</div>
              </div>
              <div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.6, marginBottom: 10 }}>{c.focus}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.rounds.map((r, i) => <span key={i} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `${c.color}10`, color: c.color, fontFamily: 'JetBrains Mono,monospace' }}>{i + 1}. {r.replace('_', ' ')}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {selectedType && (
        <>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff', letterSpacing: 2, marginBottom: 14 }}>PICK SPECIFIC COMPANY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {types[selectedType].examples.map(c => (
              <button key={c} onClick={() => setSelectedCompany(c)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: selectedCompany === c ? types[selectedType].color : 'rgba(255,255,255,0.05)', color: selectedCompany === c ? '#020812' : '#5a7a9a', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={startInterview} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${types[selectedType].color},${types[selectedType].color}99)`, color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            Start {selectedCompany} Interview →
          </button>
        </>
      )}

      {data?.sessions?.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>YOUR PAST INTERVIEWS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.sessions.slice(0, 5).map((s, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e8f4ff', fontWeight: 600 }}>{s.company_name}</div>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{new Date(s.started_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.completed ? (
                    <>
                      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, color: s.verdict === 'SELECTED' ? '#1D9E75' : '#ff2d78' }}>{s.overall_score}%</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: s.verdict === 'SELECTED' ? 'rgba(29,158,117,0.1)' : 'rgba(255,45,120,0.1)', color: s.verdict === 'SELECTED' ? '#1D9E75' : '#ff2d78', fontFamily: 'JetBrains Mono,monospace' }}>{s.verdict}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace' }}>INCOMPLETE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PermissionGate>
  );
}
