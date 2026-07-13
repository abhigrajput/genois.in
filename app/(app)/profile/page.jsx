'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { useToken, apiFetch } from '@/lib/useApi';
import Link from 'next/link';

const PLACEMENT_COMPANIES = [
  'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Amazon', 'Flipkart', 'Startups', 'Other MNCs',
];

const WEAK_SUBJECTS = [
  'Arrays & Strings', 'Linked Lists', 'Trees & Graphs',
  'Dynamic Programming', 'Recursion', 'OS & DBMS',
  'Computer Networks', 'System Design', 'Math & Aptitude',
  'OOP Concepts', 'SQL Queries',
];

const MONTH_OPTIONS = [
  { label: '1-3 months', value: 2 },
  { label: '4-6 months', value: 5 },
  { label: '7-9 months', value: 8 },
  { label: '10-12 months', value: 11 },
  { label: '12+ months', value: 18 },
];

const DOMAINS = [
  {slug:'fullstack',label:'Full Stack'},{slug:'dsa',label:'DSA'},
  {slug:'aiml',label:'Machine Learning'},{slug:'datascience',label:'Data Science'},
  {slug:'cybersecurity',label:'Cybersecurity'},{slug:'devops',label:'DevOps'},
  {slug:'android',label:'Mobile'},{slug:'systemdesign',label:'System Design'},
  {slug:'blockchain',label:'Blockchain'},{slug:'gamedev',label:'Game Dev'},
];

// The 6 axes returned by /api/analytics/skill-identity → skillAreas. Order + labels
// are fixed here so the radar reads consistently everywhere it's shown.
const SKILL_AXES = [
  { key: 'theoretical',    label: 'Theory' },
  { key: 'coding',         label: 'Coding' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'projects',       label: 'Projects' },
  { key: 'consistency',    label: 'Consistency' },
  { key: 'domainDepth',    label: 'Domain Depth' },
];

function skillColor(v) {
  if (v >= 70) return '#1D9E75';
  if (v >= 40) return '#EF9F27';
  return '#ff6b4a';
}

// A single shimmering block — reserves layout while data loads so nothing jumps in.
function Shimmer({ w = '100%', h = 12, r = 6, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 37%, rgba(255,255,255,0.04) 63%)',
      backgroundSize: '900px 100%', animation: 'genoisShimmer 1.4s linear infinite',
      ...style,
    }} />
  );
}

const CARD = { background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 };

export default function ProfilePage() {
  const router = useRouter();
  const { user, score, progress, updateUser, logout } = useAuthStore();
  const { token } = useToken();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name||'', college: user?.college||'', year: user?.year||'' });
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myBadges, setMyBadges] = useState([]);

  // Skill analytics — the 6-axis identity, loaded dynamically from real performance.
  const [skill, setSkill] = useState(null);
  const [skillLoading, setSkillLoading] = useState(true);

  // Placement profile state
  const [placementForm, setPlacementForm] = useState({
    target_companies: user?.target_companies || [],
    cgpa: user?.cgpa ?? '',
    months_to_placement: user?.months_to_placement || 8,
    weak_subjects: user?.weak_subjects || [],
  });
  const [placementLoading, setPlacementLoading] = useState(false);

  // Keep local forms in sync once the auth store hydrates (direct nav / hard refresh).
  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name||'', college: user.college||'', year: user.year||'' });
    setPlacementForm({
      target_companies: user.target_companies || [],
      cgpa: user.cgpa ?? '',
      months_to_placement: user.months_to_placement || 8,
      weak_subjects: user.weak_subjects || [],
    });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/badge/status', token)
      .then(r => setMyBadges((r.data.badges || []).filter(b => b.status === 'active')))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setSkillLoading(true);
    apiFetch('/api/analytics/skill-identity', token)
      .then(r => { if (alive) setSkill(r.data || null); })
      .catch(() => { if (alive) setSkill(null); })
      .finally(() => { if (alive) setSkillLoading(false); });
    return () => { alive = false; };
  }, [token]);

  async function saveProfile() {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (e) { toast.error('Update failed'); }
    setLoading(false);
  }

  async function savePlacementProfile() {
    setPlacementLoading(true);
    try {
      const payload = {
        target_companies: placementForm.target_companies,
        weak_subjects: placementForm.weak_subjects,
        months_to_placement: placementForm.months_to_placement,
      };
      if (placementForm.cgpa !== '' && !isNaN(parseFloat(placementForm.cgpa))) {
        payload.cgpa = parseFloat(placementForm.cgpa);
      } else if (placementForm.cgpa === '') {
        payload.cgpa = null;
      }
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) { updateUser(d.data.user); toast.success('Placement profile saved!'); }
      else toast.error(d.message || 'Save failed');
    } catch { toast.error('Save failed'); }
    setPlacementLoading(false);
  }

  function togglePlacementCompany(c) {
    setPlacementForm(p => ({
      ...p,
      target_companies: p.target_companies.includes(c)
        ? p.target_companies.filter(x => x !== c)
        : [...p.target_companies, c],
    }));
  }

  function toggleWeakSubject(s) {
    setPlacementForm(p => ({
      ...p,
      weak_subjects: p.weak_subjects.includes(s)
        ? p.weak_subjects.filter(x => x !== s)
        : [...p.weak_subjects, s],
    }));
  }

  async function changeDomain(slug) {
    setLoading(true);
    try {
      await authAPI.changeDomain(slug);
      updateUser({ domain_slug: slug });
      setShowDomainModal(false);
      toast.success('Domain changed!');
    } catch { toast.error('Failed'); }
    setLoading(false);
  }

  async function resetProgress() {
    setLoading(true);
    try {
      await authAPI.resetProgress();
      setShowResetModal(false);
      toast.success('Progress reset!');
      router.push('/dashboard');
    } catch { toast.error('Failed'); }
    setLoading(false);
  }

  function signOut() {
    logout();
    document.cookie = 'genois_token=; path=/; max-age=0';
    localStorage.clear();
    router.push('/login');
  }

  const cardStyle = { ...CARD, marginBottom: 16 };
  const inpStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.12)', background: 'rgba(255,255,255,0.02)', color: '#e8e8ed', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' };
  const btnSecondary = { padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.2)', background: 'transparent', color: '#00d9a3', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 600 };

  const shimmerKeyframes = '@keyframes genoisShimmer { 0% { background-position: -450px 0; } 100% { background-position: 450px 0; } }';

  // ─── Loading gate — auth store not yet hydrated ────────────────────────────
  // Render a real skeleton instead of a page full of "Not set" / "Student"
  // fallbacks, so a hard refresh mid-hydration never flashes broken content.
  if (!user) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', width: '100%', paddingBottom: 60 }}>
        <style>{shimmerKeyframes}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
          <div style={{ gridColumn: '1 / -1', ...CARD }}>
            <Shimmer w={140} h={10} style={{ marginBottom: 12 }} />
            <Shimmer w="60%" h={16} />
          </div>
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Shimmer w={48} h={48} r={24} />
              <div style={{ flex: 1 }}>
                <Shimmer w="70%" h={16} style={{ marginBottom: 8 }} />
                <Shimmer w="50%" h={12} />
              </div>
            </div>
            <Shimmer h={12} style={{ marginBottom: 10 }} />
            <Shimmer w="80%" h={12} />
          </div>
          <div style={CARD}>
            <Shimmer w="40%" h={14} style={{ marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[0,1,2].map(i => <Shimmer key={i} h={70} r={10} />)}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', ...CARD }}>
            <Shimmer w="30%" h={14} style={{ marginBottom: 16 }} />
            {[0,1,2,3].map(i => <Shimmer key={i} h={12} style={{ marginBottom: 12 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const areas = skill?.skillAreas || null;
  const hasSkillData = !!areas && SKILL_AXES.some(a => (areas[a.key] || 0) > 0);
  const jobReady = Math.round(skill?.jobReadyScore || 0);

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%', paddingBottom: 60 }}>
      <style>{shimmerKeyframes}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>

        {/* PUBLIC PROFILE - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 8 }}>YOUR PUBLIC PROFILE</div>
          <div style={{ fontSize: 14, color: '#00d9a3', marginBottom: 14, wordBreak: 'break-word' }}>
            genois.in/u/{user?.name?.toLowerCase().replace(/\s+/g,'-') || 'you'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => { navigator.clipboard.writeText('https://genois.in/u/'+(user?.name?.toLowerCase().replace(/\s+/g,'-')||'')); toast.success('Copied!'); }} style={btnSecondary}>
              Copy Link
            </button>
            <a href={'/u/'+(user?.name?.toLowerCase().replace(/\s+/g,'-')||'')} target="_blank" rel="noreferrer"
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              View Profile
            </a>
          </div>
        </div>

        {/* PROFILE INFO */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#020812', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
                {(user?.name||'A')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#e8e8ed', wordBreak: 'break-word' }}>{user?.name || 'Student'}</div>
                <div style={{ fontSize: 13, color: '#5a7a9a', wordBreak: 'break-word' }}>{user?.email}</div>
              </div>
            </div>
            <button onClick={() => { setEditing(!editing); setForm({ name: user?.name||'', college: user?.college||'', year: user?.year||'' }); }}
              style={btnSecondary}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{key:'name',label:'NAME'},{key:'college',label:'COLLEGE'},{key:'year',label:'YEAR'}].map(f => (
                <div key={f.key}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 6 }}>{f.label}</div>
                  <input value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={inpStyle} />
                </div>
              ))}
              <button onClick={saveProfile} disabled={loading}
                style={{ padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                {label:'COLLEGE', value: user?.college},
                {label:'YEAR', value: user?.year},
                {label:'DOMAIN', value: user?.domain_slug?.toUpperCase()},
                {label:'PLAN', value: 'PLACEMENT BETA'},
              ].map((item,i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: '#e8e8ed', fontWeight: 600, wordBreak: 'break-word' }}>{item.value || 'Not set'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PERFORMANCE */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 16 }}>Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              {label:'Total Score', value: score?.total_score ?? (typeof score === 'number' ? score : 0), color:'#ff6b4a'},
              {label:'Current Day', value: progress?.current_day||0, color:'#1D9E75'},
              {label:'Streak', value: (progress?.streak||0)+'d', color:'#EF9F27'},
            ].map((s,i) => (
              <div key={i} style={{ background: s.color+'15', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SKILL ANALYTICS - full width — 6-axis identity from real performance */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed' }}>📈 Skill Analytics</div>
            {!skillLoading && hasSkillData && (
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#00d9a3' }}>{jobReady}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a' }}>/100 JOB-READY</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 20 }}>Your 6-axis skill identity, computed from your real tests, coding and projects.</div>

          {skillLoading ? (
            // Loading state — skeleton of the 6 axis bars.
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SKILL_AXES.map((a) => (
                <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Shimmer w={120} h={12} />
                  <Shimmer h={8} r={4} style={{ flex: 1 }} />
                  <Shimmer w={36} h={12} />
                </div>
              ))}
            </div>
          ) : hasSkillData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SKILL_AXES.map((a) => {
                const v = Math.max(0, Math.min(100, Math.round(areas[a.key] || 0)));
                const c = skillColor(v);
                return (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 120, fontSize: 12, color: '#8a9aac', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{a.label}</div>
                    <div style={{ flex: 1, height: 8, minWidth: 40, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${v}%`, background: c, borderRadius: 4, transition: 'width .5s' }} />
                    </div>
                    <div style={{ width: 30, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 13, color: c, flexShrink: 0 }}>{v}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state — new account with no measured performance yet.
            <div style={{ padding: '18px 16px', borderRadius: 10, background: 'rgba(0,217,163,0.04)', border: '1px dashed rgba(0,217,163,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#8a9aac', lineHeight: 1.6, marginBottom: 12 }}>
                No skill data yet. Finish a daily task, take a test, or ship a project and your 6-axis identity starts filling in.
              </div>
              <Link href="/dashboard" style={{ ...btnSecondary, display: 'inline-block', textDecoration: 'none' }}>Go to today&apos;s task →</Link>
            </div>
          )}
        </div>

        {/* SKILL BADGES - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed' }}>🎖️ Skill Badges</div>
            <Link href="/badge" style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(0,217,163,0.2)', background:'transparent', color:'#00d9a3', textDecoration:'none', fontSize:12, fontFamily:'var(--font-heading)', fontWeight:600 }}>Get Verified →</Link>
          </div>
          {myBadges.length === 0 ? (
            <div style={{ fontSize:13, color:'#5a7a9a' }}>No active badges yet. <Link href="/badge" style={{ color:'#00d9a3' }}>Start a verification test →</Link></div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {myBadges.map(b => {
                const ICONS = {fullstack:'🌐',dsa:'🧠',cybersecurity:'🔒',aiml:'🤖',devops:'⚙️',android:'📱',datascience:'📊',blockchain:'⛓️',gamedev:'🎮',systemdesign:'🏗️'};
                const LEVEL_C = {proficient:'#4f9cf9',expert:'#EF9F27',master:'#1D9E75'};
                const lc = LEVEL_C[b.level] || '#4f9cf9';
                return (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:20, background:`${lc}15`, border:`1px solid ${lc}40` }}>
                    <span style={{ fontSize:14 }}>{ICONS[b.domain] || '🎖️'}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:lc, fontFamily:'var(--font-heading)' }}>{b.domain}</span>
                    <span style={{ fontSize:10, color:'#5a7a9a', fontFamily:'var(--font-mono)' }}>{b.daysLeft}d</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PLACEMENT PROFILE - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>🎯 Placement Profile</div>
          <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 20 }}>Used by GENOIS AI to personalize your roadmap, chatbot, and company-specific prep.</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>TARGET COMPANIES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLACEMENT_COMPANIES.map(c => {
                const sel = placementForm.target_companies.includes(c);
                return (
                  <button key={c} onClick={() => togglePlacementCompany(c)} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? '#00d9a3' : 'rgba(255,255,255,0.08)'}`,
                    background: sel ? 'rgba(0,217,163,0.08)' : 'transparent',
                    color: sel ? '#00d9a3' : '#5a7a9a',
                    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
                  }}>{c}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>MONTHS TO PLACEMENT</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MONTH_OPTIONS.map(m => {
                const sel = placementForm.months_to_placement === m.value;
                return (
                  <button key={m.value} onClick={() => setPlacementForm(p => ({ ...p, months_to_placement: m.value }))} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? '#00d9a3' : 'rgba(255,255,255,0.08)'}`,
                    background: sel ? 'rgba(0,217,163,0.08)' : 'transparent',
                    color: sel ? '#00d9a3' : '#5a7a9a',
                    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
                  }}>{m.label}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>WEAK AREAS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WEAK_SUBJECTS.map(s => {
                const sel = placementForm.weak_subjects.includes(s);
                return (
                  <button key={s} onClick={() => toggleWeakSubject(s)} style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${sel ? '#00d9a3' : 'rgba(255,255,255,0.08)'}`,
                    background: sel ? 'rgba(0,217,163,0.08)' : 'transparent',
                    color: sel ? '#00d9a3' : '#5a7a9a',
                    fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600,
                  }}>{s}</button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20, maxWidth: 240 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 6 }}>CGPA</div>
            <input
              type="number" min="0" max="10" step="0.1"
              value={placementForm.cgpa}
              onChange={e => setPlacementForm(p => ({ ...p, cgpa: e.target.value }))}
              placeholder="e.g. 7.2"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,217,163,0.12)', background: 'rgba(255,255,255,0.02)', color: '#e8e8ed', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#3a4a5a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Not shared publicly</div>
          </div>

          <button onClick={savePlacementProfile} disabled={placementLoading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
            {placementLoading ? 'Saving...' : 'Save Placement Profile'}
          </button>
        </div>

        {/* SETTINGS - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 16 }}>Settings</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowDomainModal(true)} style={btnSecondary}>Change Domain</button>
            <button onClick={() => setShowResetModal(true)} style={{ ...btnSecondary, border: '1px solid rgba(255,45,120,0.3)', color: '#ff2d78' }}>Reset Progress</button>
            <button onClick={signOut} style={{ ...btnSecondary, border: '1px solid rgba(255,255,255,0.08)', color: '#5a7a9a' }}>Sign Out</button>
          </div>
        </div>

      </div>

      {/* Domain Modal */}
      {showDomainModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.15)', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>Change Domain</div>
            <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 16 }}>Resets roadmap to Day 1. Score is kept.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {DOMAINS.map(d => (
                <button key={d.slug} onClick={() => changeDomain(d.slug)} disabled={loading}
                  style={{ padding: '10px 12px', borderRadius: 10, border: user?.domain_slug === d.slug ? '1px solid rgba(0,217,163,0.4)' : '1px solid rgba(255,255,255,0.06)', background: user?.domain_slug === d.slug ? 'rgba(0,217,163,0.08)' : 'transparent', color: '#e8e8ed', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
                  {d.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDomainModal(false)} style={{ ...btnSecondary, width: '100%', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', color: '#5a7a9a' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.2)', borderRadius: 14, padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#ff2d78', marginBottom: 8 }}>Reset All Progress?</div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 20 }}>Deletes all scores, tasks and tests. Cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowResetModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={resetProgress} disabled={loading} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ff2d78', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>{loading ? 'Resetting...' : 'Reset'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
