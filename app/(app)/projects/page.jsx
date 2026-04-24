'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const STEP_GUIDE = [
  {
    title: 'Setup Your Computer',
    time: '30 minutes',
    icon: '💻',
    color: '#7F77DD',
    intro: 'Before writing any code, you need to set up your computer properly. This is like preparing your kitchen before cooking.',
    tasks: [
      'Download and install VS Code from https://code.visualstudio.com (it is free)',
      'Open VS Code after installing',
      'Press Ctrl+Shift+` (backtick key, top left of keyboard) to open the terminal inside VS Code',
      'The terminal is where you type commands to install things and run your code',
      'Create a new folder for your project: type "mkdir my-project" and press Enter',
      'Open that folder: type "cd my-project" and press Enter',
    ],
    quiz: [
      { q: 'What shortcut opens the terminal in VS Code?', options: ['Ctrl+T', 'Ctrl+Shift+`', 'Alt+Enter', 'F12'], ans: 1 },
      { q: 'What command creates a new folder?', options: ['cd', 'mkdir', 'create', 'new'], ans: 1 },
    ],
    tip: 'Think of VS Code as your workshop and the terminal as your toolbox. You need both to build things.',
  },
  {
    title: 'Install and Write Core Code',
    time: '2 to 3 hours',
    icon: '⌨️',
    color: '#1D9E75',
    intro: 'Now you will install the tools your project needs and write the main code. Do not worry if you make mistakes — every developer makes mistakes.',
    tasks: [
      'In the terminal, install required packages (the exact command is shown in your project description above)',
      'Create your main file: right click in VS Code left panel → New File → name it as per your project',
      'Write the code ONE function at a time. Do not write everything at once.',
      'After writing each function, test it: type "python yourfile.py" or "node yourfile.js" to run',
      'If you see an error, READ the error message carefully — it tells you exactly what is wrong',
      'Copy the error and search on Google if you do not understand it — this is what every developer does',
    ],
    quiz: [
      { q: 'What should you do after writing each function?', options: ['Delete it', 'Test it immediately', 'Write 10 more functions', 'Ask someone else'], ans: 1 },
      { q: 'What do you do when you see an error?', options: ['Give up', 'Read the error message carefully', 'Delete the file', 'Restart computer'], ans: 1 },
    ],
    tip: 'Real developers spend 70% of time reading errors and fixing them. Errors are not failures — they are instructions.',
  },
  {
    title: 'Test and Fix Everything',
    time: '1 hour',
    icon: '🧪',
    color: '#D85A30',
    intro: 'Testing means trying to break your own project. If you cannot break it, neither can others. This step makes your project reliable.',
    tasks: [
      'Run your project and use every feature you built',
      'Try entering wrong inputs — what happens? Does it crash or show a helpful message?',
      'Try the most common mistake users make and see if your code handles it',
      'Fix every crash or confusing behavior you find',
      'Ask one friend or family member to try using it — watch where they get confused',
      'Fix the top 3 issues you find from testing',
    ],
    quiz: [
      { q: 'Why do we test our own project?', options: ['To waste time', 'To find and fix problems before users do', 'Because teacher said so', 'To make it slower'], ans: 1 },
      { q: 'What is the best way to find confusing parts of your app?', options: ['Read the code', 'Ask someone unfamiliar to use it', 'Add more code', 'Delete features'], ans: 1 },
    ],
    tip: 'The best testers are people who have never seen your project before. Their confusion shows you what to improve.',
  },
  {
    title: 'Deploy and Submit',
    time: '30 minutes',
    icon: '🚀',
    color: '#EF9F27',
    intro: 'Deploying means putting your project on the internet so anyone can access it. This is what makes it a real project you can show in interviews.',
    tasks: [
      'Create a free account on GitHub at https://github.com if you do not have one',
      'In terminal type: git init, then git add ., then git commit -m "my first project"',
      'Create a new repository on GitHub website and follow the instructions to push your code',
      'Go to https://vercel.com and sign in with GitHub',
      'Click New Project, select your repository, click Deploy',
      'Copy the live URL that Vercel gives you (ends in .vercel.app) and submit it here',
    ],
    quiz: [
      { q: 'What does deploying mean?', options: ['Deleting your project', 'Putting your project on the internet', 'Printing your code', 'Saving to USB'], ans: 1 },
      { q: 'Which platform gives you a free live URL for your project?', options: ['Google Drive', 'Vercel', 'Notepad', 'Calculator'], ans: 1 },
    ],
    tip: 'A live URL is worth 10x more than code on your laptop in interviews. Recruiters want to see it working.',
  },
];

export default function ProjectsPage() {
  const { token, ready } = useToken();
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [week, setWeek] = useState(1);
  const [checked, setChecked] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});
  const [expandedStep, setExpandedStep] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your project mentor 🛠️ Ask me anything about your current project. I will guide you step by step without giving you direct answers — so you actually learn.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/roadmap/daily', token)
      .then(r => {
        const w = r.data?.currentWeek || 1;
        setWeek(w);
        return apiFetch('/api/projects/week/' + w, token);
      })
      .then(r => {
        setProject(r.data.project);
        setProgress(r.data.progress);
        setExpandedStep(r.data.progress?.current_step || 0);
      })
      .catch(err => toast.error('Could not load project: ' + err.message))
      .finally(() => setLoading(false));
  }, [ready, token]);

  async function completeStep(i) {
    if (!project || !token) return;
    const allChecked = STEP_GUIDE[i].tasks.every((_, j) => checked[i + '_' + j]);
    if (!allChecked) {
      toast.error('Please tick all tasks before completing this step');
      return;
    }
    const quizDone = quizSubmitted[i];
    if (!quizDone) {
      toast.error('Please answer the quiz questions first');
      return;
    }
    try {
      const res = await apiFetch('/api/projects/' + project.id + '/step', token, 'POST', {
        stepNumber: i,
        notes: 'Step ' + (i + 1) + ' completed with tasks and quiz',
      });
      setProgress(res.data.progress);
      setExpandedStep(i + 1);
      toast.success('Step ' + (i + 1) + ' complete! 🎉');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function submitProject() {
    if (!project || !token) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/projects/' + project.id + '/submit', token, 'POST', {});
      setFeedback(res.data.aiFeedback);
      toast.success('Project submitted! +30 pts 🎉');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading || !token) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/project-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          message: userMsg,
          projectTitle: project?.title,
          projectDescription: project?.description,
          techStack: project?.tech_stack,
          currentStep: progress?.current_step || 0,
          history: chatMessages.slice(-6),
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.data?.reply || 'Let me think about that...' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  const toggle = (k) => setChecked(p => ({ ...p, [k]: !p[k] }));

  function submitQuiz(stepIndex) {
    const step = STEP_GUIDE[stepIndex];
    let correct = 0;
    step.quiz.forEach((q, qi) => {
      if (quizAnswers[stepIndex + '_' + qi] === q.ans) correct++;
    });
    setQuizSubmitted(p => ({ ...p, [stepIndex]: { correct, total: step.quiz.length } }));
    if (correct === step.quiz.length) {
      toast.success('Perfect score! All answers correct ✅');
    } else {
      toast.error(correct + '/' + step.quiz.length + ' correct. Review and try again.');
    }
  }

  const cur = progress?.current_step || 0;
  const card = { background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 14 };

  if (!ready || loading) return (
    <div style={{ textAlign: 'center', paddingTop: 80, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading your project...
    </div>
  );

  if (!project) return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 16 }}>Projects</h1>
      <div style={{ ...card, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>◆</div>
        <div style={{ color: '#e8f4ff', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No project for Week {week} yet</div>
        <div style={{ color: '#5a7a9a', fontSize: 13 }}>Go to Daily Roadmap and complete today tasks first</div>
      </div>
    </div>
  );

  const steps = (() => {
    try {
      if (Array.isArray(project.steps)) return project.steps;
      if (typeof project.steps === 'string') return JSON.parse(project.steps);
    } catch {}
    return [];
  })();

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>Projects</h1>
      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>Week {week} · Build this in VS Code on your computer · Takes 2 weeks</p>

      <div style={{ ...card, borderColor: 'rgba(186,117,23,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#BA7517,transparent)' }} />
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#BA7517', letterSpacing: 2, marginBottom: 6 }}>WEEK {week} PROJECT</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: '#e8f4ff', marginBottom: 6 }}>{project.title}</div>
        <div style={{ fontSize: 13, color: '#5a7a9a', lineHeight: 1.7, marginBottom: 12 }}>{project.description}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {(project.tech_stack || []).map(t => (
            <span key={t} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(0,240,255,0.08)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)', fontFamily: 'JetBrains Mono,monospace' }}>{t}</span>
          ))}
        </div>

        {steps.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: '#EF9F27', marginBottom: 10 }}>📋 Project Details from Your Domain</div>
            {steps.map((step, i) => (
              <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.6 }}>
                <span style={{ color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace', marginRight: 8 }}>{i + 1}.</span>
                {typeof step === 'string' ? step : JSON.stringify(step)}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(cur / 4) * 100}%`, background: 'linear-gradient(90deg,#BA7517,#EF9F27)', borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 6, fontFamily: 'JetBrains Mono,monospace' }}>{cur}/4 steps done</div>
      </div>

      {STEP_GUIDE.map((step, i) => {
        const done = i < cur;
        const active = i === cur;
        const locked = i > cur;
        const isExpanded = expandedStep === i;
        const qDone = quizSubmitted[i];

        return (
          <div key={i} style={{ ...card, borderColor: done ? 'rgba(29,158,117,0.2)' : active ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.04)', opacity: locked ? 0.4 : 1 }}>
            <div
              onClick={() => !locked && setExpandedStep(isExpanded ? null : i)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: locked ? 'default' : 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: done ? 'rgba(29,158,117,0.15)' : active ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)', color: done ? '#1D9E75' : active ? '#00f0ff' : '#5a7a9a', border: `2px solid ${done ? '#1D9E75' : active ? '#00f0ff' : 'rgba(255,255,255,0.08)'}` }}>
                {done ? '✓' : step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600, color: done ? '#1D9E75' : active ? '#e8f4ff' : '#5a7a9a' }}>
                  Step {i + 1}: {step.title}
                </div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                  {done ? 'COMPLETED ✓' : active ? 'CURRENT · ' + step.time : 'LOCKED'}
                </div>
              </div>
              {!locked && <div style={{ color: '#5a7a9a', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</div>}
            </div>

            {isExpanded && !locked && (
              <div style={{ marginTop: 16 }}>
                <div style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#c8d8e8', lineHeight: 1.8 }}>💡 {step.intro}</div>
                </div>

                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: step.color, marginBottom: 10 }}>
                  ✅ Your Tasks — tick each one as you complete it:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {step.tasks.map((task, j) => (
                    <label key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: checked[i + '_' + j] ? 'rgba(29,158,117,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked[i + '_' + j] ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <input type="checkbox" checked={checked[i + '_' + j] || false} onChange={() => toggle(i + '_' + j)} style={{ accentColor: '#00f0ff', marginTop: 3, flexShrink: 0, width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, color: checked[i + '_' + j] ? '#5a7a9a' : '#c8d8e8', textDecoration: checked[i + '_' + j] ? 'line-through' : 'none', lineHeight: 1.6 }}>{task}</span>
                    </label>
                  ))}
                </div>

                <div style={{ background: 'rgba(123,92,255,0.06)', border: '1px solid rgba(123,92,255,0.2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: '#7b5cff', marginBottom: 12 }}>
                    🧠 Quick Check — Answer these before moving on:
                  </div>
                  {step.quiz.map((q, qi) => (
                    <div key={qi} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#e8f4ff', marginBottom: 8 }}>Q{qi + 1}: {q.q}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options.map((opt, oi) => {
                          const selected = quizAnswers[i + '_' + qi] === oi;
                          const isCorrect = qDone && oi === q.ans;
                          const isWrong = qDone && selected && oi !== q.ans;
                          return (
                            <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: qDone ? 'default' : 'pointer', background: isCorrect ? 'rgba(29,158,117,0.15)' : isWrong ? 'rgba(255,45,120,0.1)' : selected ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isCorrect ? '#1D9E75' : isWrong ? '#ff2d78' : selected ? '#00f0ff' : 'rgba(255,255,255,0.06)'}` }}>
                              <input type="radio" name={`q_${i}_${qi}`} disabled={!!qDone} checked={selected} onChange={() => setQuizAnswers(p => ({ ...p, [i + '_' + qi]: oi }))} style={{ accentColor: '#00f0ff' }} />
                              <span style={{ fontSize: 13, color: isCorrect ? '#1D9E75' : isWrong ? '#ff2d78' : '#c8d8e8' }}>{opt}</span>
                              {isCorrect && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontSize: 12 }}>✓ Correct</span>}
                              {isWrong && <span style={{ marginLeft: 'auto', color: '#ff2d78', fontSize: 12 }}>✗ Wrong</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {!qDone ? (
                    <button onClick={() => submitQuiz(i)} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7b5cff,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                      Submit Answers
                    </button>
                  ) : (
                    <div style={{ fontSize: 13, color: qDone.correct === qDone.total ? '#1D9E75' : '#EF9F27', marginTop: 4 }}>
                      {qDone.correct === qDone.total ? '✅ All correct! You understood this step.' : `${qDone.correct}/${qDone.total} correct. Review the tasks above and try again if needed.`}
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(239,159,39,0.06)', border: '1px solid rgba(239,159,39,0.2)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: '#EF9F27' }}>💡 Pro tip: {step.tip}</span>
                </div>

                {active && (
                  <button onClick={() => completeStep(i)} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
                    ✓ I completed Step {i + 1} — Move to Next
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {cur >= 4 && !feedback && (
        <div style={{ ...card, textAlign: 'center', borderColor: 'rgba(29,158,117,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#1D9E75', marginBottom: 6 }}>All steps done!</div>
          <div style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>Submit your project for AI feedback and earn 30 points</div>
          <button onClick={submitProject} disabled={submitting} style={{ padding: '13px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1D9E75,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
            {submitting ? 'Claude is reviewing your project...' : 'Submit Project for AI Review →'}
          </button>
        </div>
      )}

      {feedback && (
        <div style={{ ...card, borderColor: 'rgba(29,158,117,0.25)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#1D9E75', marginBottom: 12 }}>✓ AI Feedback on Your Project</div>
          <div style={{ fontSize: 14, color: '#e8f4ff', lineHeight: 1.9 }}>{feedback}</div>
        </div>
      )}

      {/* Floating project mentor chat */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
        {chatOpen && (
          <div style={{
            position: 'absolute', bottom: 64, right: 0,
            width: 320, height: 420,
            background: '#070f1f',
            border: '1px solid rgba(0,240,255,0.2)',
            borderRadius: 16,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,240,255,0.1)', background: 'rgba(0,240,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#00f0ff' }}>🛠️ Project Mentor</div>
                <div style={{ fontSize: 11, color: '#5a7a9a' }}>{project?.title}</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#5a7a9a', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  maxWidth: '85%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(123,92,255,0.2))' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: 13, color: '#e8f4ff', lineHeight: 1.6,
                }}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#5a7a9a', fontSize: 13 }}>
                  Thinking...
                </div>
              )}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid rgba(0,240,255,0.1)', display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                placeholder="Ask about your project..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 13, fontFamily: 'Outfit,sans-serif', outline: 'none' }}
              />
              <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontWeight: 700, fontSize: 14 }}>
                →
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 20px rgba(0,240,255,0.4)' }}>
          {chatOpen ? '✕' : '🛠️'}
        </button>
      </div>
    </div>
  );
}
