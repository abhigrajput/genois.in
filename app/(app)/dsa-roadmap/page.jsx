'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';

export default function DSARoadmapPage() {
  const { token, ready } = useToken();
  const { userPlan } = usePermission();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDay, setViewDay] = useState(null);
  const [taskState, setTaskState] = useState({});

  const [phase, setPhase] = useState('check');
  const [diagnostic, setDiagnostic] = useState(null);
  const [theoryAnswers, setTheoryAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [diagnosticStep, setDiagnosticStep] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token]);

  async function load() {
    try {
      const r = await apiFetch('/api/dsa-roadmap', token);
      setData(r.data);
      setViewDay(r.data.currentDay);
      if (!r.data.progress?.level) {
        const diagR = await apiFetch('/api/dsa-roadmap/diagnostic', token);
        setDiagnostic(diagR.data);
        setPhase('diagnostic');
      } else {
        setPhase('roadmap');
      }
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function startRoadmap() {
    try {
      await apiFetch('/api/dsa-roadmap', token, 'POST', { action: 'start', language: 'cpp' });
      toast.success('DSA Roadmap started! 90 days to crack DSA.');
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function completeTask(day, taskType) {
    try {
      const r = await apiFetch('/api/dsa-roadmap', token, 'POST', { action: 'complete_task', day, taskType });
      setTaskState(prev => ({ ...prev, [`${day}_${taskType}`]: true }));
      if (r.data.allDone) {
        toast.success(`Day ${day} complete! +20 pts`);
        load();
      } else {
        toast.success('Task marked done');
      }
    } catch (e) { toast.error(e.message); }
  }

  async function submitDiagnostic() {
    setLoading(true);
    try {
      const r = await apiFetch('/api/dsa-roadmap/diagnostic', token, 'POST', {
        theoryAnswers: Object.values(theoryAnswers),
        codingAnswers: Object.values(codingAnswers),
      });
      toast.success(r.data.message);
      load();
    } catch (e) {
      toast.error(e.message);
      setLoading(false);
    }
  }

  if (loading || phase === 'check') return <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center' }}>Loading DSA roadmap...</div>;

  if (phase === 'diagnostic') {
    if (!diagnostic) return null;
    const totalTheory = diagnostic.theoryQuestions.length;
    const totalCoding = diagnostic.codingQuestions.length;
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 20 }}>Diagnostic Test</h1>
        {diagnosticStep < totalTheory ? (
          <div>
            <p style={{ color: '#5a7a9a', marginBottom: 10 }}>Theory Question {diagnosticStep + 1} of {totalTheory}</p>
            <div style={{ fontSize: 18, color: '#e8f4ff', marginBottom: 20 }}>{diagnostic.theoryQuestions[diagnosticStep].question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {diagnostic.theoryQuestions[diagnosticStep].options.map((opt, i) => (
                <button key={i} onClick={() => {
                  setTheoryAnswers({ ...theoryAnswers, [diagnosticStep]: opt });
                  setDiagnosticStep(diagnosticStep + 1);
                }} style={{ padding: 14, borderRadius: 8, background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', color: '#e8f4ff', textAlign: 'left', cursor: 'pointer' }}>{opt}</button>
              ))}
            </div>
          </div>
        ) : diagnosticStep < totalTheory + totalCoding ? (
          <div>
            <p style={{ color: '#5a7a9a', marginBottom: 10 }}>Coding Question {diagnosticStep - totalTheory + 1} of {totalCoding}</p>
            <div style={{ fontSize: 18, color: '#e8f4ff', marginBottom: 20 }}>{diagnostic.codingQuestions[diagnosticStep - totalTheory].problem}</div>
            <textarea 
              value={codingAnswers[diagnosticStep - totalTheory] || ''}
              onChange={(e) => setCodingAnswers({ ...codingAnswers, [diagnosticStep - totalTheory]: e.target.value })}
              style={{ width: '100%', height: 150, background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', color: '#e8f4ff', padding: 14, borderRadius: 8, marginBottom: 20 }}
              placeholder="Write your logic/code here..."
            />
            <button onClick={() => setDiagnosticStep(diagnosticStep + 1)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Next</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#e8f4ff', marginBottom: 20 }}>Test Complete</h2>
            <button onClick={submitDiagnostic} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Submit & Get Level</button>
          </div>
        )}
      </div>
    );
  }

  if (!data?.progress || data.progress.current_day === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 40, fontFamily: 'Outfit,sans-serif' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📘</div>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#e8f4ff', marginBottom: 12 }}>90-Day DSA Roadmap</h1>
        <p style={{ color: '#5a7a9a', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Daily video. Resource. Coding problem. Test. Notes. 90 days to crack DSA. Same structure as your Daily Roadmap but focused entirely on DSA.
        </p>
        <button onClick={startRoadmap} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
          Start 90-Day Challenge →
        </button>
      </div>
    );
  }

  const curriculum = DSA_LEVELS[data?.progress?.level || 'beginner'] || DSA_LEVELS.beginner;
  const dayData = curriculum.find(d => d.day === viewDay) || curriculum[0];
  const isCompleted = data.completedDays?.includes(viewDay);
  const isCurrentOrPast = viewDay <= data.currentDay;
  const diffColor = dayData.difficulty === 'easy' ? '#1D9E75' : dayData.difficulty === 'medium' ? '#EF9F27' : '#ff2d78';

  const TASKS = [
    { key: 'video', icon: '📺', label: 'Watch Video', desc: dayData.videoTitle, link: dayData.video, type: 'external' },
    { key: 'resource', icon: '📖', label: 'Read Resource', desc: dayData.resourceTitle, link: dayData.resource, type: 'external' },
    { key: 'coding', icon: '💻', label: 'Coding Problem', desc: dayData.codingProblem, type: 'internal' },
    { key: 'test', icon: '📝', label: 'Daily Test', desc: dayData.testTopic, type: 'internal' },
    { key: 'notes', icon: '📋', label: 'AI Notes', desc: dayData.notesTopic, type: 'internal' },
  ];

  return (
    <PermissionGate feature="dsa_roadmap">
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>📘 DSA Roadmap</h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>Day {data.currentDay} of 90 · {data.completedDays?.length || 0} days completed</p>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${((data.completedDays?.length || 0) / 90) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#7b5cff)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
          <span>{data.completedDays?.length || 0}/90 DAYS</span>
          <span>{Math.round(((data.completedDays?.length || 0) / 90) * 100)}% COMPLETE</span>
        </div>
      </div>

      <div style={{ background: '#070f1f', border: `2px solid ${diffColor}25`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 4 }}>DAY {viewDay} · WEEK {dayData.week}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff' }}>{dayData.topic}</div>
          </div>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${diffColor}15`, color: diffColor, fontFamily: 'JetBrains Mono,monospace', alignSelf: 'flex-start' }}>
            {(dayData?.difficulty || 'easy').toUpperCase()}
          </span>
        </div>

        {!isCurrentOrPast && (
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12, color: '#5a7a9a', marginBottom: 14 }}>
            🔒 Locked. Complete Day {data.currentDay} to unlock this day.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TASKS.map(t => {
            const done = taskState[`${viewDay}_${t.key}`] || isCompleted;
            return (
              <div key={t.key} style={{ background: done ? 'rgba(29,158,117,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.04)'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f4ff', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.5 }}>{t.desc}</div>
                </div>
                {t.link && (
                  <a href={t.link} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', textDecoration: 'none', fontSize: 11, fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
                    Open →
                  </a>
                )}
                {isCurrentOrPast && !done && (
                  <button onClick={() => completeTask(viewDay, t.key)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 11, fontWeight: 700 }}>
                    Done ✓
                  </button>
                )}
                {done && <span style={{ fontSize: 16, color: '#1D9E75' }}>✅</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 10 }}>ALL 90 DAYS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(48px,1fr))', gap: 4 }}>
        {curriculum.map(d => {
          const isDone = data.completedDays?.includes(d.day);
          const isCurrent = d.day === data.currentDay;
          const isLocked = d.day > data.currentDay;
          return (
            <button key={d.day} onClick={() => setViewDay(d.day)} style={{ padding: '10px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: isDone ? '#1D9E75' : isCurrent ? '#00f0ff' : isLocked ? 'rgba(255,255,255,0.03)' : 'rgba(0,240,255,0.08)', color: isDone || isCurrent ? '#020812' : isLocked ? '#3a4a5a' : '#00f0ff', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
    </PermissionGate>
  );
}
