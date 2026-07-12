'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

const DOMAIN_PROJECTS = {
  fullstack: [
    { week: 4, title: 'Personal Portfolio Website', difficulty: 'beginner', description: 'Build a responsive portfolio with HTML/CSS showing your profile, skills, and contact form', steps: ['Setup VS Code project', 'Create index.html structure', 'Design responsive stylesheet', 'Add contact form with input validations', 'Push code to GitHub', 'Deploy on Vercel/Netlify'] },
    { week: 8, title: 'JavaScript Quiz App', difficulty: 'beginner', description: 'Build an interactive quiz app with timer, score tracking, and local storage', steps: ['Setup HTML/CSS layout', 'Write quiz questions data', 'Implement timer countdown logic', 'Handle question transitions & grading', 'Store user highscores in LocalStorage'] },
    { week: 12, title: 'React Todo App with Authentication', difficulty: 'beginner', description: 'Full todo app with React hooks, user auth, and persistent storage', steps: ['Create React app with Vite', 'Build interactive todo components', 'Integrate state management using Hooks', 'Add login/signup forms', 'Connect to Supabase backend'] },
    { week: 16, title: 'REST API with Node.js', difficulty: 'intermediate', description: 'Build a complete REST API with Express, JWT auth, and PostgreSQL', steps: ['Setup Express server structure', 'Design database schemas', 'Implement JWT token signing middleware', 'Write CRUD handlers for items', 'Test end-to-end with Postman'] },
    { week: 20, title: 'Full Stack Blog Platform', difficulty: 'intermediate', description: 'Complete blog with React frontend, Node backend, PostgreSQL database', steps: ['Create project workspace directories', 'Build database migrations & seeds', 'Develop Node.js auth & post handlers', 'Construct React feed & editor panels', 'Connect API endpoints to client'] },
    { week: 24, title: 'E-commerce App with Next.js', difficulty: 'advanced', description: 'Full e-commerce with product listing, cart, payments, and admin panel', steps: ['Initialize Next.js application', 'Design product listing layouts', 'Implement shopping cart state actions', 'Integrate Stripe checkout API', 'Build vendor control dashboard'] },
    { week: 28, title: 'Real-time Chat Application', difficulty: 'advanced', description: 'Chat app with WebSockets, rooms, message history, and notifications', steps: ['Design client-server socket events', 'Setup Socket.io with Node server', 'Create real-time chat room states', 'Persist messages in database', 'Add browser push notifications'] },
    { week: 32, title: 'Social Media Platform', difficulty: 'advanced', description: 'Social app with posts, likes, comments, follows, and real-time updates', steps: ['Design relational database tables', 'Build post and media uploading API', 'Create interactive likes & comments', 'Implement user follow mechanics', 'Integrate visual news feed activity'] },
    { week: 40, title: 'SaaS Application', difficulty: 'expert', description: 'Complete SaaS product with subscriptions, dashboard, and analytics', steps: ['Map core value offering features', 'Build Stripe subscription pricing tiers', 'Construct user analytics dashboard', 'Implement usage limits middleware', 'Add visual usage charts'] },
    { week: 52, title: 'Portfolio Capstone Project', difficulty: 'expert', description: 'Your best project combining all skills - deploy and present to employers', steps: ['Brainstorm capstone scope & specs', 'Design UI system and schema', 'Develop fullstack features securely', 'Deploy with CI/CD pipelines', 'Create video demo and case study'] }
  ],
  dsa: [
    { week: 4, title: 'Array & String Problem Set', difficulty: 'beginner', description: 'Solve 20 array and string problems on LeetCode, write C++ solutions with explanations', steps: ['Select 10 Easy & 10 Medium problems', 'Implement highly optimized solutions', 'Write space/time complexity analyses', 'Push solution codes to GitHub', 'Create markdown documentation'] },
    { week: 8, title: 'Linked List Library', difficulty: 'beginner', description: 'Build a complete linked list implementation in C++ with all operations and visualizer', steps: ['Design Node structures in C++', 'Implement Singly & Doubly List classes', 'Write insert, delete, reverse methods', 'Build command-line visualizer', 'Add thorough memory management'] },
    { week: 12, title: 'Custom Stack & Queue Implementation', difficulty: 'beginner', description: 'Implement stack, queue, and deque from scratch in C++ with all edge cases', steps: ['Design Array and Node backed states', 'Implement push, pop, enqueue, dequeue', 'Write boundary & capacity validations', 'Include sliding window maximum test', 'Publish as reusable headers'] },
    { week: 16, title: 'Binary Tree Visualizer', difficulty: 'intermediate', description: 'Build a C++ program that builds and visualizes binary trees with all traversals', steps: ['Build tree node representations', 'Write level-order insertion methods', 'Implement DFS & BFS traversal steps', 'Create textual tree printer visual', 'Compile and execute test scenarios'] },
    { week: 20, title: 'Graph Problem Solver', difficulty: 'intermediate', description: 'Implement BFS, DFS, Dijkstra, and Kruskal in C++ with a graph visualizer', steps: ['Design Adjacency List graph class', 'Implement BFS and DFS search patterns', 'Develop Dijkstra shortest-path logic', 'Write Union-Find Kruskal MST code', 'Generate dot layouts for visualization'] },
    { week: 24, title: 'DP Problem Collection', difficulty: 'advanced', description: 'Solve 30 DP problems with detailed explanations, time/space analysis in C++', steps: ['Aggregate 30 core DP problem statements', 'Provide recursive top-down solutions', 'Add memoization array structures', 'Implement optimized bottom-up tables', 'Document time & space gains'] },
    { week: 28, title: 'Competitive Programming Toolkit', difficulty: 'advanced', description: 'Build a C++ template with all common algorithms ready for competitive programming', steps: ['Write fast I/O configuration macros', 'Include custom vector/string helpers', 'Implement modular arithmetic math library', 'Add segment tree template class', 'Verify on standard contest problems'] },
    { week: 36, title: 'LeetCode 100 Challenge', difficulty: 'expert', description: 'Solve 100 LeetCode problems (easy/medium/hard mix) and document all solutions', steps: ['Formulate a checklist of 100 problems', 'Commit solutions divided by patterns', 'Add exhaustive descriptive comments', 'Outline alternative strategies', 'Track performance benchmarks'] },
    { week: 44, title: 'Mock Interview Preparation', difficulty: 'expert', description: 'Complete 50 mock interview problems with time constraints and explanations', steps: ['Select 50 popular interview questions', 'Simulate 45-minute solving trials', 'Refine verbal problem explanation notes', 'Write dry-run execution tables', 'Verify edge case optimizations'] },
    { week: 52, title: 'Complete DSA Portfolio', difficulty: 'expert', description: 'GitHub repo with all solutions, complexity analysis, and study notes', steps: ['Organize repository layout logically', 'Write extensive master README.md', 'Create topical category directories', 'Format code files elegantly', 'Promote portfolio link to LinkedIn'] }
  ],
  cybersecurity: [
    { week: 4, title: 'Network Scanner Tool', difficulty: 'beginner', description: 'Build a Python network scanner using sockets to discover hosts and open ports', steps: ['Import socket and sys modules', 'Setup target IP range parsing', 'Implement multi-threaded port scanner', 'Add timeout and error handling', 'Output scan report nicely'] },
    { week: 8, title: 'Password Cracker', difficulty: 'beginner', description: 'Build a Python dictionary attack tool for educational purposes', steps: ['Review hash algorithms (SHA256, MD5)', 'Read password dictionary file safely', 'Implement hashing comparison functions', 'Optimize verification throughput', 'Add clear terminal alerts'] }
  ]
};

export default function ProjectsPortfolioPage() {
  const { user } = useAuthStore();
  const domain = user?.domain_slug || 'fullstack';
  const [currentWeek, setCurrentWeek] = useState(1);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submission form states per project
  const [activeSubmitting, setActiveSubmitting] = useState(null); // project title
  const [githubUrl, setGithubUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('genois_token');
      // Fetch dynamic current progress first
      const rRes = await fetch('/api/roadmap/daily', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rData = await rRes.json();
      if (rData.success) {
        const currentDay = rData.data?.currentDay || 1;
        setCurrentWeek(Math.ceil(currentDay / 7));
      }

      const res = await fetch('/api/projects/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.data.projects || []);
      }
    } catch {
      toast.error('Failed to load project portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const submitProject = async (e, project) => {
    e.preventDefault();
    if (!githubUrl || !githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('genois_token');
      const res = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectTitle: project.title,
          githubUrl,
          week: project.week,
          domain,
          notes: projectNotes,
          projectId: project.id || 'p_week_' + project.week // fallback or generated UUID
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setActiveSubmitting(null);
        setGithubUrl('');
        setProjectNotes('');
        fetchHistory(); // reload history
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Project submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getProjectStatus = (projTitle) => {
    const record = historyList.find(h => h.projects?.title === projTitle);
    return record ? record.status : 'not_started';
  };

  const getProjectProgress = (projTitle) => {
    return historyList.find(h => h.projects?.title === projTitle) || null;
  };

  const projects = DOMAIN_PROJECTS[domain] || DOMAIN_PROJECTS.fullstack;

  if (loading) return <div className="text-gray-400 text-sm">Loading projects portfolio...</div>;

  return (
    <div className="w-full space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-heading)' }}>🎓 Career Projects Portfolio</h1>
        <p className="text-sm text-gray-400 mt-1">Build outstanding, real-world portfolio assets as you progress through your 52-week curriculum.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: All Projects Timeline & Accordeon (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          {projects.map((proj, idx) => {
            const status = getProjectStatus(proj.title);
            const isLocked = idx >= 2 && proj.week > currentWeek + 2;
            const progressRecord = getProjectProgress(proj.title);

            // Parse AI feedback if available
            let feedback = null;
            if (progressRecord?.ai_feedback) {
              try {
                feedback = typeof progressRecord.ai_feedback === 'string'
                  ? JSON.parse(progressRecord.ai_feedback)
                  : progressRecord.ai_feedback;
              } catch (e) {
                console.error(e);
              }
            }

            return (
              <div key={idx} style={{
                background: '#070f1a',
                border: isLocked ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,217,163,0.08)',
                borderRadius: '16px', padding: '20px', opacity: isLocked ? 0.5 : 1,
                position: 'relative', overflow: 'hidden', transition: 'all 0.25s'
              }}>
                {/* Horizontal flow line for timeline */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                  background: isLocked ? 'rgba(255,255,255,0.05)' : status === 'reviewed' ? '#1D9E75' : status === 'submitted' ? '#00d9a3' : 'rgba(0,217,163,0.15)'
                }} />

                {/* Title & Badge Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingLeft: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>WEEK {proj.week}</span>
                    <span style={{
                      background: 'rgba(255,255,255,0.03)', color: '#c8d8e8', fontSize: '10px',
                      textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', fontWeight: 600
                    }}>{proj.difficulty}</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isLocked && <span className="text-gray-500 text-xs font-semibold">🔒 Locked</span>}
                    {!isLocked && status === 'not_started' && <span className="text-gray-400 text-xs font-semibold">⏳ Not Started</span>}
                    {!isLocked && status === 'submitted' && <span style={{ color: '#00d9a3', fontSize: '12px', fontWeight: 700 }}>🛸 Under AI Audit</span>}
                    {!isLocked && status === 'reviewed' && <span style={{ color: '#1D9E75', fontSize: '12px', fontWeight: 700 }}>✅ Audit Completed</span>}
                  </div>
                </div>

                {/* Project Details */}
                <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#e8e8ed', fontFamily: 'var(--font-heading)' }}>{proj.title}</h2>
                  <p style={{ fontSize: '13.5px', color: '#8aa2b9', marginTop: '4px', lineHeight: 1.5 }}>{proj.description}</p>

                  {/* Steps Accordion */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#5a7a9a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Implementation steps</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                      {proj.steps.map((st, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)',
                          padding: '8px 10px', borderRadius: '8px', fontSize: '12px', color: '#b2c8dc',
                          border: '1px solid rgba(255,255,255,0.02)'
                        }}>
                          <span style={{ color: '#00d9a3', fontWeight: 700 }}>{i+1}</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Repository Section */}
                  {!isLocked && status === 'not_started' && activeSubmitting !== proj.title && (
                    <button onClick={() => {
                      setActiveSubmitting(proj.title);
                      // Assign dynamically generated project UUID or standard ID if exists in db
                      proj.id = progressRecord?.project_id || 'dummy-uuid-needed';
                    }} style={{
                      marginTop: '16px', background: 'linear-gradient(135deg, #00d9a3, #ff6b4a)',
                      color: '#020812', fontWeight: 700, fontSize: '13px', padding: '10px 20px',
                      borderRadius: '8px', border: 'none', cursor: 'pointer'
                    }}>
                      Start Project & Submit Code →
                    </button>
                  )}

                  {activeSubmitting === proj.title && (
                    <form onSubmit={(e) => submitProject(e, proj)} style={{
                      marginTop: '16px', padding: '14px', borderRadius: '12px',
                      border: '1px solid rgba(0,217,163,0.2)', background: 'rgba(0,0,0,0.15)',
                      display: 'flex', flexDirection: 'column', gap: '10px'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#5a7a9a', textTransform: 'uppercase', marginBottom: '4px' }}>GitHub Repo URL</label>
                        <input type="url" required value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/yourusername/portfolio"
                          style={{
                            width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,217,163,0.15)',
                            background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: '13px', outline: 'none'
                          }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#5a7a9a', textTransform: 'uppercase', marginBottom: '4px' }}>Submission Notes</label>
                        <textarea value={projectNotes} onChange={e => setProjectNotes(e.target.value)} rows={2}
                          placeholder="List technologies used, features implemented..."
                          style={{
                            width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,217,163,0.15)',
                            background: 'rgba(255,255,255,0.03)', color: '#e8e8ed', fontSize: '13px', outline: 'none', resize: 'none'
                          }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" disabled={submitting} style={{
                          flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 700,
                          background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', cursor: 'pointer'
                        }}>{submitting ? 'Submitting...' : 'Submit Repository'}</button>
                        <button type="button" onClick={() => setActiveSubmitting(null)} style={{
                          padding: '10px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                          background: 'transparent', color: '#c8d8e8', cursor: 'pointer'
                        }}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {/* AI feedback view */}
                  {status === 'reviewed' && feedback && (
                    <div style={{
                      marginTop: '16px', padding: '16px', borderRadius: '12px',
                      border: '1px solid rgba(29,158,117,0.2)', background: 'rgba(29,158,117,0.03)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#1D9E75', fontWeight: 700 }}>🎯 Senior AI Audit Report</span>
                        <span style={{
                          background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: '14px',
                          fontWeight: 800, padding: '3px 10px', borderRadius: '6px'
                        }}>{feedback.grade} ({feedback.score}/100)</span>
                      </div>
                      
                      <p style={{ fontSize: '13px', color: '#b2c8dc', lineHeight: 1.5, marginBottom: '10px' }}>{feedback.overall_feedback}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12.5px', marginBottom: '10px' }}>
                        <div>
                          <div style={{ color: '#1D9E75', fontWeight: 700, marginBottom: '4px' }}>✓ Key Strengths</div>
                          {feedback.strengths?.map((str, i) => <div key={i}>• {str}</div>)}
                        </div>
                        <div>
                          <div style={{ color: '#ff5c8a', fontWeight: 700, marginBottom: '4px' }}>⚡ Recommendations</div>
                          {feedback.improvements?.map((imp, i) => <div key={i}>• {imp}</div>)}
                        </div>
                      </div>

                      {feedback.encouragement && (
                        <div style={{
                          fontStyle: 'italic', fontSize: '12px', color: '#5a7a9a', borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: '8px', marginTop: '8px'
                        }}>
                          "{feedback.encouragement}"
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>

        {/* Right Column: VS Code guide & Stats (1/3 width) */}
        <div className="space-y-6">
          
          {/* Portfolio Stats */}
          <div style={{
            background: 'linear-gradient(135deg, #091322, #070f1a)',
            border: '1px solid rgba(0,217,163,0.12)',
            borderRadius: '16px', padding: '20px'
          }}>
            <h3 style={{
              fontSize: '13px', fontWeight: 800, color: '#e8e8ed', marginBottom: '16px',
              fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px'
            }}>📊 Portfolio Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00d9a3' }}>
                  {historyList.filter(h => h.status === 'reviewed').length}
                </div>
                <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '2px' }}>Audited Projects</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff6b4a' }}>
                  {historyList.filter(h => h.status === 'submitted').length}
                </div>
                <div style={{ fontSize: '11px', color: '#5a7a9a', marginTop: '2px' }}>Pending Audit</div>
              </div>
            </div>
          </div>

          {/* VS Code Setup Guide */}
          <div style={{
            background: '#070f1a', border: '1px solid rgba(0,217,163,0.08)',
            borderRadius: '16px', padding: '20px'
          }}>
            <h3 style={{
              fontSize: '13px', fontWeight: 800, color: '#e8e8ed', marginBottom: '12px',
              fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px'
            }}>💻 VS Code Workspace Guide</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: '#a2b9cd', lineHeight: 1.6 }}>
              <div>
                <strong>1. Initialize Workspace</strong>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px',
                  fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#00d9a3', marginTop: '4px'
                }}>mkdir genois-portfolio && cd genois-portfolio</pre>
              </div>
              <div>
                <strong>2. Create Project directory</strong>
                <p style={{ marginTop: '2px' }}>Create subfolders for each milestone week to keep your workspace organized.</p>
              </div>
              <div>
                <strong>3. Commit and push regularly</strong>
                <p style={{ marginTop: '2px' }}>Push to a public GitHub repository. Ensure a clear <code>README.md</code> is present in the root for senior AI evaluations.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
