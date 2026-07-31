'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const DOMAINS = ['fullstack', 'dsa', 'ml', 'ai', 'ds', 'cybersec', 'cloud', 'mobile', 'devops', 'sysdesign'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function CompanyChallengesPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', domain: 'fullstack', difficulty: 'medium', deadline: '' });

  useEffect(() => {
    const t = localStorage.getItem('genois_company_token');
    if (!t) { router.push('/company/login'); return; }
    setToken(t);
    loadChallenges(t);
  }, []);

  async function loadChallenges(t) {
    setLoading(true);
    try {
      const r = await fetch('/api/company/challenges', { headers: { Authorization: 'Bearer ' + t } });
      const d = await r.json();
      setChallenges(d.data?.challenges || []);
    } catch {}
    setLoading(false);
  }

  async function createChallenge() {
    if (!form.title || !form.description) { toast.error('Fill title and description'); return; }
    setGenerating(true);
    try {
      const r = await fetch('/api/company/challenges', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Challenge created with AI questions!');
        setShowForm(false);
        setForm({ title: '', description: '', domain: 'fullstack', difficulty: 'medium', deadline: '' });
        loadChallenges(token);
      } else {
        toast.error(d.message);
      }
    } catch { toast.error('Failed to create challenge'); }
    setGenerating(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <nav style={{ background: 'var(--gx-bg)', borderBottom: '1px solid var(--gx-border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, cursor: 'pointer' }} onClick={() => router.push('/company/dashboard')}>
            <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => router.push('/company/dashboard')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 13 }}>Students</button>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Challenges</button>
          </div>
        </div>
        <button onClick={() => router.push('/company/dashboard')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 13 }}>← Dashboard</button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>Company Challenges</h1>
            <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>Post technical challenges. AI generates questions. Students compete. You see ranked results.</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
            + Post Challenge
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', borderRadius: 14, padding: 28, marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 20 }}>CREATE CHALLENGE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>CHALLENGE TITLE *</div>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Full Stack Developer Challenge — July 2025" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>JOB DESCRIPTION / CHALLENGE BRIEF *</div>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the role, what you are looking for, tech stack required, responsibilities..." rows={4} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DOMAIN</div>
                  <select value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DIFFICULTY</div>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DEADLINE (optional)</div>
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Cancel</button>
              <button onClick={createChallenge} disabled={generating} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: generating ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                {generating ? '⏳ AI generating questions... (~30s)' : 'Post Challenge — AI generates questions →'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>Loading...</div>
        ) : challenges.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 8 }}>No challenges yet</div>
            <div style={{ color: 'var(--gx-text-muted)', fontSize: 14, marginBottom: 20 }}>Post your first challenge. AI generates 5 questions automatically.</div>
            <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              Post First Challenge →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {challenges.map((c, i) => (
              <div key={i} style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gx-accent)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>{c.description.substring(0, 120)}...</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>{c.domain?.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-warning-soft)', color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)' }}>{c.difficulty?.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-success-soft)', color: 'var(--gx-success)', fontFamily: 'var(--font-mono)' }}>{c.questions?.length || 0} QUESTIONS</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-accent)' }}>{c.totalAttempts}</div>
                    <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>attempts</div>
                    <div style={{ fontSize: 12, color: 'var(--gx-success)' }}>{c.completedAttempts} completed</div>
                    {c.avgScore > 0 && <div style={{ fontSize: 12, color: 'var(--gx-warning)' }}>avg {c.avgScore}%</div>}
                  </div>
                </div>
                {c.deadline && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    Deadline: {new Date(c.deadline).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
