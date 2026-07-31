'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';

const LANG_COLORS = {
  JavaScript: '#f7df1e', Python: '#3776ab', Java: '#b07219',
  TypeScript: '#2b7489', 'C++': '#f34b7d', C: '#555555',
  Go: '#00add8', Rust: '#dea584', Ruby: '#701516', PHP: '#4f5d95',
  Swift: '#ffac45', Kotlin: '#f18e33', Dart: '#00b4ab',
};

export default function GitHubPage() {
  const { token, ready } = useToken();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/github/profile', token)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ready, token]);

  async function connect() {
    if (!username.trim()) { toast.error('Enter your GitHub username'); return; }
    setConnecting(true);
    try {
      const r = await apiFetch('/api/github/connect', token, 'POST', { githubUsername: username });
      setData({ connected: true, ...r.data });
      toast.success('GitHub connected!');
    } catch (e) { toast.error(e.message); }
    setConnecting(false);
  }

  async function sync() {
    setSyncing(true);
    try {
      const r = await apiFetch('/api/github/sync', token, 'POST', {});
      toast.success('GitHub synced!');
      const fresh = await apiFetch('/api/github/profile', token);
      setData(fresh.data);
    } catch (e) { toast.error(e.message); }
    setSyncing(false);
  }

  function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days}d ago`;
  }

  if (loading) return (
    <div style={{ color: 'var(--gx-text-muted)', padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
      Loading GitHub profile...
    </div>
  );

  if (!data?.connected) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
            🐙 Connect GitHub
          </h1>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>
            Connect your GitHub to show real code activity on your GENOIS profile.
          </p>
        </div>

        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 28, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 20 }}>WHY CONNECT GITHUB</div>
          {[
            { icon: '✅', text: 'Shows real commit history — not self-reported' },
            { icon: '📊', text: 'Languages you actually code in' },
            { icon: '⭐', text: 'Stars earned on your repositories' },
            { icon: '💼', text: 'Recruiters see verifiable proof of your work' },
            { icon: '🏆', text: 'GitHub activity adds to your GENOIS credibility score' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--gx-text)' }}>{f.text}</span>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>YOUR GITHUB USERNAME</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && connect()}
                placeholder="e.g. abhigrajput2004"
                style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 14, outline: 'none' }}
              />
              <button onClick={connect} disabled={connecting} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: connecting ? 'var(--gx-accent-soft)' : 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {connecting ? 'Connecting...' : 'Connect →'}
              </button>
            </div>
            <p style={{ color: 'var(--gx-text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 8 }}>
              Just your username — no OAuth required · Read only access
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
            🐙 GitHub Profile
          </h1>
          <a href={data.url} target="_blank" rel="noreferrer" style={{ color: 'var(--gx-accent)', fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
            @{data.username} →
          </a>
        </div>
        <button onClick={sync} disabled={syncing} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--gx-accent-border)', background: 'transparent', color: 'var(--gx-accent)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600 }}>
          {syncing ? 'Syncing...' : '🔄 Sync'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Repositories', value: data.repos, color: 'var(--gx-accent)' },
          { label: 'Total Stars', value: data.stars, color: 'var(--gx-warning)' },
          { label: 'Recent Commits', value: data.commits, color: 'var(--gx-success)' },
          { label: 'Languages', value: data.languages?.length || 0, color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {data.languages?.length > 0 && (
        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 14 }}>LANGUAGES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.languages.map((lang, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[lang] || 'var(--gx-surface-2)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--gx-text)', fontFamily: 'var(--font-mono)' }}>{lang}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentRepos?.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 2, marginBottom: 14 }}>RECENT REPOSITORIES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {data.recentRepos.map((repo, i) => (
              <a key={i} href={repo.url} target="_blank" rel="noreferrer" style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--gx-accent)' }}>{repo.name}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--gx-text-muted)', flexShrink: 0 }}>
                    {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                    {repo.forks > 0 && <span>🍴 {repo.forks}</span>}
                  </div>
                </div>
                {repo.description && (
                  <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{repo.description.substring(0, 80)}{repo.description.length > 80 ? '...' : ''}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {repo.language && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[repo.language] || 'var(--gx-surface-2)' }} />
                      <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>{repo.language}</span>
                    </div>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>{timeAgo(repo.updatedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {data.lastSynced && (
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>
          Last synced: {new Date(data.lastSynced).toLocaleDateString('en-IN')}
        </div>
      )}
    </div>
  );
}
