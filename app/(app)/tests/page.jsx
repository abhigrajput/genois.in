'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TestsPage() {
  const [token, setToken] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [topic, setTopic] = useState('');
  const [roadmapId, setRoadmapId] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [scheduleInfo, setScheduleInfo] = useState({ dayOfWeek: 0, date: 1, daysUntilMonday: 0, daysUntilFirst: 0 });

  useEffect(() => {
    const t = localStorage.getItem('genois_token');
    setToken(t);

    // Schedule info
    const now = new Date();
    const dow = now.getDay();
    const date = now.getDate();
    const daysUntilMonday = dow === 1 ? 0 : (8 - dow) % 7;
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilFirst = date === 1 ? 0 : Math.ceil((startOfNextMonth - now) / (1000 * 60 * 60 * 24));
    setScheduleInfo({ dayOfWeek: dow, date, daysUntilMonday, daysUntilFirst });

    if (!t) return;
    fetch('/api/roadmap/daily', { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json()).then(d => {
        setTopic(d.data?.roadmapItem?.topic || '');
        setRoadmapId(d.data?.roadmapItem?.id || null);
        setCurrentDay(d.data?.currentDay || 1);
      }).catch(() => {});
    fetch('/api/tests/history', { headers: { Authorization: 'Bearer ' + t } })
      .then(r => r.json()).then(d => setHistory(d.data?.tests || [])).catch(() => {});
  }, []);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (!test || result) return;
    let warnings = 0;
    function handleVisibilityChange() {
      if (document.hidden && test && !result) {
        warnings++;
        if (warnings === 1) {
          toast.error('⚠️ Warning 1/2: Do not switch tabs during test!');
        } else if (warnings === 2) {
          toast.error('⚠️ Warning 2/2: Final warning! Next tab switch will auto-submit.');
        } else if (warnings >= 3) {
          toast.error('🚫 Auto-submitted due to tab switching. Zero marks.');
          setResult({
            score: 0, correct: 0, total: test.questions?.length || 5,
            pointsEarned: 0, result: 'failed',
            feedback: test.questions?.map(() => ({ isCorrect: false, correctAnswer: 'N/A', explanation: 'Auto-submitted due to tab switching.' })) || [],
            autoSubmitted: true,
          });
          setTest(null);
          setActiveType(null);
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [test, result]);

  // Anti-cheat: copy-paste block
  useEffect(() => {
    if (!test || result) return;
    function blockCopy(e) { e.preventDefault(); toast.error('🚫 Copying is not allowed during tests'); }
    function blockPaste(e) { e.preventDefault(); toast.error('🚫 Pasting is not allowed during tests'); }
    document.addEventListener('copy', blockCopy);
    document.addEventListener('paste', blockPaste);
    return () => {
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('paste', blockPaste);
    };
  }, [test, result]);

  async function startTest(type) {
    if (!token) { toast.error('Please login'); return; }
    setActiveType(type);
    setLoading(true);
    setTest(null);
    setResult(null);
    setAnswers({});
    try {
      const urls = { daily: '/api/tests/daily/generate', weekly: '/api/tests/weekly/generate', monthly: '/api/tests/monthly/generate', revision: '/api/tests/revision/generate' };
      const body = type === 'daily' ? { roadmapId, dayNumber: currentDay } : {};
      const res = await fetch(urls[type], { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setTest(data.data);
      toast.success('Test ready!');
    } catch (err) {
      toast.error(err.message);
      setActiveType(null);
    } finally {
      setLoading(false);
    }
  }

  async function submitTest() {
    if (!test || !token) return;
    if (Object.keys(answers).length < test.questions.length) { toast.error('Answer all questions'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/tests/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ testId: test.testId, answers: test.questions.map((_, i) => ({ answer: answers[i] || '' })) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data.data);
      toast.success('Done!');
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  const C = { background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 24, marginBottom: 16 };

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>Tests</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 28 }}>{topic ? 'Today: ' + topic : 'Loading topic...'}</p>

      {/* Anti-cheat warning banner */}
      {test && !result && (
        <div style={{
          background: 'rgba(255,45,120,0.08)',
          border: '1px solid rgba(255,45,120,0.3)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 12, color: '#ff2d78', fontFamily: 'JetBrains Mono,monospace' }}>
            ANTI-CHEAT ACTIVE — Tab switching and copy-paste are monitored. 3 tab switches = auto zero.
          </span>
        </div>
      )}

      {!activeType && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            {
              id: 'daily', label: 'Daily Test', color: '#7F77DD',
              desc: '5 fresh questions · New every day · Available now',
              locked: false,
            },
            {
              id: 'weekly', label: 'Weekly Test', color: '#1D9E75',
              desc: scheduleInfo.dayOfWeek === 1
                ? '10 questions · Available today only (Monday)'
                : `10 questions · Unlocks on Monday · ${scheduleInfo.daysUntilMonday} day${scheduleInfo.daysUntilMonday !== 1 ? 's' : ''} away`,
              locked: scheduleInfo.dayOfWeek !== 1,
            },
            {
              id: 'monthly', label: 'Monthly Test', color: '#D85A30',
              desc: scheduleInfo.date === 1
                ? '20 questions · Available today only (1st of month)'
                : `20 questions · Unlocks on 1st · ${scheduleInfo.daysUntilFirst} day${scheduleInfo.daysUntilFirst !== 1 ? 's' : ''} away`,
              locked: scheduleInfo.date !== 1,
            },
            { id: 'revision', label: 'Revision Test', desc: 'Available anytime · Focus on your weak topics', color: '#D4537E', locked: false },
          ].map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 12, background: '#070f1f', boxShadow: 'inset 4px 0 0 ' + (t.locked ? '#3a4a5a' : t.color), border: '1px solid rgba(255,255,255,0.06)', opacity: t.locked ? 0.7 : 1 }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: t.locked ? '#5a7a9a' : '#e8f4ff', marginBottom: 3 }}>
                  {t.locked ? '🔒 ' : ''}{t.label}
                </div>
                <div style={{ fontSize: 12, color: '#5a7a9a' }}>{t.desc}</div>
              </div>
              {t.locked ? (
                <div style={{ padding: '11px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#3a4a5a', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, marginLeft: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                  Locked
                </div>
              ) : (
                <button onClick={() => startTest(t.id)} style={{ padding: '11px 26px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,' + t.color + ',#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, marginLeft: 16 }}>
                  Start →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ ...C, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 600 }}>Claude is generating your test...</div>
          <div style={{ color: '#5a7a9a', fontSize: 13, marginTop: 6 }}>Takes about 15 seconds</div>
        </div>
      )}

      {test && !result && !loading && (
        <div style={C}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#00f0ff', marginBottom: 20 }}>{test.topic} · {test.questions?.length} Questions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {(test.questions || []).map((q, i) => (
              <div key={i}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8f4ff', marginBottom: 10, lineHeight: 1.6 }}>Q{i + 1}. {q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(q.options || []).map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 8, cursor: 'pointer', background: answers[i] === opt[0] ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (answers[i] === opt[0] ? '#00f0ff' : 'rgba(255,255,255,0.06)') }}>
                      <input type="radio" name={'q' + i} value={opt[0]} checked={answers[i] === opt[0]} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} style={{ accentColor: '#00f0ff' }} />
                      <span style={{ color: '#e8f4ff', fontSize: 13 }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => { setTest(null); setActiveType(null); }} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13 }}>← Back</button>
            <button onClick={submitTest} style={{ flex: 1, padding: 13, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>Submit Test</button>
          </div>
        </div>
      )}

      {result && (
        <div style={C}>
          <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
            <div style={{ fontSize: 60, fontWeight: 800, fontFamily: 'Syne,sans-serif', color: result.score >= 60 ? '#1D9E75' : '#ff2d78' }}>{result.score}%</div>
            <div style={{ color: result.result === 'passed' ? '#1D9E75' : '#ff2d78', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{result.result === 'passed' ? '✅ Passed!' : '❌ Study more'}</div>
            <div style={{ color: '#5a7a9a', fontSize: 13, marginTop: 6 }}>{result.correct}/{result.total} correct · +{result.pointsEarned} pts</div>
            {result.autoSubmitted && <div style={{ fontSize: 12, color: '#ff2d78', marginTop: 6 }}>Auto-submitted due to tab switching</div>}
          </div>
          {(result.feedback || []).map((f, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 8, background: f.isCorrect ? 'rgba(29,158,117,0.08)' : 'rgba(255,45,120,0.08)', border: '1px solid ' + (f.isCorrect ? 'rgba(29,158,117,0.2)' : 'rgba(255,45,120,0.2)') }}>
              <div style={{ fontSize: 13, color: f.isCorrect ? '#1D9E75' : '#ff2d78', fontWeight: 500 }}>Q{i + 1}: {f.isCorrect ? '✓ Correct' : '✗ Correct: ' + f.correctAnswer}</div>
              {f.explanation && <div style={{ fontSize: 12, color: '#5a7a9a', marginTop: 3 }}>{f.explanation}</div>}
            </div>
          ))}
          <button onClick={() => { setTest(null); setResult(null); setAnswers({}); setActiveType(null); }} style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Take Another Test</button>
        </div>
      )}

      {history.length > 0 && !activeType && (
        <div style={C}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 14 }}>Past Tests</div>
          {history.slice(0, 8).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e8f4ff' }}>{t.topic}</div>
                <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 1 }}>{t.type} · {new Date(t.taken_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.result === 'passed' ? '#1D9E75' : '#ff2d78' }}>{Math.round(t.score)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
