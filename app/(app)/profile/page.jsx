'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { useToken, apiFetch } from '@/lib/useApi';

const DOMAINS = [
  {slug:'fullstack',label:'Full Stack'},{slug:'dsa',label:'DSA'},
  {slug:'ml',label:'Machine Learning'},{slug:'ai',label:'AI'},
  {slug:'ds',label:'Data Science'},{slug:'cybersec',label:'Cybersecurity'},
  {slug:'cloud',label:'Cloud'},{slug:'mobile',label:'Mobile'},
  {slug:'devops',label:'DevOps'},{slug:'sysdesign',label:'System Design'},
];



export default function ProfilePage() {
  const router = useRouter();
  const { user, score, progress, updateUser, logout } = useAuthStore();
  const { token } = useToken();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name||'', college: user?.college||'', year: user?.year||'' });
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);



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

  const cardStyle = { background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24, marginBottom: 16 };
  const inpStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.12)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif', boxSizing: 'border-box' };
  const btnSecondary = { padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 600 };

  return (
    <div style={{ fontFamily: 'Outfit,sans-serif', width: '100%', paddingBottom: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
        
        {/* PUBLIC PROFILE - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 2, marginBottom: 8 }}>YOUR PUBLIC PROFILE</div>
          <div style={{ fontSize: 14, color: '#00f0ff', marginBottom: 14 }}>
            genois.in/u/{user?.name?.toLowerCase().replace(/\s+/g,'-') || 'you'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { navigator.clipboard.writeText('https://genois.in/u/'+(user?.name?.toLowerCase().replace(/\s+/g,'-')||'')); toast.success('Copied!'); }} style={btnSecondary}>
              Copy Link
            </button>
            <a href={'/u/'+(user?.name?.toLowerCase().replace(/\s+/g,'-')||'')} target="_blank" rel="noreferrer"
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontSize: 13, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
              View Profile
            </a>
          </div>
        </div>

        {/* PROFILE INFO */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#020812', fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                {(user?.name||'A')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f4ff' }}>{user?.name || 'Student'}</div>
                <div style={{ fontSize: 13, color: '#5a7a9a' }}>{user?.email}</div>
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
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 6 }}>{f.label}</div>
                  <input value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={inpStyle} />
                </div>
              ))}
              <button onClick={saveProfile} disabled={loading}
                style={{ padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700 }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                {label:'COLLEGE', value: user?.college},
                {label:'YEAR', value: user?.year},
                {label:'DOMAIN', value: user?.domain_slug?.toUpperCase()},
                {label:'PLAN', value: (user?.subscription_plan||user?.plan||'spectator').toUpperCase()},
              ].map((item,i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: '#e8f4ff', fontWeight: 600 }}>{item.value || 'Not set'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PERFORMANCE */}
        <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 16 }}>Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              {label:'Total Score', value: score?.total_score||score||0, color:'#7b5cff'},
              {label:'Current Day', value: progress?.current_day||0, color:'#1D9E75'},
              {label:'Streak', value: (progress?.streak||0)+'d', color:'#EF9F27'},
            ].map((s,i) => (
              <div key={i} style={{ background: s.color+'15', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SETTINGS - full width */}
        <div style={{ gridColumn: '1 / -1', background: '#070f1f', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 16 }}>Settings</div>
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
          <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>Change Domain</div>
            <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 16 }}>Resets roadmap to Day 1. Score is kept.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {DOMAINS.map(d => (
                <button key={d.slug} onClick={() => changeDomain(d.slug)} disabled={loading}
                  style={{ padding: '10px 12px', borderRadius: 10, border: user?.domain_slug === d.slug ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.06)', background: user?.domain_slug === d.slug ? 'rgba(0,240,255,0.08)' : 'transparent', color: '#e8f4ff', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
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
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#ff2d78', marginBottom: 8 }}>Reset All Progress?</div>
            <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 20 }}>Deletes all scores, tasks and tests. Cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowResetModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={resetProgress} disabled={loading} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ff2d78', color: '#fff', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>{loading ? 'Resetting...' : 'Reset'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
