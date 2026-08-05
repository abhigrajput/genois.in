'use client';
/**
 * The curated library — the DEFAULT view of /notes.
 *
 * The tester's complaint was that /notes felt like a ChatGPT wrapper: an empty
 * box that generates something new every time. So the first thing on the page is
 * now a shelf of sheets that already exist, and generation moved to a secondary
 * action inside My Notes.
 *
 * EVIDENCE RENDERING RULES (mirrors lib/studySheets/evidence.js — do not soften
 * these in the UI, or the honesty guarantee is only skin-deep):
 *   weak       → show the number WITH its counts. "31% (5/16)", never bare "31%".
 *   solid      → same, positive tone.
 *   thin       → say the data is too thin. Never render it as a weakness.
 *   unmeasured → say nothing at all. Silence is the honest state for an unknown.
 */
import { useState, useMemo } from 'react';
import Badge from '@/components/ui/Badge';

function EvidenceBadge({ row }) {
  if (!row || row.status === 'unmeasured') return null;

  if (row.status === 'weak') {
    return <Badge tone="danger">{row.accuracy}% · {row.correct}/{row.total}</Badge>;
  }
  if (row.status === 'solid') {
    return <Badge tone="success">{row.accuracy}% · {row.correct}/{row.total}</Badge>;
  }
  // thin — measured, but not enough to call either way.
  return <Badge tone="neutral">Only {row.total} q so far</Badge>;
}

export default function SheetLibrary({ sheets, groups, evidence, onOpen }) {
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');

  const available = useMemo(() => {
    const present = new Set(sheets.map(s => s.group));
    return ['All', ...groups.filter(g => present.has(g))];
  }, [sheets, groups]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sheets.filter((s) => {
      if (group !== 'All' && s.group !== group) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.skillLabels.some(l => l.toLowerCase().includes(q))
      );
    });
  }, [sheets, group, query]);

  const weakest = evidence?.available ? (evidence.weakest || []) : [];
  const sheetById = useMemo(() => new Map(sheets.map(s => [s.id, s])), [sheets]);

  return (
    <div>
      {/* Evidence-led entry point. Rendered ONLY when a sheet is genuinely
          measured-weak — never as a filler for a new account. */}
      {weakest.length > 0 && (
        <div className="gx-card gx-card--accent" style={{ padding: 16, marginBottom: 18 }}>
          <span className="gx-section-label">Start here — based on your assessments</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {weakest.map((w) => {
              const sheet = sheetById.get(w.sheetId);
              if (!sheet) return null;
              return (
                <button
                  key={w.sheetId}
                  onClick={() => onOpen(w.sheetId)}
                  className="gx-well"
                  style={{ textAlign: 'left', padding: '10px 14px', cursor: 'pointer', minWidth: 220 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-text)' }}>{sheet.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--gx-danger)', marginTop: 3 }}>
                    {w.accuracy}% correct ({w.correct}/{w.total} questions)
                  </div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--gx-text-subtle)', margin: '10px 0 0' }}>
            Measured from your own test and practice history. Areas you have not been assessed on are not listed —
            unmeasured is not the same as weak.
          </p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div className="gx-segment" role="tablist" aria-label="Sheet category" style={{ flexWrap: 'wrap' }}>
          {available.map(g => (
            <button
              key={g}
              role="tab"
              aria-selected={group === g}
              className="gx-segment__item"
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <input
          className="gx-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search sheets and topics..."
          aria-label="Search study sheets"
          style={{ maxWidth: 260, marginLeft: 'auto' }}
        />
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--gx-text-subtle)' }}>
          No sheets match “{query}”.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {visible.map((sheet) => {
            const row = evidence?.available ? evidence.bySheet?.[sheet.id] : null;
            return (
              <button
                key={sheet.id}
                onClick={() => onOpen(sheet.id)}
                className="gx-card gx-card--interactive"
                style={{ textAlign: 'left', padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <span className="gx-card__title" style={{ fontSize: 14 }}>{sheet.title}</span>
                  <EvidenceBadge row={row} />
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {sheet.summary}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
                  <Badge tone="neutral">{sheet.counts.concepts} concepts</Badge>
                  <Badge tone="neutral">{sheet.counts.cards} cards</Badge>
                  {sheet.counts.problems > 0 && <Badge tone="neutral">{sheet.counts.problems} problems</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
