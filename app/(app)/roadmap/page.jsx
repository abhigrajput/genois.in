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

  // Project submission states
  const [projectUrl, setProjectUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectProgress, setProjectProgress] = useState(null);

  useEffect(() => {
    loadDaily();
  }, []);

  useEffect(() => {
    if (daily?.projectProgress) {
      setProjectProgress(daily.projectProgress);
      const notes = daily.projectProgress.step_notes?.[0];
      if (notes?.githubUrl) setProjectUrl(notes.githubUrl);
      if (notes?.notes) setProjectNotes(notes.notes);
    }
  }, [daily]);

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

  async function completeTask(type) {
    try {
      const res = await taskAPI.completeTask({ taskType: type, completed: true, day: daily.currentDay });
      setTasks(prev => prev.map(t => t.type === type ? { ...t, status: 'completed', score: 20 } : t));
      toast.success(`+20 pts!`);
      
      const currentIndex = STEPS.indexOf(type);
      const nextIndex = currentIndex + 1;
      if (nextIndex < STEPS.length) {
        setTimeout(() => setActiveStep(nextIndex), 800);
      }

      if (res.data.allDone) {
        const nextDay = daily.currentDay + 1;
        toast.success(`🎉 Day ${daily.currentDay} complete! Day ${nextDay} unlocked!`, { duration: 4000 });
        updateProgress({ current_day: nextDay });
        setDaily(d => ({ ...d, dayUnlocked: true, newDay: nextDay }));
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
      await completeTask('test');
    } catch { toast.error('Failed to submit test'); } finally { setTestLoading(false); }
  }

  async function submitCode() {
    setCodeLoading(true);
    try {
      const res = await codingAPI.submit({ codingTestId: codingTest.id, code, language: codeLanguage });
      setCodeResult(res.data);
      await completeTask('coding');
    } catch { toast.error('Code submission failed'); } finally { setCodeLoading(false); }
  }

  async function generateNotes() {
    setNoteLoading(true);
    try {
      const res = await notesAPI.generate({ roadmapId: daily.roadmapItem.id, noteType });
      setNote(res.data.note);
      if (!isTaskDone('notes')) await completeTask('notes');
    } catch { toast.error('Failed to generate notes'); } finally { setNoteLoading(false); }
  }

  const submitProject = async (e) => {
    e.preventDefault();
    if (!projectUrl || !projectUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    setSubmittingProject(true);
    try {
      const token = localStorage.getItem('genois_token');
      const res = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectTitle: daily.project.title,
          githubUrl: projectUrl,
          week: daily.currentWeek,
          domain: daily.roadmapItem.domain_slug,
          notes: projectNotes,
          projectId: daily.project.id
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setProjectProgress({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          step_notes: [{ githubUrl: projectUrl, notes: projectNotes }]
        });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Project submission failed');
    } finally {
      setSubmittingProject(false);
    }
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading your roadmap...</div>;
  if (!daily) return <div className="text-gray-400 text-sm">No roadmap found.</div>;

  const { roadmapItem, currentDay, currentWeek, dayUnlocked, newDay, objectives, keyConcepts, codingProblem, codingProblemUrl, isProjectDay, project } = daily;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  // Find dynamic feedback if reviewed
  let aiFeedbackParsed = null;
  if (projectProgress?.ai_feedback) {
    try {
      aiFeedbackParsed = typeof projectProgress.ai_feedback === 'string' 
        ? JSON.parse(projectProgress.ai_feedback)
        : projectProgress.ai_feedback;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="w-full space-y-6" style={{ fontFamily: 'Outfit,sans-serif' }}>
      
      {/* Top Banner Area */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px'
      }}>
        <div>
          <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'Syne,sans-serif' }}>Day {currentDay} — {roadmapItem?.topic}</h1>
          <p className="text-sm text-gray-400 mt-1">Week {currentWeek} · {roadmapItem?.difficulty} · Follow the flow in order</p>
        </div>
        <div style={{
          background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)',
          borderRadius: '12px', padding: '8px 16px', textAlign: 'right'
        }}>
          <div style={{ fontSize: '11px', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>GENERATION LAYER</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase' }}>{daily.generatedBy || 'Supabase Cache'}</div>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Flow & Tasks (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Day Unlock Alerts */}
          {dayUnlocked && (
            <div style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              background: 'rgba(29,158,117,0.1)', border: '1px solid #1D9E75',
              boxShadow: '0 0 20px rgba(29,158,117,0.2)', color: '#e8f4ff', textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🎉 Day {currentDay} Complete! You earned 100 points!</div>
              <div style={{ fontSize: '14px', color: '#1D9E75', marginTop: '4px' }}>Day {newDay} is now unlocked</div>
            </div>
          )}

          {/* PROJECT DAY BANNER */}
          {isProjectDay && project && (
            <div style={{
              background: 'linear-gradient(135deg, #091322, #070f1a)',
              border: '1px solid rgba(0,240,255,0.15)',
              borderRadius: '16px', padding: '24px',
              backgroundImage: 'linear-gradient(rgba(0,240,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.02) 1px,transparent 1px)',
              backgroundSize: '24px 24px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg,transparent,rgba(0,240,255,0.5),transparent)'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  background: 'rgba(123,92,255,0.15)', border: '1px solid rgba(123,92,255,0.3)',
                  color: '#9d85ff', fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                  borderRadius: '20px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace'
                }}>🚀 Project Week! Time to Build</span>
                <span style={{ fontSize: '13px', color: '#5a7a9a', fontWeight: 600 }}>⏱️ Est: {project.estimated_hours || 20} Hours</span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#e8f4ff', fontFamily: 'Syne,sans-serif' }}>{project.title}</h2>
              <p style={{ fontSize: '14px', color: '#8aa2b9', marginTop: '6px', lineHeight: 1.6 }}>{project.description}</p>

              {/* Steps Accordion */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '13px', color: '#5a7a9a', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Milestone Steps</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {project.steps?.map((step, idx) => (
                    <div key={idx} style={{
                      display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px',
                      fontSize: '13px', color: '#c8d8e8'
                    }}>
                      <span style={{ color: '#00f0ff', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>0{idx+1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub Submission Form */}
              <div style={{
                marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '20px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e8f4ff', marginBottom: '12px' }}>Submit Your Code</h3>
                
                {projectProgress?.status === 'submitted' && (
                  <div style={{
                    background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '12px', padding: '14px', color: '#00f0ff', fontSize: '13px'
                  }}>
                    ⏳ <strong>Under AI Review:</strong> Your project has been submitted successfully. A senior AI mentor is currently reviewing your GitHub repository. Feedback and score adjustments will appear below in 2-3 minutes!
                  </div>
                )}

                {projectProgress?.status === 'reviewed' && aiFeedbackParsed && (
                  <div style={{
                    background: 'rgba(29,158,117,0.05)', border: '1px solid rgba(29,158,117,0.2)',
                    borderRadius: '12px', padding: '16px', color: '#e8f4ff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#1D9E75', fontWeight: 700 }}>✅ AI Assessment Complete</span>
                      <span style={{
                        background: 'rgba(29,158,117,0.2)', color: '#1D9E75', fontWeight: 800,
                        fontSize: '16px', padding: '4px 12px', borderRadius: '8px'
                      }}>{aiFeedbackParsed.grade} ({aiFeedbackParsed.score}/100)</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#a2b9cd', lineHeight: 1.6, marginBottom: '12px' }}>{aiFeedbackParsed.overall_feedback}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1D9E75', marginBottom: '4px' }}>Strengths</div>
                        {aiFeedbackParsed.strengths?.slice(0, 2).map((s, i) => <div key={i}>• {s}</div>)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#ff5c8a', marginBottom: '4px' }}>Improvements</div>
                        {aiFeedbackParsed.improvements?.slice(0, 2).map((im, i) => <div key={i}>• {im}</div>)}
                      </div>
                    </div>
                  </div>
                )}

                {(!projectProgress || projectProgress.status === 'not_started') && (
                  <form onSubmit={submitProject} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#5a7a9a', textTransform: 'uppercase', marginBottom: '4px' }}>GitHub Repository URL</label>
                      <input type="url" required value={projectUrl} onChange={e => setProjectUrl(e.target.value)}
                        placeholder="https://github.com/yourusername/your-project"
                        style={{
                          width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.15)',
                          background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: '13px', outline: 'none'
                        }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#5a7a9a', textTransform: 'uppercase', marginBottom: '4px' }}>Project Notes (Optional)</label>
                      <textarea value={projectNotes} onChange={e => setProjectNotes(e.target.value)} rows={2}
                        placeholder="Brief notes about your tech stack or challenges faced..."
                        style={{
                          width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.15)',
                          background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: '13px', outline: 'none', resize: 'none'
                        }} />
                    </div>
                    <button type="submit" disabled={submittingProject} style={{
                      padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 700,
                      background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      {submittingProject ? 'Submitting Code...' : 'Submit Repository for AI Audit →'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Navigation Steps Tabs */}
          <div className="flex gap-2 flex-wrap">
            {STEPS.map((step, i) => (
              <button key={step} onClick={() => setActiveStep(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isTaskDone(step) ? 'bg-success/10 text-success border-success/20' : activeStep === i ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}>
                {isTaskDone(step) ? '✓ ' : ''}{STEP_LABELS[step]}
              </button>
            ))}
          </div>

          {/* Main Card View */}
          <div className="card min-h-64" style={{ width: '100%' }}>
            
            {activeStep === 0 && (
              <div className="space-y-4">
                <h3 className="section-title">▶ Watch Video — {roadmapItem?.topic}</h3>
                <p className="text-sm text-gray-500">Watch the video to learn the theory before coding.</p>
                {roadmapItem?.video_url && (
                  <a href={roadmapItem.video_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex">Open on YouTube ↗</a>
                )}
                {!isTaskDone('video')
                  ? <button onClick={() => completeTask('video')} style={ACTION_BTN_STYLE}>✓ Mark as Watched</button>
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
                  ? <button onClick={() => completeTask('resource')} style={ACTION_BTN_STYLE}>✓ Mark as Read</button>
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

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / 5) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{completedCount}/5 done</span>
          </div>

        </div>

        {/* Right Column: objectives, key concepts, coding problem (1/3 width) */}
        <div className="space-y-6">
          
          {/* Daily Objectives Card */}
          {objectives && objectives.length > 0 && (
            <div style={{
              background: '#070f1a', border: '1px solid rgba(0,240,255,0.08)',
              borderRadius: '16px', padding: '20px'
            }}>
              <h3 style={{
                fontSize: '14px', fontWeight: 800, color: '#e8f4ff', marginBottom: '14px',
                fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '1px'
              }}>🎯 Daily Objectives</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,240,255,0.1)',
                      color: '#00f0ff', fontSize: '11px', fontWeight: 700, flexShrink: 0
                    }}>{i+1}</span>
                    <span style={{ fontSize: '13px', color: '#c8d8e8', lineHeight: 1.5 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts Card */}
          {keyConcepts && keyConcepts.length > 0 && (
            <div style={{
              background: '#070f1a', border: '1px solid rgba(0,240,255,0.08)',
              borderRadius: '16px', padding: '20px'
            }}>
              <h3 style={{
                fontSize: '14px', fontWeight: 800, color: '#e8f4ff', marginBottom: '12px',
                fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '1px'
              }}>💡 Key Concepts</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {keyConcepts.map((concept, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#a2b9cd'
                  }}>
                    #{concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coding Problem Spotlight */}
          {codingProblem && (
            <div style={{
              background: '#070f1a', border: '1px solid rgba(29,158,117,0.15)',
              borderRadius: '16px', padding: '20px',
              backgroundImage: 'linear-gradient(rgba(29,158,117,0.01) 1px,transparent 1px)',
              backgroundSize: '100% 8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>💻</span>
                <h3 style={{
                  fontSize: '14px', fontWeight: 800, color: '#e8f4ff',
                  fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '1px'
                }}>Coding Problem</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#c8d8e8', lineHeight: 1.5, marginBottom: '14px' }}>
                Validate today's skills by solving: <strong style={{ color: '#00f0ff' }}>{codingProblem}</strong>
              </p>
              {codingProblemUrl && (
                <a href={codingProblemUrl} target="_blank" rel="noreferrer" style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%',
                  padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 700,
                  background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)',
                  color: '#1D9E75', textDecoration: 'none', fontSize: '12px', transition: 'all 0.2s'
                }}>
                  Practice Problem ↗
                </a>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
