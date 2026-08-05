'use client';
/**
 * /notes — curated study material first, freeform notes second.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * This page used to be one thing: a sidebar of saved notes and a textarea, with
 * a "type a topic and an AI writes it" flow bolted on. A tester's verdict was
 * that it "feels like a ChatGPT wrapper / note editor — I'd rather have curated
 * revision sheets, cheat sheets, flashcards, and pattern-based interview notes".
 *
 * So the DEFAULT tab is now a shelf of curated sheets that already exist, and
 * generation is a small secondary control inside My Notes.
 *
 * WHAT DID NOT CHANGE
 * -------------------
 * My Notes is the previous editor, moved into a component with its behaviour
 * intact: same endpoints, same autosave, same delete. No note was migrated,
 * reshaped or removed — this rework only ADDS a second tab beside it.
 */
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import SheetLibrary from '@/components/notes/SheetLibrary';
import SheetReader from '@/components/notes/SheetReader';
import NotesEditor from '@/components/notes/NotesEditor';

const TABS = [
  { key: 'study', label: 'Study Material' },
  { key: 'mine', label: 'My Notes' },
];

export default function NotesPage() {
  const { token, ready } = useToken();

  // Curated is the default view — that is the whole point of the rework.
  const [tab, setTab] = useState('study');
  const [openSheet, setOpenSheet] = useState(null);

  const [library, setLibrary] = useState(null);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState(null);

  // Bumped when a sheet is saved into notes, so the editor reloads and selects it.
  const [focusNoteId, setFocusNoteId] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch('/api/study-sheets', token);
        if (!cancelled) setLibrary(r.data);
      } catch (e) {
        if (!cancelled) setLibraryError(e.message || 'Could not load study material');
      }
      if (!cancelled) setLoadingLibrary(false);
    })();
    return () => { cancelled = true; };
  }, [ready, token]);

  function handleSheetSaved(noteId) {
    setFocusNoteId(noteId);
    setOpenSheet(null);
    setTab('mine');
  }

  if (!ready) return null;

  return (
    <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '4px 0 40px' }}>

      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 750, color: 'var(--gx-text)', margin: 0 }}>Notes</h1>
        <p style={{ fontSize: 13.5, color: 'var(--gx-text-muted)', margin: '6px 0 0' }}>
          Curated revision sheets, cheat sheets and flashcards — plus your own notes.
        </p>
      </header>

      <div className="gx-segment" role="tablist" aria-label="Notes view" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className="gx-segment__item"
            onClick={() => { setTab(t.key); setOpenSheet(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'study' && (
        loadingLibrary ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--gx-text-muted)' }}>
            Loading study material...
          </div>
        ) : libraryError ? (
          <div className="gx-alert gx-alert--danger">{libraryError}</div>
        ) : openSheet ? (
          <SheetReader
            sheetId={openSheet}
            token={token}
            onBack={() => setOpenSheet(null)}
            onSaved={handleSheetSaved}
          />
        ) : (
          <SheetLibrary
            sheets={library?.sheets || []}
            groups={library?.groups || []}
            evidence={library?.evidence}
            onOpen={setOpenSheet}
          />
        )
      )}

      {tab === 'mine' && (
        <>
          <GenerateNote token={token} onCreated={setFocusNoteId} />
          <NotesEditor token={token} focusNoteId={focusNoteId} />
        </>
      )}
    </div>
  );
}

/**
 * Generation, demoted.
 *
 * It still exists — some topics have no curated sheet, and removing a working
 * feature was not the ask. But it is now one collapsed row inside the secondary
 * tab rather than the identity of the page, and it says plainly that the curated
 * sheets are the better first stop.
 *
 * Reuses the existing /api/notes/generate and /api/notes endpoints unchanged:
 * generate the text, then save it as an ordinary note.
 */
function GenerateNote({ token, onCreated }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    const t = topic.trim();
    if (!t) return;
    setBusy(true);
    try {
      const gen = await apiFetch('/api/notes/generate', token, 'POST', { topic: t });
      const content = gen.data?.notes || '';
      if (!content) throw new Error('Nothing was generated');
      const saved = await apiFetch('/api/notes', token, 'POST', { title: t, content });
      toast.success('Note generated and saved');
      setTopic('');
      setOpen(false);
      onCreated?.(saved.data?.note?.id || null);
    } catch (e) {
      toast.error(e.message || 'Could not generate');
    }
    setBusy(false);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {!open ? (
        <button className="gx-btn gx-btn--ghost gx-btn--sm" onClick={() => setOpen(true)}>
          + Generate a note on a topic
        </button>
      ) : (
        <div className="gx-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="gx-input"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') generate(); }}
              placeholder="Topic, e.g. Kruskal's algorithm"
              aria-label="Topic to generate a note about"
              style={{ flex: 1, minWidth: 200 }}
              disabled={busy}
            />
            <button className="gx-btn gx-btn--primary gx-btn--sm" onClick={generate} disabled={busy || !topic.trim()}>
              {busy ? 'Generating...' : 'Generate'}
            </button>
            <button className="gx-btn gx-btn--ghost gx-btn--sm" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gx-text-subtle)', margin: '10px 0 0' }}>
            For topics with no curated sheet. Generated text is a starting point, not reviewed material — check
            Study Material first.
          </p>
        </div>
      )}
    </div>
  );
}
