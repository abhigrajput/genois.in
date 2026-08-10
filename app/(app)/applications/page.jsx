'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import { useRouter } from 'next/navigation';
import { Card, SectionLabel, Badge, Button, Input, Textarea, Select, Label } from '@/components/ui';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

/**
 * Application tracker — the student's own data, and the only page in GENOIS
 * that records what happened AFTER the application went in.
 *
 * Everything here is typed by the student. Nothing is inferred, scraped or
 * generated: GENOIS does not know whether anyone actually applied anywhere, so
 * an empty board says "you haven't logged anything yet" rather than showing a
 * seeded example that would read as real.
 */

const STAGES = [
  { id: 'applied',   label: 'Applied',   tone: 'neutral' },
  { id: 'oa',        label: 'OA',        tone: 'info' },
  { id: 'interview', label: 'Interview', tone: 'accent' },
  { id: 'offer',     label: 'Offer',     tone: 'success' },
  { id: 'rejected',  label: 'Rejected',  tone: 'danger' },
];

const SOURCES = [
  { id: 'off_campus', label: 'Off-campus' },
  { id: 'on_campus',  label: 'On-campus / TPO' },
  { id: 'referral',   label: 'Referral' },
  { id: 'other',      label: 'Other' },
];

const sourceLabel = (id) => SOURCES.find(s => s.id === id)?.label || null;

const muted = { color: 'var(--gx-text-muted)', fontSize: 12, lineHeight: 1.6 };
const mono = { fontFamily: 'var(--font-mono)' };

const EMPTY_FORM = { company: '', role: '', appliedOn: '', stage: 'applied', source: 'off_campus', notes: '' };

function fmtDate(iso) {
  if (!iso) return 'no date';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// ── Add / edit form ─────────────────────────────────────────────────────────

function ApplicationForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      style={{ display: 'grid', gap: 12 }}
    >
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <div>
          <Label htmlFor="app-company">Company *</Label>
          <Input id="app-company" value={form.company} onChange={set('company')} placeholder="e.g. Amazon" maxLength={120} required />
        </div>
        <div>
          <Label htmlFor="app-role">Role</Label>
          <Input id="app-role" value={form.role} onChange={set('role')} placeholder="e.g. SDE-1" maxLength={120} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        <div>
          <Label htmlFor="app-date">Date applied</Label>
          <Input id="app-date" type="date" value={form.appliedOn || ''} onChange={set('appliedOn')} />
        </div>
        <div>
          <Label htmlFor="app-stage">Stage</Label>
          <Select id="app-stage" value={form.stage} onChange={set('stage')}>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="app-source">How you applied</Label>
          <Select id="app-source" value={form.source || ''} onChange={set('source')}>
            <option value="">Not recorded</option>
            {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="app-notes">Notes</Label>
        <Textarea
          id="app-notes"
          value={form.notes || ''}
          onChange={set('notes')}
          rows={3}
          maxLength={2000}
          placeholder="Referrer, OA date, what the interviewer asked — anything you'll want back later."
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={saving || !form.company.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

// ── One card on the board ───────────────────────────────────────────────────

function ApplicationCard({ app, onEdit, onDelete, onStage, busy }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card padded style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {app.company}
          </div>
          {app.role && <div style={muted}>{app.role}</div>}
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(app)}
            aria-label={`Edit ${app.company} application`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gx-text-subtle)' }}
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${app.company} application`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gx-text-subtle)' }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div style={{ ...muted, ...mono, marginTop: 6 }}>
        {fmtDate(app.appliedOn)}
        {sourceLabel(app.source) && ` · ${sourceLabel(app.source)}`}
      </div>

      {app.notes && (
        <div style={{ ...muted, marginTop: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{app.notes}</div>
      )}

      {/* Stage change is the one edit students make constantly, so it doesn't
          require opening the full form. */}
      <div style={{ marginTop: 8 }}>
        <Label htmlFor={`stage-${app.id}`} className="gx-section-label">Move to</Label>
        <Select
          id={`stage-${app.id}`}
          value={app.stage}
          disabled={busy}
          onChange={(e) => onStage(app, e.target.value)}
          style={{ padding: '5px 8px', fontSize: 12 }}
        >
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>

      {confirming && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--gx-text)', marginBottom: 8 }}>
            Delete your {app.company} entry? This can&apos;t be undone.
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => onDelete(app)}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Keep</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const router = useRouter();
  const { token, ready } = useToken();
  const [apps, setApps] = useState([]);
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);   // the app being edited
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [prefill, setPrefill] = useState(EMPTY_FORM);

  // ?company=Amazon, handed over from the Apply directory. Read off
  // window.location rather than useSearchParams so this page needs no Suspense
  // boundary and never opts the route into a different rendering mode.
  useEffect(() => {
    const company = new URLSearchParams(window.location.search).get('company');
    if (company) {
      setPrefill({ ...EMPTY_FORM, company: company.slice(0, 120) });
      setAdding(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || !token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetch('/api/applications', token);
      setApps(r?.data?.applications || []);
      setAvailable(r?.data?.available !== false);
      setReason(r?.data?.reason || null);
    } catch (e) {
      setError(friendlyError(e, 'load your applications'));
    } finally {
      setLoading(false);
    }
  }

  async function create(form) {
    setSaving(true);
    setActionError(null);
    try {
      const r = await apiFetch('/api/applications', token, 'POST', {
        company: form.company,
        role: form.role || null,
        appliedOn: form.appliedOn || null,
        stage: form.stage,
        source: form.source || null,
        notes: form.notes || null,
      });
      setApps(prev => [r.data.application, ...prev]);
      setAdding(false);
      setPrefill(EMPTY_FORM);
    } catch (e) {
      setActionError(friendlyError(e, 'save this application'));
    } finally {
      setSaving(false);
    }
  }

  async function update(app, patch) {
    setBusyId(app.id);
    setActionError(null);
    try {
      const r = await apiFetch(`/api/applications/${app.id}`, token, 'PATCH', patch);
      setApps(prev => prev.map(a => (a.id === app.id ? r.data.application : a)));
      setEditing(null);
    } catch (e) {
      setActionError(friendlyError(e, 'update this application'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(app) {
    setBusyId(app.id);
    setActionError(null);
    try {
      await apiFetch(`/api/applications/${app.id}`, token, 'DELETE');
      setApps(prev => prev.filter(a => a.id !== app.id));
    } catch (e) {
      setActionError(friendlyError(e, 'delete this application'));
    } finally {
      setBusyId(null);
    }
  }

  const byStage = useMemo(() => {
    const cols = Object.fromEntries(STAGES.map(s => [s.id, []]));
    for (const a of apps) (cols[a.stage] || cols.applied).push(a);
    return cols;
  }, [apps]);

  if (!ready || loading) return <LoadingSkeleton variant="cards" label="Loading your applications…" />;

  if (error) return (
    <ErrorCard
      title="Couldn't load your applications"
      message={error}
      primaryLabel="↻ Retry"
      onPrimary={load}
      secondaryLabel="Go to Apply"
      onSecondary={() => router.push('/apply')}
    />
  );

  const header = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
            📋 Application Tracker
          </h1>
          <p style={{ ...muted, fontSize: 13 }}>
            Your applications, your data. Nothing here is filled in for you —{' '}
            <Link href="/apply" className="gx-link">find where to apply</Link>, then log what you sent.
          </p>
        </div>
        {available && !adding && !editing && (
          <Button onClick={() => { setPrefill(EMPTY_FORM); setAdding(true); }}>
            <Plus size={14} strokeWidth={2.2} style={{ marginRight: 5 }} /> Log an application
          </Button>
        )}
      </div>

      {actionError && (
        <div className="gx-alert gx-alert--danger" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </>
  );

  const shell = (children) => (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      {header}
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );

  // Storage genuinely isn't there. Say so — an empty board here would be a lie
  // that also silently swallows anything the student typed.
  if (!available) {
    return shell(
      <ErrorCard
        icon="🗄️"
        title="The tracker isn't set up on this environment yet"
        message={
          reason === 'not_migrated'
            ? 'The job_applications table is missing — migration supabase/migrations/20260808_job_applications.sql hasn\'t been applied here. Nothing you enter would be saved, so the board is disabled rather than pretending to work.'
            : 'We couldn\'t reach the application store. Your entries are safe; retry in a moment.'
        }
        primaryLabel="↻ Retry"
        onPrimary={load}
        secondaryLabel="Go to Apply"
        onSecondary={() => router.push('/apply')}
      />
    );
  }

  if (adding) {
    return shell(
      <Card padded>
        <SectionLabel>Log an application</SectionLabel>
        <div style={{ marginTop: 12 }}>
          <ApplicationForm
            initial={prefill}
            saving={saving}
            onSubmit={create}
            onCancel={() => { setAdding(false); setPrefill(EMPTY_FORM); }}
          />
        </div>
      </Card>
    );
  }

  if (editing) {
    return shell(
      <Card padded>
        <SectionLabel>Edit application</SectionLabel>
        <div style={{ marginTop: 12 }}>
          <ApplicationForm
            initial={{
              company: editing.company || '',
              role: editing.role || '',
              appliedOn: editing.appliedOn || '',
              stage: editing.stage,
              source: editing.source || '',
              notes: editing.notes || '',
            }}
            saving={busyId === editing.id}
            onSubmit={(form) => update(editing, {
              company: form.company,
              role: form.role || null,
              appliedOn: form.appliedOn || null,
              stage: form.stage,
              source: form.source || null,
              notes: form.notes || null,
            })}
            onCancel={() => setEditing(null)}
          />
        </div>
      </Card>
    );
  }

  // Honest empty state: no sample rows, no placeholder company.
  if (apps.length === 0) {
    return shell(
      <Card padded style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📮</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>
          Nothing logged yet
        </div>
        <div style={{ ...muted, maxWidth: 460, margin: '0 auto 16px' }}>
          This board fills up only from what you enter. GENOIS has no way to see where you&apos;ve
          applied, so there&apos;s nothing to show until you add the first one.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => { setPrefill(EMPTY_FORM); setAdding(true); }}>Log your first application</Button>
          <Link href="/apply" className="gx-btn gx-btn--secondary" style={{ textDecoration: 'none' }}>
            Find where to apply
          </Link>
        </div>
      </Card>
    );
  }

  const active = apps.filter(a => !['offer', 'rejected'].includes(a.stage)).length;

  return shell(
    <>
      <Card muted padded style={{ marginBottom: 16 }}>
        <SectionLabel>Your funnel</SectionLabel>
        <div style={{ ...muted, ...mono, marginTop: 6 }}>
          {apps.length} logged · {active} still open ·{' '}
          {STAGES.map(s => `${s.label.toLowerCase()} ${byStage[s.id].length}`).join(' · ')}
        </div>
        <div style={{ ...muted, marginTop: 4 }}>
          Counts of what you&apos;ve entered — GENOIS adds no outcomes of its own and shows no
          success rate, because a handful of applications can&apos;t support one.
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
          alignItems: 'start',
        }}
      >
        {STAGES.map(stage => (
          <section key={stage.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Badge tone={stage.tone}>{stage.label}</Badge>
              <span style={{ ...mono, ...muted }}>{byStage[stage.id].length}</span>
            </div>
            {byStage[stage.id].length === 0 ? (
              <div style={{ ...muted, padding: '10px 2px' }}>None</div>
            ) : (
              byStage[stage.id].map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  busy={busyId === app.id}
                  onEdit={setEditing}
                  onDelete={remove}
                  onStage={(a, stageId) => update(a, { stage: stageId })}
                />
              ))
            )}
          </section>
        ))}
      </div>

      <p style={{ ...muted, marginTop: 20, marginBottom: 32 }}>
        Only you can see this board. Nothing on it is shared, ranked against other students, or used
        to score you.
      </p>
    </>
  );
}
