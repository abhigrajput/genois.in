'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';
import toast from 'react-hot-toast';
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

  if (loading || phase === 'check') return <div style={{ color: 'var(--gx-text-muted)', padding: 60, textAlign: 'center' }}>Loading DSA roadmap...</div>;

  if (phase === 'diagnostic') {
    if (!diagnostic) return null;
    const totalTheory = diagnostic.theoryQuestions.length;
    const totalCoding = diagnostic.codingQuestions.length;
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 20 }}>Diagnostic Test</h1>
        {diagnosticStep < totalTheory ? (
          <div>
            <p style={{ color: 'var(--gx-text-muted)', marginBottom: 10 }}>Theory Question {diagnosticStep + 1} of {totalTheory}</p>
            <div style={{ fontSize: 18, color: 'var(--gx-text)', marginBottom: 20 }}>{diagnostic.theoryQuestions[diagnosticStep].question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {diagnostic.theoryQuestions[diagnosticStep].options.map((opt, i) => (
                <button key={i} onClick={() => {
                  setTheoryAnswers({ ...theoryAnswers, [diagnosticStep]: opt });
                  setDiagnosticStep(diagnosticStep + 1);
                }} style={{ padding: 14, borderRadius: 8, background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', color: 'var(--gx-text)', textAlign: 'left', cursor: 'pointer' }}>{opt}</button>
              ))}
            </div>
          </div>
        ) : diagnosticStep < totalTheory + totalCoding ? (
          <div>
            <p style={{ color: 'var(--gx-text-muted)', marginBottom: 10 }}>Coding Question {diagnosticStep - totalTheory + 1} of {totalCoding}</p>
            <div style={{ fontSize: 18, color: 'var(--gx-text)', marginBottom: 20 }}>{diagnostic.codingQuestions[diagnosticStep - totalTheory].problem}</div>
            <textarea 
              value={codingAnswers[diagnosticStep - totalTheory] || ''}
              onChange={(e) => setCodingAnswers({ ...codingAnswers, [diagnosticStep - totalTheory]: e.target.value })}
              style={{ width: '100%', height: 150, background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', color: 'var(--gx-text)', padding: 14, borderRadius: 8, marginBottom: 20 }}
              placeholder="Write your logic/code here..."
            />
            <button onClick={() => setDiagnosticStep(diagnosticStep + 1)} style={{ padding: '12px 24px', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Next</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--gx-text)', marginBottom: 20 }}>Test Complete</h2>
            <button onClick={submitDiagnostic} style={{ padding: '14px 32px', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Submit & Get Level</button>
          </div>
        )}
      </div>
    );
  }

  if (!data?.progress || data.progress.current_day === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 40, fontFamily: 'var(--font-body)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📘</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12 }}>90-Day DSA Roadmap</h1>
        <p style={{ color: 'var(--gx-text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Daily video. Resource. Coding problem. Test. Notes. 90 days to crack DSA. Same structure as your Daily Roadmap but focused entirely on DSA.
        </p>
        <button onClick={startRoadmap} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
          Start 90-Day Challenge →
        </button>
      </div>
    );
  }

  const curriculum = DSA_LEVELS[data?.progress?.level || 'beginner'] || DSA_LEVELS.beginner;
  const dayData = curriculum.find(d => d.day === viewDay) || curriculum[0];
  const isCompleted = data.completedDays?.includes(viewDay);
  const isCurrentOrPast = viewDay <= data.currentDay;
  const diffColor = dayData.difficulty === 'easy' ? 'var(--gx-success)' : dayData.difficulty === 'medium' ? 'var(--gx-warning)' : 'var(--gx-danger)';

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
    // Public beta: DSA Roadmap renders directly to every tester. The shared
    // <PermissionGate feature="dsa_roadmap"> wrapper was removed here so no
    // "Feature Locked / Paid plans coming soon" state can block a beta user.
    // Re-wrap this return (and restore the import) to re-gate the feature.
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>📘 DSA Roadmap</h1>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>Day {data.currentDay} of 90 · {data.completedDays?.length || 0} days completed</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', fontSize: 11, fontFamily: 'var(--font-body)', color: 'var(--gx-warning)', letterSpacing: 1, userSelect: 'none', flexShrink: 0 }}>
          ⚡ C++
        </span>
      </div>

      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ height: 6, background: 'var(--gx-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${((data.completedDays?.length || 0) / 90) * 100}%`, background: 'var(--gx-accent)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>{data.completedDays?.length || 0}/90 DAYS</span>
          <span>{Math.round(((data.completedDays?.length || 0) / 90) * 100)}% COMPLETE</span>
        </div>
      </div>

      <div style={{ background: 'var(--gx-bg)', border: `2px solid color-mix(in srgb, ${diffColor} 15%, transparent)`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 4 }}>DAY {viewDay} · WEEK {dayData.week}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--gx-text)' }}>{dayData.topic}</div>
          </div>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `color-mix(in srgb, ${diffColor} 8%, transparent)`, color: diffColor, fontFamily: 'var(--font-mono)', alignSelf: 'flex-start' }}>
            {(dayData?.difficulty || 'easy').toUpperCase()}
          </span>
        </div>

        {!isCurrentOrPast && (
          <div style={{ padding: '12px 14px', background: 'var(--gx-surface)', borderRadius: 8, fontSize: 12, color: 'var(--gx-text-muted)', marginBottom: 14 }}>
            🔒 Locked. Complete Day {data.currentDay} to unlock this day.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TASKS.map(t => {
            const done = taskState[`${viewDay}_${t.key}`] || isCompleted;
            return (
              <div key={t.key} style={{ background: done ? 'var(--gx-success-soft)' : 'var(--gx-surface)', border: `1px solid ${done ? 'var(--gx-success-border)' : 'var(--gx-border)'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 3 }}>{t.label}</div>
                  {t.loading ? (
                    <div style={{ height: 12, width: 180, borderRadius: 6, background: 'var(--gx-accent-soft)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                      {t.stlNote && (
                        <div style={{ marginTop: 5, fontSize: 11, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)', background: 'var(--gx-warning-soft)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                          ⚡ {t.stlNote}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {t.loading && (
                  <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>searching...</span>
                )}
                {!t.loading && t.link && (
                  <a href={t.link} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'transparent', color: 'var(--gx-accent)', textDecoration: 'none', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Open →
                  </a>
                )}
                {t.action && (
                  <button onClick={t.action} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'transparent', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Open →
                  </button>
                )}
                {isCurrentOrPast && !done && (
                  <button onClick={() => completeTask(viewDay, t.key)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 11, fontWeight: 700 }}>
                    Done ✓
                  </button>
                )}
                {done && <span style={{ fontSize: 16, color: 'var(--gx-success)' }}>✅</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 10 }}>ALL 90 DAYS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(48px,1fr))', gap: 4 }}>
        {curriculum.map(d => {
          const isDone = data.completedDays?.includes(d.day);
          const isCurrent = d.day === data.currentDay;
          const isLocked = d.day > data.currentDay;
          return (
            <button key={d.day} onClick={() => setViewDay(d.day)} style={{ padding: '10px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: isDone ? 'var(--gx-success)' : isCurrent ? 'var(--gx-accent)' : isLocked ? 'var(--gx-surface)' : 'var(--gx-accent-soft)', color: isDone || isCurrent ? 'var(--gx-text-inverse)' : isLocked ? 'var(--gx-text-subtle)' : 'var(--gx-accent)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {d.day}
            </button>
          );
        })}
      </div>

      {showNotes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--gx-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: 'var(--gx-text)', margin: 0 }}>📚 AI Notes — {dayData.topic}</h2>
              <button onClick={() => setShowNotes(false)} style={{ background: 'transparent', border: 'none', color: 'var(--gx-text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, color: 'var(--gx-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
              {loadingNotes ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--gx-accent)', animation: 'pulse 1.5s infinite' }}>Generating custom notes...</div> : aiNotes}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--gx-border)', textAlign: 'right' }}>
              <button onClick={() => { setShowNotes(false); completeTask(viewDay, 'notes'); }} style={{ padding: '10px 24px', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Mark Done ✓</button>
            </div>
          </div>
        </div>
      )}

      {showDailyTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', borderRadius: 16, width: '100%', maxWidth: 600, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--gx-text)', marginBottom: 12 }}>Daily Test: {dayData.topic}</h2>
            <p style={{ color: 'var(--gx-text-muted)', marginBottom: 24 }}>10 MCQ questions generated by AI to test your understanding.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowDailyTest(false)} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--gx-text-muted)', border: '1px solid var(--gx-border)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowDailyTest(false); completeTask(viewDay, 'test'); window.open('/tests', '_blank'); }} style={{ padding: '12px 24px', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Go to Tests →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
