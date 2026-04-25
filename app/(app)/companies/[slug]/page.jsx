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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#5a7a9a' }}>Loading...</div>;
  if (!data?.company) return <div style={{ padding: 40, color: '#ff2d78' }}>Company not found</div>;

  const c = data.company;

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', maxWidth: 900, paddingBottom: 60 }}>
      <button onClick={() => router.push('/companies')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 12, marginBottom: 16, fontFamily: 'JetBrains Mono,monospace' }}>← Back</button>

      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 48 }}>{c.logo}</div>
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff' }}>{c.name}</div>
            <div style={{ fontSize: 13, color: '#5a7a9a' }}>{c.fullName}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>PACKAGE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>{c.package}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>PREP TIME</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EF9F27' }}>{c.prepTime}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>DURATION</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00f0ff' }}>{c.duration}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['info', 'questions', 'community'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t ? 'linear-gradient(135deg,#00f0ff,#7b5cff)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#020812' : '#8a9ab0', fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 600, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#00f0ff', marginBottom: 8 }}>Eligibility</div>
            <div style={{ fontSize: 13, color: '#e8f4ff' }}>{c.eligibility}</div>
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#00f0ff', marginBottom: 12 }}>Interview Rounds</div>
            {c.rounds.map((r, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#e8f4ff' }}>
                <span style={{ color: '#7b5cff', fontWeight: 700, marginRight: 8 }}>Round {i + 1}:</span> {r}
              </div>
            ))}
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#00f0ff', marginBottom: 12 }}>Skills Required</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.skills.map((s, i) => (
                <span key={i} style={{ padding: '5px 10px', borderRadius: 16, background: 'rgba(0,240,255,0.06)', color: '#00f0ff', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#1D9E75', marginBottom: 12 }}>💡 Pro Tips</div>
            {c.tips.map((tip, i) => (
              <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#e8f4ff', display: 'flex', gap: 8 }}>
                <span style={{ color: '#1D9E75' }}>✓</span> {tip}
              </div>
            ))}
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#00f0ff', marginBottom: 12 }}>📚 Resources</div>
            {c.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#00f0ff', textDecoration: 'none' }}>
                → {r.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div>
          <button onClick={generateAIQuestions} disabled={generating} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#7b5cff,#00f0ff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {generating ? 'Generating...' : '✨ Generate AI Questions'}
          </button>

          {aiQuestions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 2, marginBottom: 8 }}>AI GENERATED</div>
              {aiQuestions.map((q, i) => (
                <div key={i} style={{ padding: 14, background: '#070f1f', border: '1px solid rgba(123,92,255,0.15)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace' }}>{q.category}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(239,159,39,0.1)', color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace' }}>{q.difficulty}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#e8f4ff' }}>{q.question}</div>
                </div>
              ))}
            </div>
          )}

          {data.questions?.length > 0 && (
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 8 }}>COMMUNITY SHARED</div>
              {data.questions.map((q, i) => (
                <div key={i} style={{ padding: 14, background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: '#e8f4ff', marginBottom: 6 }}>{q.question}</div>
                  <div style={{ fontSize: 11, color: '#5a7a9a' }}>↑ {q.upvotes || 0} upvotes</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'community' && (
        <div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <textarea value={newDiscussion} onChange={e => setNewDiscussion(e.target.value)} rows={3} placeholder={`Share your ${c.name} interview experience or ask a question...`} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'Outfit,sans-serif', boxSizing: 'border-box' }} />
            <button onClick={postDiscussion} disabled={posting || newDiscussion.length < 5} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              {posting ? 'Posting...' : 'Post →'}
            </button>
          </div>

          {data.discussions?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#5a7a9a', fontSize: 13 }}>Be the first to start a discussion!</div>
          ) : (
            data.discussions?.map((d, i) => (
              <div key={i} style={{ padding: 14, background: '#070f1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#00f0ff', fontWeight: 700 }}>{d.users?.name || 'Anonymous'}</span>
                  <span style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13, color: '#e8f4ff', lineHeight: 1.6 }}>{d.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
