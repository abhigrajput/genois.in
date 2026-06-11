'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const PROMPTS = [
  'I have been copy pasting code for 2 years and still cannot write a loop from scratch...',
  'My resume says 3 years experience with React but I only started learning it last month...',
  'I panic every time someone asks me to explain my own project in an interview...',
  'I have 47 Udemy courses and have completed exactly zero of them...',
  'I told my parents I am learning to code but I have been watching YouTube for 6 hours...',
  'I apply for jobs requiring 5 years experience even though I just graduated...',
  'I pretend to understand when my senior explains something but I have no idea...',
];

export default function ConfessionsPage() {
  const { token, ready } = useToken();
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState('top');
  const [showForm, setShowForm] = useState(false);
  const [placeholder, setPlaceholder] = useState(PROMPTS[0]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PROMPTS.length;
      setPlaceholder(PROMPTS[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    loadConfessions();
  }, [ready, token, sort]);

  async function loadConfessions() {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/confessions?sort=${sort}`, token);
      setConfessions(r.data?.confessions || []);
    } catch {}
    setLoading(false);
  }

  async function post() {
    if (!content.trim()) { toast.error('Write something first'); return; }
    if (content.trim().length < 10) { toast.error('Too short. Say more.'); return; }
    setPosting(true);
    try {
      await apiFetch('/api/confessions', token, 'POST', { content });
      setContent('');
      setShowForm(false);
      toast.success('Confession posted anonymously!');
      loadConfessions();
    } catch (e) { toast.error(e.message); }
    setPosting(false);
  }

  async function upvote(id) {
    const updated = confessions.map(c =>
      c.id === id
        ? { ...c, upvotes: c.hasUpvoted ? c.upvotes - 1 : c.upvotes + 1, hasUpvoted: !c.hasUpvoted }
        : c
    );
    setConfessions(updated);
    try {
      await apiFetch('/api/confessions/upvote', token, 'POST', { confessionId: id });
    } catch {
      loadConfessions();
    }
  }

  function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${mins}m ago`;
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
          🤫 Confession Wall
        </h1>
        <p style={{ color: '#5a7a9a', fontSize: 13 }}>
          Anonymous. No judgment. Every engineer has been here.
        </p>
      </div>

      {/* POST CONFESSION */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: '16px 20px', borderRadius: 14,
            border: '1px dashed rgba(0,240,255,0.2)',
            background: 'rgba(0,240,255,0.02)',
            color: '#3a4a5a', cursor: 'pointer', textAlign: 'left',
            fontSize: 14, fontFamily: 'Outfit,sans-serif',
            marginBottom: 20, transition: 'all 0.2s',
          }}>
          🤫 {placeholder}
        </button>
      ) : (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 12 }}>
            🤫 POST ANONYMOUSLY
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="No one will know it's you. What do you need to get off your chest?"
            maxLength={500}
            rows={4}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1px solid rgba(0,240,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              color: '#e8f4ff', fontSize: 14,
              fontFamily: 'Outfit,sans-serif', outline: 'none',
              resize: 'vertical', boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
              {content.length}/500 · 100% anonymous
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowForm(false); setContent(''); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={post} disabled={posting || content.trim().length < 10} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: posting ? 'rgba(0,240,255,0.2)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                {posting ? 'Posting...' : 'Post Anonymously'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SORT TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'top', label: '🔥 Top' },
          { key: 'new', label: '🕐 New' },
        ].map(s => (
          <button key={s.key} onClick={() => setSort(s.key)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600,
            background: sort === s.key ? '#00f0ff' : 'rgba(255,255,255,0.05)',
            color: sort === s.key ? '#020812' : '#5a7a9a',
          }}>{s.label}</button>
        ))}
      </div>

      {/* CONFESSIONS LIST */}
      {loading ? (
        <div style={{ color: '#5a7a9a', textAlign: 'center', padding: 40, fontFamily: 'JetBrains Mono,monospace' }}>
          Loading confessions...
        </div>
      ) : confessions.length === 0 ? (
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.08)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤫</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>
            No confessions yet
          </div>
          <div style={{ color: '#5a7a9a', fontSize: 14 }}>
            Be the first. We have all been there.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {confessions.map((c, i) => (
            <div key={c.id} style={{
              background: '#070f1f',
              border: c.is_featured
                ? '1px solid rgba(239,159,39,0.3)'
                : '1px solid rgba(0,240,255,0.06)',
              borderRadius: 14, padding: 20,
              position: 'relative', overflow: 'hidden',
            }}>
              {c.is_featured && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#EF9F27,transparent)' }} />
              )}
              {c.is_featured && (
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#EF9F27', letterSpacing: 1, marginBottom: 10 }}>
                  ⭐ TOP CONFESSION THIS WEEK
                </div>
              )}

              <p style={{ fontSize: 15, color: '#c8d8e8', lineHeight: 1.7, marginBottom: 14, margin: 0, marginBottom: 14 }}>
                &quot;{c.content}&quot;
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.domain_slug && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,240,255,0.06)', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                      {c.domain_slug.toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => upvote(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20,
                    border: `1px solid ${c.hasUpvoted ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    background: c.hasUpvoted ? 'rgba(0,240,255,0.08)' : 'transparent',
                    color: c.hasUpvoted ? '#00f0ff' : '#5a7a9a',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit,sans-serif',
                    transition: 'all 0.15s',
                  }}>
                  <span>{c.hasUpvoted ? '❤️' : '🤍'}</span>
                  <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>{c.upvotes}</span>
                  <span style={{ fontSize: 11 }}>relatable</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center', color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', lineHeight: 1.7 }}>
        All confessions are 100% anonymous.<br />
        No names. No emails. No tracking.
      </div>
    </div>
  );
}
