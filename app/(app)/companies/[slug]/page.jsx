'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState('info');
  const [newDiscussion, setNewDiscussion] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, params.slug]);

  async function load() {
    try {
      const r = await apiFetch(`/api/company-prep/${params.slug}`, token);
      setData(r.data);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function generateAIQuestions() {
    setGenerating(true);
    try {
      const r = await apiFetch(`/api/company-prep/${params.slug}/ai-questions`, token);
      setAiQuestions(r.data?.questions || []);
      toast.success('AI questions generated!');
    } catch (e) {
      toast.error(e.message);
    }
    setGenerating(false);
  }

  async function postDiscussion() {
    if (newDiscussion.length < 5) return;
    setPosting(true);
    try {
      await apiFetch(`/api/company-prep/${params.slug}/discussion`, token, 'POST', { message: newDiscussion });
      setNewDiscussion('');
      load();
      toast.success('Posted!');
    } catch (e) {
      toast.error(e.message);
    }
    setPosting(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gx-text-muted)' }}>Loading...</div>;
  if (!data?.company) return <div style={{ padding: 40, color: 'var(--gx-danger)' }}>Company not found</div>;

  const c = data.company;

  return (
    <div style={{ fontFamily: 'var(--font-body)', maxWidth: 900, paddingBottom: 60 }}>
      <button onClick={() => router.push('/companies')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 16, fontFamily: 'var(--font-mono)' }}>← Back</button>

      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 48 }}>{c.logo}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)' }}>{c.name}</div>
            <div style={{ fontSize: 13, color: 'var(--gx-text-muted)' }}>{c.fullName}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          <div style={{ background: 'var(--gx-surface)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>ENTRY ROLE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-success)' }}>{c.entryRole}</div>
          </div>
          <div style={{ background: 'var(--gx-surface)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>PREP TIME</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-warning)' }}>{c.prepTime}</div>
          </div>
          <div style={{ background: 'var(--gx-surface)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>DURATION</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-accent)' }}>{c.duration}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['info', 'questions', 'community'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--gx-accent)' : 'var(--gx-surface)', color: tab === t ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-accent)', marginBottom: 8 }}>Eligibility</div>
            <div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{c.eligibility}</div>
          </div>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-accent)', marginBottom: 12 }}>Interview Rounds</div>
            {c.rounds.map((r, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'var(--gx-surface)', borderRadius: 8, marginBottom: 6, fontSize: 13, color: 'var(--gx-text)' }}>
                <span style={{ color: 'var(--gx-warning)', fontWeight: 700, marginRight: 8 }}>Round {i + 1}:</span> {r}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-accent)', marginBottom: 12 }}>Skills Required</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.skills.map((s, i) => (
                <span key={i} style={{ padding: '5px 10px', borderRadius: 16, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-success-border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-success)', marginBottom: 12 }}>💡 Pro Tips</div>
            {c.tips.map((tip, i) => (
              <div key={i} style={{ padding: '6px 0', fontSize: 13, color: 'var(--gx-text)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--gx-success)' }}>✓</span> {tip}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-accent)', marginBottom: 12 }}>📚 Resources</div>
            {c.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px 12px', background: 'var(--gx-surface)', borderRadius: 8, marginBottom: 6, fontSize: 13, color: 'var(--gx-accent)', textDecoration: 'none' }}>
                → {r.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div>
          <button onClick={generateAIQuestions} disabled={generating} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', background: 'var(--gx-warning)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {generating ? 'Generating...' : '✨ Generate AI Questions'}
          </button>

          {aiQuestions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 2, marginBottom: 8 }}>AI GENERATED</div>
              {aiQuestions.map((q, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--gx-bg)', border: '1px solid var(--gx-warning-border)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>{q.category}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'var(--gx-warning-soft)', color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)' }}>{q.difficulty}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{q.question}</div>
                </div>
              ))}
            </div>
          )}

          {data.questions?.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-success)', letterSpacing: 2, marginBottom: 8 }}>COMMUNITY SHARED</div>
              {data.questions.map((q, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--gx-bg)', border: '1px solid var(--gx-success-border)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: 'var(--gx-text)', marginBottom: 6 }}>{q.question}</div>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-muted)' }}>↑ {q.upvotes || 0} upvotes</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'community' && (
        <div>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <textarea value={newDiscussion} onChange={e => setNewDiscussion(e.target.value)} rows={3} placeholder={`Share your ${c.name} interview experience or ask a question...`} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
            <button onClick={postDiscussion} disabled={posting || newDiscussion.length < 5} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700 }}>
              {posting ? 'Posting...' : 'Post →'}
            </button>
          </div>

          {data.discussions?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--gx-text-muted)', fontSize: 13 }}>Be the first to start a discussion!</div>
          ) : (
            data.discussions?.map((d, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--gx-accent)', fontWeight: 700 }}>{d.users?.name || 'Anonymous'}</span>
                  <span style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--gx-text)', lineHeight: 1.6 }}>{d.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
