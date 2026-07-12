'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

const TASK_TYPES = ['video', 'resource', 'coding', 'test', 'notes'];
const TASK_LABELS = { video: '▶ Watch Video', resource: '📖 Read Resource', coding: '⌨️ Coding Task', test: '🎯 Take Test', notes: '📝 Generate Notes' };
const TASK_POINTS = { video: 10, resource: 10, coding: 20, test: 20, notes: 10 };

export default function CustomRoadmapDetailPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const params = useParams();
  const roadmapId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState('video');
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState('');
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    loadData();
  }, [ready, token]);

  async function loadData() {
    try {
      const r = await apiFetch(`/api/custom-roadmap/${roadmapId}`, token);
      setData(r.data);
      const completedTypes = (r.data.tasks || []).filter(t => t.status === 'completed').map(t => t.type);
      const firstIncomplete = TASK_TYPES.find(t => !completedTypes.includes(t));
      if (firstIncomplete) setActiveTask(firstIncomplete);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function completeTask(type) {
    if (completing) return;
    setCompleting(true);
    try {
      await apiFetch(`/api/custom-roadmap/${roadmapId}`, token, 'POST', {
        action: 'complete_task',
        taskType: type,
        dayNumber: data.roadmap.current_day,
      });
      toast.success(`+${TASK_POINTS[type]} pts`);
      await loadData();
      const nextTask = TASK_TYPES.find(t => t !== type && !(data.tasks || []).find(tk => tk.type === t && tk.status === 'completed'));
      if (nextTask) setActiveTask(nextTask);
    } catch (e) { toast.error(e.message); }
    setCompleting(false);
  }

  async function generateTest() {
    setLoadingTest(true);
    try {
      const r = await apiFetch(`/api/custom-roadmap/${roadmapId}`, token, 'POST', { action: 'generate_test' });
      setQuestions(r.data?.questions || []);
    } catch (e) { toast.error(e.message); }
    setLoadingTest(false);
  }

  async function generateNotes() {
    setLoadingNotes(true);
    try {
      const r = await apiFetch(`/api/custom-roadmap/${roadmapId}`, token, 'POST', { action: 'generate_notes' });
      setNotes(r.data?.notes || '');
    } catch (e) { toast.error(e.message); }
    setLoadingNotes(false);
  }

  function submitTest() {
    const correct = questions.filter((q, i) => selectedAnswers[i] === q.correct).length;
    const score = Math.round((correct / questions.length) * 100);
    toast.success(`Score: ${correct}/${questions.length} (${score}%)`);
    setTestSubmitted(true);
    completeTask('test');
  }

  if (loading) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Loading your roadmap...
    </div>
  );

  if (!data?.roadmap) return (
    <div style={{ color: '#ff2d78', padding: 60, textAlign: 'center' }}>Roadmap not found.</div>
  );

  const roadmap = data.roadmap;
  const dayData = data.currentDayData;
  const completedTypes = (data.tasks || []).filter(t => t.status === 'completed').map(t => t.type);
  const completedCount = completedTypes.length;
  const isTaskDone = (type) => completedTypes.includes(type);

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/custom-roadmap')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00d9a3', fontSize: 18, padding: 0, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#e8e8ed', margin: 0, marginBottom: 2 }}>{roadmap.topic}</h1>
          <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
            Day {roadmap.current_day} of {roadmap.total_days} · {completedCount}/5 tasks done
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#00d9a3' }}>
            {Math.round((roadmap.current_day / roadmap.total_days) * 100)}%
          </div>
          <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>complete</div>
        </div>
      </div>

      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((roadmap.current_day / roadmap.total_days) * 100)}%`, background: 'linear-gradient(90deg,#00d9a3,#ff6b4a)', borderRadius: 3 }} />
      </div>

      {dayData && (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>
            Day {roadmap.current_day}: {dayData.topic}
          </div>
          <div style={{ fontSize: 13, color: '#5a7a9a', lineHeight: 1.6 }}>{dayData.description}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TASK_TYPES.map(type => (
          <button key={type} onClick={() => setActiveTask(type)} style={{
            padding: '8px 14px', borderRadius: 20, border: `1px solid ${activeTask === type ? 'rgba(0,217,163,0.4)' : isTaskDone(type) ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.08)'}`,
            background: activeTask === type ? 'rgba(0,217,163,0.1)' : isTaskDone(type) ? 'rgba(29,158,117,0.08)' : 'transparent',
            color: activeTask === type ? '#00d9a3' : isTaskDone(type) ? '#1D9E75' : '#5a7a9a',
            cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600,
          }}>
            {isTaskDone(type) ? '✓ ' : ''}{TASK_LABELS[type]}
          </button>
        ))}
      </div>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 14, padding: 24, minHeight: 300 }}>

        {activeTask === 'video' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 12 }}>WATCH VIDEO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e8ed', marginBottom: 8 }}>Search on YouTube:</div>
            <div style={{ padding: '12px 16px', background: 'rgba(0,217,163,0.06)', borderRadius: 10, fontSize: 14, color: '#00d9a3', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
              {dayData.video_search}
            </div>
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dayData.video_search)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: '#FF0000', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
              🎥 Search on YouTube →
            </a>
            {!isTaskDone('video') && (
              <div>
                <button onClick={() => completeTask('video')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                  ✓ Mark as Watched +10pts
                </button>
              </div>
            )}
            {isTaskDone('video') && <div style={{ color: '#1D9E75', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'resource' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b4a', letterSpacing: 2, marginBottom: 12 }}>READ RESOURCE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e8ed', marginBottom: 16 }}>Read the documentation or article for today:</div>
            <a href={dayData.resource_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: 'rgba(255,107,74,0.15)', border: '1px solid rgba(255,107,74,0.3)', color: '#ff6b4a', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
              📖 Open Resource →
            </a>
            {!isTaskDone('resource') && (
              <div>
                <button onClick={() => completeTask('resource')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#ff6b4a,#00d9a3)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                  ✓ Mark as Read +10pts
                </button>
              </div>
            )}
            {isTaskDone('resource') && <div style={{ color: '#1D9E75', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'coding' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 12 }}>CODING TASK</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8e8ed', marginBottom: 12 }}>Today's Hands-on Task:</div>
            <div style={{ padding: '16px', background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, fontSize: 14, color: '#c8d8e8', lineHeight: 1.7, marginBottom: 20 }}>
              {dayData.coding_task}
            </div>
            {!isTaskDone('coding') && (
              <button onClick={() => completeTask('coding')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1D9E75,#00d9a3)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                ✓ Mark as Done +20pts
              </button>
            )}
            {isTaskDone('coding') && <div style={{ color: '#1D9E75', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'test' && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>DAILY TEST</div>
            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <button onClick={generateTest} disabled={loadingTest || isTaskDone('test')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#EF9F27,#D85A30)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
                  {loadingTest ? 'Generating questions...' : isTaskDone('test') ? '✓ Test Completed' : 'Start Test →'}
                </button>
              </div>
            ) : (
              <div>
                {questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, color: '#e8e8ed', marginBottom: 12, fontWeight: 500 }}>Q{i+1}: {q.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const letters = ['A','B','C','D'];
                        const isSelected = selectedAnswers[i] === opt;
                        const isCorrect = testSubmitted && opt === q.correct;
                        const isWrong = testSubmitted && isSelected && opt !== q.correct;
                        return (
                          <button key={oi} onClick={() => !testSubmitted && setSelectedAnswers(p => ({...p, [i]: opt}))} style={{
                            padding: '10px 14px', borderRadius: 8, cursor: testSubmitted ? 'default' : 'pointer', textAlign: 'left',
                            border: `1px solid ${isCorrect ? 'rgba(29,158,117,0.5)' : isWrong ? 'rgba(255,45,120,0.5)' : isSelected ? 'rgba(0,217,163,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            background: isCorrect ? 'rgba(29,158,117,0.1)' : isWrong ? 'rgba(255,45,120,0.1)' : isSelected ? 'rgba(0,217,163,0.06)' : 'transparent',
                            color: isCorrect ? '#1D9E75' : isWrong ? '#ff2d78' : '#c8d8e8', fontSize: 13,
                          }}>
                            <span style={{ color: '#5a7a9a', marginRight: 8, fontFamily: 'var(--font-mono)' }}>{letters[oi]}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {testSubmitted && q.explanation && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,217,163,0.04)', borderRadius: 8, fontSize: 12, color: '#5a7a9a' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                {!testSubmitted && (
                  <button onClick={submitTest} disabled={Object.keys(selectedAnswers).length < questions.length} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#EF9F27,#D85A30)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                    Submit Test →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTask === 'notes' && (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#378ADD', letterSpacing: 2, marginBottom: 12 }}>AI NOTES</div>
            {!notes ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <button onClick={generateNotes} disabled={loadingNotes || isTaskDone('notes')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#378ADD,#ff6b4a)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
                  {loadingNotes ? 'Generating notes...' : isTaskDone('notes') ? '✓ Notes Completed' : 'Generate Notes →'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: 16, background: 'rgba(55,138,221,0.05)', border: '1px solid rgba(55,138,221,0.1)', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 14, color: '#c8d8e8', lineHeight: 1.8, marginBottom: 20 }}>
                  {notes}
                </div>
                {!isTaskDone('notes') && (
                  <button onClick={() => completeTask('notes')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#378ADD,#ff6b4a)', color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                    ✓ Save Notes +10pts
                  </button>
                )}
                {isTaskDone('notes') && <div style={{ color: '#1D9E75', fontWeight: 600 }}>✓ Completed</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
