'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const DOMAIN_OPTIONS = ['', 'fullstack', 'dsa', 'ml', 'ai', 'ds', 'cybersec', 'cloud', 'mobile', 'devops', 'sysdesign'];
const DOMAIN_COLORS = { cloud: '#378ADD', fullstack: '#7F77DD', dsa: '#1D9E75', ml: '#D85A30', ai: '#BA7517', ds: '#378ADD', cybersec: '#D4537E', mobile: '#E24B4A', devops: '#888780', sysdesign: '#534AB7' };

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
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif' }}>
      <nav style={{ background: 'rgba(2,8,18,0.98)', borderBottom: '1px solid rgba(0,240,255,0.1)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800 }}>
            <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(0,240,255,0.08)', color: '#00f0ff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Students</button>
            <button onClick={() => router.push('/company/challenges')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>Challenges</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {company && <span style={{ fontSize: 13, color: '#5a7a9a' }}>{company.name}</span>}
          <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
            Find Your Next Engineer
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 13 }}>
            Browse top students ranked by real daily performance. Filter by domain, score, and college.
          </p>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>DOMAIN</div>
              <select value={filters.domain} onChange={e => setFilters(p => ({ ...p, domain: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: '#070f1f', color: '#e8f4ff', fontSize: 13, outline: 'none' }}>
                <option value="">All Domains</option>
                {DOMAIN_OPTIONS.filter(Boolean).map(d => (
                  <option key={d} value={d}>{d.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>MIN SCORE</div>
              <select value={filters.minScore} onChange={e => setFilters(p => ({ ...p, minScore: parseInt(e.target.value) }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: '#070f1f', color: '#e8f4ff', fontSize: 13, outline: 'none' }}>
                <option value={0}>Any Score</option>
                <option value={100}>100+ pts</option>
                <option value={300}>300+ pts</option>
                <option value={600}>600+ pts</option>
                <option value={900}>900+ pts</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>SKILL LEVEL</div>
              <select value={filters.tier || ''} onChange={e => setFilters(p => ({ ...p, tier: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: '#070f1f', color: '#e8f4ff', fontSize: 13, outline: 'none' }}>
                <option value="">All Levels</option>
                <option value="fresher">🌱 Fresher</option>
                <option value="junior">💼 Junior</option>
                <option value="mid-level">⚡ Mid-Level</option>
                <option value="senior">🏆 Senior</option>
                <option value="expert">🔥 Expert</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>COLLEGE</div>
              <input value={filters.college} onChange={e => setFilters(p => ({ ...p, college: e.target.value }))} placeholder="Search college name..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={applyFilters} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              Search →
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a' }}>
            {students.length} students found
          </div>
          <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
            Ranked by GENOIS Score — Real verified skill
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
            Loading students...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
            {students.map((s, i) => {
              const color = DOMAIN_COLORS[s.domain] || '#00f0ff';
              return (
                <div key={i} style={{ background: '#070f1f', border: `1px solid ${color}18`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, color: '#e8f4ff', marginBottom: 3 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 6 }}>{s.college}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${color}15`, color, fontFamily: 'JetBrains Mono,monospace' }}>
                          {s.domain?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,240,255,0.06)', color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace' }}>
                          Rank #{s.rank}
                        </span>
                        {s.skillTier && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${s.skillTier.color}15`, color: s.skillTier.color, fontFamily: 'JetBrains Mono,monospace' }}>
                            {s.skillTier.icon} {s.skillTier.label.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color }}>
                        {s.score}
                      </div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>pts</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
                    <span>🔥 {s.streak}d streak</span>
                    <span>📅 Day {s.currentDay}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {s.linkedinUrl && (
                      <a href={s.linkedinUrl} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid rgba(0,119,181,0.3)', background: 'rgba(0,119,181,0.08)', color: '#0077B5', textDecoration: 'none', fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600, textAlign: 'center' }}>
                        LinkedIn
                      </a>
                    )}
                    <button onClick={() => setContactModal(s)} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${color},${color}99)`, color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700 }}>
                      Contact Student →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {students.length === 0 && !loading && (
          <div style={{ padding: 60, textAlign: 'center', background: '#070f1f', border: '1px solid rgba(0,240,255,0.06)', borderRadius: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff', marginBottom: 8 }}>No students found</div>
            <div style={{ color: '#5a7a9a', fontSize: 14 }}>Try adjusting your filters.</div>
          </div>
        )}
      </div>

      {contactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f4ff', marginBottom: 4 }}>
              Contact {contactModal.name}
            </div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 20 }}>
              We will email {contactModal.name} with your contact request. They will reply to your company email directly.
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginBottom: 6 }}>MESSAGE (optional)</div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Hi ${contactModal.name}, we found your GENOIS profile and are interested in discussing a role at ${company?.name}...`} rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#e8f4ff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setContactModal(null); setMessage(''); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13 }}>Cancel</button>
              <button onClick={contactStudent} disabled={!!contactingId} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
                {contactingId ? 'Sending...' : 'Send Contact Request →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
