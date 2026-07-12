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
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
      <nav style={{ background: 'rgba(2,8,18,0.98)', borderBottom: '1px solid rgba(0,217,163,0.1)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, cursor: 'pointer' }} onClick={() => router.push('/company/dashboard')}>
            <span style={{ color: '#00d9a3' }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => router.push('/company/dashboard')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>Students</button>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(0,217,163,0.08)', color: '#00d9a3', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Challenges</button>
          </div>
        </div>
        <button onClick={() => router.push('/company/dashboard')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>← Dashboard</button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 4 }}>Company Challenges</h1>
            <p style={{ color: '#5a7a9a', fontSize: 13 }}>Post technical challenges. AI generates questions. Students compete. You see ranked results.</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
            + Post Challenge
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.2)', borderRadius: 14, padding: 28, marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 20 }}>CREATE CHALLENGE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>CHALLENGE TITLE *</div>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Full Stack Developer Challenge — July 2025" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8e8ed', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>JOB DESCRIPTION / CHALLENGE BRIEF *</div>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the role, what you are looking for, tech stack required, responsibilities..." rows={4} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,217,163,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8e8ed', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DOMAIN</div>
                  <select value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: '#070f1f', color: '#e8e8ed', fontSize: 13, outline: 'none' }}>
                    {DOMAINS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DIFFICULTY</div>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: '#070f1f', color: '#e8e8ed', fontSize: 13, outline: 'none' }}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DEADLINE (optional)</div>
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.15)', background: '#070f1f', color: '#e8e8ed', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Cancel</button>
              <button onClick={createChallenge} disabled={generating} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: generating ? 'rgba(0,217,163,0.2)' : 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                {generating ? '⏳ AI generating questions... (~30s)' : 'Post Challenge — AI generates questions →'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Loading...</div>
        ) : challenges.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#070f1f', border: '1px solid rgba(0,217,163,0.06)', borderRadius: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', marginBottom: 8 }}>No challenges yet</div>
            <div style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 20 }}>Post your first challenge. AI generates 5 questions automatically.</div>
            <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
              Post First Challenge →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {challenges.map((c, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00d9a3,transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 10, lineHeight: 1.5 }}>{c.description.substring(0, 120)}...</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,217,163,0.08)', color: '#00d9a3', fontFamily: 'var(--font-mono)' }}>{c.domain?.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,159,39,0.1)', color: '#EF9F27', fontFamily: 'var(--font-mono)' }}>{c.difficulty?.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontFamily: 'var(--font-mono)' }}>{c.questions?.length || 0} QUESTIONS</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#00d9a3' }}>{c.totalAttempts}</div>
                    <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>attempts</div>
                    <div style={{ fontSize: 12, color: '#1D9E75' }}>{c.completedAttempts} completed</div>
                    {c.avgScore > 0 && <div style={{ fontSize: 12, color: '#EF9F27' }}>avg {c.avgScore}%</div>}
                  </div>
                </div>
                {c.deadline && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#3a4a5a', fontFamily: 'var(--font-mono)' }}>
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
