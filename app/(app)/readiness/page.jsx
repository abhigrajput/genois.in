'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import { Card, CardHeader, CardBody, CardTitle, SectionLabel, Badge, Progress } from '@/components/ui';

/**
 * Placement Readiness.
 *
 * Every number on this page is followed by the evidence that produced it, and
 * anything that has NOT been measured says "not measured" rather than showing
 * a zero or a placeholder. There is deliberately no offer probability and no
 * unconditional ETA — see lib/placementReadiness.js for why.
 */

const scoreTone = (score) =>
  score >= 75 ? 'var(--gx-success)' : score >= 50 ? 'var(--gx-warning)' : 'var(--gx-danger)';

const muted = { color: 'var(--gx-text-muted)', fontSize: 12, lineHeight: 1.6 };
const mono = { fontFamily: 'var(--font-mono)' };

function ActionLink({ action }) {
  if (!action?.href) return null;
  return (
    <Link href={action.href} className="gx-btn gx-btn--outline gx-btn--sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
      {action.label} →
    </Link>
  );
}

/** A labelled bar with its evidence line, or an honest "not measured" row. */
function DimensionRow({ dim }) {
  const weightPct = Math.round(dim.weight * 100);

  if (!dim.measured) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gx-border)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text-muted)' }}>
            {dim.label} <span style={{ ...mono, fontSize: 11 }}>· {weightPct}% weight</span>
          </div>
          <div style={muted}>{dim.missingMessage}</div>
        </div>
        <ActionLink action={dim.action} />
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--gx-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>
          {dim.label} <span style={{ ...mono, fontSize: 11, color: 'var(--gx-text-muted)' }}>· {weightPct}% weight</span>
        </span>
        <span style={{ ...mono, fontSize: 15, fontWeight: 700, color: scoreTone(dim.score) }}>{dim.score}%</span>
      </div>
      <Progress value={dim.score} max={100} label={dim.label} style={{ margin: '6px 0' }} />
      <div style={muted}>{dim.evidence}</div>
      {dim.detail && (
        <div style={{ ...muted, ...mono, marginTop: 2 }}>
          technical {dim.detail.technical ?? '—'} · clarity {dim.detail.clarity ?? '—'} · confidence {dim.detail.confidence ?? '—'}
        </div>
      )}
    </div>
  );
}

/** One focus area, with the per-skill correct/total rows behind it. */
function AreaRow({ area }) {
  const tone = area.status === 'not_measured' ? 'var(--gx-text-subtle)' : scoreTone(area.accuracy);

  return (
    <div style={{ padding: '9px 0', borderBottom: '1px solid var(--gx-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: area.measured ? 'var(--gx-text)' : 'var(--gx-text-muted)' }}>
          {area.label}
        </span>
        <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: tone }}>
          {area.measured ? `${area.accuracy}%` : 'not measured'}
        </span>
      </div>

      {area.measured ? (
        <>
          <Progress value={area.accuracy} max={100} label={area.label} style={{ margin: '5px 0' }} />
          <details>
            <summary style={{ ...muted, ...mono, cursor: 'pointer' }}>
              {area.correct}/{area.total} correct · {area.skills.length} skill{area.skills.length > 1 ? 's' : ''} with evidence
            </summary>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {area.skills.map(s => (
                <div key={s.skill} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, ...muted }}>
                  <span>{s.label}</span>
                  <span style={mono}>{s.correct}/{s.total} · {s.accuracy}%</span>
                </div>
              ))}
            </div>
          </details>
        </>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={muted}>
            {area.total > 0 ? `${area.total} question${area.total > 1 ? 's' : ''} of evidence so far — not enough to score` : 'no evidence yet'}
          </span>
          <ActionLink action={area.action} />
        </div>
      )}
    </div>
  );
}

function CompanyCard({ c }) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <CardTitle>{c.company}</CardTitle>
          <div style={{ ...muted, marginTop: 2 }}>{c.focusSentence || c.profile}</div>
        </div>
        {c.scored ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...mono, fontSize: 30, fontWeight: 800, lineHeight: 1, color: scoreTone(c.overall) }}>{c.overall}%</div>
            <div style={{ ...muted, ...mono }}>
              {c.coverage.dimensionsMeasured}/{c.coverage.dimensionsTotal} inputs · {c.coverage.areasMeasured}/{c.coverage.areasTotal} focus areas
            </div>
          </div>
        ) : (
          <Badge tone="neutral">Not enough evidence yet</Badge>
        )}
      </CardHeader>

      <CardBody>
        {!c.scored && (
          <div style={{ background: 'var(--gx-info-soft)', border: '1px solid var(--gx-info-border)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)', marginBottom: 4 }}>
              No readiness score for {c.company} yet
            </div>
            <div style={muted}>
              {c.unscoredReason} We won&apos;t show a percentage until there is real evidence behind it.
            </div>
          </div>
        )}

        <SectionLabel>Score inputs</SectionLabel>
        <div style={{ marginTop: 6, marginBottom: 6 }}>
          {c.dimensions.map(d => <DimensionRow key={d.key} dim={d} />)}
        </div>
        <div style={{ ...muted, marginBottom: 18 }}>{c.weightsNote}</div>

        <SectionLabel>Focus areas — from {c.company}&apos;s interview profile</SectionLabel>
        <div style={{ marginTop: 6, marginBottom: 18 }}>
          {c.areas.length
            ? c.areas.map(a => <AreaRow key={a.key} area={a} />)
            : <div style={muted}>This company&apos;s profile names no focus areas the skill taxonomy tracks yet.</div>}
        </div>

        {c.gaps.length > 0 && (
          <>
            <SectionLabel>What&apos;s blocking you</SectionLabel>
            <div style={{ marginTop: 6, marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.gaps.map(g => (
                <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>
                      {g.label}{' '}
                      <Badge tone={g.type === 'weak' ? 'danger' : 'neutral'} pill>
                        {g.type === 'weak' ? `${g.accuracy}%` : 'unmeasured'}
                      </Badge>
                    </div>
                    <div style={muted}>{g.detail}</div>
                  </div>
                  <ActionLink action={g.action} />
                </div>
              ))}
            </div>
          </>
        )}

        {c.missingInputs.length > 0 && (
          <div style={{ background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>Not measured yet</div>
            {c.missingInputs.map(m => (
              <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <span style={muted}>{m.message}</span>
                <ActionLink action={m.action} />
              </div>
            ))}
          </div>
        )}

        {c.eta.available ? (
          <div style={{ borderTop: '1px solid var(--gx-border)', paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--gx-text)' }}>
              At your current pace, closing these gaps takes about{' '}
              <strong style={mono}>{c.eta.days} day{c.eta.days > 1 ? 's' : ''}</strong>.
            </div>
            <div style={muted}>{c.eta.note} Based on {c.eta.basis}.</div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--gx-border)', paddingTop: 12, ...muted }}>
            {c.eta.reason === 'no_gaps'
              ? 'No open gaps in the tracked focus areas — nothing to estimate.'
              : 'No time estimate — we only project a date from your own logged practice pace, and there isn\'t enough history yet (3+ active days across at least a week).'}
          </div>
        )}

        <details style={{ marginTop: 14 }}>
          <summary style={{ ...muted, cursor: 'pointer' }}>How this number is computed</summary>
          <div style={{ ...muted, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={mono}>overall = Σ(dimension × weight) ÷ Σ(weight), measured dimensions only</div>
            <div style={mono}>
              skills {c.weights.skills} · resume {c.weights.resume} · interview {c.weights.interview}
            </div>
            <div>Skill mastery is the mean accuracy of the focus areas above; an area needs 3+ graded questions before it counts. Unmeasured areas are excluded, never scored zero.</div>
            <div>No offer or interview probability is shown anywhere — GENOIS holds no hiring-outcome data, so any such number would be made up.</div>
          </div>
        </details>
      </CardBody>
    </Card>
  );
}

export default function ReadinessPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready || !token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const r = await apiFetch('/api/readiness', token);
      setData(r?.data || null);
    } catch (e) {
      setError(friendlyError(e, 'load your readiness'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <LoadingSkeleton variant="page" label="Reading your assessment evidence…" />;

  if (error) return (
    <ErrorCard title="Couldn't load readiness" message={error} primaryLabel="↻ Retry" onPrimary={load} secondaryLabel="Go to dashboard" onSecondary={() => { window.location.href = '/dashboard'; }} />
  );

  const header = (
    <>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
        🎯 Placement Readiness
      </h1>
      <p style={{ ...muted, fontSize: 13, marginBottom: 24 }}>
        Built only from work you&apos;ve actually done — graded questions, resume analyses and mock interviews.
        Anything we haven&apos;t measured says so.
      </p>
    </>
  );

  const shell = (children) => (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      {header}
      {children}
    </div>
  );

  if (!data?.available) {
    return shell(
      <ErrorCard
        title="Readiness is unavailable"
        message="We couldn't read your evidence right now. Retry in a moment."
        primaryLabel="↻ Retry"
        onPrimary={load}
      />
    );
  }

  // ── No target company: nothing to score against, and picking one for the
  //    student would be inventing intent. ──────────────────────────────────
  if (!data.hasTargets) {
    return shell(
      <Card padded style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>Pick a target company first</div>
        <div style={{ ...muted, maxWidth: 460, margin: '0 auto 16px' }}>
          Readiness is scored against a specific company&apos;s interview profile, so there&apos;s nothing to
          score until you choose one.
          {data.unknownTargets?.length > 0 && (
            <> Your profile lists {data.unknownTargets.join(', ')}, which GENOIS doesn&apos;t have an
            interview profile for yet.</>
          )}
        </div>
        <Link href="/profile" className="gx-btn gx-btn--primary" style={{ textDecoration: 'none' }}>
          Choose target companies →
        </Link>
        <div style={{ ...muted, marginTop: 14 }}>
          Profiles available: {data.allCompanies.join(' · ')}
        </div>
      </Card>
    );
  }

  // ── Targets set, but zero evidence anywhere. The fresh-account state: no
  //    percentage, no ETA, no ranking — just what to do first. ────────────
  if (!data.hasAnyEvidence) {
    return shell(
      <Card padded style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>
          Complete a diagnostic and a few assessments to unlock your readiness
        </div>
        <div style={{ ...muted, maxWidth: 480, margin: '0 auto 18px' }}>
          You&apos;re targeting {data.targets.join(', ')}. We score readiness only from work you&apos;ve
          actually done, so there&apos;s nothing to show yet — no estimated score, no percentage.
          Three things generate the evidence:
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/diagnostic" className="gx-btn gx-btn--primary" style={{ textDecoration: 'none' }}>Take the diagnostic</Link>
          <Link href="/resume" className="gx-btn gx-btn--secondary" style={{ textDecoration: 'none' }}>Analyse your resume</Link>
          <Link href="/voice-interview" className="gx-btn gx-btn--secondary" style={{ textDecoration: 'none' }}>Run a mock interview</Link>
        </div>
      </Card>
    );
  }

  const ev = data.evidenceSummary;

  return shell(
    <>
      <Card muted padded style={{ marginBottom: 18 }}>
        <SectionLabel>Evidence on file</SectionLabel>
        <div style={{ ...muted, ...mono, marginTop: 6 }}>
          {ev.available ? `${ev.questions} graded questions · ${ev.attempts} attempts · ${ev.skillsWithEvidence} skills tagged` : 'assessment history unavailable'}
          {' · '}resume {ev.resume.measured ? 'analysed' : 'not analysed'}
          {' · '}mock interviews {ev.interview.sessions || 0}
        </div>
        {ev.pace.known && (
          <div style={{ ...muted, marginTop: 4 }}>
            Your pace: {ev.pace.perDay} questions/day over the last {ev.pace.spanDays} days ({ev.pace.activeDays} active days).
          </div>
        )}
      </Card>

      {data.companies.map(c => <CompanyCard key={c.company} c={c} />)}

      <p style={{ ...muted, marginTop: 8, marginBottom: 32 }}>
        GENOIS does not show an offer or interview probability. It has no hiring-outcome data, so such a
        number could only be invented.
      </p>
    </>
  );
}
