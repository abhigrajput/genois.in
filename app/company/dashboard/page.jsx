'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const DOMAIN_OPTIONS = ['', 'fullstack', 'dsa', 'ml', 'ai', 'ds', 'cybersec', 'cloud', 'mobile', 'devops', 'sysdesign'];
const DOMAIN_COLORS = { cloud: 'var(--gx-info)', fullstack: 'var(--gx-info)', dsa: 'var(--gx-success)', ml: 'var(--gx-warning)', ai: 'var(--gx-warning)', ds: 'var(--gx-info)', cybersec: 'var(--gx-danger)', mobile: 'var(--gx-danger)', devops: 'var(--gx-text-muted)', sysdesign: 'var(--gx-info)' };

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [token, setToken] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ domain: '', minScore: 0, college: '', tier: '' });
  const [contactingId, setContactingId] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('genois_company_token');
    const c = localStorage.getItem('genois_company');
    if (!t || !c) { router.push('/company/login'); return; }
    setToken(t);
    setCompany(JSON.parse(c));
    loadStudents(t, {});
  }, []);

  async function loadStudents(t, f) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.domain) params.set('domain', f.domain);
      if (f.minScore > 0) params.set('minScore', f.minScore);
      if (f.college) params.set('college', f.college);
      if (f.tier) params.set('tier', f.tier);
      params.set('limit', '50');

      const r = await fetch('/api/company/students?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + t },
      });
      const d = await r.json();
      setStudents(d.data?.students || []);
    } catch {}
    setLoading(false);
  }

  async function contactStudent() {
    if (!contactModal) return;
    setContactingId(contactModal.userId);
    try {
      const r = await fetch('/api/company/contact', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentUserId: contactModal.userId, message }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success('Contact request sent! Student will be emailed.');
        setContactModal(null);
        setMessage('');
      } else {
        toast.error(d.message);
      }
    } catch { toast.error('Failed to contact student'); }
    setContactingId(null);
  }

  function applyFilters() {
    loadStudents(token, filters);
  }

  function logout() {
    localStorage.removeItem('genois_company_token');
    localStorage.removeItem('genois_company');
    router.push('/company/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <nav style={{ background: 'var(--gx-bg)', borderBottom: '1px solid var(--gx-border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800 }}>
            <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Students</button>
            <button onClick={() => router.push('/company/challenges')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 13 }}>Challenges</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {company && <span style={{ fontSize: 13, color: 'var(--gx-text-muted)' }}>{company.name}</span>}
          <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
            Find Your Next Engineer
          </h1>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 13 }}>
            Browse top students ranked by real daily performance. Filter by domain, score, and college.
          </p>
        </div>

        <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DOMAIN</div>
              <select value={filters.domain} onChange={e => setFilters(p => ({ ...p, domain: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }}>
                <option value="">All Domains</option>
                {DOMAIN_OPTIONS.filter(Boolean).map(d => (
                  <option key={d} value={d}>{d.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>MIN SCORE</div>
              <select value={filters.minScore} onChange={e => setFilters(p => ({ ...p, minScore: parseInt(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }}>
                <option value={0}>Any Score</option>
                <option value={100}>100+ pts</option>
                <option value={300}>300+ pts</option>
                <option value={600}>600+ pts</option>
                <option value={900}>900+ pts</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>SKILL LEVEL</div>
              <select value={filters.tier || ''} onChange={e => setFilters(p => ({ ...p, tier: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-bg)', color: 'var(--gx-text)', fontSize: 13, outline: 'none' }}>
                <option value="">All Levels</option>
                <option value="fresher">🌱 Fresher</option>
                <option value="junior">💼 Junior</option>
                <option value="mid-level">⚡ Mid-Level</option>
                <option value="senior">🏆 Senior</option>
                <option value="expert">🔥 Expert</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>COLLEGE</div>
              <input value={filters.college} onChange={e => setFilters(p => ({ ...p, college: e.target.value }))} placeholder="Search college name..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={applyFilters} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              Search →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-muted)' }}>
            {students.length} students found
          </div>
          <div style={{ fontSize: 12, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)' }}>
            Ranked by GENOIS Score — Real verified skill
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Loading students...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {students.map((s, i) => {
              const color = DOMAIN_COLORS[s.domain] || 'var(--gx-accent)';
              return (
                <div key={i} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${color} 9%, transparent)`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 3 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginBottom: 6 }}>{s.college}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `color-mix(in srgb, ${color} 8%, transparent)`, color, fontFamily: 'var(--font-mono)' }}>
                          {s.domain?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>
                          Rank #{s.rank}
                        </span>
                        {s.skillTier && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `color-mix(in srgb, ${s.skillTier.color} 8%, transparent)`, color: s.skillTier.color, fontFamily: 'var(--font-mono)' }}>
                            {s.skillTier.icon} {s.skillTier.label.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color }}>
                        {s.score}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>pts</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>🔥 {s.streak}d streak</span>
                    <span>📅 Day {s.currentDay}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {s.linkedinUrl && (
                      <a href={s.linkedinUrl} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--gx-info-border)', background: 'var(--gx-info-soft)', color: '#0077B5', textDecoration: 'none', fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600, textAlign: 'center' }}>
                        LinkedIn
                      </a>
                    )}
                    <button onClick={() => setContactModal(s)} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: color, color: 'var(--gx-text)', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700 }}>
                      Contact Student →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {students.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 8 }}>No students found</div>
            <div style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>Try adjusting your filters.</div>
          </div>
        )}
      </div>

      {contactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-accent-border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 4 }}>
              Contact {contactModal.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', marginBottom: 20 }}>
              We will email {contactModal.name} with your contact request. They will reply to your company email directly.
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>MESSAGE (optional)</div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Hi ${contactModal.name}, we found your GENOIS profile and are interested in discussing a role at ${company?.name}...`} rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setContactModal(null); setMessage(''); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}>Cancel</button>
              <button onClick={contactStudent} disabled={!!contactingId} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>
                {contactingId ? 'Sending...' : 'Send Contact Request →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
