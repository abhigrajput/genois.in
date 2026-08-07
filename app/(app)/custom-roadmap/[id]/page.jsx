'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { videoForTopic } from '@/lib/curatedVideos';
import VideoPlayer from '@/components/VideoPlayer';

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
    <div style={{ color: 'var(--gx-text-muted)', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Loading your roadmap...
    </div>
  );

  if (!data?.roadmap) return (
    <div style={{ color: 'var(--gx-danger)', padding: 60, textAlign: 'center' }}>Roadmap not found.</div>
  );

  const roadmap = data.roadmap;
  const dayData = data.currentDayData;
  const completedTypes = (data.tasks || []).filter(t => t.status === 'completed').map(t => t.type);
  const completedCount = completedTypes.length;
  const isTaskDone = (type) => completedTypes.includes(type);

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/custom-roadmap')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gx-accent)', fontSize: 18, padding: 0, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--gx-text)', margin: 0, marginBottom: 2 }}>{roadmap.topic}</h1>
          <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Day {roadmap.current_day} of {roadmap.total_days} · {completedCount}/5 tasks done
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--gx-accent)' }}>
            {Math.round((roadmap.current_day / roadmap.total_days) * 100)}%
          </div>
          <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>complete</div>
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--gx-surface)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((roadmap.current_day / roadmap.total_days) * 100)}%`, background: 'var(--gx-accent)', borderRadius: 3 }} />
      </div>

      {dayData && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 4 }}>
            Day {roadmap.current_day}: {dayData.topic}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.6 }}>{dayData.description}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TASK_TYPES.map(type => (
          <button key={type} onClick={() => setActiveTask(type)} style={{
            padding: '8px 14px', borderRadius: 20, border: `1px solid ${activeTask === type ? 'var(--gx-accent-border)' : isTaskDone(type) ? 'var(--gx-success-border)' : 'var(--gx-border)'}`,
            background: activeTask === type ? 'var(--gx-accent-soft)' : isTaskDone(type) ? 'var(--gx-success-soft)' : 'transparent',
            color: activeTask === type ? 'var(--gx-accent)' : isTaskDone(type) ? 'var(--gx-success)' : 'var(--gx-text-muted)',
            cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600,
          }}>
            {isTaskDone(type) ? '✓ ' : ''}{TASK_LABELS[type]}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, minHeight: 300 }}>

        {activeTask === 'video' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 12 }}>WATCH VIDEO</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 12 }}>
              {dayData.topic || dayData.video_search}
            </div>
            {/* Was: a red "Search on YouTube →" button pointing at
                youtube.com/results, which dumped the student on a search page in
                a new tab. Now the curated video for the day's topic plays here. */}
            <div style={{ marginBottom: 20 }}>
              <VideoPlayer
                video={videoForTopic(dayData.topic || dayData.video_search)}
                empty={
                  <div style={{ padding: '12px 16px', background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 10, fontSize: 13, color: 'var(--gx-text-muted)' }}>
                    No curated video for this topic yet — mark it done once you have covered it.
                  </div>
                }
              />
            </div>
            {!isTaskDone('video') && (
              <div>
                <button onClick={() => completeTask('video')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                  ✓ Mark as Watched +10pts
                </button>
              </div>
            )}
            {isTaskDone('video') && <div style={{ color: 'var(--gx-success)', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'resource' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 2, marginBottom: 12 }}>READ RESOURCE</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 16 }}>Read the documentation or article for today:</div>
            <a href={dayData.resource_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', color: 'var(--gx-warning)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
              📖 Open Resource →
            </a>
            {!isTaskDone('resource') && (
              <div>
                <button onClick={() => completeTask('resource')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-warning)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                  ✓ Mark as Read +10pts
                </button>
              </div>
            )}
            {isTaskDone('resource') && <div style={{ color: 'var(--gx-success)', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'coding' && dayData && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-success)', letterSpacing: 2, marginBottom: 12 }}>CODING TASK</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 12 }}>Today's Hands-on Task:</div>
            <div style={{ padding: '16px', background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', borderRadius: 10, fontSize: 14, color: 'var(--gx-text)', lineHeight: 1.7, marginBottom: 20 }}>
              {dayData.coding_task}
            </div>
            {!isTaskDone('coding') && (
              <button onClick={() => completeTask('coding')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-success)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                ✓ Mark as Done +20pts
              </button>
            )}
            {isTaskDone('coding') && <div style={{ color: 'var(--gx-success)', fontWeight: 600 }}>✓ Completed</div>}
          </div>
        )}

        {activeTask === 'test' && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 2, marginBottom: 12 }}>DAILY TEST</div>
            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <button onClick={generateTest} disabled={loadingTest || isTaskDone('test')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-warning)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
                  {loadingTest ? 'Generating questions...' : isTaskDone('test') ? '✓ Test Completed' : 'Start Test →'}
                </button>
              </div>
            ) : (
              <div>
                {questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 20, padding: 16, background: 'var(--gx-surface)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, color: 'var(--gx-text)', marginBottom: 12, fontWeight: 500 }}>Q{i+1}: {q.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const letters = ['A','B','C','D'];
                        const isSelected = selectedAnswers[i] === opt;
                        const isCorrect = testSubmitted && opt === q.correct;
                        const isWrong = testSubmitted && isSelected && opt !== q.correct;
                        return (
                          <button key={oi} onClick={() => !testSubmitted && setSelectedAnswers(p => ({...p, [i]: opt}))} style={{
                            padding: '10px 14px', borderRadius: 8, cursor: testSubmitted ? 'default' : 'pointer', textAlign: 'left',
                            border: `1px solid ${isCorrect ? 'var(--gx-success-border)' : isWrong ? 'var(--gx-danger-border)' : isSelected ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`,
                            background: isCorrect ? 'var(--gx-success-soft)' : isWrong ? 'var(--gx-danger-soft)' : isSelected ? 'var(--gx-accent-soft)' : 'transparent',
                            color: isCorrect ? 'var(--gx-success)' : isWrong ? 'var(--gx-danger)' : 'var(--gx-text)', fontSize: 13,
                          }}>
                            <span style={{ color: 'var(--gx-text-muted)', marginRight: 8, fontFamily: 'var(--font-mono)' }}>{letters[oi]}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {testSubmitted && q.explanation && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--gx-accent-soft)', borderRadius: 8, fontSize: 12, color: 'var(--gx-text-muted)' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                {!testSubmitted && (
                  <button onClick={submitTest} disabled={Object.keys(selectedAnswers).length < questions.length} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-warning)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                    Submit Test →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTask === 'notes' && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-info)', letterSpacing: 2, marginBottom: 12 }}>NOTES</div>
            {!notes ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <button onClick={generateNotes} disabled={loadingNotes || isTaskDone('notes')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-info)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700 }}>
                  {loadingNotes ? 'Generating notes...' : isTaskDone('notes') ? '✓ Notes Completed' : 'Generate Notes →'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: 16, background: 'var(--gx-info-soft)', border: '1px solid var(--gx-info-border)', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 14, color: 'var(--gx-text)', lineHeight: 1.8, marginBottom: 20 }}>
                  {notes}
                </div>
                {!isTaskDone('notes') && (
                  <button onClick={() => completeTask('notes')} disabled={completing} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-info)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                    ✓ Save Notes +10pts
                  </button>
                )}
                {isTaskDone('notes') && <div style={{ color: 'var(--gx-success)', fontWeight: 600 }}>✓ Completed</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
