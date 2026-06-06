'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const G = '#00ff41';
const GD = '#00cc33';
const BG = '#030a03';
const CARD_BG = '#0a1a0a';
const BORDER = 'rgba(0,255,65,0.15)';

const DOMAIN_LABELS = {
  dsa: 'DSA', fullstack: 'Full Stack', aiml: 'AI/ML',
  cybersecurity: 'Cybersecurity', devops: 'DevOps', systemdesign: 'System Design',
};

const READINESS_ORDER = ['Ready 🟢', 'Almost Ready 🟡', 'In Progress 🟠', 'Not Ready 🔴'];
const READINESS_COLORS = {
  'Ready 🟢': '#00ff41',
  'Almost Ready 🟡': '#facc15',
  'In Progress 🟠': '#f97316',
  'Not Ready 🔴': '#ef4444',
};

function Badge({ level }) {
  const color = READINESS_COLORS[level] || '#9ca3af';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, whiteSpace: 'nowrap' }}>
      {level}
    </span>
  );
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px 24px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#4b8a4b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: accent || G, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#4b8a4b', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function PlacementDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterReadiness, setFilterReadiness] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [sortBy, setSortBy] = useState('readinessScore');
  const [expandedRow, setExpandedRow] = useState(null);
  const [activeSegment, setActiveSegment] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('placement_admin_token');
    if (!token) { router.replace('/placement-admin/login'); return; }
    fetchStats(token);
    const interval = setInterval(() => fetchStats(token), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router]);

  async function fetchStats(token) {
    try {
      const r = await fetch('/api/placement-admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401) { router.replace('/placement-admin/login'); return; }
      const d = await r.json();
      if (d.success) setData(d.data);
      else setError(d.message || 'Failed to load data');
    } catch {
      setError('Failed to load data');
    }
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem('placement_admin_token');
    router.push('/placement-admin/login');
  }

  function exportCSV() {
    if (!data) return;
    const header = ['Name', 'Email', 'College', 'Domain', 'Day', 'Total Score', 'Streak', 'Readiness Score', 'Readiness Level', 'Target Companies', 'CGPA'].join(',');
    const rows = data.students.map(s => [
      `"${s.name}"`, `"${s.email}"`, `"${s.college}"`, `"${s.domain_slug}"`,
      s.current_day, s.total_score, s.streak, s.readinessScore,
      `"${s.readinessLevel}"`, `"${(s.target_companies || []).join('; ')}"`,
      s.cgpa ?? '',
    ].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `placement_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data.students];

    if (activeSegment) list = list.filter(s => s.readinessLevel === activeSegment);
    if (filterReadiness) list = list.filter(s => s.readinessLevel === filterReadiness);
    if (filterDomain) list = list.filter(s => s.domain_slug === filterDomain);
    if (filterCompany) list = list.filter(s => (s.target_companies || []).includes(filterCompany));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'readinessScore') return b.readinessScore - a.readinessScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'current_day') return b.current_day - a.current_day;
      if (sortBy === 'total_score') return b.total_score - a.total_score;
      return 0;
    });
    return list;
  }, [data, search, filterDomain, filterReadiness, filterCompany, sortBy, activeSegment]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontFamily: 'JetBrains Mono, monospace', fontSize: 18 }}>
        Loading placement data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, textAlign: 'center', padding: 24 }}>
        {error}<br />
        <button onClick={logout} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: G, cursor: 'pointer', fontSize: 13 }}>Re-login</button>
      </div>
    );
  }

  const { summary } = data;
  const inProgressCount = (summary.totalStudents - summary.readyCount - summary.almostReadyCount) - data.students.filter(s => s.readinessScore < 40).length;
  const notReadyCount = data.students.filter(s => s.readinessScore < 40).length;
  const segments = [
    { key: 'Ready 🟢', label: 'Ready', count: summary.readyCount, color: '#00ff41' },
    { key: 'Almost Ready 🟡', label: 'Almost Ready', count: summary.almostReadyCount, color: '#facc15' },
    { key: 'In Progress 🟠', label: 'In Progress', count: inProgressCount, color: '#f97316' },
    { key: 'Not Ready 🔴', label: 'Not Ready', count: notReadyCount, color: '#ef4444' },
  ];
  const total = summary.totalStudents || 1;

  const inputStyle = {
    background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8,
    color: '#e2ffe2', padding: '9px 13px', fontSize: 13, outline: 'none',
    fontFamily: 'JetBrains Mono, monospace',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#e2ffe2', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* ── HEADER ── */}
      <header style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: G, letterSpacing: 2 }}>GENOIS</span>
          <span style={{ color: '#4b8a4b', fontSize: 13 }}>/ Placement Cell Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#4b8a4b', fontSize: 12 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <button onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(0,255,65,0.08)', color: G, cursor: 'pointer', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            Export CSV ↓
          </button>
          <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.06)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── SUMMARY CARDS ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <SummaryCard label="Total Students" value={summary.totalStudents} sub="enrolled on GENOIS" />
          <SummaryCard label="Placement Ready" value={summary.readyCount} sub={`${total ? Math.round(summary.readyCount / total * 100) : 0}% of batch`} accent={G} />
          <SummaryCard label="Avg Readiness Score" value={`${summary.avgScore}/100`} sub="batch average" accent="#4ade80" />
          <SummaryCard label="Avg Daily Streak" value={`${summary.avgStreak}d`} sub="days active" accent="#86efac" />
        </div>

        {/* ── READINESS DISTRIBUTION ── */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#4b8a4b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Readiness Distribution — click to filter</div>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 36, marginBottom: 14, cursor: 'pointer' }}>
            {segments.map(seg => {
              const pct = Math.max((seg.count / total) * 100, seg.count > 0 ? 4 : 0);
              return (
                <div
                  key={seg.key}
                  onClick={() => setActiveSegment(activeSegment === seg.key ? '' : seg.key)}
                  title={`${seg.label}: ${seg.count} students`}
                  style={{
                    width: `${pct}%`, background: seg.color,
                    opacity: activeSegment && activeSegment !== seg.key ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#030a03', transition: 'opacity 0.2s',
                    minWidth: seg.count > 0 ? 40 : 0, overflow: 'hidden',
                  }}
                >
                  {seg.count > 0 && seg.count}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {segments.map(seg => (
              <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color }} />
                <span style={{ color: '#9ca3af' }}>{seg.label}: <strong style={{ color: '#e2ffe2' }}>{seg.count}</strong></span>
              </div>
            ))}
          </div>
          {activeSegment && (
            <button onClick={() => setActiveSegment('')} style={{ marginTop: 10, padding: '5px 12px', borderRadius: 6, border: `1px solid ${BORDER}`, background: 'transparent', color: '#4b8a4b', cursor: 'pointer', fontSize: 11 }}>
              Clear filter ×
            </button>
          )}
        </div>

        {/* ── DOMAIN + COMPANY CHARTS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
          {/* Domain distribution */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#4b8a4b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Domain Distribution</div>
            {summary.topDomains.length === 0 && <div style={{ color: '#4b8a4b', fontSize: 13 }}>No data</div>}
            {summary.topDomains.map(({ domain, count }) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={domain} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#e2ffe2' }}>{DOMAIN_LABELS[domain] || domain}</span>
                    <span style={{ color: '#4b8a4b' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(0,255,65,0.08)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: G, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Target company breakdown */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#4b8a4b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Target Company Breakdown</div>
            {summary.targetCompanyBreakdown.length === 0 && <div style={{ color: '#4b8a4b', fontSize: 13 }}>Students haven't set target companies yet</div>}
            {summary.targetCompanyBreakdown.slice(0, 10).map(({ company, count }) => {
              const maxCount = summary.targetCompanyBreakdown[0]?.count || 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={company} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: '#e2ffe2' }}>{company}</span>
                    <span style={{ color: '#4b8a4b' }}>{count}</span>
                  </div>
                  <div style={{ background: 'rgba(0,255,65,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#4ade80', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STUDENT TABLE ── */}
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name / email..."
              style={{ ...inputStyle, width: 220 }}
            />
            <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={selectStyle}>
              <option value="">All Domains</option>
              {summary.topDomains.map(({ domain }) => (
                <option key={domain} value={domain}>{DOMAIN_LABELS[domain] || domain}</option>
              ))}
            </select>
            <select value={filterReadiness} onChange={e => setFilterReadiness(e.target.value)} style={selectStyle}>
              <option value="">All Levels</option>
              {READINESS_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {summary.targetCompanyBreakdown.length > 0 && (
              <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={selectStyle}>
                <option value="">All Companies</option>
                {summary.targetCompanyBreakdown.slice(0, 20).map(({ company }) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            )}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
              <option value="readinessScore">Sort: Readiness</option>
              <option value="name">Sort: Name</option>
              <option value="current_day">Sort: Day Progress</option>
              <option value="total_score">Sort: Score</option>
            </select>
            <span style={{ color: '#4b8a4b', fontSize: 12, marginLeft: 'auto' }}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['#', 'Name', 'College', 'Domain', 'Day', 'Score', 'Streak', 'Readiness', 'Target Co.', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: '#4b8a4b', letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                      style={{ borderBottom: `1px solid rgba(0,255,65,0.06)`, cursor: 'pointer', background: expandedRow === s.id ? 'rgba(0,255,65,0.04)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (expandedRow !== s.id) e.currentTarget.style.background = 'rgba(0,255,65,0.025)'; }}
                      onMouseLeave={e => { if (expandedRow !== s.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '13px 14px', color: '#4b8a4b' }}>{i + 1}</td>
                      <td style={{ padding: '13px 14px', fontWeight: 600, color: '#e2ffe2', whiteSpace: 'nowrap' }}>{s.name}</td>
                      <td style={{ padding: '13px 14px', color: '#9ca3af', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.college}</td>
                      <td style={{ padding: '13px 14px', color: '#4ade80' }}>{DOMAIN_LABELS[s.domain_slug] || s.domain_slug}</td>
                      <td style={{ padding: '13px 14px', color: '#e2ffe2', fontFamily: 'JetBrains Mono, monospace' }}>D{s.current_day}</td>
                      <td style={{ padding: '13px 14px', color: '#e2ffe2', fontFamily: 'JetBrains Mono, monospace' }}>{s.total_score.toLocaleString()}</td>
                      <td style={{ padding: '13px 14px', color: s.streak >= 7 ? G : '#9ca3af' }}>{s.streak}🔥</td>
                      <td style={{ padding: '13px 14px' }}><Badge level={s.readinessLevel} /></td>
                      <td style={{ padding: '13px 14px', color: '#9ca3af', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(s.target_companies || []).slice(0, 2).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ color: '#4b8a4b', fontSize: 11 }}>{expandedRow === s.id ? '▲ Hide' : '▼ Details'}</span>
                      </td>
                    </tr>
                    {expandedRow === s.id && (
                      <tr key={`${s.id}-exp`} style={{ background: 'rgba(0,255,65,0.03)', borderBottom: `1px solid rgba(0,255,65,0.06)` }}>
                        <td colSpan={10} style={{ padding: '16px 28px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            <Detail label="Email" value={s.email} />
                            <Detail label="CGPA" value={s.cgpa != null ? `${s.cgpa} / 10` : 'Not set'} />
                            <Detail label="Months to Placement" value={s.months_to_placement ? `${s.months_to_placement} months` : 'Not set'} />
                            <Detail label="Last Active" value={s.lastActive || 'Never'} />
                            <Detail label="Readiness Score" value={`${s.readinessScore} / 100`} />
                            <Detail
                              label="Target Companies"
                              value={(s.target_companies || []).length > 0 ? s.target_companies.join(', ') : 'Not set'}
                            />
                            <Detail
                              label="Weak Subjects"
                              value={(s.weak_subjects || []).length > 0 ? s.weak_subjects.join(', ') : 'None flagged'}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#4b8a4b' }}>
                      No students match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 24 }}>
          <div style={{ color: '#2d5c2d', fontSize: 12 }}>Powered by <span style={{ color: G }}>GENOIS</span> · genois.in</div>
          <div style={{ color: '#1e3a1e', fontSize: 11, marginTop: 4 }}>Data refreshes every 5 minutes</div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#4b8a4b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e2ffe2', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}
