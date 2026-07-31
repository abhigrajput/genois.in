'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import { DOMAIN_PROJECTS, githubSearchUrl } from '@/lib/projectTemplates';

const DIFFICULTY_META = {
  beginner:     { label: 'STARTER',      color: 'var(--gx-accent)' },
  intermediate: { label: 'INTERMEDIATE', color: 'var(--gx-warning)' },
  advanced:     { label: 'ADVANCED',     color: 'var(--gx-warning)' },
  expert:       { label: 'EXPERT',       color: 'var(--gx-danger)' },
};

// Small copy-to-clipboard helper shared by the resume bullets.
function copyText(text, label = 'Copied to clipboard') {
  try {
    navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error('Copy failed — select and copy manually');
  }
}

function TechChips({ tech }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tech.map((t) => (
        <span key={t} style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--gx-text-muted)',
          background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)',
          borderRadius: 20, padding: '3px 10px',
        }}>{t}</span>
      ))}
    </div>
  );
}

function SectionLabel({ children, color = 'var(--gx-text-muted)' }) {
  return (
    <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
      {children}
    </div>
  );
}

export default function ProjectsPortfolioPage() {
  const { user } = useAuthStore();
  const { token, ready } = useToken();
  // domains.slug values are e.g. 'cybersec' (not 'cybersecurity') — the old key
  // silently fell back to fullstack for several domains. Resolve against the
  // real catalog, then fall back to fullstack only when a domain has no templates yet.
  const domain = user?.domain_slug || 'fullstack';
  const projects = DOMAIN_PROJECTS[domain] || DOMAIN_PROJECTS.fullstack;

  const [currentWeek, setCurrentWeek] = useState(1);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Submission form state (one project open at a time)
  const [activeSubmitting, setActiveSubmitting] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState({}); // title -> bool (guidance drawer)

  useEffect(() => {
    if (!ready || !token) return;
    fetchHistory();
  }, [ready, token]);

  async function fetchHistory() {
    setError(null);
    setLoading(true);
    try {
      const rData = await apiFetch('/api/roadmap/daily', token).catch(() => null);
      if (rData?.success) {
        const currentDay = rData.data?.currentDay || 1;
        setCurrentWeek(Math.ceil(currentDay / 7));
      }
      const data = await apiFetch('/api/projects/history', token);
      if (data.success) setHistoryList(data.data.projects || []);
    } catch (e) {
      setError(friendlyError(e, 'load your project portfolio'));
    } finally {
      setLoading(false);
    }
  }

  async function submitProject(e, project) {
    e.preventDefault();
    if (!githubUrl || !githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/projects/submit', token, 'POST', {
        projectTitle: project.title,
        githubUrl,
        week: project.week,
        domain,
        difficulty: project.difficulty,
        description: project.description,
        notes: projectNotes,
      });
      if (data.success) {
        toast.success(data.message || 'Project submitted!');
        setActiveSubmitting(null);
        setGithubUrl('');
        setProjectNotes('');
        fetchHistory();
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'submit your project'));
    } finally {
      setSubmitting(false);
    }
  }

  const getRecord = (title) => historyList.find((h) => h.projects?.title === title) || null;
  const getStatus = (title) => getRecord(title)?.status || 'not_started';

  if (!ready || loading) {
    return <LoadingSkeleton variant="cards" label="Loading your project portfolio…" />;
  }

  if (error) {
    return <ErrorCard title="Couldn't load your portfolio" message={error} primaryLabel="↻ Retry" onPrimary={fetchHistory} />;
  }

  return (
    <div className="w-full space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-heading)' }}>🎓 Career Projects Portfolio</h1>
        <p className="text-sm text-gray-400 mt-1">Real, resume-worthy builds mapped to your 52-week track — each with phased guidance, a tech stack, deployment steps, and copy-ready resume bullets.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: project timeline */}
        <div className="xl:col-span-2 space-y-4">
          {projects.map((proj, idx) => {
            const status = getStatus(proj.title);
            const isLocked = idx >= 2 && proj.week > currentWeek + 2;
            const record = getRecord(proj.title);
            const diff = DIFFICULTY_META[proj.difficulty] || DIFFICULTY_META.beginner;
            const isOpen = !!expanded[proj.title];

            let feedback = null;
            if (record?.ai_feedback) {
              try {
                feedback = typeof record.ai_feedback === 'string' ? JSON.parse(record.ai_feedback) : record.ai_feedback;
              } catch { /* malformed feedback — ignore */ }
            }

            return (
              <div key={idx} style={{
                background: 'var(--gx-surface)',
                border: isLocked ? '1px solid var(--gx-border)' : `1px solid ${diff.color}`,
                borderRadius: 16, padding: 20, opacity: isLocked ? 0.5 : 1,
                position: 'relative', overflow: 'hidden', transition: 'all 0.25s',
              }}>
                {/* Timeline accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                  background: isLocked ? 'var(--gx-surface)' : status === 'reviewed' ? 'var(--gx-success)' : status === 'submitted' ? 'var(--gx-accent)' : diff.color,
                }} />

                {/* Title & badge row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>WEEK {proj.week}</span>
                    <span style={{ background: `color-mix(in srgb, ${diff.color} 8%, transparent)`, color: diff.color, fontSize: 10, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{diff.label}</span>
                  </div>
                  <div>
                    {isLocked && <span className="text-gray-500 text-xs font-semibold">🔒 Locked</span>}
                    {!isLocked && status === 'not_started' && <span className="text-gray-400 text-xs font-semibold">⏳ Not Started</span>}
                    {!isLocked && status === 'submitted' && <span style={{ color: 'var(--gx-accent)', fontSize: 12, fontWeight: 700 }}>🛸 Under AI Audit</span>}
                    {!isLocked && status === 'reviewed' && <span style={{ color: 'var(--gx-success)', fontSize: 12, fontWeight: 700 }}>✅ Audit Completed</span>}
                  </div>
                </div>

                {/* Project details */}
                <div style={{ paddingLeft: 12, marginTop: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gx-text)', fontFamily: 'var(--font-heading)' }}>{proj.title}</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--gx-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{proj.description}</p>

                  {/* Tech stack — always visible */}
                  <div style={{ marginTop: 14 }}>
                    <SectionLabel>Tech stack</SectionLabel>
                    <TechChips tech={proj.tech} />
                  </div>

                  {/* Expand / collapse the deep guidance so cards stay scannable */}
                  <button onClick={() => setExpanded((p) => ({ ...p, [proj.title]: !p[proj.title] }))}
                    style={{
                      marginTop: 16, background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)',
                      color: 'var(--gx-accent)', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
                      cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    {isOpen ? '▲ Hide build guide' : '▼ Show build guide, deployment & resume bullets'}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* Phased implementation guidance */}
                      <div>
                        <SectionLabel>Implementation guide</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {proj.phases.map((phase, pi) => (
                            <div key={pi} style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: `color-mix(in srgb, ${diff.color} 9%, transparent)`, color: diff.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{pi + 1}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-text)' }}>{phase.name}</span>
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 4, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {phase.steps.map((st, si) => (
                                  <li key={si} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>
                                    <span style={{ color: diff.color, flexShrink: 0 }}>▸</span>
                                    <span>{st}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deployment guidance */}
                      <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: '12px 14px' }}>
                        <SectionLabel color="var(--gx-accent)">🚀 Where & how to deploy</SectionLabel>
                        <div style={{ fontSize: 12.5, color: 'var(--gx-text)', fontWeight: 600, marginBottom: 6 }}>{proj.deploy.platform}</div>
                        <ul style={{ margin: 0, paddingLeft: 4, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {proj.deploy.notes.map((n, ni) => (
                            <li key={ni} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>
                              <span style={{ color: 'var(--gx-accent)', flexShrink: 0 }}>•</span>
                              <span>{n}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Resume bullets — copy-ready */}
                      <div>
                        <SectionLabel color="var(--gx-warning)">📄 Resume bullets (click to copy)</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {proj.resumeBullets.map((b, bi) => (
                            <button key={bi} onClick={() => copyText(b, 'Resume bullet copied')}
                              title="Click to copy"
                              style={{
                                textAlign: 'left', background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)',
                                borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'flex-start',
                                fontFamily: 'var(--font-body)',
                              }}>
                              <span style={{ color: 'var(--gx-warning)', fontSize: 12, flexShrink: 0, marginTop: 1 }}>⧉</span>
                              <span style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>{b}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* GitHub reference search — never a hardcoded/invented repo URL */}
                      <div>
                        <SectionLabel>🔗 Reference implementations</SectionLabel>
                        <a href={githubSearchUrl(proj.searchTerms)} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--gx-accent)',
                            background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 8,
                            padding: '8px 12px', textDecoration: 'none',
                          }}>
                          <span>🐙</span> Browse similar projects on GitHub →
                        </a>
                        <p style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                          Opens a live GitHub search for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gx-text-muted)' }}>{proj.searchTerms}</span> — study real repos, don&apos;t copy them.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit repository */}
                  {!isLocked && status === 'not_started' && activeSubmitting !== proj.title && (
                    <button onClick={() => setActiveSubmitting(proj.title)} style={{
                      marginTop: 16, background: 'var(--gx-accent)',
                      color: 'var(--gx-text-inverse)', fontWeight: 700, fontSize: 13, padding: '10px 20px',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                    }}>
                      Submit Your Build for AI Audit →
                    </button>
                  )}

                  {activeSubmitting === proj.title && (
                    <form onSubmit={(e) => submitProject(e, proj)} style={{
                      marginTop: 16, padding: 14, borderRadius: 12,
                      border: '1px solid var(--gx-accent-border)', background: 'var(--gx-surface-2)',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--gx-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>GitHub Repo URL</label>
                        <input type="url" required value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/yourusername/your-project"
                          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--gx-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Submission Notes</label>
                        <textarea value={projectNotes} onChange={(e) => setProjectNotes(e.target.value)} rows={2}
                          placeholder="List technologies used, features implemented, live URL…"
                          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', resize: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={submitting} style={{ flex: 1, padding: 10, borderRadius: 6, border: 'none', fontWeight: 700, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', cursor: 'pointer' }}>{submitting ? 'Submitting…' : 'Submit Repository'}</button>
                        <button type="button" onClick={() => setActiveSubmitting(null)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text)', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {/* AI feedback */}
                  {status === 'reviewed' && feedback && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid var(--gx-success-border)', background: 'var(--gx-success-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--gx-success)', fontWeight: 700 }}>🎯 Senior AI Audit Report</span>
                        {feedback.grade && <span style={{ background: 'var(--gx-success-soft)', color: 'var(--gx-success)', fontSize: 14, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>{feedback.grade} ({feedback.score}/100)</span>}
                      </div>
                      {feedback.overall_feedback && <p style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{feedback.overall_feedback}</p>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, marginBottom: 10 }}>
                        <div>
                          <div style={{ color: 'var(--gx-success)', fontWeight: 700, marginBottom: 4 }}>✓ Key Strengths</div>
                          {feedback.strengths?.map((str, i) => <div key={i} style={{ color: 'var(--gx-text-muted)' }}>• {str}</div>)}
                        </div>
                        <div>
                          <div style={{ color: 'var(--gx-danger)', fontWeight: 700, marginBottom: 4 }}>⚡ Recommendations</div>
                          {feedback.improvements?.map((imp, i) => <div key={i} style={{ color: 'var(--gx-text-muted)' }}>• {imp}</div>)}
                        </div>
                      </div>
                      {feedback.encouragement && (
                        <div style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--gx-text-muted)', borderTop: '1px solid var(--gx-border)', paddingTop: 8, marginTop: 8 }}>
                          &ldquo;{feedback.encouragement}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: stats + guide */}
        <div className="space-y-6">
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 16, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>📊 Portfolio Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-accent)' }}>{historyList.filter((h) => h.status === 'reviewed').length}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Audited Projects</div>
              </div>
              <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-warning)' }}>{historyList.filter((h) => h.status === 'submitted').length}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Pending Audit</div>
              </div>
            </div>
            <div style={{ marginTop: 14, background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-warning)' }}>{projects.length}</div>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Projects in Your Track</div>
            </div>
          </div>

          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>💻 How to Use This Page</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.6 }}>
              <div><strong style={{ color: 'var(--gx-text)' }}>1. Open the build guide</strong><p style={{ marginTop: 2 }}>Each project has phased steps, a real tech stack, and deployment instructions for that exact stack.</p></div>
              <div><strong style={{ color: 'var(--gx-text)' }}>2. Build & deploy</strong><p style={{ marginTop: 2 }}>Follow the phases, push to a public GitHub repo with a clear <code>README.md</code>, and deploy using the guidance provided.</p></div>
              <div><strong style={{ color: 'var(--gx-text)' }}>3. Submit & get audited</strong><p style={{ marginTop: 2 }}>Submit your repo URL for an AI code audit, then paste the copy-ready resume bullets straight into your CV.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
