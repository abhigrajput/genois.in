'use client';
/**
 * /projects — the guided project journey.
 *
 * WHAT THIS PAGE USED TO BE
 * -------------------------
 * A timeline of catalog projects, each with an expandable "build guide": three
 * authored phases rendered as read-only prose, a tech stack, deployment notes,
 * copy-ready resume bullets and a GitHub search link. All of that is still
 * here, unchanged — the submit-for-AI-audit flow and the audit report below it
 * are byte-for-byte what they were.
 *
 * WHAT FEATURE C ADDS ON TOP
 * --------------------------
 *   1. LEVELS. The catalog's four difficulties collapse into three tiers
 *      (lib/projectLevels.js). The student picks one, or we start them where
 *      their diagnostic and their audited-project count say they are.
 *   2. A BUILD PATH, not a paragraph. Each phase now carries the concepts it
 *      exercises (taxonomy skill ids, so they mean the same thing here as in
 *      /notes and the evidence bus), a time estimate, and — where one exists —
 *      the curated video and study sheet for exactly that phase.
 *   3. PROGRESS. Phases tick off and persist per user.
 *   4. The resume bullets a finished project earns are surfaced at the moment
 *      it is finished, instead of only inside the guide drawer.
 *
 * The enrichment (2) and the progress (3) both come from
 * /api/projects/journey; the prose stays local to this page. They line up by
 * phase index, which both sides read from the same catalog.
 */
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import VideoPlayer from '@/components/VideoPlayer';
import { DOMAIN_PROJECTS, githubSearchUrl } from '@/lib/projectTemplates';
import { LEVELS, ALL_LEVELS, tierForDifficulty, projectKey, levelMeta } from '@/lib/projectLevels';

const DIFFICULTY_META = {
  beginner:     { label: 'STARTER',      color: 'var(--gx-accent)' },
  intermediate: { label: 'INTERMEDIATE', color: 'var(--gx-warning)' },
  advanced:     { label: 'ADVANCED',     color: 'var(--gx-warning)' },
  expert:       { label: 'EXPERT',       color: 'var(--gx-danger)' },
};

/** Where the student's level choice is remembered between visits. */
const LEVEL_STORAGE_KEY = 'genois_project_level';

// Small copy-to-clipboard helper shared by the resume bullets.
function copyText(text, label = 'Copied to clipboard') {
  try {
    navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error('Copy failed — select and copy manually');
  }
}

function TechChips({ tech }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tech.map((t) => (
        <span key={t} style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--gx-text-muted)',
          background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)',
          borderRadius: 20, padding: '3px 10px',
        }}>{t}</span>
      ))}
    </div>
  );
}

function SectionLabel({ children, color = 'var(--gx-text-muted)' }) {
  return (
    <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/** Slim bar reused for a single project and for the journey summary. */
function ProgressBar({ done, total, color = 'var(--gx-accent)' }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'var(--gx-surface-2, var(--gx-surface))', overflow: 'hidden', border: '1px solid var(--gx-border)' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .25s' }} />
    </div>
  );
}

/**
 * One phase of a build path: the checkbox, what to build, the concepts it
 * exercises, how long it takes, and the resources for it.
 *
 * `meta` is the enriched half from /api/projects/journey. When it is missing
 * (the request failed, or this phase index is not in the response) the phase
 * still renders its authored steps — the guide never disappears because an
 * enrichment call did.
 */
function PhaseCard({ phase, meta, index, accent, checked, disabled, onToggle }) {
  return (
    <div style={{
      background: checked ? 'var(--gx-success-soft)' : 'var(--gx-surface)',
      border: `1px solid ${checked ? 'var(--gx-success-border)' : 'var(--gx-border)'}`,
      borderRadius: 10, padding: '12px 14px', transition: 'background .2s, border-color .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onToggle(index, e.target.checked)}
          aria-label={`Mark phase "${phase.name}" complete`}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--gx-success)', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: `color-mix(in srgb, ${accent} 9%, transparent)`, color: accent,
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
            }}>{index + 1}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-text)', textDecoration: checked ? 'line-through' : 'none' }}>
              {phase.name}
            </span>
            {meta?.hours && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--gx-text-muted)' }}>
                ~{meta.hours.label}
              </span>
            )}
          </div>

          {/* What to build */}
          <ul style={{ margin: '8px 0 0', paddingLeft: 4, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {phase.steps.map((st, si) => (
              <li key={si} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>
                <span style={{ color: accent, flexShrink: 0 }}>▸</span>
                <span>{st}</span>
              </li>
            ))}
          </ul>

          {/* Concepts this phase exercises — same vocabulary as /notes and the
              evidence bus. A phase with nothing in the taxonomy shows nothing. */}
          {!!meta?.skills?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--gx-text-subtle, var(--gx-text-muted))', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>
                Uses
              </span>
              {meta.skills.map((s) => (
                <span key={s.id} style={{
                  fontSize: 10.5, color: 'var(--gx-accent)', background: 'var(--gx-accent-soft)',
                  border: '1px solid var(--gx-border)', borderRadius: 20, padding: '3px 10px',
                }}>{s.label}</span>
              ))}
            </div>
          )}

          {/* Learn it here: the curated video plays in-page, the sheet opens in
              /notes. Both are omitted entirely when nothing is curated. */}
          {(meta?.video || meta?.sheet) && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meta.video && (
                <div>
                  <SectionLabel>▶ Learn this phase</SectionLabel>
                  <VideoPlayer video={meta.video} asModal />
                </div>
              )}
              {meta.sheet && (
                <a href={`/notes?sheet=${encodeURIComponent(meta.sheet.id)}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                    fontSize: 12, color: 'var(--gx-accent)', background: 'var(--gx-accent-soft)',
                    border: '1px solid var(--gx-border)', borderRadius: 8, padding: '6px 10px', textDecoration: 'none',
                  }}>
                  📑 Study sheet: {meta.sheet.title}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPortfolioPage() {
  const { user } = useAuthStore();
  const { token, ready } = useToken();

  const [currentWeek, setCurrentWeek] = useState(1);
  const [historyList, setHistoryList] = useState([]);
  const [journey, setJourney] = useState(null);   // /api/projects/journey payload
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The journey API reads the domain from the users table; the auth store is a
  // cached copy that can lag a profile change. Both sides build project keys
  // from this value, so they have to agree — prefer the server's answer.
  //
  // domains.slug values are e.g. 'cybersec' (not 'cybersecurity') — the old key
  // silently fell back to fullstack for several domains. Resolve against the
  // real catalog, then fall back to fullstack only when a domain has no
  // templates yet. lib/projectJourney.js applies exactly the same fallback.
  const domain = journey?.domain || user?.domain_slug || 'fullstack';
  const projects = DOMAIN_PROJECTS[domain] || DOMAIN_PROJECTS.fullstack;

  // The tier being shown. `null` until we know whether the student has picked
  // one before, so the first paint does not flash the wrong tier.
  const [level, setLevel] = useState(null);
  const [levelChosen, setLevelChosen] = useState(false);

  // Submission form state (one project open at a time)
  const [activeSubmitting, setActiveSubmitting] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState({}); // title -> bool (guidance drawer)
  const [savingPhase, setSavingPhase] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    fetchAll();
  }, [ready, token]);

  // The remembered choice wins over the inferred level, because a student who
  // has told us where they are should not be re-guessed at on every visit.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LEVEL_STORAGE_KEY) : null;
    if (saved) { setLevel(saved); setLevelChosen(true); }
  }, []);

  useEffect(() => {
    if (level === null && journey?.inferred?.level) setLevel(journey.inferred.level);
  }, [journey, level]);

  async function fetchAll() {
    setError(null);
    setLoading(true);
    try {
      const rData = await apiFetch('/api/roadmap/daily', token).catch(() => null);
      if (rData?.success) {
        const currentDay = rData.data?.currentDay || 1;
        setCurrentWeek(Math.ceil(currentDay / 7));
      }
      const [history, journeyRes] = await Promise.all([
        apiFetch('/api/projects/history', token),
        // The journey is an enhancement, not a prerequisite: if it fails the
        // page still renders the catalog, the guides and the submit flow.
        apiFetch('/api/projects/journey', token).catch(() => null),
      ]);
      if (history.success) setHistoryList(history.data.projects || []);
      if (journeyRes?.success) setJourney(journeyRes.data);
    } catch (e) {
      setError(friendlyError(e, 'load your project portfolio'));
    } finally {
      setLoading(false);
    }
  }

  function chooseLevel(next) {
    setLevel(next);
    setLevelChosen(true);
    try { localStorage.setItem(LEVEL_STORAGE_KEY, next); } catch { /* private mode — the choice just won't persist */ }
  }

  /** key → { phases, completedPhases, totalHours, … } from the journey API. */
  const journeyByKey = useMemo(() => {
    const map = new Map();
    for (const p of journey?.projects || []) map.set(p.key, p);
    return map;
  }, [journey]);

  const trackingAvailable = journey ? journey.trackingAvailable : false;

  async function togglePhase(project, phaseIndex, done) {
    const key = projectKey(domain, project.week, project.title);
    if (!trackingAvailable) return;

    const before = journeyByKey.get(key)?.completedPhases || [];
    const after = done
      ? [...new Set([...before, phaseIndex])].sort((a, b) => a - b)
      : before.filter((i) => i !== phaseIndex);

    // Optimistic: a checkbox that waits on a round-trip feels broken.
    setJourney((j) => j && ({
      ...j,
      projects: j.projects.map(p => p.key === key ? { ...p, completedPhases: after } : p),
    }));
    setSavingPhase(`${key}:${phaseIndex}`);

    try {
      const res = await apiFetch('/api/projects/journey', token, 'POST', {
        projectKey: key, phaseIndex, done,
      });
      if (res?.success) {
        setJourney((j) => j && ({
          ...j,
          projects: j.projects.map(p => p.key === key
            ? { ...p, completedPhases: res.data.completedPhases, completedAt: res.data.completedAt }
            : p),
        }));
        const total = journeyByKey.get(key)?.phaseCount || 0;
        if (done && res.data.completedPhases.length === total) {
          toast.success('Project complete — grab your resume bullets below');
        }
      }
    } catch (err) {
      // Put the checkbox back where it was; a tick that silently stored
      // nothing is worse than one that visibly failed.
      setJourney((j) => j && ({
        ...j,
        projects: j.projects.map(p => p.key === key ? { ...p, completedPhases: before } : p),
      }));
      toast.error(friendlyError(err, 'save your progress'));
    } finally {
      setSavingPhase(null);
    }
  }

  async function submitProject(e, project) {
    e.preventDefault();
    if (!githubUrl || !githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/projects/submit', token, 'POST', {
        projectTitle: project.title,
        githubUrl,
        week: project.week,
        domain,
        difficulty: project.difficulty,
        description: project.description,
        notes: projectNotes,
      });
      if (data.success) {
        toast.success(data.message || 'Project submitted!');
        setActiveSubmitting(null);
        setGithubUrl('');
        setProjectNotes('');
        fetchAll();
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'submit your project'));
    } finally {
      setSubmitting(false);
    }
  }

  const getRecord = (title) => historyList.find((h) => h.projects?.title === title) || null;
  const getStatus = (title) => getRecord(title)?.status || 'not_started';

  const visibleProjects = useMemo(
    () => (level && level !== ALL_LEVELS
      ? projects.filter(p => tierForDifficulty(p.difficulty) === level)
      : projects),
    [projects, level],
  );

  // Journey-wide totals for the summary card.
  const totals = useMemo(() => {
    const rows = (journey?.projects || []).filter(
      p => !level || level === ALL_LEVELS || p.tier === level,
    );
    const phasesDone = rows.reduce((n, p) => n + (p.completedPhases?.length || 0), 0);
    const phasesTotal = rows.reduce((n, p) => n + p.phaseCount, 0);
    return {
      phasesDone,
      phasesTotal,
      started: rows.filter(p => (p.completedPhases?.length || 0) > 0).length,
      finished: rows.filter(p => p.completedPhases?.length === p.phaseCount).length,
      hours: rows.reduce((n, p) => n + (p.totalHours?.min || 0), 0),
    };
  }, [journey, level]);

  if (!ready || loading) {
    return <LoadingSkeleton variant="cards" label="Loading your project portfolio…" />;
  }

  if (error) {
    return <ErrorCard title="Couldn't load your portfolio" message={error} primaryLabel="↻ Retry" onPrimary={fetchAll} />;
  }

  const activeLevel = levelMeta(level);

  return (
    <div className="w-full space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'var(--font-heading)' }}>🎓 Guided Project Journey</h1>
        <p className="text-sm text-gray-400 mt-1">Pick your level, then follow the build path phase by phase — what to build, the concepts it uses, how long it takes, and the video or sheet to learn it from. Tick phases off as you go.</p>
      </div>

      {/* Level picker */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 18 }}>
        <SectionLabel>Your level</SectionLabel>
        <div className="gx-segment" role="tablist" aria-label="Project level" style={{ flexWrap: 'wrap' }}>
          {[...LEVELS, { id: ALL_LEVELS, label: 'All projects' }].map((l) => (
            <button key={l.id} role="tab" aria-selected={level === l.id}
              className="gx-segment__item" onClick={() => chooseLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', margin: '10px 0 0', lineHeight: 1.55 }}>
          {activeLevel
            ? activeLevel.blurb
            : 'Every project in your track, in week order.'}
        </p>
        {!levelChosen && journey?.inferred && (
          <p style={{ fontSize: 12, color: 'var(--gx-text-muted)', margin: '6px 0 0' }}>
            Starting you at <strong style={{ color: 'var(--gx-text)' }}>{levelMeta(journey.inferred.level)?.label}</strong>
            {journey.inferred.source === 'diagnostic' && ' based on your diagnostic score'}
            {journey.inferred.source === 'portfolio' && ' based on the projects you\'ve already had audited'}
            {journey.inferred.source === 'default' && ' — take the diagnostic or pick a level yourself to change this'}.
          </p>
        )}
      </div>

      {journey && !trackingAvailable && (
        <div className="gx-alert gx-alert--warning" style={{ fontSize: 13 }}>
          Phase tracking isn&apos;t available on this environment yet, so the checkboxes are read-only.
          Everything else on this page — the build paths, resources and submissions — works normally.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: project timeline */}
        <div className="xl:col-span-2 space-y-4">
          {visibleProjects.length === 0 && (
            <div style={{ background: 'var(--gx-surface)', border: '1px dashed var(--gx-border)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gx-text)' }}>
                No {activeLevel?.label?.toLowerCase()} projects curated for this track yet
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', margin: '8px auto 0', maxWidth: '48ch', lineHeight: 1.6 }}>
                Your domain&apos;s catalog doesn&apos;t reach this tier. Finish the tiers below it — an
                interviewer would rather see two shipped intermediate builds than one abandoned advanced one.
              </p>
            </div>
          )}

          {visibleProjects.map((proj, idx) => {
            const status = getStatus(proj.title);
            const key = projectKey(domain, proj.week, proj.title);
            const jp = journeyByKey.get(key);
            const completed = jp?.completedPhases || [];
            const phaseCount = jp?.phaseCount ?? proj.phases.length;
            const allDone = completed.length >= phaseCount && phaseCount > 0;

            // The week lock is guidance for someone browsing the whole track. It
            // is deliberately lifted inside a chosen tier: a student who says
            // "I'm advanced" is telling us to show them advanced work now, and
            // locking it would make the level picker decorative.
            const isLocked = (!level || level === ALL_LEVELS) && idx >= 2 && proj.week > currentWeek + 2;
            const record = getRecord(proj.title);
            const diff = DIFFICULTY_META[proj.difficulty] || DIFFICULTY_META.beginner;
            const isOpen = !!expanded[proj.title];

            let feedback = null;
            if (record?.ai_feedback) {
              try {
                feedback = typeof record.ai_feedback === 'string' ? JSON.parse(record.ai_feedback) : record.ai_feedback;
              } catch { /* malformed feedback — ignore */ }
            }

            return (
              <div key={key} style={{
                background: 'var(--gx-surface)',
                border: isLocked ? '1px solid var(--gx-border)' : `1px solid ${allDone ? 'var(--gx-success-border)' : diff.color}`,
                borderRadius: 16, padding: 20, opacity: isLocked ? 0.5 : 1,
                position: 'relative', overflow: 'hidden', transition: 'all 0.25s',
              }}>
                {/* Timeline accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                  background: isLocked ? 'var(--gx-surface)' : allDone || status === 'reviewed' ? 'var(--gx-success)' : status === 'submitted' ? 'var(--gx-accent)' : diff.color,
                }} />

                {/* Title & badge row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>WEEK {proj.week}</span>
                    <span style={{ background: `color-mix(in srgb, ${diff.color} 8%, transparent)`, color: diff.color, fontSize: 10, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{diff.label}</span>
                    {jp?.totalHours && (
                      <span style={{ fontSize: 10.5, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ~{jp.totalHours.min}–{jp.totalHours.max} h
                      </span>
                    )}
                  </div>
                  <div>
                    {isLocked && <span className="text-gray-500 text-xs font-semibold">🔒 Locked</span>}
                    {!isLocked && status === 'not_started' && !allDone && completed.length === 0 && <span className="text-gray-400 text-xs font-semibold">⏳ Not Started</span>}
                    {!isLocked && status === 'not_started' && !allDone && completed.length > 0 && <span style={{ color: 'var(--gx-accent)', fontSize: 12, fontWeight: 700 }}>🔨 Building</span>}
                    {!isLocked && status === 'not_started' && allDone && <span style={{ color: 'var(--gx-success)', fontSize: 12, fontWeight: 700 }}>✅ Build Complete</span>}
                    {!isLocked && status === 'submitted' && <span style={{ color: 'var(--gx-accent)', fontSize: 12, fontWeight: 700 }}>🛸 Under AI Audit</span>}
                    {!isLocked && status === 'reviewed' && <span style={{ color: 'var(--gx-success)', fontSize: 12, fontWeight: 700 }}>✅ Audit Completed</span>}
                  </div>
                </div>

                {/* Project details */}
                <div style={{ paddingLeft: 12, marginTop: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gx-text)', fontFamily: 'var(--font-heading)' }}>{proj.title}</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--gx-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{proj.description}</p>

                  {/* Build progress */}
                  {jp && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gx-text-muted)', marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase' }}>Build progress</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{completed.length}/{phaseCount} phases</span>
                      </div>
                      <ProgressBar done={completed.length} total={phaseCount} color={allDone ? 'var(--gx-success)' : diff.color} />
                    </div>
                  )}

                  {/* Tech stack — always visible */}
                  <div style={{ marginTop: 14 }}>
                    <SectionLabel>Tech stack</SectionLabel>
                    <TechChips tech={proj.tech} />
                  </div>

                  {/* Expand / collapse the deep guidance so cards stay scannable */}
                  <button onClick={() => setExpanded((p) => ({ ...p, [proj.title]: !p[proj.title] }))}
                    style={{
                      marginTop: 16, background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)',
                      color: 'var(--gx-accent)', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
                      cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    {isOpen ? '▲ Hide build path' : '▼ Open the guided build path'}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* THE BUILD PATH */}
                      <div>
                        <SectionLabel>Build path — tick each phase as you finish it</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {proj.phases.map((phase, pi) => (
                            <PhaseCard
                              key={pi}
                              phase={phase}
                              meta={jp?.phases?.[pi]}
                              index={pi}
                              accent={diff.color}
                              checked={completed.includes(pi)}
                              disabled={!trackingAvailable || savingPhase === `${key}:${pi}`}
                              onToggle={(i, done) => togglePhase(proj, i, done)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Deployment guidance */}
                      <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: '12px 14px' }}>
                        <SectionLabel color="var(--gx-accent)">🚀 Where &amp; how to deploy</SectionLabel>
                        <div style={{ fontSize: 12.5, color: 'var(--gx-text)', fontWeight: 600, marginBottom: 6 }}>{proj.deploy.platform}</div>
                        <ul style={{ margin: 0, paddingLeft: 4, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {proj.deploy.notes.map((n, ni) => (
                            <li key={ni} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>
                              <span style={{ color: 'var(--gx-accent)', flexShrink: 0 }}>•</span>
                              <span>{n}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Resume bullets — copy-ready */}
                      <div>
                        <SectionLabel color="var(--gx-warning)">📄 Resume bullets (click to copy)</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {proj.resumeBullets.map((b, bi) => (
                            <button key={bi} onClick={() => copyText(b, 'Resume bullet copied')}
                              title="Click to copy"
                              style={{
                                textAlign: 'left', background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)',
                                borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'flex-start',
                                fontFamily: 'var(--font-body)',
                              }}>
                              <span style={{ color: 'var(--gx-warning)', fontSize: 12, flexShrink: 0, marginTop: 1 }}>⧉</span>
                              <span style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>{b}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* GitHub reference search — never a hardcoded/invented repo URL */}
                      <div>
                        <SectionLabel>🔗 Reference implementations</SectionLabel>
                        <a href={githubSearchUrl(proj.searchTerms)} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--gx-accent)',
                            background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 8,
                            padding: '8px 12px', textDecoration: 'none',
                          }}>
                          <span>🐙</span> Browse similar projects on GitHub →
                        </a>
                        <p style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                          Opens a live GitHub search for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gx-text-muted)' }}>{proj.searchTerms}</span> — study real repos, don&apos;t copy them.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* What finishing the build earns — shown at the moment it is
                      earned, not buried in the drawer. Same authored bullets. */}
                  {allDone && status === 'not_started' && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid var(--gx-success-border)', background: 'var(--gx-success-soft)' }}>
                      <div style={{ fontSize: 13, color: 'var(--gx-success)', fontWeight: 700, marginBottom: 4 }}>
                        🎉 All {phaseCount} phases done — this is what it&apos;s worth on your resume
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                        Click a line to copy it. Then submit the repo for an AI audit — the report tells you
                        what an interviewer will pick at.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proj.resumeBullets.map((b, bi) => (
                          <button key={bi} onClick={() => copyText(b, 'Resume bullet copied')}
                            title="Click to copy"
                            style={{
                              textAlign: 'left', background: 'var(--gx-surface)', border: '1px solid var(--gx-border)',
                              borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 8,
                              alignItems: 'flex-start', fontFamily: 'var(--font-body)',
                            }}>
                            <span style={{ color: 'var(--gx-success)', fontSize: 12, flexShrink: 0, marginTop: 1 }}>⧉</span>
                            <span style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.5 }}>{b}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit repository */}
                  {!isLocked && status === 'not_started' && activeSubmitting !== proj.title && (
                    <button onClick={() => setActiveSubmitting(proj.title)} style={{
                      marginTop: 16, background: 'var(--gx-accent)',
                      color: 'var(--gx-text-inverse)', fontWeight: 700, fontSize: 13, padding: '10px 20px',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                    }}>
                      Submit Your Build for AI Audit →
                    </button>
                  )}

                  {activeSubmitting === proj.title && (
                    <form onSubmit={(e) => submitProject(e, proj)} style={{
                      marginTop: 16, padding: 14, borderRadius: 12,
                      border: '1px solid var(--gx-accent-border)', background: 'var(--gx-surface-2)',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--gx-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>GitHub Repo URL</label>
                        <input type="url" required value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/yourusername/your-project"
                          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--gx-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Submission Notes</label>
                        <textarea value={projectNotes} onChange={(e) => setProjectNotes(e.target.value)} rows={2}
                          placeholder="List technologies used, features implemented, live URL…"
                          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', resize: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={submitting} style={{ flex: 1, padding: 10, borderRadius: 6, border: 'none', fontWeight: 700, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', cursor: 'pointer' }}>{submitting ? 'Submitting…' : 'Submit Repository'}</button>
                        <button type="button" onClick={() => setActiveSubmitting(null)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text)', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {/* AI feedback */}
                  {status === 'reviewed' && feedback && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid var(--gx-success-border)', background: 'var(--gx-success-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--gx-success)', fontWeight: 700 }}>🎯 Senior AI Audit Report</span>
                        {feedback.grade && <span style={{ background: 'var(--gx-success-soft)', color: 'var(--gx-success)', fontSize: 14, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>{feedback.grade} ({feedback.score}/100)</span>}
                      </div>
                      {feedback.overall_feedback && <p style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{feedback.overall_feedback}</p>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, marginBottom: 10 }}>
                        <div>
                          <div style={{ color: 'var(--gx-success)', fontWeight: 700, marginBottom: 4 }}>✓ Key Strengths</div>
                          {feedback.strengths?.map((str, i) => <div key={i} style={{ color: 'var(--gx-text-muted)' }}>• {str}</div>)}
                        </div>
                        <div>
                          <div style={{ color: 'var(--gx-danger)', fontWeight: 700, marginBottom: 4 }}>⚡ Recommendations</div>
                          {feedback.improvements?.map((imp, i) => <div key={i} style={{ color: 'var(--gx-text-muted)' }}>• {imp}</div>)}
                        </div>
                      </div>
                      {feedback.encouragement && (
                        <div style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--gx-text-muted)', borderTop: '1px solid var(--gx-border)', paddingTop: 8, marginTop: 8 }}>
                          &ldquo;{feedback.encouragement}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: journey progress, portfolio stats, guide */}
        <div className="space-y-6">
          {journey && (
            <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 14, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>🧭 Your Build Journey</h3>

              {totals.phasesDone === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Nothing built yet. Open the first project&apos;s build path and tick{' '}
                  <strong style={{ color: 'var(--gx-text)' }}>phase 1</strong> when it&apos;s working on your machine —
                  that&apos;s the whole start. The {totals.phasesTotal} phases at this level add up to roughly{' '}
                  {totals.hours} hours of building.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gx-text-muted)', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase' }}>Phases complete</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{totals.phasesDone}/{totals.phasesTotal}</span>
                  </div>
                  <ProgressBar done={totals.phasesDone} total={totals.phasesTotal} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                    <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-accent)' }}>{totals.started}</div>
                      <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>In Progress</div>
                    </div>
                    <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-success)' }}>{totals.finished}</div>
                      <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Builds Finished</div>
                    </div>
                  </div>
                </>
              )}
              <p style={{ fontSize: 10.5, color: 'var(--gx-text-subtle, var(--gx-text-muted))', marginTop: 12, lineHeight: 1.5 }}>
                Time figures are estimates from the phase size and difficulty, not measurements — treat them as a pace, not a deadline.
              </p>
            </div>
          )}

          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 16, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>📊 Portfolio Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-accent)' }}>{historyList.filter((h) => h.status === 'reviewed').length}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Audited Projects</div>
              </div>
              <div style={{ background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-warning)' }}>{historyList.filter((h) => h.status === 'submitted').length}</div>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>Pending Audit</div>
              </div>
            </div>
            <div style={{ marginTop: 14, background: 'var(--gx-surface)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gx-warning)' }}>{visibleProjects.length}</div>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 2 }}>
                {level && level !== ALL_LEVELS ? `${activeLevel?.label} Projects` : 'Projects in Your Track'}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 12, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>💻 How to Use This Page</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5, color: 'var(--gx-text-muted)', lineHeight: 1.6 }}>
              <div><strong style={{ color: 'var(--gx-text)' }}>1. Pick your level</strong><p style={{ marginTop: 2 }}>Starter assumes zero experience. Be honest — the path is the same, only the starting rung differs.</p></div>
              <div><strong style={{ color: 'var(--gx-text)' }}>2. Follow the build path</strong><p style={{ marginTop: 2 }}>One phase at a time. Each says what to build, which concepts it uses, and how long it should take — with a video or sheet where you need to learn something first.</p></div>
              <div><strong style={{ color: 'var(--gx-text)' }}>3. Tick as you go</strong><p style={{ marginTop: 2 }}>Progress saves to your account, so you can put a build down for a week and pick it back up.</p></div>
              <div><strong style={{ color: 'var(--gx-text)' }}>4. Ship, then submit</strong><p style={{ marginTop: 2 }}>Deploy using the notes for that exact stack, submit the repo for an AI audit, and paste the resume bullets straight into your CV.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
