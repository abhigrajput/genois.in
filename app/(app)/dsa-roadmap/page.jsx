'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';
import toast from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';
import { usePermission } from '@/lib/usePermission';
import { useRouter } from 'next/navigation';

export default function DSARoadmapPage() {
  const { token, ready } = useToken();
  const { userPlan } = usePermission();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDay, setViewDay] = useState(null);
  const [taskState, setTaskState] = useState({});
  const [showDailyTest, setShowDailyTest] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  // Dynamic video URL state — keyed by topic to avoid redundant fetches
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoCacheRef = useRef({});

  async function loadNotes() {
    setLoadingNotes(true);
    setShowNotes(true);
    try {
      const r = await apiFetch(`/api/dsa-roadmap/notes?day=${dayData.day}`, token);
      setAiNotes(r.data.notes);
    } catch (e) { setAiNotes('Failed to load notes'); }
    setLoadingNotes(false);
  }

  const [phase, setPhase] = useState('check');
  const [diagnostic, setDiagnostic] = useState(null);
  const [theoryAnswers, setTheoryAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [diagnosticStep, setDiagnosticStep] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token]);

  // Fetch video URL whenever the viewed day changes
  useEffect(() => {
    if (!data) return;
    const curriculum = DSA_LEVELS[data?.progress?.level || 'beginner'] || DSA_LEVELS.beginner;
    const dayObj = curriculum.find(d => d.day === viewDay) || curriculum[0];
    if (!dayObj) return;
    const cacheKey = dayObj.topic;
    if (videoCacheRef.current[cacheKey]) {
      setVideoUrl(videoCacheRef.current[cacheKey]);
      return;
    }
    setVideoUrl(null);
    setVideoLoading(true);
    fetch(`/api/dsa-video?topic=${encodeURIComponent(dayObj.topic)}`)
      .then(r => r.json())
      .then(res => {
        const url = res.url || null;
        videoCacheRef.current[cacheKey] = url;
        setVideoUrl(url);
      })
      .catch(() => setVideoUrl(null))
      .finally(() => setVideoLoading(false));
  }, [viewDay, data]);

  async function load() {
    try {
      const r = await apiFetch('/api/dsa-roadmap', token);
      setData(r.data);
      setViewDay(r.data.currentDay);
      if (!r.data.progress?.level) {
        // No diagnostic result — redirect to the new diagnostic page
        router.replace('/dsa-diagnostic');
        return;
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
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 20 }}>Diagnostic Test</h1>
        {diagnosticStep < totalTheory ? (
          <div>
            <p style={{ color: '#5a7a9a', marginBottom: 10 }}>Theory Question {diagnosticStep + 1} of {totalTheory}</p>
            <div style={{ fontSize: 18, color: '#e8e8ed', marginBottom: 20 }}>{diagnostic.theoryQuestions[diagnosticStep].question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {diagnostic.theoryQuestions[diagnosticStep].options.map((opt, i) => (
                <button key={i} onClick={() => {
                  setTheoryAnswers({ ...theoryAnswers, [diagnosticStep]: opt });
                  setDiagnosticStep(diagnosticStep + 1);
                }} style={{ padding: 14, borderRadius: 8, background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', color: '#e8e8ed', textAlign: 'left', cursor: 'pointer' }}>{opt}</button>
              ))}
            </div>
          </div>
        ) : diagnosticStep < totalTheory + totalCoding ? (
          <div>
            <p style={{ color: '#5a7a9a', marginBottom: 10 }}>Coding Question {diagnosticStep - totalTheory + 1} of {totalCoding}</p>
            <div style={{ fontSize: 18, color: '#e8e8ed', marginBottom: 20 }}>{diagnostic.codingQuestions[diagnosticStep - totalTheory].problem}</div>
            <textarea 
              value={codingAnswers[diagnosticStep - totalTheory] || ''}
              onChange={(e) => setCodingAnswers({ ...codingAnswers, [diagnosticStep - totalTheory]: e.target.value })}
              style={{ width: '100%', height: 150, background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', color: '#e8e8ed', padding: 14, borderRadius: 8, marginBottom: 20 }}
              placeholder="Write your logic/code here..."
            />
            <button onClick={() => setDiagnosticStep(diagnosticStep + 1)} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Next</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#e8e8ed', marginBottom: 20 }}>Test Complete</h2>
            <button onClick={submitDiagnostic} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Submit & Get Level</button>
          </div>
        )}
      </div>
    );
  }

  if (!data?.progress || data.progress.current_day === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 40, fontFamily: 'var(--font-body)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📘</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', marginBottom: 12 }}>90-Day DSA Roadmap</h1>
        <p style={{ color: '#5a7a9a', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Daily video. Resource. Coding problem. Test. Notes. 90 days to crack DSA. Same structure as your Daily Roadmap but focused entirely on DSA.
        </p>
        <button onClick={startRoadmap} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
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
    {
      key: 'video',
      icon: '📺',
      label: 'Watch Video',
      desc: videoLoading
        ? 'Finding the best video for this topic...'
        : (dayData.videoTitle || dayData.topic),
      link: videoUrl || undefined,
      type: 'external',
      loading: videoLoading,
    },
    { key: 'resource', icon: '📖', label: 'Read Resource', desc: dayData.resourceTitle, link: dayData.resource, type: 'external' },
    { key: 'coding', icon: '💻', label: 'Coding Problem (C++)', desc: dayData.codingProblem, stlNote: 'Solve this in C++. Focus on STL: vector, map, set, pair, priority_queue, stack, queue.', type: 'internal', action: () => window.open(dayData.problemLink || '#', '_blank') },
    { key: 'test', icon: '📝', label: 'Daily Test', desc: dayData.testTopic, type: 'internal', action: () => setShowDailyTest(true) },
    { key: 'notes', icon: '📋', label: 'AI Notes', desc: dayData.notesTopic, type: 'internal', action: loadNotes },
  ];

  return (
    <PermissionGate feature="dsa_roadmap">
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>📘 DSA Roadmap</h1>
          <p style={{ color: '#5a7a9a', fontSize: 13 }}>Day {data.currentDay} of 90 · {data.completedDays?.length || 0} days completed</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,107,74,0.12)', border: '1px solid rgba(255,107,74,0.3)', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#ff6b4a', letterSpacing: 1, userSelect: 'none', flexShrink: 0 }}>
          ⚡ C++
        </span>
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${((data.completedDays?.length || 0) / 90) * 100}%`, background: 'linear-gradient(90deg,#00f0ff,#ff6b4a)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
          <span>{data.completedDays?.length || 0}/90 DAYS</span>
          <span>{Math.round(((data.completedDays?.length || 0) / 90) * 100)}% COMPLETE</span>
        </div>
      </div>

      <div style={{ background: '#070f1f', border: `2px solid ${diffColor}25`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 4 }}>DAY {viewDay} · WEEK {dayData.week}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed' }}>{dayData.topic}</div>
          </div>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${diffColor}15`, color: diffColor, fontFamily: 'var(--font-mono)', alignSelf: 'flex-start' }}>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ed', marginBottom: 3 }}>{t.label}</div>
                  {t.loading ? (
                    <div style={{ height: 12, width: 180, borderRadius: 6, background: 'linear-gradient(90deg,rgba(0,240,255,0.08) 25%,rgba(0,240,255,0.18) 50%,rgba(0,240,255,0.08) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.5 }}>{t.desc}</div>
                      {t.stlNote && (
                        <div style={{ marginTop: 5, fontSize: 11, color: '#ff6b4a', fontFamily: 'var(--font-mono)', background: 'rgba(255,107,74,0.06)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                          ⚡ {t.stlNote}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {t.loading && (
                  <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>searching...</span>
                )}
                {!t.loading && t.link && (
                  <a href={t.link} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', textDecoration: 'none', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Open →
                  </a>
                )}
                {t.action && (
                  <button onClick={t.action} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Open →
                  </button>
                )}
                {isCurrentOrPast && !done && (
                  <button onClick={() => completeTask(viewDay, t.key)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700 }}>
                    Done ✓
                  </button>
                )}
                {done && <span style={{ fontSize: 16, color: '#1D9E75' }}>✅</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 10 }}>ALL 90 DAYS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(48px,1fr))', gap: 4 }}>
        {curriculum.map(d => {
          const isDone = data.completedDays?.includes(d.day);
          const isCurrent = d.day === data.currentDay;
          const isLocked = d.day > data.currentDay;
          return (
            <button key={d.day} onClick={() => setViewDay(d.day)} style={{ padding: '10px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: isDone ? '#1D9E75' : isCurrent ? '#00f0ff' : isLocked ? 'rgba(255,255,255,0.03)' : 'rgba(0,240,255,0.08)', color: isDone || isCurrent ? '#020812' : isLocked ? '#3a4a5a' : '#00f0ff', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {d.day}
            </button>
          );
        })}
      </div>

      {showNotes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#e8e8ed', margin: 0 }}>📚 AI Notes — {dayData.topic}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: 'transparent', border: 'none', color: '#5a7a9a', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, color: '#c8d8e8', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
              {loadingNotes ? <div style={{ textAlign: 'center', padding: 40, color: '#00f0ff', animation: 'pulse 1.5s infinite' }}>Generating custom notes...</div> : aiNotes}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
              <button onClick={() => { setShowNotes(false); completeTask(viewDay, 'notes'); }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Mark Done ✓</button>
            </div>
          </div>
        </div>
      )}

      {showDailyTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 16, width: '100%', maxWidth: 600, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#e8e8ed', marginBottom: 12 }}>Daily Test: {dayData.topic}</h2>
            <p style={{ color: '#5a7a9a', marginBottom: 24 }}>10 MCQ questions generated by AI to test your understanding.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowDailyTest(false)} style={{ padding: '12px 24px', background: 'transparent', color: '#5a7a9a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowDailyTest(false); completeTask(viewDay, 'test'); window.open('/tests', '_blank'); }} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#00f0ff,#ff6b4a)', color: '#020812', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Go to Tests →</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGate>
  );
}
