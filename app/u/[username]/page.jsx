'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

const DOMAIN_COLORS = {
  cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75',
  ml: '#D85A30', ai: '#BA7517', ds: '#378ADD',
  cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7',
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
    <div style={{ minHeight: '100vh', background: '#020812', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
      Loading profile...
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#020812', fontFamily: 'var(--font-body)' }}>
      <PublicNav />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>Profile not found</div>
        <div style={{ color: '#5a7a9a', fontSize: 15, marginBottom: 24 }}>This student does not exist or has not signed up yet.</div>
        <Link href="/onboarding" style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
          Create Your Profile →
        </Link>
      </div>
    </div>
  );

  const color = DOMAIN_COLORS[profile.domain] || '#00d9a3';

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,217,163,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.012) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

      <PublicNav />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        {/* PROFILE HEADER */}
        <div style={{ background: '#070f1f', border: `1px solid ${color}25`, borderRadius: 20, padding: '32px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle,${color}08,transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#e8e8ed', margin: 0 }}>
                  {profile.name}
                </h1>
                {profile.hired && (
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', color: '#1D9E75', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ✓ PLACED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: '#5a7a9a', marginBottom: 10 }}>{profile.college}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 12px', borderRadius: 20, background: `${color}15`, border: `1px solid ${color}25`, color, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {profile.domain?.toUpperCase()}
                </span>
                {profile.skillLevel && (
                  <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(0,217,163,0.06)', color: '#00d9a3', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {SKILL_LABELS[profile.skillLevel]}
                  </span>
                )}
                <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: '#5a7a9a', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Joined {timeAgo(profile.joinedAt)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 800, color, lineHeight: 1 }}>{profile.score}</div>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 2 }}>GENOIS SCORE</div>
            </div>
          </div>

          {profile.skillTier && (
            <div style={{ background: `${profile.skillTier.color}10`, border: `1px solid ${profile.skillTier.color}30`, borderRadius: 12, padding: '14px 18px', marginTop: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 36 }}>{profile.skillTier.icon}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: profile.skillTier.color, letterSpacing: 2, marginBottom: 4 }}>CLASSIFIED AS</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: profile.skillTier.color }}>{profile.skillTier.label}</div>
                <div style={{ fontSize: 12, color: '#8a9ab0', marginTop: 2 }}>{profile.skillTier.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>Typical package</div>
                <div style={{ fontSize: 13, color: '#c8d8e8', fontWeight: 600 }}>{profile.skillTier.expectedPackage}</div>
              </div>
            </div>
          )}

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Global Rank', value: `#${profile.rank}`, color: '#ff6b4a' },
              { label: 'Top', value: `${100 - profile.percentile}%`, color: '#1D9E75' },
              { label: 'Day', value: profile.currentDay, color },
              { label: 'Streak', value: `🔥${profile.streak}d`, color: '#EF9F27' },
              { label: 'Avg Test', value: `${profile.avgTestScore}%`, color: '#00d9a3' },
              ...(profile.diagnosticScore ? [{ label: 'Baseline', value: `${profile.diagnosticScore}%`, color: '#D85A30' }] : []),
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px', textAlign: 'center', border: `1px solid ${s.color}12` }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* PLACEMENT */}
          {profile.hired && profile.company && (
            <div style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75' }}>
                  Placed at {profile.company}
                  {profile.ctc > 0 && <span style={{ color: '#EF9F27', marginLeft: 8 }}>· {profile.ctc} LPA</span>}
                </div>
                <div style={{ fontSize: 12, color: '#5a7a9a' }}>Verified via GENOIS outcome tracking</div>
              </div>
            </div>
          )}

          {/* SOCIAL LINKS */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,119,181,0.3)', background: 'rgba(0,119,181,0.08)', color: '#0077B5', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                💼 LinkedIn
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#e8e8ed', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                🐙 GitHub
              </a>
            )}
            <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.2)', background: copied ? 'rgba(0,217,163,0.1)' : 'transparent', color: '#00d9a3', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              {copied ? '✓ Copied' : '🔗 Share Profile'}
            </button>
          </div>
        </div>

        {/* GITHUB STATS */}
        {profile.githubUsername && (
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 14 }}>
              🐙 GITHUB — @{profile.githubUsername}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Repos', value: profile.githubRepos, color: '#00d9a3' },
                { label: 'Stars', value: profile.githubStars, color: '#EF9F27' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {profile.githubLanguages?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.githubLanguages.map((lang, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLORS[lang] || '#5a7a9a' }} />
                    <span style={{ fontSize: 11, color: '#c8d8e8', fontFamily: 'var(--font-mono)' }}>{lang}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VERIFIED SKILLS */}
        {profile.verifiedSkills?.length > 0 && (
          <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 14 }}>
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
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(29,158,117,0.05)', border: '1px solid rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#e8e8ed' }}>{skill.skill_name}</div>
                      <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
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
        <div style={{ background: 'linear-gradient(135deg,rgba(0,217,163,0.04),rgba(255,107,74,0.02))', border: '1px solid rgba(0,217,163,0.12)', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 10 }}>VERIFIED BY GENOIS</div>
          <div style={{ fontSize: 14, color: '#8a9ab0', lineHeight: 1.7 }}>
            This profile is verified by GENOIS. Score and rank are based on real daily performance — daily coding, timed tests, and actual projects. Not self-reported.
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/onboarding" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
              Get Your Verified Profile →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
