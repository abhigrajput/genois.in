'use client';
/**
 * My Notes — the freeform editor, lifted OUT of app/(app)/notes/page.jsx
 * unchanged in behaviour.
 *
 * This is the feature 8749 saved notes already live in. The rework around it is
 * strictly additive, so the rules here are:
 *   - same endpoints (/api/notes, /api/notes/[id]) with the same payloads,
 *   - same 2-second debounced autosave, same delete, same counters,
 *   - no migration, no reshaping of a note, no deletion of anything.
 *
 * The only addition is `focusNoteId`: when a curated sheet is saved into notes,
 * the page passes the new note's id so this list reloads and selects it. Nothing
 * about existing rows changes.
 */
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

export default function NotesEditor({ token, focusNoteId = null }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!token) return;
    loadNotes(focusNoteId);
    // Reloads when a sheet has just been saved into notes.
  }, [token, focusNoteId]);

  // A pending debounced save must not fire after unmount.
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  async function loadNotes(selectId = null) {
    try {
      const r = await apiFetch('/api/notes', token);
      const list = r.data?.notes || [];
      setNotes(list);
      const target = (selectId && list.find(n => n.id === selectId)) || list[0];
      if (target) selectNote(target);
    } catch (e) {
      toast.error('Failed to load notes');
    }
    setLoading(false);
  }

  function selectNote(note) {
    clearTimeout(saveTimer.current);   // don't let a pending save land on the new note
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
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--gx-text-muted)' }}>
      Loading notes...
    </div>
  );

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 190px)', minHeight: 420, display: 'flex', borderRadius: 'var(--gx-radius)', overflow: 'hidden', border: '1px solid var(--gx-border)' }}>

      {/* SIDEBAR */}
      <div style={{ width: 260, flexShrink: 0, background: 'var(--gx-bg)', borderRight: '1px solid var(--gx-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px', borderBottom: '1px solid var(--gx-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="gx-section-label">My Notes ({notes.length})</span>
          <button className="gx-btn gx-btn--primary gx-btn--sm" onClick={createNote} disabled={creating}>
            {creating ? '...' : '+ New'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--gx-text-subtle)', fontSize: 13 }}>
              No notes yet. Click + New to start, or save a study sheet from Study Material.
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                style={{
                  padding: '12px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--gx-border-subtle)',
                  background: selected?.id === note.id ? 'var(--gx-surface-2)' : 'transparent',
                  borderLeft: selected?.id === note.id ? '2px solid var(--gx-accent)' : '2px solid transparent',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                  aria-label={`Delete ${note.title || 'note'}`}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gx-text-subtle)', fontSize: 13, padding: '2px 4px', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--gx-surface)', minWidth: 0 }}>
        {selected ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--gx-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                aria-label="Note title"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 17, fontWeight: 700, color: 'var(--gx-text)', minWidth: 0 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: saving ? 'var(--gx-warning)' : 'var(--gx-text-subtle)' }}>
                  {saving ? 'Saving...' : 'Auto-saved'}
                </span>
                <button className="gx-btn gx-btn--secondary gx-btn--sm" onClick={saveNote}>Save</button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              aria-label="Note content"
              placeholder="Start typing your notes here..."
              style={{ flex: 1, padding: '18px 20px', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--gx-text)', fontSize: 14, lineHeight: 1.75 }}
            />
            <div style={{ padding: '8px 20px', borderTop: '1px solid var(--gx-border)', display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>{content.length} characters</span>
              <span style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>{content.split('\n').length} lines</span>
              <span style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>{content.split(' ').filter(w => w).length} words</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--gx-text-subtle)', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gx-text-muted)' }}>No note selected</div>
            <div style={{ fontSize: 13 }}>Create a new note, or save a curated sheet from Study Material.</div>
            <button className="gx-btn gx-btn--primary" onClick={createNote}>+ Create note</button>
          </div>
        )}
      </div>
    </div>
  );
}
