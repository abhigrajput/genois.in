'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  { topic: 'CSS Flexbox and Grid', know: 'Basic HTML and CSS', goal: 'Build responsive layouts' },
  { topic: 'React Hooks', know: 'Basic React components', goal: 'Master useState useEffect useContext' },
  { topic: 'SQL Joins', know: 'Basic SELECT queries', goal: 'Write complex multi-table queries' },
  { topic: 'Docker Basics', know: 'Linux command line', goal: 'Containerize my applications' },
  { topic: 'Binary Search', know: 'Basic arrays and loops', goal: 'Solve BST problems in interviews' },
  { topic: 'REST API Design', know: 'Basic HTTP', goal: 'Design production grade APIs' },
];

export default function CustomRoadmapPage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ topic: '', alreadyKnow: '', goal: '', days: '7' });

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/custom-roadmap', token)
      .then(r => { setRoadmaps(r.data?.roadmaps || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function create() {
    if (!form.topic.trim()) { toast.error('Enter a topic'); return; }
    setCreating(true);
    try {
      const r = await apiFetch('/api/custom-roadmap', token, 'POST', form);
      toast.success('Custom roadmap created!');
      router.push('/custom-roadmap/' + r.data.roadmap.id);
    } catch (e) { toast.error(e.message); }
    setCreating(false);
  }

  function useSuggestion(s) {
    setForm({ topic: s.topic, alreadyKnow: s.know, goal: s.goal, days: '7' });
    setShowForm(true);
  }

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          🗺️ Custom Roadmap
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Already know HTML? Skip it. Learn only what you need. AI generates a personalized roadmap for any topic.
        </p>
      </div>

      {!showForm ? (
        <>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 16 }}>QUICK SUGGESTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 20 }}>
              {SUGGESTIONS.map((s, i) => (
                <div key={i} onClick={() => useSuggestion(s)} style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,240,255,0.08)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>{s.topic}</div>
                  <div style={{ fontSize: 12, color: '#5a7a9a' }}>Already know: {s.know}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700 }}>
              + Create Custom Roadmap →
            </button>
          </div>

          {roadmaps.length > 0 && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>YOUR CUSTOM ROADMAPS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roadmaps.map((r, i) => (
                  <div key={i} onClick={() => router.push('/custom-roadmap/' + r.id)} style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>{r.topic}</div>
                      <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                        Day {r.current_day} of {r.total_days} · {r.status}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: r.status === 'completed' ? '#1D9E75' : '#00f0ff' }}>
                        {Math.round((r.current_day / r.total_days) * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>complete</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 28 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 20 }}>CREATE YOUR ROADMAP</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>WHAT DO YOU WANT TO LEARN? *</div>
              <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. CSS Flexbox, React Hooks, SQL Joins, Docker..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>WHAT DO YOU ALREADY KNOW ABOUT THIS?</div>
              <input value={form.alreadyKnow} onChange={e => setForm(p => ({ ...p, alreadyKnow: e.target.value }))} placeholder="e.g. I know basic CSS properties but not layouts..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>WHAT IS YOUR GOAL?</div>
              <input value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Build responsive layouts for my projects..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>HOW MANY DAYS? (3-30)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['3', '5', '7', '10', '14', '30'].map(d => (
                  <button key={d} onClick={() => setForm(p => ({ ...p, days: d }))} style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${form.days === d ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.08)'}`, background: form.days === d ? 'rgba(0,240,255,0.1)' : 'transparent', color: form.days === d ? '#00f0ff' : '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setForm({ topic: '', alreadyKnow: '', goal: '', days: '7' }); }} style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>
              Cancel
            </button>
            <button onClick={create} disabled={creating} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: creating ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              {creating ? 'Generating your roadmap... (30 seconds)' : 'Generate My Roadmap →'}
            </button>
          </div>
          <p style={{ textAlign: 'center', color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', marginTop: 10 }}>
            AI generates a personalized day-by-day plan skipping what you already know
          </p>
        </div>
      )}
    </div>
  );
}
