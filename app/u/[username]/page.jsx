'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

// Public profile. Opt-in, and only the fields the owner agreed to publish:
// name, college, LinkedIn, GitHub, rank, streak. No score, no skill tier, no
// package or employer claim, no diagnostic result.
export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/public/profile/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProfile(d.data);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
      Loading profile...
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', fontFamily: 'var(--font-body)' }}>
      <PublicNav />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>Profile not found</div>
        <div style={{ color: 'var(--gx-text-muted)', fontSize: 15, marginBottom: 24 }}>This profile does not exist or is not public.</div>
        <Link href="/onboarding" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
          Create Your Profile →
        </Link>
      </div>
    </div>
  );

  const color = 'var(--gx-accent)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'var(--gx-accent-soft) 1px,var(--gx-accent-soft) 1px', backgroundSize: '56px 56px' }} />

      <PublicNav />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        {/* PROFILE HEADER */}
        <div style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`, borderRadius: 20, padding: '32px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: 'var(--gx-text)', margin: '0 0 6px' }}>
              {profile.name}
            </h1>
            {profile.college && (
              <div style={{ fontSize: 14, color: 'var(--gx-text-muted)' }}>{profile.college}</div>
            )}
          </div>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Global Rank', value: `#${profile.rank}`, color: 'var(--gx-warning)' },
              { label: 'Streak', value: `🔥${profile.streak}d`, color: 'var(--gx-warning)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--gx-surface)', borderRadius: 10, padding: '12px', textAlign: 'center', border: `1px solid color-mix(in srgb, ${s.color} 7%, transparent)` }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* SOCIAL LINKS */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--gx-info-border)', background: 'var(--gx-info-soft)', color: '#0077B5', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                💼 LinkedIn
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                🐙 GitHub
              </a>
            )}
            <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: copied ? 'var(--gx-accent-soft)' : 'transparent', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              {copied ? '✓ Copied' : '🔗 Share Profile'}
            </button>
          </div>
        </div>

        {/* VERIFICATION BADGE */}
        <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 10 }}>VERIFIED BY GENOIS</div>
          <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.7 }}>
            Rank and streak come from real activity on GENOIS — daily coding, timed tests, and actual projects. Not self-reported.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/onboarding" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
              Get Your Verified Profile →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
