'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { token, ready } = useToken();
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [noteType, setNoteType] = useState('theory');
  const [generating, setGenerating] = useState(false);
  const [daily, setDaily] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/notes', token).then(r => setNotes(r.data.notes || [])).catch(console.error);
    apiFetch('/api/roadmap/daily', token).then(r => setDaily(r.data)).catch(console.error);
  }, [ready, token]);

  async function generate() {
    if (!token || !daily?.roadmapItem?.id) { toast.error('Wait for roadmap to load'); return; }
    setGenerating(true);
    try {
      const res = await apiFetch('/api/notes/generate', token, 'POST', { roadmapId: daily.roadmapItem.id, noteType });
      const updated = await apiFetch('/api/notes', token);
      setNotes(updated.data.notes || []);
      setSelected(res.data.note);
      if (isMobile) setShowContent(true);
      toast.success('Notes generated!');
    } catch (err) { toast.error(err.message); }
    finally { setGenerating(false); }
  }

  function selectNote(n) {
    setSelected(n);
    if (isMobile) setShowContent(true);
  }

  if (!ready) return (
    <div style={{ color: '#5a7a9a', padding: 60, textAlign: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: 1600, margin: '0 auto', fontFamily: 'Outfit,sans-serif' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {isMobile && showContent && (
          <button
            onClick={() => setShowContent(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#00f0ff', fontSize: 20, padding: 0 }}>
            ←
          </button>
        )}
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', margin: 0 }}>
          {isMobile && showContent && selected ? selected.topic : 'AI Notes'}
        </h1>
      </div>

      <p style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 20 }}>
        {daily ? `Topic: ${daily.roadmapItem?.topic}` : 'Loading...'}
      </p>

      {/* NOTE TYPE SELECTOR + GENERATE — hide on mobile when viewing content */}
      {(!isMobile || !showContent) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          {['theory', 'coding', 'full', 'revision'].map(t => (
            <button key={t} onClick={() => setNoteType(t)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
              background: noteType === t ? '#00f0ff' : 'rgba(255,255,255,0.05)',
              color: noteType === t ? '#020812' : '#5a7a9a',
            }}>{t}</button>
          ))}
          <button onClick={generate} disabled={generating} style={{
            padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700,
            background: generating ? 'rgba(123,92,255,0.3)' : 'linear-gradient(135deg,#00f0ff,#7b5cff)',
            color: generating ? '#5a7a9a' : '#020812',
          }}>
            {generating ? 'Generating...' : '+ Generate Notes'}
          </button>
        </div>
      )}

      {/* MOBILE LAYOUT */}
      {isMobile ? (
        showContent && selected ? (
          // CONTENT VIEW on mobile
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 6 }}>
                {selected.topic}
              </div>
              <span style={{
                fontSize: 11, padding: '3px 12px', borderRadius: 20,
                background: 'rgba(0,240,255,0.08)', color: '#00f0ff',
                fontFamily: 'JetBrains Mono,monospace', textTransform: 'capitalize',
              }}>{selected.type} Notes</span>
            </div>
            <div style={{
              color: '#e8f4ff',
              background: '#0a1628',
              border: '1px solid rgba(0,240,255,0.06)',
              borderRadius: 10,
              padding: 16,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.9,
              fontSize: 14,
              fontFamily: 'Outfit,sans-serif',
            }}>
              {selected.content}
            </div>
          </div>
        ) : (
          // LIST VIEW on mobile
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>
              SAVED NOTES
            </div>
            {notes.length === 0 ? (
              <div style={{ color: '#5a7a9a', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                No notes yet.<br />Generate your first one above.
              </div>
            ) : (
              notes.map((n, i) => (
                <div key={i} onClick={() => selectNote(n)} style={{
                  padding: '14px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  marginBottom: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(0,240,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e8f4ff', marginBottom: 4 }}>{n.topic}</div>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(0,240,255,0.08)', color: '#00f0ff',
                      fontFamily: 'JetBrains Mono,monospace', textTransform: 'capitalize',
                    }}>{n.type}</span>
                  </div>
                  <span style={{ color: '#5a7a9a', fontSize: 18 }}>›</span>
                </div>
              ))
            )}
          </div>
        )
      ) : (
        // DESKTOP LAYOUT — side by side
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>
              SAVED NOTES
            </div>
            {notes.length === 0 ? (
              <div style={{ color: '#5a7a9a', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                No notes yet.<br />Generate your first one.
              </div>
            ) : (
              notes.map((n, i) => (
                <div key={i} onClick={() => setSelected(n)} style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                  background: selected?.id === n.id ? 'rgba(0,240,255,0.08)' : 'transparent',
                  border: `1px solid ${selected?.id === n.id ? 'rgba(0,240,255,0.3)' : 'transparent'}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8f4ff', marginBottom: 4 }}>{n.topic}</div>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(0,240,255,0.08)', color: '#00f0ff',
                    fontFamily: 'JetBrains Mono,monospace', textTransform: 'capitalize',
                  }}>{n.type}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 24, minHeight: 400 }}>
            {!selected ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>≡</div>
                <div style={{ color: '#e8f4ff', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Select a note to read</div>
                <div style={{ color: '#5a7a9a', fontSize: 13 }}>Or generate a new one above</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 6 }}>{selected.topic}</div>
                  <span style={{
                    fontSize: 11, padding: '3px 12px', borderRadius: 20,
                    background: 'rgba(0,240,255,0.08)', color: '#00f0ff',
                    fontFamily: 'JetBrains Mono,monospace', textTransform: 'capitalize',
                  }}>{selected.type} Notes</span>
                </div>
                <div style={{
                  color: '#e8f4ff',
                  background: '#0a1628',
                  border: '1px solid rgba(0,240,255,0.06)',
                  borderRadius: 10,
                  padding: 20,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.9,
                  fontSize: 14,
                  fontFamily: 'Outfit,sans-serif',
                  minHeight: 280,
                }}>
                  {selected.content}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
