'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('joined');
  const [eliminating, setEliminating] = useState(false);
  const [elimResult, setElimResult] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);

  async function sendEmails(type) {
    if (!confirm('Send ' + type + ' emails to all students?')) return;
    setSendingEmail(type);
    try {
      const t = localStorage.getItem('genois_token');
      const r = await fetch('/api/emails/send-daily', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const d = await r.json();
      alert('Sent: ' + d.data?.sent + ' | Failed: ' + d.data?.failed);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setSendingEmail(null);
  }

  async function runElimination() {
    if (!confirm('Run weekly elimination? This will update badges for ALL students.')) return;
    setEliminating(true);
    try {
      const t = localStorage.getItem('genois_token');
      const r = await fetch('/api/admin/elimination', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + t },
      });
      const d = await r.json();
      setElimResult(d.data);
      alert(`Done! Hire-Ready: ${d.data.hireReady} | Not Ready: ${d.data.notReady}`);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setEliminating(false);
  }

  useEffect(() => {
    const t = localStorage.getItem('genois_token');
    if (!t) { router.push('/login'); return; }
    fetch('/api/admin/stats', {
      headers: { Authorization: 'Bearer ' + t }
    }).then(r => r.json()).then(d => {
      if (!d.success) { router.push('/dashboard'); return; }
      setData(d.data);
      setLoading(false);
    }).catch(() => router.push('/dashboard'));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020812', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f0ff', fontFamily: 'Syne,sans-serif', fontSize: 18 }}>
      Loading admin panel...
    </div>
  );

  const filtered = (data?.users || [])
    .filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.college?.toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ? true :
        filter === 'active' ? u.isActiveToday :
        filter === 'inactive' ? u.isInactive :
        filter === 'expiring' ? u.isTrialExpiring :
        filter === 'paid' ? (u.plan !== 'trial' && u.plan !== 'free') :
        true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.totalScore - a.totalScore;
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'day') return b.currentDay - a.currentDay;
      return new Date(b.joinedAt) - new Date(a.joinedAt);
    });

  const s = data?.stats || {};
  const card = { background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 20 };

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
              <span style={{ color: '#5a7a9a', fontSize: 14, fontWeight: 400, marginLeft: 12, fontFamily: 'JetBrains Mono,monospace' }}>ADMIN</span>
            </div>
            <div style={{ color: '#5a7a9a', fontSize: 13 }}>Founder dashboard — only you can see this</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={runElimination}
              disabled={eliminating}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: eliminating ? 'rgba(255,45,120,0.2)' : 'linear-gradient(135deg,#ff2d78,#EF9F27)',
                color: '#fff',
                cursor: eliminating ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne,sans-serif',
                fontSize: 13,
                fontWeight: 700,
              }}>
              {eliminating ? 'Running...' : '⚡ Run Weekly Elimination'}
            </button>
            <button onClick={() => sendEmails('daily_digest')} disabled={sendingEmail === 'daily_digest'} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'rgba(0,240,255,0.12)', color: '#00f0ff', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              {sendingEmail === 'daily_digest' ? 'Sending...' : '📧 Daily Digest'}
            </button>
            <button onClick={() => sendEmails('streak_break')} disabled={sendingEmail === 'streak_break'} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,45,120,0.1)', color: '#ff2d78', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              {sendingEmail === 'streak_break' ? 'Sending...' : '🔥 Streak Break'}
            </button>
            <button onClick={() => sendEmails('trial_expiry')} disabled={sendingEmail === 'trial_expiry'} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'rgba(239,159,39,0.1)', color: '#EF9F27', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              {sendingEmail === 'trial_expiry' ? 'Sending...' : '⚠️ Trial Expiry'}
            </button>
            <button onClick={() => window.open('/correlation', '_blank')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
              📈 Correlation Data
            </button>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13 }}>
              Back to App
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Students', value: s.totalUsers || 0, color: '#00f0ff' },
            { label: 'Active Today', value: s.activeToday || 0, color: '#1D9E75' },
            { label: 'Inactive 7d+', value: s.inactiveUsers || 0, color: '#ff2d78' },
            { label: 'On Trial', value: s.trialUsers || 0, color: '#EF9F27' },
            { label: 'Paid Users', value: s.paidUsers || 0, color: '#7b5cff' },
            { label: 'Trial Expiring', value: s.expiringTrials || 0, color: '#D85A30' },
          ].map(st => (
            <div key={st.label} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 12, color: '#5a7a9a', marginTop: 4 }}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name email college..." style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 13, outline: 'none' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: '#070f1f', color: '#e8f4ff', fontSize: 13, outline: 'none' }}>
            <option value="all">All Students</option>
            <option value="active">Active Today</option>
            <option value="inactive">Inactive 7d+</option>
            <option value="expiring">Trial Expiring</option>
            <option value="paid">Paid Users</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: '#070f1f', color: '#e8f4ff', fontSize: 13, outline: 'none' }}>
            <option value="joined">Latest Joined</option>
            <option value="score">Highest Score</option>
            <option value="streak">Longest Streak</option>
            <option value="day">Furthest Day</option>
          </select>
          <div style={{ fontSize: 13, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>{filtered.length} students</div>
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
                  {['Student','College','Domain','Plan','Day','Streak','Score','Last Active','Trial Left','Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                  ))}
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>BADGE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#e8f4ff' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#5a7a9a', marginTop: 1 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#8a9ab0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.college || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'rgba(0,240,255,0.08)', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace' }}>{u.domain}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: u.plan === 'pro' ? 'rgba(0,240,255,0.1)' : u.plan === 'elite' ? 'rgba(123,92,255,0.1)' : 'rgba(255,255,255,0.05)', color: u.plan === 'pro' ? '#00f0ff' : u.plan === 'elite' ? '#7b5cff' : '#5a7a9a' }}>{u.plan}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#e8f4ff', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>{u.currentDay}</td>
                    <td style={{ padding: '12px 16px', color: '#EF9F27', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>🔥{u.streak}</td>
                    <td style={{ padding: '12px 16px', color: '#7b5cff', fontFamily: 'Syne,sans-serif', fontWeight: 700, textAlign: 'center' }}>{u.totalScore}</td>
                    <td style={{ padding: '12px 16px', color: '#5a7a9a', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {u.isActiveToday ? <span style={{ color: '#1D9E75' }}>Today</span> : u.lastActive || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {u.trialDaysLeft !== null ? (
                        <span style={{ fontSize: 12, color: u.isTrialExpired ? '#ff2d78' : u.isTrialExpiring ? '#EF9F27' : '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                          {u.isTrialExpired ? 'EXPIRED' : u.trialDaysLeft + 'd'}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', background: u.isActiveToday ? 'rgba(29,158,117,0.15)' : u.isInactive ? 'rgba(255,45,120,0.1)' : 'rgba(255,255,255,0.05)', color: u.isActiveToday ? '#1D9E75' : u.isInactive ? '#ff2d78' : '#5a7a9a' }}>
                        {u.isActiveToday ? 'ACTIVE' : u.isInactive ? 'INACTIVE' : 'IDLE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.weeklyBadge === 'hire_ready' && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontFamily: 'JetBrains Mono,monospace', background: 'rgba(29,158,117,0.15)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>
                          ✓ HIRE-READY
                        </span>
                      )}
                      {u.weeklyBadge === 'not_ready' && (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontFamily: 'JetBrains Mono,monospace', background: 'rgba(255,45,120,0.1)', color: '#ff2d78', border: '1px solid rgba(255,45,120,0.2)' }}>
                          ✗ NOT READY
                        </span>
                      )}
                      {!u.weeklyBadge && (
                        <span style={{ color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: '#5a7a9a' }}>No students found</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
