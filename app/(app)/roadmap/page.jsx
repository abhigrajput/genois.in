'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { roadmapAPI, taskAPI, testAPI, codingAPI, notesAPI } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import CodeEditor from '@/components/CodeEditor';

const STEPS = ['video','resource','coding','test','notes'];
const STEP_LABELS = { video:'Watch Video', resource:'Read Resource', coding:'Coding Challenge', test:'Daily Test', notes:'AI Notes' };

const ACTION_BTN_STYLE = {
  background: 'linear-gradient(135deg, #00f0ff, #7b5cff)',
  color: '#020812',
  fontWeight: 700,
  padding: '14px 28px',
  borderRadius: '10px',
  width: '100%',
  fontSize: '15px',
  border: 'none',
  cursor: 'pointer'
};

export default function DailyRoadmapPage() {
  const { updateProgress } = useAuthStore();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [tasks, setTasks] = useState([]);

  const [test, setTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const [codingTest, setCodingTest] = useState(null);
  const [code, setCode] = useState('// Write your solution here\n');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeResult, setCodeResult] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const [noteType, setNoteType] = useState('theory');
  const [note, setNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => { loadDaily(); }, []);

  async function loadDaily() {
    try {
      const res = await roadmapAPI.getDaily();
      setDaily(res.data);
      setTasks(res.data.tasks || []);
      if (res.data.codingTest) setCodingTest(res.data.codingTest);
    } catch (err) {
      toast.error('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  }

  const isTaskDone = (type) => tasks.find(t => t.type === type)?.status === 'completed';

  async function completeTask(type, taskScore) {
    try {
      const res = await taskAPI.completeTask({ dayNumber: daily.currentDay, taskType: type, score: taskScore });
      if (res.data.alreadyDone) return;
      setTasks(prev => prev.map(t => t.type === type ? { ...t, status: 'completed', score: res.data.points } : t));
      toast.success(`+${res.data.points} pts!`);
      
      const currentIndex = STEPS.indexOf(type);
      const nextIndex = currentIndex + 1;
      if (nextIndex < STEPS.length) {
        setTimeout(() => setActiveStep(nextIndex), 800);
      }

      if (res.data.dayUnlocked) {
        toast.success(`🎉 Day ${daily.currentDay} complete! Day ${res.data.newDay} unlocked!`, { duration: 4000 });
        updateProgress({ current_day: res.data.newDay });
        setDaily(d => ({ ...d, dayUnlocked: true, newDay: res.data.newDay }));
      }
    } catch (err) { toast.error(err.message); }
  }

  async function generateTest() {
    setTestLoading(true);
    try {
      const res = await testAPI.generateDaily({ roadmapId: daily.roadmapItem.id, dayNumber: daily.currentDay });
      setTest(res.data);
    } catch { toast.error('Failed to generate test'); } finally { setTestLoading(false); }
  }

  async function submitTest() {
    if (!test) return;
    setTestLoading(true);
    try {
      const answers = test.questions.map((_, i) => ({ answer: testAnswers[i] || '' }));
      const res = await testAPI.submit({ testId: test.testId, answers });
      setTestResult(res.data);
      await completeTask('test', res.data.score);
    } catch { toast.error('Failed to submit test'); } finally { setTestLoading(false); }
  }

  async function submitCode() {
    setCodeLoading(true);
    try {
      const res = await codingAPI.submit({ codingTestId: codingTest.id, code, language: codeLanguage });
      setCodeResult(res.data);
      await completeTask('coding', res.data.points);
    } catch { toast.error('Code submission failed'); } finally { setCodeLoading(false); }
  }

  async function generateNotes() {
    setNoteLoading(true);
    try {
      const res = await notesAPI.generate({ roadmapId: daily.roadmapItem.id, noteType });
      setNote(res.data.note);
      if (!isTaskDone('notes')) await completeTask('notes', 10);
    } catch { toast.error('Failed to generate notes'); } finally { setNoteLoading(false); }
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading your roadmap...</div>;
  if (!daily) return <div className="text-gray-400 text-sm">No roadmap found.</div>;

  const { roadmapItem, currentDay, currentWeek, dayUnlocked, newDay } = daily;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-dark">Day {currentDay} — {roadmapItem?.topic}</h1>
        <p className="text-sm text-gray-400 mt-1">Week {currentWeek} · {roadmapItem?.difficulty} · Follow the flow in order</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STEPS.map((step, i) => (
          <button key={step} onClick={() => setActiveStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isTaskDone(step) ? 'bg-success/10 text-success border-success/20' : activeStep === i ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}>
            {isTaskDone(step) ? '✓ ' : ''}{STEP_LABELS[step]}
          </button>
        ))}
      </div>

      {dayUnlocked && (
        <div style={{
          width: '100%', padding: '16px', borderRadius: '12px',
          background: 'rgba(29,158,117,0.1)', border: '1px solid #1D9E75',
          boxShadow: '0 0 20px rgba(29,158,117,0.2)', color: '#e8f4ff', textAlign: 'center', marginBottom: '16px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🎉 Day {currentDay} Complete! You earned 100 points!</div>
          <div style={{ fontSize: '14px', color: '#1D9E75', marginTop: '4px' }}>Day {newDay} is now unlocked</div>
        </div>
      )}

      <div className="card min-h-64" style={{ width: '100%' }}>
        {activeStep === 0 && (
          <div className="space-y-4">
            <h3 className="section-title">▶ Watch Video — {roadmapItem?.topic}</h3>
            <p className="text-sm text-gray-500">Watch the video to learn the theory before coding.</p>
            {roadmapItem?.video_url && (
              <a href={roadmapItem.video_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex">Open on YouTube ↗</a>
            )}
            {!isTaskDone('video')
              ? <button onClick={() => completeTask('video', 10)} style={ACTION_BTN_STYLE}>✓ Mark as Watched</button>
              : <div className="text-success text-sm font-medium">✓ Completed!</div>}
          </div>
        )}

        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="section-title">📖 Read Resource — {roadmapItem?.topic}</h3>
            <div className="space-y-2">
              {[{ label:'Documentation', url: roadmapItem?.resource_url }, { label:'Article', url: roadmapItem?.article_url }]
                .filter(r => r.url)
                .map(r => (
                  <a key={r.label} href={r.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-all text-sm text-dark font-medium">
                    📚 {r.label} ↗
                  </a>
                ))}
            </div>
            {!isTaskDone('resource')
              ? <button onClick={() => completeTask('resource', 10)} style={ACTION_BTN_STYLE}>✓ Mark as Read</button>
              : <div className="text-success text-sm font-medium">✓ Completed!</div>}
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="section-title">{'{ }'} Coding Challenge</h3>
            {codingTest ? (
              <>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 600, color: '#e8f4ff', marginBottom: 6, fontSize: 15 }}>{codingTest.title}</div>
                  <p style={{ fontSize: 13, color: '#c8d8e8', lineHeight: 1.7 }}>{codingTest.problem}</p>
                  {codingTest.example_input && (
                    <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'JetBrains Mono,monospace', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 10 }}>
                      <div style={{ color: '#5a7a9a' }}>Input: <span style={{ color: '#00f0ff' }}>{codingTest.example_input}</span></div>
                      <div style={{ color: '#5a7a9a' }}>Output: <span style={{ color: '#1D9E75' }}>{codingTest.example_output}</span></div>
                    </div>
                  )}
                </div>
                <CodeEditor
                  token={localStorage.getItem('genois_token')}
                  taskDescription={codingTest?.problem || 'Complete the coding challenge'}
                  expectedOutput={codingTest?.example_output || null}
                  onComplete={submitCode}
                  isCompleted={isTaskDone('coding') || !!codeResult}
                />
                {codeResult && (
                  <div className="p-4 rounded-xl bg-gray-50 space-y-2">
                    <div className="flex gap-2">
                      <span className={`badge ${codeResult.review?.isCorrect ? 'badge-success' : 'badge-danger'}`}>{codeResult.review?.isCorrect ? 'Correct' : 'Needs Work'}</span>
                      <span className="badge badge-primary">Score: {codeResult.review?.score}/100</span>
                    </div>
                    <p className="text-sm text-gray-600">{codeResult.review?.feedback}</p>
                  </div>
                )}
              </>
            ) : <div className="text-gray-400 text-sm">Loading coding challenge...</div>}
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="section-title">✎ Daily Test — {roadmapItem?.topic}</h3>
            {!test && !testResult && (
              <button onClick={generateTest} disabled={testLoading} style={ACTION_BTN_STYLE}>
                {testLoading ? 'Claude is generating...' : 'Generate 5 Questions'}
              </button>
            )}
            {test && !testResult && (
              <div className="space-y-4">
                {test.questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium text-dark">Q{i+1}. {q.question}</p>
                    <div className="space-y-1">
                      {q.options.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${testAnswers[i] === opt[0] ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" name={`q${i}`} value={opt[0]} onChange={e => setTestAnswers(a => ({...a, [i]: e.target.value}))} className="text-primary" />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={submitTest} disabled={testLoading || Object.keys(testAnswers).length < test.questions.length}
                  style={ACTION_BTN_STYLE}>
                  {testLoading ? 'Grading...' : 'Submit Test'}
                </button>
              </div>
            )}
            {testResult && (
              <div className="space-y-3">
                <div className={`text-center p-6 rounded-xl ${testResult.result === 'passed' ? 'bg-success/8' : 'bg-orange-50'}`}>
                  <div className={`text-4xl font-bold ${testResult.result === 'passed' ? 'text-success' : 'text-orange-500'}`}>{testResult.score}%</div>
                  <div className="text-sm text-gray-500 mt-1">{testResult.correct}/{testResult.total} correct · {testResult.result === 'passed' ? '✅ Passed!' : '❌ Keep practicing'}</div>
                </div>
                {testResult.feedback?.map((f, i) => (
                   <div key={i} className={`p-3 rounded-lg text-sm ${f.isCorrect ? 'bg-success/5 text-success' : 'bg-red-50 text-red-600'}`}>
                    Q{i+1}: {f.isCorrect ? '✓ Correct' : `✗ Correct: ${f.correctAnswer}`}
                    {f.explanation && <p className="text-gray-500 text-xs mt-1">{f.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4">
            <h3 className="section-title">≡ AI Study Notes — {roadmapItem?.topic}</h3>
            <div className="flex gap-2">
              {['theory','coding','full','revision'].map(t => (
                <button key={t} onClick={() => setNoteType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all ${noteType === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}>{t}</button>
              ))}
            </div>
            {!note
              ? <button onClick={generateNotes} disabled={noteLoading} style={ACTION_BTN_STYLE}>
                  {noteLoading ? 'Claude is writing notes...' : `Generate ${noteType} notes`}
                </button>
              : <div style={{
                  background: '#0a1628',
                  color: '#e8f4ff',
                  border: '1px solid rgba(0,240,255,0.08)',
                  borderRadius: 12,
                  padding: 20,
                  fontSize: 14,
                  lineHeight: 1.9,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Outfit,sans-serif',
                }}>{note.content}</div>}
            {isTaskDone('notes') && <div className="text-success text-sm font-medium">✓ Completed!</div>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / 5) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{completedCount}/5 done</span>
      </div>
    </div>
  );
}
