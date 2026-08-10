'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToken, apiFetch } from '@/lib/useApi';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';
import { Card, CardHeader, CardBody, CardTitle, SectionLabel, Badge, Button } from '@/components/ui';
import { ExternalLink, Building2, Compass } from 'lucide-react';

/**
 * Apply — where to actually apply, once prep is underway.
 *
 * This page is a DIRECTORY, not a job board, and it says so on its face. There
 * are no deadlines, no "currently hiring" badges and no open-role counts
 * anywhere on it, because GENOIS reads nobody's hiring system and every one of
 * those numbers would have to be invented. Every link points at the
 * organisation's own careers domain.
 *
 * Readiness percentages shown against a company come from /api/readiness — the
 * same evidence-backed score as /readiness. A company the student hasn't
 * targeted shows no number at all rather than a zero.
 */

const muted = { color: 'var(--gx-text-muted)', fontSize: 12, lineHeight: 1.6 };
const mono = { fontFamily: 'var(--font-mono)' };

const scoreTone = (score) =>
  score >= 75 ? 'var(--gx-success)' : score >= 50 ? 'var(--gx-warning)' : 'var(--gx-danger)';

function ReadinessCorner({ readiness, company, readinessAvailable }) {
  // The overlay itself failed. Saying "not one of your targets" here would be a
  // claim about the student's profile that we did not actually read.
  if (!readinessAvailable) {
    return (
      <div style={{ textAlign: 'right', maxWidth: 190 }}>
        <div style={muted}>Readiness unavailable right now</div>
      </div>
    );
  }

  // Not one of their target companies — nothing measured, so nothing shown.
  if (!readiness) {
    return (
      <div style={{ textAlign: 'right', maxWidth: 190 }}>
        <div style={muted}>Not one of your targets</div>
        <Link href="/profile" className="gx-link" style={{ fontSize: 12 }}>Add to targets →</Link>
      </div>
    );
  }

  if (!readiness.scored) {
    return (
      <div style={{ textAlign: 'right', maxWidth: 200 }}>
        <Badge tone="neutral">Not enough evidence yet</Badge>
        <div style={{ ...muted, marginTop: 4 }}>
          No {company} readiness score until there is real work behind it.
        </div>
        <Link href="/readiness" className="gx-link" style={{ fontSize: 12 }}>See what&apos;s missing →</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ ...mono, fontSize: 28, fontWeight: 800, lineHeight: 1, color: scoreTone(readiness.overall) }}>
        {readiness.overall}%
      </div>
      <div style={muted}>ready for {company}</div>
      <Link href="/readiness" className="gx-link" style={{ fontSize: 12 }}>Breakdown →</Link>
    </div>
  );
}

function CompanyRow({ c, readinessAvailable }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 22, lineHeight: 1.2 }} aria-hidden="true">{c.logo}</span>
          <div style={{ minWidth: 0 }}>
            <CardTitle>{c.company}</CardTitle>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
              {c.entryRole
                ? <Badge tone="accent">{c.entryRole}</Badge>
                : <Badge tone="neutral">Entry bands not on file</Badge>}
              {c.tier && <Badge tone="neutral">{c.tier}</Badge>}
            </div>
          </div>
        </div>
        <ReadinessCorner readiness={c.readiness} company={c.company} readinessAvailable={readinessAvailable} />
      </CardHeader>

      <CardBody>
        <SectionLabel>Interview profile</SectionLabel>
        <div style={{ ...muted, marginTop: 5, marginBottom: 14 }}>{c.profile}</div>

        <SectionLabel>How to apply</SectionLabel>
        <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>Off-campus</span>
            {c.careersUrl ? (
              <Button href={c.careersUrl} variant="outline" size="sm">
                {c.careersLabel} <ExternalLink size={12} strokeWidth={2} style={{ marginLeft: 4 }} />
              </Button>
            ) : (
              <span style={muted}>No verified careers link on file — we won&apos;t guess one.</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>On-campus</span>
            <span style={{ ...muted, flex: 1, minWidth: 220 }}>
              {c.campusProgram
                ? <>Recruits through <strong>{c.campusProgram}</strong>. Whether they visit <em>your</em> college, and when, is set per drive — your TPO is the only source for that.</>
                : <>Ask your TPO whether they visit your campus. GENOIS has no visibility into individual college drives and won&apos;t pretend otherwise.</>}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href={`/applications?company=${encodeURIComponent(c.company)}`}
            className="gx-btn gx-btn--secondary gx-btn--sm"
            style={{ textDecoration: 'none' }}
          >
            Track an application here
          </Link>
          {c.companySlug && (
            <Link href={`/companies/${c.companySlug}`} className="gx-btn gx-btn--ghost gx-btn--sm" style={{ textDecoration: 'none' }}>
              Prep guide
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function PortalRow({ p }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--gx-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>{p.name}</span>
          <Badge tone="neutral">{p.kind}</Badge>
        </div>
        <Button href={p.url} variant="outline" size="sm">
          Open <ExternalLink size={12} strokeWidth={2} style={{ marginLeft: 4 }} />
        </Button>
      </div>
      <div style={{ ...muted, marginTop: 5 }}>{p.what}</div>
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();
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
      const r = await apiFetch('/api/apply/directory', token);
      setData(r?.data || null);
    } catch (e) {
      setError(friendlyError(e, 'load the apply directory'));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || loading) return <LoadingSkeleton variant="page" label="Loading the apply directory…" />;

  if (error) return (
    <ErrorCard
      title="Couldn't load the directory"
      message={error}
      primaryLabel="↻ Retry"
      onPrimary={load}
      secondaryLabel="Go to dashboard"
      onSecondary={() => router.push('/dashboard')}
    />
  );

  const companies = data?.companies || [];
  const portals = data?.portals || [];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
        🚀 Apply
      </h1>
      <p style={{ ...muted, fontSize: 13, marginBottom: 18 }}>
        Prep gets you ready. This is where you go next — the companies GENOIS scores you against,
        their official careers pages, and the off-campus platforms worth a profile.
      </p>

      <Card muted padded style={{ marginBottom: 20 }}>
        <SectionLabel icon={Compass}>What this page is</SectionLabel>
        <div style={{ ...muted, marginTop: 6 }}>{data?.generatedNote}</div>
      </Card>

      {data?.readinessAvailable && !data?.hasTargets && (
        <Card padded style={{ marginBottom: 20, borderColor: 'var(--gx-info-border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 4 }}>
            No target companies set
          </div>
          <div style={{ ...muted, marginBottom: 10 }}>
            The directory below works either way, but readiness is scored against a company you&apos;ve
            actually chosen — so until you pick targets there are no percentages to show here.
          </div>
          <Link href="/profile" className="gx-btn gx-btn--primary gx-btn--sm" style={{ textDecoration: 'none' }}>
            Choose target companies →
          </Link>
        </Card>
      )}

      <SectionLabel icon={Building2}>Companies · {companies.length}</SectionLabel>
      <div style={{ ...muted, margin: '6px 0 12px' }}>
        The same companies the roadmap and readiness score use — GENOIS doesn&apos;t keep a separate,
        larger company list it can&apos;t actually prepare you for.
      </div>
      {companies.map(c => (
        <CompanyRow key={c.company} c={c} readinessAvailable={!!data?.readinessAvailable} />
      ))}

      <div style={{ marginTop: 26 }}>
        <SectionLabel>Off-campus platforms · {portals.length}</SectionLabel>
        <div style={{ ...muted, margin: '6px 0 2px' }}>
          Where off-campus roles are actually posted. We link the platform, not any individual listing —
          a listing link would be dead within weeks.
        </div>
        <Card padded style={{ marginTop: 10 }}>
          {portals.map(p => <PortalRow key={p.id} p={p} />)}
          <div style={{ ...muted, marginTop: 12 }}>
            Whatever the platform says, follow a role back to the company&apos;s own careers page before you
            apply. Aggregators keep listings live long after the company has closed them.
          </div>
        </Card>
      </div>

      <p style={{ ...muted, marginTop: 20, marginBottom: 32 }}>
        Applied somewhere? Log it in the{' '}
        <Link href="/applications" className="gx-link">application tracker</Link> so you can see your
        funnel instead of guessing at it.
      </p>
    </div>
  );
}
