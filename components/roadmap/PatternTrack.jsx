'use client';

/**
 * The pattern board — the roadmap's organizing unit.
 *
 * Renders the ONE pattern the student is on, what it takes to leave it, the
 * problem list they work through, and the full ordered track behind it.
 *
 * HONESTY RULES, same as <WhyThisDay/> on this page:
 *   • Every number shown is a real count from the student's own rows.
 *   • "Unmeasured" and "weak" are never collapsed into one word.
 *   • When per-problem tracking is unavailable (migration unapplied) the
 *     checkboxes are hidden and the panel SAYS SO, rather than showing an
 *     0/8 bar that can never move.
 *   • No plan → this returns null and the page reads exactly as before.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { roadmapAPI } from '@/lib/api';

const STATE_STYLE = {
  mastered: { label: 'Mastered', cls: 'border-success/25 bg-success/10 text-success', dot: 'bg-success' },
  practiced: { label: 'Unverified', cls: 'border-[var(--gx-warning)]/25 bg-[var(--gx-warning)]/10 text-[var(--gx-warning)]', dot: 'bg-[var(--gx-warning)]' },
  'in-progress': { label: 'In progress', cls: 'border-primary/25 bg-primary/10 text-primary', dot: 'bg-[var(--gx-accent)]' },
  weak: { label: 'Measured weak', cls: 'border-[var(--gx-danger)]/25 bg-[var(--gx-danger)]/10 text-[var(--gx-danger)]', dot: 'bg-[var(--gx-danger)]' },
  unmeasured: { label: 'Not measured', cls: 'border-[var(--gx-border)] bg-[var(--gx-surface)] text-muted', dot: 'bg-[var(--gx-text-subtle)]' },
  locked: { label: 'Builds on earlier work', cls: 'border-[var(--gx-border)] bg-[var(--gx-surface)] text-[var(--gx-text-subtle)]', dot: 'bg-[var(--gx-text-subtle)]' },
};

const DIFF_STYLE = {
  easy: 'text-success',
  medium: 'text-[var(--gx-warning)]',
  hard: 'text-[var(--gx-danger)]',
};

function StateBadge({ state }) {
  const s = STATE_STYLE[state] || STATE_STYLE.unmeasured;
  return (
    <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${s.cls}`}>
      {s.label}
    </span>
  );
}

/** Coverage bar. Shows solved/needed against the stated rule, never a bare %. */
function CoverageBar({ solved, needed, total }) {
  const pct = needed > 0 ? Math.min(100, Math.round((solved / needed) * 100)) : 0;
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--gx-surface)]">
        <div className="h-full rounded-full bg-[var(--gx-accent)] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>{solved}/{needed} PROBLEMS TOWARD MASTERY</span>
        <span>{total} IN THE LIST</span>
      </div>
    </div>
  );
}

export default function PatternTrack({ plan, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [showAll, setShowAll] = useState(false);
  // Optimistic local overlay so a tick feels instant; the authoritative list
  // comes back on the next reload.
  const [local, setLocal] = useState({});

  if (!plan?.available || !plan.current) return null;

  const c = plan.current;
  const { pace, totals, signals, rules } = plan;
  const tracking = signals.coverageTracking;

  const isSolved = (patternId, problem) => {
    const key = `${patternId}:${problem.id}`;
    return key in local ? local[key] : problem.solved;
  };

  async function toggle(problem) {
    if (!tracking) return;
    const key = `${c.id}:${problem.id}`;
    const next = !isSolved(c.id, problem);
    setBusy(problem.id);
    setLocal((s) => ({ ...s, [key]: next }));
    try {
      const json = await roadmapAPI.setProblemSolved(c.id, problem.id, next);
      if (json?.data?.saved === false) {
        setLocal((s) => ({ ...s, [key]: !next }));
        toast.error(json.message || 'Could not save that');
      } else if (next) {
        // A tick can be the one that clears the pattern — let the page reload
        // so advancement (and the next pattern) shows up immediately.
        onChanged?.();
      }
    } catch (e) {
      setLocal((s) => ({ ...s, [key]: !next }));
      toast.error(e.message || 'Could not save that');
    } finally {
      setBusy(null);
    }
  }

  const ev = c.evidence || { correct: 0, total: 0, accuracy: null };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-[var(--gx-surface)] p-5">
      {/* ── Header: which pattern, and where they stand ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-extrabold uppercase tracking-[1px] text-muted">
            Current pattern · {c.order + 1} of {totals.patterns}
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-dark">{c.name}</h2>
        </div>
        <StateBadge state={c.state} />
      </div>

      {/* ── Off-sequence warning. A roadmap that silently jumps from Sliding
              Window to Graphs looks broken; this says who moved it. ── */}
      {plan.detour && (
        <div className="mt-3 rounded-xl border border-[var(--gx-warning)]/25 bg-[var(--gx-warning)]/[0.07] p-3">
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-[1px] text-[var(--gx-warning)]">
            Out of sequence, on purpose
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-[var(--gx-text)]">
            You&apos;d normally be on <strong>{plan.detour.from.name}</strong> now. Your assessment history
            puts <strong>{plan.detour.to.name}</strong> ahead of it — clear this, and the sequence resumes.
          </div>
        </div>
      )}

      {/* ── The concept, hand-authored ── */}
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--gx-text)]">{c.intro}</p>

      {/* ── WHY this pattern now. Straight from evidence — no fabrication. ── */}
      <div className="mt-3.5 rounded-xl border border-[var(--gx-accent-border)] bg-[var(--gx-accent-soft)] p-3.5">
        <div className="font-mono text-[10px] font-extrabold uppercase tracking-[1px] text-[var(--gx-accent)]">
          Why this pattern now
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-dark">{c.why}</div>
        {!signals.evidence && (
          <div className="mt-1.5 text-[11px] text-muted">
            You haven&apos;t been assessed yet, so this is the standard order — not a personalised call.
            Take a test and this starts adapting.
          </div>
        )}
      </div>

      {/* ── Progress within the pattern ── */}
      <div className="mt-4 space-y-2.5">
        {tracking ? (
          <CoverageBar solved={c.solvedCount} needed={c.needed} total={c.problemCount} />
        ) : (
          <div className="rounded-xl border border-[var(--gx-warning)]/20 bg-[var(--gx-warning)]/[0.06] p-3 text-[12px] text-[var(--gx-text)]">
            Per-problem tracking isn&apos;t available on this database yet, so progress here is measured from
            assessment evidence alone.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Stat
            label="Tested accuracy"
            value={ev.total > 0 ? `${ev.accuracy}%` : '—'}
            sub={ev.total > 0 ? `${ev.correct}/${ev.total} questions` : 'nothing measured yet'}
          />
          <Stat
            label="From coding"
            value={ev.coding > 0 ? String(ev.coding) : '—'}
            sub={ev.coding > 0 ? 'questions from real submissions' : 'no coding evidence yet'}
          />
          <Stat
            label="Mastery bar"
            value={`${rules.MASTERY_ACCURACY}%`}
            sub={tracking ? `over ${rules.MIN_EVIDENCE}+ questions` : `over ${rules.DEGRADED_MIN_EVIDENCE}+ questions`}
          />
        </div>
      </div>

      {/* ── What unlocks next ── */}
      <div className="mt-4 rounded-xl border border-[var(--gx-border)] bg-[var(--gx-bg)] p-3.5">
        <div className="font-mono text-[10px] font-extrabold uppercase tracking-[1px] text-muted">
          {c.unlocks ? `Unlocks next: ${c.unlocks.name}` : 'Last pattern in the track'}
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-dark">{c.requirement.text}</div>
        <div className="mt-1.5 text-[11px] text-muted">
          Mastery here means: <span className="italic">{c.tell}</span>
        </div>
      </div>

      {/* ── The problem list ── */}
      <div className="mt-4">
        <div className="mb-2 font-mono text-[11px] font-extrabold uppercase tracking-[1px] text-muted">
          {c.name} problems · easiest first
        </div>
        <div className="flex flex-col gap-1.5">
          {c.problems.map((p) => {
            const done = isSolved(c.id, p);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-[10px] border p-2.5 transition-colors ${
                  done
                    ? 'border-success/25 bg-success/[0.07]'
                    : 'border-[var(--gx-border)] bg-[var(--gx-bg)]'
                }`}
              >
                {tracking && (
                  <button
                    onClick={() => toggle(p)}
                    disabled={busy === p.id}
                    aria-label={done ? `Mark ${p.title} unsolved` : `Mark ${p.title} solved`}
                    className={`flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border text-[11px] font-bold transition-all active:scale-90 disabled:opacity-50 ${
                      done
                        ? 'border-success bg-success text-[var(--gx-text-inverse)]'
                        : 'border-[var(--gx-border)] bg-transparent text-transparent hover:border-[var(--gx-accent)]'
                    }`}
                  >
                    ✓
                  </button>
                )}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-w-0 flex-1 truncate text-[13px] no-underline hover:underline ${
                    done ? 'text-muted line-through' : 'text-dark'
                  }`}
                >
                  {p.title}
                </a>
                <span className={`flex-shrink-0 font-mono text-[10px] font-bold uppercase ${DIFF_STYLE[p.difficulty]}`}>
                  {p.difficulty}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pace, from the real runway ── */}
      <div className="mt-4 rounded-xl border border-[var(--gx-border)] bg-[var(--gx-bg)] p-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-[1px] text-muted">Your pace</div>
          <div className="font-mono text-[11px] text-muted">
            {pace.remainingDays} days left of {pace.totalDays}
          </div>
        </div>
        <div className="mt-1 text-[13px] font-semibold text-dark">
          {pace.problemsPerDay} problems/day
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-muted">{pace.note}</div>

        {pace.trimmed.length > 0 && (
          <div className="mt-2.5 rounded-[10px] border border-[var(--gx-warning)]/20 bg-[var(--gx-warning)]/[0.06] p-2.5">
            <div className="font-mono text-[10px] font-extrabold uppercase tracking-[1px] text-[var(--gx-warning)]">
              Cut to fit your runway
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-[var(--gx-text)]">
              Even at {pace.problemsPerDay}/day the full track doesn&apos;t fit before your target, so these are
              deprioritised — you can still open them below:
            </div>
            <ul className="mt-1.5 space-y-1">
              {pace.trimmed.map((t) => (
                <li key={t.id} className="text-[11px] text-muted">
                  <span className="font-semibold text-dark">{t.name}</span> ({t.problems} problems) — {t.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── The full track ── */}
      <div className="mt-4">
        <button
          onClick={() => setShowAll((v) => !v)}
          className="cursor-pointer rounded-[10px] border border-primary/25 bg-primary/10 px-3.5 py-2 font-display text-[12px] font-bold text-primary transition-all hover:border-primary/50 hover:bg-primary/20 active:scale-[0.97]"
        >
          {showAll ? 'Hide the full track' : `Show all ${totals.patterns} patterns (${totals.mastered} mastered)`}
        </button>

        {showAll && (
          <div className="mt-3 flex flex-col gap-1.5">
            {plan.patterns.map((p) => {
              const s = STATE_STYLE[p.state] || STATE_STYLE.unmeasured;
              const isCurrent = p.id === c.id;
              return (
                <div
                  key={p.id}
                  className={`rounded-[10px] border p-2.5 ${
                    isCurrent ? 'border-[var(--gx-accent)]/40 bg-[var(--gx-accent-soft)]' : 'border-[var(--gx-border)] bg-[var(--gx-bg)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${s.dot}`} />
                      <span className="truncate text-[13px] font-semibold text-dark">{p.name}</span>
                      {p.companies.length > 0 && (
                        <span className="hidden font-mono text-[10px] text-muted sm:inline">
                          · {p.companies.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {tracking && (
                        <span className="font-mono text-[10px] text-muted">
                          {p.solvedCount}/{p.problemCount}
                        </span>
                      )}
                      <StateBadge state={p.state} />
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-muted">{p.why}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-[10px] border border-[var(--gx-border)] bg-[var(--gx-bg)] p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.5px] text-muted">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold text-dark">{value}</div>
      <div className="text-[10px] leading-tight text-muted">{sub}</div>
    </div>
  );
}
