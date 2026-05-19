'use client';
import { useState, useEffect, useRef } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { token, ready } = useToken();
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!ready || !token) return;
    loadNotes();
  }, [ready, token]);

  async function loadNotes() {
    try {
      const r = await apiFetch('/api/notes', token);
      setNotes(r.data?.notes || []);
      if (r.data?.notes?.length > 0) {
        selectNote(r.data.notes[0]);
      }
    } catch (e) {
      toast.error('Failed to load notes');
    }
    setLoading(false);
  }

  function selectNote(note) {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content || '');
  }

  async function createNote() {
    setCreating(true);
    try {
      const r = await apiFetch('/api/notes', token, 'POST', {
        title: 'Untitled Note',
        content: '',
      });
      const newNote = r.data?.note;
      setNotes(prev => [newNote, ...prev]);
      selectNote(newNote);
      toast.success('New note created');
    } catch (e) {
      toast.error(e.message);
    }
    setCreating(false);
  }

  async function saveNote() {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await apiFetch(`/api/notes/${selected.id}`, token, 'PUT', { title, content });
      const updated = r.data?.note;
      setNotes(prev => prev.map(n => n.id === selected.id ? updated : n));
      setSelected(updated);
    } catch (e) {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  async function deleteNote(noteId) {
    try {
      await apiFetch(`/api/notes/${noteId}`, token, 'DELETE');
      const remaining = notes.filter(n => n.id !== noteId);
      setNotes(remaining);
      if (selected?.id === noteId) {
        if (remaining.length > 0) selectNote(remaining[0]);
        else { setSelected(null); setTitle(''); setContent(''); }
      }
      toast.success('Note deleted');
    } catch (e) {
      toast.error(e.message);
    }
  }

  function handleTitleChange(val) {
    setTitle(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNote, 2000);
  }

  function handleContentChange(val) {
    setContent(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNote, 2000);
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
      Loading notes...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%', height: 'calc(100vh - 80px)', display: 'flex', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,240,255,0.08)' }}>

      {/* SIDEBAR */}
      <div style={{ width: 260, flexShrink: 0, background: '#070f1f', borderRight: '1px solid rgba(0,240,255,0.08)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(0,240,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#e8f4ff' }}>📒 My Notes</div>
          <button onClick={createNote} disabled={creating} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
            {creating ? '...' : '+ New'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#3a4a5a', fontSize: 13 }}>
              No notes yet. Click + New to start.
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} onClick={() => selectNote(note)} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', background: selected?.id === note.id ? 'rgba(0,240,255,0.06)' : 'transparent', borderLeft: selected?.id === note.id ? '2px solid #00f0ff' : '2px solid transparent', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: selected?.id === note.id ? '#00f0ff' : '#e8f4ff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3a4a5a', fontSize: 14, padding: '2px 4px', flexShrink: 0, opacity: 0.5 }}>
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020812' }}>
        {selected ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,240,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Note title..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: saving ? '#EF9F27' : '#3a4a5a' }}>
                  {saving ? 'Saving...' : 'Auto-saved'}
                </span>
                <button onClick={saveNote} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600 }}>
                  Save
                </button>
              </div>
            </div>
            <textarea value={content} onChange={e => handleContentChange(e.target.value)} placeholder="Start typing your notes here...&#10;&#10;Tips:&#10;• Use this to save key concepts&#10;• Write down important formulas&#10;• Note your daily learnings" style={{ flex: 1, padding: '20px', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif', fontSize: 14, lineHeight: 1.8 }} />
            <div style={{ padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3a4a5a' }}>
                {content.length} characters
              </span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3a4a5a' }}>
                {content.split('\n').length} lines
              </span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3a4a5a' }}>
                {content.split(' ').filter(w => w).length} words
              </span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#3a4a5a' }}>
            <div style={{ fontSize: 48 }}>📒</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#5a7a9a' }}>No note selected</div>
            <div style={{ fontSize: 13, color: '#3a4a5a' }}>Create a new note or select one from the list</div>
            <button onClick={createNote} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
              + Create First Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
