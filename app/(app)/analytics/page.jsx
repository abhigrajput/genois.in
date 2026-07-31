'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import { Flame, Zap, CheckCircle2, ClipboardList } from 'lucide-react';

// GENOIS design system — green on slate. Blue is the one non-green series hue
// (test scores), always in its OWN chart, never on a second axis.
const G = 'var(--gx-accent)';
const BLUE = 'var(--gx-info)';
const AMBER = 'var(--gx-warning)';
const MUTED = 'var(--gx-text-muted)';
const GRID = 'var(--gx-border)';

const CARD = 'relative overflow-hidden rounded-2xl border border-primary/10 bg-[var(--gx-surface)] p-5';

const TYPE_META = {
  dsa_diagnostic:  { icon: '🎯', label: 'DSA Diagnostic' },
  aptitude:        { icon: '🧠', label: 'Aptitude' },
  daily:           { icon: '📝', label: 'Daily Test' },
  weekly:          { icon: '📅', label: 'Weekly Test' },
  monthly:         { icon: '🗓', label: 'Monthly Test' },
  revision:        { icon: '🔁', label: 'Revision Test' },
  voice_interview: { icon: '🎙', label: 'Voice Interview' },
  mock_interview:  { icon: '🎤', label: 'Mock Interview' },
};

const tooltipStyle = {
  contentStyle: {
    background: 'var(--gx-surface)',
    border: '1px solid var(--gx-accent-border)',
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--gx-text)',
  },
  labelStyle: { color: MUTED, marginBottom: 4 },
  itemStyle: { color: 'var(--gx-text)' },
};

function scoreColor(score) {
  if (score >= 70) return 'var(--gx-success)';
  if (score >= 40) return 'var(--gx-warning)';
  return 'var(--gx-danger)';
}

// Mandatory per-widget empty state — a widget with no data explains how to
// unlock itself. Never zeros-as-charts, never "0 tests" that reads like a bug.
function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="max-w-[300px] text-[13px] leading-relaxed text-muted">{message}</div>
    </div>
  );
}

function WidgetTitle({ children, caption }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-sm font-extrabold uppercase tracking-[1px] text-dark">{children}</h2>
      {caption && <p className="mt-0.5 text-[11px] text-muted">{caption}</p>}
    </div>
  );
}

function StatTile({ icon, value, label, accent }) {
  return (
    <div className={`${CARD} flex items-center gap-3 !p-4`}>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)`, color: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-mono text-lg font-bold leading-tight text-dark">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetch('/api/analytics/insights', token);
      setData(r?.data || null);
    } catch (e) {
      setError(friendlyError(e, 'load your analytics'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <LoadingSkeleton variant="page" label="Crunching your learning data…" />;
  if (error) return <ErrorCard title="Couldn't load analytics" message={error} primaryLabel="↻ Retry" onPrimary={load} />;
  if (!data) return <ErrorCard title="Couldn't load analytics" message="No data came back — retry in a moment." primaryLabel="↻ Retry" onPrimary={load} />;

  const { streak, weekly, growth, assessments, topicMastery, activity, totals } = data;

  const hasAny =
    (totals?.tasksCompleted || 0) > 0 ||
    (totals?.testsTaken || 0) > 0 ||
    (assessments?.attempts?.length || 0) > 0 ||
    (streak?.current || 0) > 0;

  // Fresh account: one clean unlock state instead of six empty widgets.
  if (!hasAny) {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 className="font-display text-[26px] font-extrabold text-dark">📊 Analytics</h1>
        <p className="mb-6 mt-1 text-[13px] text-muted">Your real learning data — no estimates, no filler.</p>
        <div className="rounded-2xl border border-primary/15 bg-[var(--gx-surface)] px-8 py-14 text-center">
          <div className="mb-3 text-5xl">🔓</div>
          <div className="mb-2 font-display text-lg font-extrabold text-dark">
            Complete tasks and assessments to unlock your analytics
          </div>
          <p className="mx-auto mb-7 max-w-[380px] text-[13px] leading-relaxed text-muted">
            Once you finish roadmap tasks, tests, or coding challenges, your streak,
            skill growth, and topic mastery will start building here — from your real activity.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link href="/roadmap" className="rounded-[10px] border-none bg-[var(--gx-accent)] px-6 py-3 font-display text-[13px] font-bold text-[var(--gx-text-inverse)] no-underline transition-all hover:brightness-110">
              Start today&apos;s roadmap →
            </Link>
            <Link href="/aptitude" className="rounded-[10px] border border-primary/25 bg-primary/10 px-6 py-3 font-display text-[13px] font-bold text-primary no-underline transition-all hover:bg-primary/20">
              Take an assessment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const weeklyData = (weekly || []).map(w => ({ week: `W${w.week}`, tasks: w.tasks }));
  const pointsData = (growth?.points || []).map(p => ({ date: p.date.slice(5), total: p.total }));
  const testsData = (growth?.tests || []).map((t, i) => ({ ...t, date: t.date.slice(5), i }));
  const activityData = (activity || []).map(d => ({ date: d.date.slice(5), completions: d.completions }));
  const attempts = assessments?.attempts || [];

  return (
    <div className="w-full space-y-5 font-sans" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div>
        <h1 className="font-display text-[26px] font-extrabold text-dark">📊 Analytics</h1>
        <p className="mt-1 text-[13px] text-muted">Your real learning data — updated as you complete work.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={<Flame size={18} strokeWidth={2} />}
          value={streak?.current || 0}
          label={streak?.activeToday ? 'day streak · active today' : 'day streak'}
          accent={AMBER}
        />
        <StatTile icon={<CheckCircle2 size={18} strokeWidth={2} />} value={(totals?.tasksCompleted || 0).toLocaleString()} label="tasks completed" accent={G} />
        <StatTile icon={<ClipboardList size={18} strokeWidth={2} />} value={(totals?.testsTaken || 0).toLocaleString()} label="tests taken" accent={BLUE} />
        <StatTile icon={<Zap size={18} strokeWidth={2} />} value={(totals?.points || 0).toLocaleString()} label="total points" accent={G} />
      </div>

      {/* Weekly progress + Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={CARD}>
          <WidgetTitle caption="Completed roadmap tasks per week">📈 Weekly Progress</WidgetTitle>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--gx-accent)' }} />
                <Bar dataKey="tasks" name="Tasks" fill={G} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🗓" message="Complete roadmap tasks to see your week-by-week progress here." />
          )}
        </div>

        <div className={CARD}>
          <WidgetTitle caption="Task completions per day, last 30 days — we count completions, not minutes">⚡ Activity</WidgetTitle>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activityData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false} interval={6} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--gx-accent)' }} />
                <Bar dataKey="completions" name="Completions" fill={G} radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="⚡" message="Your daily activity appears once you complete your first task." />
          )}
        </div>
      </div>

      {/* Skill growth — two small multiples, one axis each (never dual-axis) */}
      <div className={CARD}>
        <WidgetTitle caption="Cumulative points from every score event · every test score, in order">🚀 Skill Growth</WidgetTitle>
        {(pointsData.length > 0 || testsData.length > 0) ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: G }}>Points earned</div>
              {pointsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={pointsData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="total" name="Points" stroke={G} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="🪙" message="Earn points from tasks, tests, and coding to chart your growth." />
              )}
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: BLUE }}>Test scores (%)</div>
              {testsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={testsData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="score" name="Score %" stroke={BLUE} strokeWidth={2} dot={{ r: 2.5, fill: BLUE, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="📝" message="Take a daily or weekly test to start your score trendline." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon="🚀" message="Complete tasks and take tests — your growth curves build from real score events." />
        )}
      </div>

      {/* Topic mastery + Assessment history */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={CARD}>
          <WidgetTitle caption="Correct vs. total across assessments and coding submissions">🧠 Topic Mastery</WidgetTitle>
          {(topicMastery || []).length > 0 ? (
            <div className="space-y-3">
              {topicMastery.map(t => (
                <div key={t.topic}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] text-[var(--gx-text)]">{t.topic}</span>
                    <span className="flex-shrink-0 font-mono text-[11px]" style={{ color: scoreColor(t.pct) }}>
                      {t.correct}/{t.total} · {t.pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--gx-surface-2)]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, background: G }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🧩" message="Answer assessment questions to reveal which topics you've mastered — and which need work." />
          )}
        </div>

        <div className={CARD}>
          <div className="mb-3 flex items-baseline justify-between">
            <WidgetTitle caption="Newest first — tap any attempt for the full answer review">🗂 Assessment History</WidgetTitle>
            {attempts.length > 0 && (
              <Link href="/review" className="flex-shrink-0 text-[12px] font-semibold text-primary no-underline hover:underline">
                View all →
              </Link>
            )}
          </div>
          {!assessments?.available ? (
            <EmptyState icon="🗂" message="Assessment review isn't available yet — new attempts will appear here once you take one." />
          ) : attempts.length === 0 ? (
            <EmptyState icon="📋" message="Take a test, aptitude session, or diagnostic — every attempt lands here with a full answer review." />
          ) : (
            <div className="space-y-2">
              {attempts.slice(0, 6).map(a => {
                const meta = TYPE_META[a.attempt_type] || { icon: '📄', label: a.attempt_type };
                return (
                  <Link key={a.id} href={`/review/${a.id}`} className="no-underline">
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary/10 bg-[var(--gx-surface)] px-3.5 py-2.5 transition-all hover:border-primary/30 hover:bg-primary/5">
                      <span className="text-lg">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-dark">
                          {meta.label}{a.topic ? ` · ${a.topic}` : ''}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted">
                          {new Date(a.taken_at).toLocaleDateString()} · {a.correct_count}/{a.total_questions} correct
                        </div>
                      </div>
                      <span className="font-mono text-[14px] font-bold" style={{ color: scoreColor(a.score) }}>
                        {a.score}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
