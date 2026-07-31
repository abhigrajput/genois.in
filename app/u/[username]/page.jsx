'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

const DOMAIN_COLORS = {
  cloud: 'var(--gx-info)', fullstack: 'var(--gx-info)', dsa: 'var(--gx-success)',
  ml: 'var(--gx-warning)', ai: 'var(--gx-warning)', ds: 'var(--gx-info)',
  cybersec: 'var(--gx-danger)', mobile: 'var(--gx-danger)', devops: 'var(--gx-text-muted)', sysdesign: 'var(--gx-info)',
};

const LANG_COLORS = {
  JavaScript: '#f7df1e', Python: '#3776ab', Java: '#b07219',
  TypeScript: '#2b7489', 'C++': '#f34b7d', C: '#555555',
  Go: '#00add8', Rust: '#dea584', Ruby: '#701516',
};

const SKILL_LABELS = {
  novice: '🌱 Novice', beginner: '📚 Beginner',
  intermediate: '⚡ Intermediate', advanced: '🚀 Advanced',
};

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

  function timeAgo(date) {
    const days = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
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
        <div style={{ color: 'var(--gx-text-muted)', fontSize: 15, marginBottom: 24 }}>This student does not exist or has not signed up yet.</div>
        <Link href="/onboarding" style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
          Create Your Profile →
        </Link>
      </div>
    </div>
  );

  const color = DOMAIN_COLORS[profile.domain] || 'var(--gx-accent)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'var(--gx-accent-soft) 1px,var(--gx-accent-soft) 1px', backgroundSize: '56px 56px' }} />

      <PublicNav />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        {/* PROFILE HEADER */}
        <div style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`, borderRadius: 20, padding: '32px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `transparent`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: 'var(--gx-text)', margin: 0 }}>
                  {profile.name}
                </h1>
                {profile.hired && (
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', color: 'var(--gx-success)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ✓ PLACED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', marginBottom: 10 }}>{profile.college}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 12px', borderRadius: 20, background: `color-mix(in srgb, ${color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`, color, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {profile.domain?.toUpperCase()}
                </span>
                {profile.skillLevel && (
                  <span style={{ padding: '3px 12px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {SKILL_LABELS[profile.skillLevel]}
                  </span>
                )}
                <span style={{ padding: '3px 12px', borderRadius: 20, background: 'var(--gx-surface)', color: 'var(--gx-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Joined {timeAgo(profile.joinedAt)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{profile.score}</div>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>GENOIS SCORE</div>
            </div>
          </div>

          {profile.skillTier && (
            <div style={{ background: `color-mix(in srgb, ${profile.skillTier.color} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${profile.skillTier.color} 19%, transparent)`, borderRadius: 12, padding: '14px 18px', marginTop: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 36 }}>{profile.skillTier.icon}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: profile.skillTier.color, letterSpacing: 2, marginBottom: 4 }}>CLASSIFIED AS</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: profile.skillTier.color }}>{profile.skillTier.label}</div>
                <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginTop: 2 }}>{profile.skillTier.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>Typical package</div>
                <div style={{ fontSize: 13, color: 'var(--gx-text)', fontWeight: 600 }}>{profile.skillTier.expectedPackage}</div>
              </div>
            </div>
          )}

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Global Rank', value: `#${profile.rank}`, color: 'var(--gx-warning)' },
              { label: 'Top', value: `${100 - profile.percentile}%`, color: 'var(--gx-success)' },
              { label: 'Day', value: profile.currentDay, color },
              { label: 'Streak', value: `🔥${profile.streak}d`, color: 'var(--gx-warning)' },
              { label: 'Avg Test', value: `${profile.avgTestScore}%`, color: 'var(--gx-accent)' },
              ...(profile.diagnosticScore ? [{ label: 'Baseline', value: `${profile.diagnosticScore}%`, color: 'var(--gx-warning)' }] : []),
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--gx-surface)', borderRadius: 10, padding: '12px', textAlign: 'center', border: `1px solid color-mix(in srgb, ${s.color} 7%, transparent)` }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* PLACEMENT */}
          {profile.hired && profile.company && (
            <div style={{ background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gx-success)' }}>
                  Placed at {profile.company}
                  {profile.ctc > 0 && <span style={{ color: 'var(--gx-warning)', marginLeft: 8 }}>· {profile.ctc} LPA</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gx-text-muted)' }}>Verified via GENOIS outcome tracking</div>
              </div>
            </div>
          )}

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

        {/* GITHUB STATS */}
        {profile.githubUsername && (
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 14 }}>
              🐙 GITHUB — @{profile.githubUsername}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Repos', value: profile.githubRepos, color: 'var(--gx-accent)' },
                { label: 'Stars', value: profile.githubStars, color: 'var(--gx-warning)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--gx-surface)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {profile.githubLanguages?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.githubLanguages.map((lang, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLORS[lang] || 'var(--gx-surface-2)' }} />
                    <span style={{ fontSize: 11, color: 'var(--gx-text)', fontFamily: 'var(--font-mono)' }}>{lang}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VERIFIED SKILLS */}
        {profile.verifiedSkills?.length > 0 && (
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-success-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-success)', letterSpacing: 2, marginBottom: 14 }}>
              ⚒️ MASTERY TRIALS (VERIFIED SKILLS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              {Object.values(
                profile.verifiedSkills.reduce((acc, curr) => {
                  if (!acc[curr.skill_slug]) acc[curr.skill_slug] = { ...curr, levels: [] };
                  acc[curr.skill_slug].levels.push(curr.level);
                  return acc;
                }, {})
              ).map((skill, i) => {
                const maxLevel = Math.max(...skill.levels);
                const isMaster = skill.levels.includes(1) && skill.levels.includes(2) && skill.levels.includes(3);
                
                return (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-text)' }}>{skill.skill_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        Level {maxLevel} {isMaster ? '· Master' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 24 }}>{isMaster ? '🏆' : maxLevel === 3 ? '🥇' : maxLevel === 2 ? '🥈' : '🥉'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VERIFICATION BADGE */}
        <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 10 }}>VERIFIED BY GENOIS</div>
          <div style={{ fontSize: 14, color: 'var(--gx-text-muted)', lineHeight: 1.7 }}>
            This profile is verified by GENOIS. Score and rank are based on real daily performance — daily coding, timed tests, and actual projects. Not self-reported.
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
