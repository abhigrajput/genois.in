'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';

const DOMAINS = [
  {slug:'fullstack',label:'Full Stack',icon:'⬡'},{slug:'dsa',label:'DSA',icon:'◈'},
  {slug:'ml',label:'Machine Learning',icon:'◉'},{slug:'ai',label:'AI',icon:'◎'},
  {slug:'ds',label:'Data Science',icon:'◇'},{slug:'cybersec',label:'Cybersecurity',icon:'◆'},
  {slug:'cloud',label:'Cloud',icon:'○'},{slug:'mobile',label:'Mobile',icon:'▣'},
  {slug:'devops',label:'DevOps',icon:'▷'},{slug:'sysdesign',label:'System Design',icon:'▦'},
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, score, progress, updateUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name||'', college: user?.college||'', year: user?.year||'1st Year' });
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setLoading(false); }
  };

  const changeDomain = async (slug) => {
    setLoading(true);
    try {
      await authAPI.changeDomain(slug);
      updateUser({ domain_slug: slug });
      setShowDomainModal(false);
      toast.success('Domain changed!');
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const resetProgress = async () => {
    setLoading(true);
    try {
      await authAPI.resetProgress();
      setShowResetModal(false);
      toast.success('Progress reset!');
      router.push('/dashboard');
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 10 }}>YOUR PUBLIC PROFILE</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, color: '#e8f4ff', fontWeight: 600, marginBottom: 4 }}>
              genois.in/u/{user?.name?.toLowerCase().replace(/\s+/g, '-')}
            </div>
            <div style={{ fontSize: 12, color: '#5a7a9a' }}>
              Share this link on LinkedIn and WhatsApp. Recruiters can verify your skills.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText('https://genois.in/u/' + encodeURIComponent(user?.name || '')); toast.success('Profile link copied!'); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.2)', background: 'transparent', color: '#00f0ff', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600 }}>
              Copy Link
            </button>
            <a href={'/u/' + encodeURIComponent(user?.name || '')} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700 }}>
              View →
            </a>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
            {(user?.name||'G').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? <input className="input font-semibold" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /> : <div className="font-semibold text-lg">{user?.name}</div>}
            <div className="text-sm text-gray-400">{user?.email}</div>
          </div>
          <button onClick={editing ? saveProfile : () => setEditing(true)} disabled={loading} className={editing ? 'btn-primary' : 'btn-secondary'}>
            {editing ? (loading ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'College', value: editing ? <input className="input text-sm py-1" value={form.college} onChange={e=>setForm(f=>({...f,college:e.target.value}))} /> : user?.college },
            { label:'Year', value: user?.year },
            { label:'Domain', value: user?.domain_slug?.toUpperCase() },
            { label:'Plan', value: <span className="badge badge-primary capitalize">{user?.plan}</span> },
          ].map(row => (
            <div key={row.label} className="py-2 border-b border-gray-50">
              <div className="text-xs text-gray-400 mb-1">{row.label}</div>
              <div className="text-sm font-medium">{row.value || '-'}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="section-title mb-3">Performance</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Total Score', value: score?.total_score||0, color:'#7F77DD' },
            { label:'Current Day', value: progress?.current_day||1, color:'#1D9E75' },
            { label:'Streak', value:`${progress?.streak||0}d`, color:'#BA7517' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{background:s.color+'0f'}}>
              <div className="text-xl font-bold" style={{color:s.color}}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="section-title mb-3">Settings</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowDomainModal(true)} className="btn-secondary text-sm">Change Domain</button>
          <button onClick={() => setShowResetModal(true)} className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all">Reset Progress</button>
          <button onClick={() => { logout(); router.push('/login'); }} className="btn-secondary text-sm">Sign Out</button>
        </div>
      </div>
      {showDomainModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="font-bold mb-1">Change Domain</h3>
            <p className="text-xs text-gray-400 mb-4">Resets roadmap to Day 1. Score is kept.</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DOMAINS.map(d => (
                <button key={d.slug} onClick={() => changeDomain(d.slug)} disabled={loading}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${user?.domain_slug===d.slug ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDomainModal(false)} className="btn-secondary w-full justify-center">Cancel</button>
          </div>
        </div>
      )}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="font-bold text-red-600 mb-2">Reset All Progress?</h3>
            <p className="text-sm text-gray-500 mb-4">Deletes all scores, tasks, tests. Cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={resetProgress} disabled={loading} className="btn-danger flex-1 justify-center">{loading ? 'Resetting...' : 'Reset'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
