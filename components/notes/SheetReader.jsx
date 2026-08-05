'use client';
/**
 * Sheet reader — the curated content itself.
 *
 * Everything rendered here came out of lib/studySheets/*, written and reviewed
 * once. No AI call happens on this screen, which is why it opens instantly and
 * why two students revising the same pattern see the same words.
 *
 * "Save to my notes" posts the sheet's markdown to the EXISTING /api/notes
 * endpoint, so a saved sheet becomes an ordinary editable note in the same table
 * as every other note. No new storage and no new schema — that is what makes
 * this additive rather than a second, parallel notes system.
 */
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import Badge, { DifficultyBadge } from '@/components/ui/Badge';
import FlashcardDrill from './FlashcardDrill';

function Section({ label, children }) {
  return (
    <section style={{ marginTop: 26 }}>
      <span className="gx-section-label">{label}</span>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((t, i) => (
        <li key={i} style={{ fontSize: 13.5, color: 'var(--gx-text-muted)', lineHeight: 1.6 }}>{t}</li>
      ))}
    </ul>
  );
}

/**
 * The student's own numbers for this sheet. Same rules as the library: counts
 * always accompany a percentage, thin evidence is labelled thin, and an
 * unmeasured sheet renders nothing at all rather than a reassuring zero.
 */
function EvidenceStrip({ evidence }) {
  if (!evidence || evidence.status === 'unmeasured') return null;

  if (evidence.status === 'thin') {
    return (
      <div className="gx-alert gx-alert--info" style={{ marginTop: 14 }}>
        Only {evidence.total} question{evidence.total === 1 ? '' : 's'} of yours has touched this area — too little to
        judge it either way.
      </div>
    );
  }

  const weak = evidence.status === 'weak';
  return (
    <div className={`gx-alert ${weak ? 'gx-alert--warning' : 'gx-alert--success'}`} style={{ marginTop: 14, display: 'block' }}>
      <strong>Your record here: {evidence.accuracy}% ({evidence.correct}/{evidence.total} questions).</strong>{' '}
      {weak ? 'This is a measured weak area for you.' : 'Measured as solid — revise rather than relearn.'}
      {evidence.skills.length > 1 && (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>
          {evidence.skills.map(s => `${s.label} ${s.accuracy}% (${s.correct}/${s.total})`).join(' · ')}
        </div>
      )}
      {evidence.skillsUnmeasured > 0 && (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>
          {evidence.skillsUnmeasured} skill{evidence.skillsUnmeasured === 1 ? '' : 's'} on this sheet
          {evidence.skillsUnmeasured === 1 ? ' has' : ' have'} never been tested — unknown, not weak.
        </div>
      )}
    </div>
  );
}

export default function SheetReader({ sheetId, token, onBack, onSaved }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drilling, setDrilling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDrilling(false);
    (async () => {
      try {
        const r = await apiFetch(`/api/study-sheets/${sheetId}`, token);
        if (!cancelled) setData(r.data);
      } catch (e) {
        if (!cancelled) toast.error(e.message || 'Failed to load sheet');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sheetId, token]);

  async function saveToNotes() {
    if (!data) return;
    setSaving(true);
    try {
      // The existing notes endpoint, unchanged — a saved sheet is a normal note.
      const r = await apiFetch('/api/notes', token, 'POST', {
        title: data.sheet.title,
        content: data.markdown,
      });
      toast.success('Saved to My Notes — edit it freely');
      onSaved?.(r.data?.note?.id || null);
    } catch (e) {
      toast.error(e.message || 'Could not save');
    }
    setSaving(false);
  }

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center', color: 'var(--gx-text-muted)' }}>Loading sheet...</div>;
  }
  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--gx-text-muted)' }}>That sheet could not be loaded.</p>
        <button className="gx-btn gx-btn--outline" onClick={onBack}>Back to library</button>
      </div>
    );
  }

  const { sheet, evidence } = data;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="gx-btn gx-btn--ghost gx-btn--sm" onClick={onBack}>← Library</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sheet.counts.cards > 0 && (
            <button className="gx-btn gx-btn--secondary gx-btn--sm" onClick={() => setDrilling(d => !d)}>
              {drilling ? 'Hide flashcards' : `Flashcards (${sheet.counts.cards})`}
            </button>
          )}
          <button className="gx-btn gx-btn--primary gx-btn--sm" onClick={saveToNotes} disabled={saving}>
            {saving ? 'Saving...' : 'Save to my notes'}
          </button>
        </div>
      </div>

      {drilling && (
        <div style={{ marginBottom: 22 }}>
          <FlashcardDrill title={sheet.title} cards={sheet.recall} onClose={() => setDrilling(false)} />
        </div>
      )}

      <div className="gx-card" style={{ padding: 24 }}>
        <Badge tone="accent">{sheet.group}</Badge>
        <h1 style={{ fontSize: 24, fontWeight: 750, color: 'var(--gx-text)', margin: '10px 0 8px' }}>{sheet.title}</h1>
        <p style={{ fontSize: 14.5, color: 'var(--gx-text-muted)', margin: 0, lineHeight: 1.6 }}>{sheet.summary}</p>

        <EvidenceStrip evidence={evidence} />

        {sheet.intro && (
          <p style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.7, marginTop: 16 }}>{sheet.intro}</p>
        )}
        {sheet.tell && (
          <div className="gx-well" style={{ padding: '12px 14px', marginTop: 14 }}>
            <span className="gx-section-label">You have got it when</span>
            <p style={{ fontSize: 13.5, color: 'var(--gx-text)', margin: '6px 0 0', lineHeight: 1.6 }}>{sheet.tell}</p>
          </div>
        )}

        {sheet.prerequisites.length > 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--gx-text-subtle)', marginTop: 12 }}>
            Builds on: {sheet.prerequisites.map(p => p.name).join(', ')}
          </p>
        )}

        {sheet.recognise.length > 0 && (
          <Section label="When to reach for it"><Bullets items={sheet.recognise} /></Section>
        )}

        {sheet.concepts.length > 0 && (
          <Section label="Key concepts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sheet.concepts.map((c, i) => (
                <div key={i} className="gx-well" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 4 }}>{c.term}</div>
                  <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.65 }}>{c.detail}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {sheet.complexity.length > 0 && (
          <Section label="Complexity">
            <div style={{ overflowX: 'auto' }}>
              <table className="gx-table">
                <thead>
                  <tr><th>Operation</th><th>Time</th><th>Space</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {sheet.complexity.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.label}</td>
                      <td><code className="gx-code">{r.time}</code></td>
                      <td><code className="gx-code">{r.space}</code></td>
                      <td style={{ color: 'var(--gx-text-muted)' }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {sheet.template && (
          <Section label={sheet.template.caption}>
            <pre className="gx-code">{sheet.template.code}</pre>
          </Section>
        )}

        {sheet.pitfalls.length > 0 && (
          <Section label="Common mistakes"><Bullets items={sheet.pitfalls} /></Section>
        )}

        {sheet.interview.length > 0 && (
          <Section label="Interview questions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sheet.interview.map((qa, i) => (
                <div key={i}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 5 }}>{qa.q}</div>
                  <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.65 }}>{qa.a}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {sheet.problems.length > 0 && (
          <Section label="Practice problems">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sheet.problems.map(p => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--gx-radius-sm)', textDecoration: 'none', border: '1px solid var(--gx-border-subtle)' }}
                >
                  <span style={{ fontSize: 13, color: 'var(--gx-text)', flex: 1 }}>{p.title}</span>
                  <DifficultyBadge level={p.difficulty} />
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
