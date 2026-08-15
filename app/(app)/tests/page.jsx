'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useToken, authHeaders } from '@/lib/useApi';

export default function TestsPage() {
  // Was an inline copy of useToken() that read localStorage directly. That left
  // cookie-authenticated users sending `Bearer null` (rejected by extractToken),
  // so the topic never resolved. Use the shared hook instead.
  const { token } = useToken();
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
  const [submitEligible, setSubmitEligible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // Schedule info — no auth needed, so keep it off the token-dependent effect.
    const now = new Date();
    const dow = now.getDay();
    const date = now.getDate();
    const daysUntilMonday = dow === 1 ? 0 : (8 - dow) % 7;
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilFirst = date === 1 ? 0 : Math.ceil((startOfNextMonth - now) / (1000 * 60 * 60 * 24));
    setScheduleInfo({ dayOfWeek: dow, date, daysUntilMonday, daysUntilFirst });
  }, []);

  useEffect(() => {
    if (!token) return;
    const headers = authHeaders(token);
    fetch('/api/roadmap/daily', { headers })
      .then(r => r.json()).then(d => {
        setTopic(d.data?.roadmapItem?.topic || '');
        setRoadmapId(d.data?.roadmapItem?.id || null);
        setCurrentDay(d.data?.currentDay || 1);
      }).catch(() => {});
    fetch('/api/tests/history', { headers })
      .then(r => r.json()).then(d => setHistory(d.data?.tests || [])).catch(() => {});
  }, [token]);

  // 30-second read gate: counts down from 30 whenever a test loads, resets on new test
  useEffect(() => {
    if (!test || result) { setSubmitEligible(false); setTimeLeft(30); return; }
    setSubmitEligible(false);
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setSubmitEligible(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, result]);

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
      const res = await fetch(urls[type], { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(body) });
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
      const res = await fetch('/api/tests/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify({ testId: test.testId, answers: test.questions.map((_, i) => ({ answer: answers[i] || '' })) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data.data);
      toast.success('Done!');
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  }

  const C = { background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 16 };

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>Tests</h1>
      <p style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginBottom: 28 }}>{topic ? 'Today: ' + topic : 'Loading topic...'}</p>

      {/* Anti-cheat warning banner */}
      {test && !result && (
        <div style={{
          background: 'var(--gx-danger-soft)',
          border: '1px solid var(--gx-danger-border)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 12, color: 'var(--gx-danger)', fontFamily: 'var(--font-mono)' }}>
            ANTI-CHEAT ACTIVE — Tab switching and copy-paste are monitored. 3 tab switches = auto zero.
          </span>
        </div>
      )}

      {!activeType && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            {
              id: 'daily', label: 'Daily Test', color: 'var(--gx-info)',
              desc: '5 fresh questions · New every day · Available now',
              locked: false,
            },
            {
              id: 'weekly', label: 'Weekly Test', color: 'var(--gx-success)',
              desc: scheduleInfo.dayOfWeek === 1
                ? '10 questions · Available today only (Monday)'
                : `10 questions · Unlocks on Monday · ${scheduleInfo.daysUntilMonday} day${scheduleInfo.daysUntilMonday !== 1 ? 's' : ''} away`,
              locked: scheduleInfo.dayOfWeek !== 1,
            },
            {
              id: 'monthly', label: 'Monthly Test', color: 'var(--gx-warning)',
              desc: scheduleInfo.date === 1
                ? '20 questions · Available today only (1st of month)'
                : `20 questions · Unlocks on 1st · ${scheduleInfo.daysUntilFirst} day${scheduleInfo.daysUntilFirst !== 1 ? 's' : ''} away`,
              locked: scheduleInfo.date !== 1,
            },
            { id: 'revision', label: 'Revision Test', desc: 'Available anytime · Focus on your weak topics', color: 'var(--gx-danger)', locked: false },
          ].map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 12, background: 'var(--gx-bg)', boxShadow: 'inset 4px 0 0 ' + (t.locked ? 'var(--gx-shadow-sm)' : t.color), border: '1px solid var(--gx-border)', opacity: t.locked ? 0.7 : 1 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: t.locked ? 'var(--gx-text-muted)' : 'var(--gx-text)', marginBottom: 3 }}>
                  {t.locked ? '🔒 ' : ''}{t.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>{t.desc}</div>
              </div>
              {t.locked ? (
                <div style={{ padding: '11px 20px', borderRadius: 8, background: 'var(--gx-surface)', color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, marginLeft: 16, border: '1px solid var(--gx-border)' }}>
                  Locked
                </div>
              ) : (
                <button onClick={() => startTest(t.id)} style={{ padding: '11px 26px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '' + t.color + '', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginLeft: 16 }}>
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
          <div style={{ color: 'var(--gx-accent)', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600 }}>GENOIS Engine is generating your test...</div>
          <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginTop: 6 }}>Takes about 15 seconds</div>
        </div>
      )}

      {test && !result && !loading && (
        <div style={C}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--gx-accent)', marginBottom: 20 }}>{test.topic} · {test.questions?.length} Questions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {(test.questions || []).map((q, i) => (
              <div key={i}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gx-text)', marginBottom: 10, lineHeight: 1.6 }}>Q{i + 1}. {q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(q.options || []).map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 8, cursor: 'pointer', background: answers[i] === opt[0] ? 'var(--gx-accent-soft)' : 'var(--gx-surface)', border: '1px solid ' + (answers[i] === opt[0] ? 'var(--gx-accent)' : 'var(--gx-border)') }}>
                      <input type="radio" name={'q' + i} value={opt[0]} checked={answers[i] === opt[0]} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} style={{ accentColor: 'var(--gx-accent)' }} />
                      <span style={{ color: 'var(--gx-text)', fontSize: 13 }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => { setTest(null); setActiveType(null); }} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>← Back</button>
            <button
              onClick={() => submitEligible && submitTest()}
              disabled={!submitEligible}
              style={{
                flex: 1, padding: 13, borderRadius: 8, border: 'none',
                cursor: submitEligible ? 'pointer' : 'not-allowed',
                background: submitEligible ? 'var(--gx-accent)' : 'var(--gx-surface)',
                color: submitEligible ? 'var(--gx-text-inverse)' : 'var(--gx-text-subtle)',
                fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
                transition: 'all 0.4s ease',
              }}>
              {submitEligible ? 'Submit Test' : `⏳ Read for ${timeLeft}s before submitting`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div style={C}>
          <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
            <div style={{ fontSize: 60, fontWeight: 800, fontFamily: 'var(--font-heading)', color: result.score >= 60 ? 'var(--gx-success)' : 'var(--gx-danger)' }}>{result.score}%</div>
            <div style={{ color: result.result === 'passed' ? 'var(--gx-success)' : 'var(--gx-danger)', fontSize: 16, fontWeight: 600, marginTop: 4 }}>{result.result === 'passed' ? '✅ Passed!' : '❌ Study more'}</div>
            <div style={{ color: 'var(--gx-text-muted)', fontSize: 13, marginTop: 6 }}>{result.correct}/{result.total} correct · +{result.pointsEarned} pts</div>
            {result.autoSubmitted && <div style={{ fontSize: 12, color: 'var(--gx-danger)', marginTop: 6 }}>Auto-submitted due to tab switching</div>}
          </div>
          {(result.feedback || []).map((f, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 8, background: f.isCorrect ? 'var(--gx-success-soft)' : 'var(--gx-danger-soft)', border: '1px solid ' + (f.isCorrect ? 'var(--gx-success-border)' : 'var(--gx-danger-border)') }}>
              <div style={{ fontSize: 13, color: f.isCorrect ? 'var(--gx-success)' : 'var(--gx-danger)', fontWeight: 500 }}>Q{i + 1}: {f.isCorrect ? '✓ Correct' : '✗ Correct: ' + f.correctAnswer}</div>
              {f.explanation && <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginTop: 3 }}>{f.explanation}</div>}
            </div>
          ))}
          {result.attemptId && (
            <a href={`/review/${result.attemptId}`} style={{ display: 'block', textAlign: 'center', marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--gx-accent-border)' }}>
              📋 Full answer review (questions, your picks &amp; explanations) →
            </a>
          )}
          <button onClick={() => { setTest(null); setResult(null); setAnswers({}); setActiveType(null); }} style={{ marginTop: 12, width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'transparent', color: 'var(--gx-accent)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Take Another Test</button>
        </div>
      )}

      {history.length > 0 && !activeType && (
        <div style={C}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--gx-text)' }}>Past Tests</div>
            <a href="/review" style={{ color: 'var(--gx-accent)', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600, textDecoration: 'none' }}>📋 Answer reviews →</a>
          </div>
          {history.slice(0, 8).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gx-border)' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{t.topic}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 1 }}>{t.type} · {new Date(t.taken_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.result === 'passed' ? 'var(--gx-success)' : 'var(--gx-danger)' }}>{Math.round(t.score)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
