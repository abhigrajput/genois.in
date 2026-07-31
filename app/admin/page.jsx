'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const S = { background:'var(--gx-surface)', color:'var(--gx-text)', fontFamily:'var(--font-body)', minHeight:'100vh' };
const card = { background:'var(--gx-bg)', border:'1px solid var(--gx-border)', borderRadius:12, padding:20 };
const mono = { fontFamily:'var(--font-mono)' };

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [userDetail, setUserDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (!token) { router.push('/login?redirect=/admin'); return; }
    fetch('/api/admin', { headers: { Authorization: 'Bearer ' + token } })
      .then(async r => {
        const d = await r.json();
        if (r.status === 401 || r.status === 403) {
          // Stale or revoked token — clear and re-login
          localStorage.removeItem('genois_token');
          setError('Session expired or insufficient privileges. Please log in as admin.');
        } else if (!d.success) {
          setError(d.message || 'Unauthorized');
        } else {
          setData(d.data);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadUser(userId) {
    const token = localStorage.getItem('genois_token');
    const r = await fetch(`/api/admin/user?userId=${userId}`, { headers: { Authorization: 'Bearer ' + token } });
    const d = await r.json();
    setUserDetail(d.data);
    setTab('user_detail');
  }

  async function extendTrial(userId, days) {
    const token = localStorage.getItem('genois_token');
    const r = await fetch('/api/admin/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ userId, action: 'extend', days })
    });
    const d = await r.json();
    if(d.success) toast.success(d.data?.message || 'Extended trial');
    else toast.error(d.message || 'Failed');
    loadUser(userId);
  }

  async function revokeTrial(userId) {
    if (!confirm('Revoke trial for this user?')) return;
    const token = localStorage.getItem('genois_token');
    const r = await fetch('/api/admin/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ userId, action: 'revoke' })
    });
    const d = await r.json();
    if(d.success) toast.success(d.data?.message || 'Revoked trial');
    else toast.error(d.message || 'Failed');
    loadUser(userId);
  }

  async function setPlan(userId, plan) {
    if (!plan) return;
    const token = localStorage.getItem('genois_token');
    const r = await fetch('/api/admin/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ userId, action: 'set_plan', plan })
    });
    const d = await r.json();
    if(d.success) toast.success(d.data?.message || 'Plan updated');
    else toast.error(d.message || 'Failed');
    loadUser(userId);
  }

  if (loading) return <div style={{...S, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gx-accent)', ...mono}}>Loading admin data...</div>;
  if (error) return (
    <div style={{...S, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20}}>
      <div style={{color:'var(--gx-danger)', fontFamily:'var(--font-heading)', fontSize:18, textAlign:'center', maxWidth:480, padding:24}}>{error}</div>
      <button
        onClick={() => router.push('/login?redirect=/admin')}
        style={{padding:'12px 28px', borderRadius:10, background:'var(--gx-accent)', color:'var(--gx-text-inverse)', fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14, border:'none', cursor:'pointer'}}
      >Log in as Admin</button>
    </div>
  );

  // Search query filtered inline below

  const TABS = [
    {key:'overview',label:'📊 Overview'},
    {key:'users',label:'👥 Users'},
    {key:'top',label:'🏆 Top Students'},
    {key:'inactive',label:'😴 Inactive'},
    {key:'revenue',label:'💰 Revenue'},
  ];

  return (
    <div style={S}>
      {/* Header */}
      <div style={{background:'var(--gx-bg)', borderBottom:'1px solid var(--gx-border)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
        <div style={{fontFamily:'var(--font-heading)', fontSize:20, fontWeight:800, color:'var(--gx-accent)'}}>⚙️ GENOIS Admin</div>
        <div style={{fontSize:12, color:'var(--gx-text-muted)', ...mono}}>{data?.stats?.totalUsers} users · ₹{(data?.stats?.monthRevenue||0).toLocaleString()} revenue</div>
        <button onClick={() => router.push('/dashboard')} style={{background:'transparent', border:'1px solid var(--gx-accent-border)', color:'var(--gx-accent)', cursor:'pointer', padding:'6px 14px', borderRadius:8, fontSize:12}}>← Dashboard</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:8, padding:'14px 24px', flexWrap:'wrap', borderBottom:'1px solid var(--gx-border)'}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', background:tab===t.key?'var(--gx-accent)':'var(--gx-surface)', color:tab===t.key?'var(--gx-text-inverse)':'var(--gx-text-muted)', fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600}}>
            {t.label}
          </button>
        ))}
        {userDetail && <button onClick={() => setTab('user_detail')} style={{padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', background:tab==='user_detail'?'var(--gx-warning)':'var(--gx-surface)', color:tab==='user_detail'?'var(--gx-text-inverse)':'var(--gx-text-muted)', fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600}}>👤 User Detail</button>}
      </div>

      <div style={{padding:'24px', maxWidth:1400, margin:'0 auto'}}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24}}>
              {[
                {label:'Total Users', value:data?.stats?.totalUsers, color:'var(--gx-accent)'},
                {label:'Active Today', value:data?.stats?.activeToday, color:'var(--gx-success)'},
                {label:'New This Week', value:data?.stats?.newThisWeek, color:'var(--gx-warning)'},
                {label:'Avg Score', value:(data?.stats?.avgScore||0)+' pts', color:'var(--gx-warning)'},
                {label:'Active Streaks', value:data?.stats?.activeStreaks, color:'var(--gx-danger)'},
                {label:'Revenue (30d)', value:'₹'+(data?.stats?.monthRevenue||0).toLocaleString(), color:'var(--gx-success)'},
                {label:'Aptitude Sessions', value:data?.stats?.aptitudeSessions, color:'var(--gx-info)'},
                {label:'Interviews', value:data?.stats?.interviewSessions, color:'var(--gx-warning)'},
              ].map(s => (
                <div key={s.label} style={{...card, textAlign:'center', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`}}>
                  <div style={{fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:s.color}}>{s.value}</div>
                  <div style={{fontSize:10, color:'var(--gx-text-muted)', marginTop:4, ...mono}}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16}}>
              <div style={card}>
                <div style={{...mono, fontSize:10, color:'var(--gx-accent)', letterSpacing:2, marginBottom:14}}>PLAN BREAKDOWN</div>
                {Object.entries(data?.planBreakdown || {}).map(([plan, count]) => (
                  <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gx-border)' }}>
                    <span style={{ color: 'var(--gx-text)', textTransform: 'capitalize' }}>{plan}</span>
                    <span style={{ color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{...card, border:'1px solid var(--gx-warning-border)'}}>
                <div style={{...mono, fontSize:10, color:'var(--gx-warning)', letterSpacing:2, marginBottom:14}}>DOMAIN BREAKDOWN</div>
                {Object.entries(data?.domainBreakdown || {}).map(([domain, count]) => (
                  <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gx-border)' }}>
                    <span style={{ color: 'var(--gx-text)', textTransform: 'uppercase' }}>{domain}</span>
                    <span style={{ color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{...card, border:'1px solid var(--gx-success-border)'}}>
                <div style={{...mono, fontSize:10, color:'var(--gx-success)', letterSpacing:2, marginBottom:14}}>RECENT SIGNUPS</div>
                {(data?.recentSignups || []).map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gx-border)' }}>
                    <div>
                      <div style={{ color: 'var(--gx-text)', fontSize: 13 }}>{u.name}</div>
                      <div style={{ color: 'var(--gx-text-muted)', fontSize: 11 }}>{u.email}</div>
                    </div>
                    <div style={{ color: 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {new Date(u.joined).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name or email..." style={{width:'100%', padding:'11px 16px', borderRadius:10, border:'1px solid var(--gx-border)', background:'var(--gx-bg)', color:'var(--gx-text)', fontSize:14, outline:'none', marginBottom:16, boxSizing:'border-box'}} />
            <div style={{ marginTop: 16 }}>
              {(data?.allUsers || [])
                .filter(u => 
                  !searchQuery || 
                  u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(u => (
                  <div key={u.id} onClick={() => loadUser(u.id)} style={{ padding: 16, borderRadius: 12, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', marginBottom: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginTop: 2 }}>{u.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 12, background: u.plan === 'dominator' ? 'var(--gx-warning-soft)' : u.plan === 'performer' ? 'var(--gx-warning-soft)' : u.plan === 'player' ? 'var(--gx-accent-soft)' : 'var(--gx-surface)', color: u.plan === 'dominator' ? 'var(--gx-warning)' : u.plan === 'performer' ? 'var(--gx-warning)' : u.plan === 'player' ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700, textTransform: 'uppercase' }}>{u.plan}</span>
                        {u.isOnTrial && u.trialDaysLeft > 0 && <span style={{ padding: '3px 10px', borderRadius: 12, background: 'var(--gx-success-soft)', color: 'var(--gx-success)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TRIAL {u.trialDaysLeft}d</span>}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, padding: '12px 0', borderTop: '1px solid var(--gx-border)' }}>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>COLLEGE</div><div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{u.college}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>YEAR</div><div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{u.year}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>DOMAIN</div><div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{u.domain}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>SCORE</div><div style={{ fontSize: 13, color: 'var(--gx-warning)', fontWeight: 700 }}>{u.score}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>DAY</div><div style={{ fontSize: 13, color: 'var(--gx-success)' }}>{u.day}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>STREAK</div><div style={{ fontSize: 13, color: 'var(--gx-warning)' }}>{u.streak}d</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>LAST ACTIVE</div><div style={{ fontSize: 13, color: u.lastActiveDays > 7 ? 'var(--gx-danger)' : 'var(--gx-text)' }}>{u.lastActiveDays !== null ? u.lastActiveDays + 'd ago' : 'Never'}</div></div>
                      <div><div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>JOINED</div><div style={{ fontSize: 13, color: 'var(--gx-text)' }}>{new Date(u.joined).toLocaleDateString()}</div></div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-mono)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--gx-border)' }}>
                      ID: {u.id} · Hash: {u.passwordHashPreview}
                    </div>
                  </div>
                ))}
              {(data?.allUsers || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--gx-text-muted)' }}>No users found</div>
              )}
            </div>
          </div>
        )}

        {/* TOP STUDENTS */}
        {tab === 'top' && (
          <div>
            <div style={{...mono, fontSize:11, color:'var(--gx-text-muted)', letterSpacing:2, marginBottom:14}}>TOP 20 STUDENTS BY SCORE</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {(data?.topStudents||[]).map((u,i) => (
                <div key={i} onClick={() => loadUser(u.id)} style={{...card, border:`1px solid ${i<3?'var(--gx-warning-border)':'var(--gx-border)'}`, display:'flex', alignItems:'center', gap:14, cursor:'pointer', flexWrap:'wrap'}}>
                  <div style={{width:32, height:32, borderRadius:8, background:i===0?'var(--gx-warning)':i===1?'var(--gx-text-subtle)':i===2?'var(--gx-warning)':'var(--gx-surface)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:i<3?'var(--gx-text-inverse)':'var(--gx-text-muted)', flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1, minWidth:140}}>
                    <div style={{fontSize:14, fontWeight:600, color:'var(--gx-text)'}}>{u.name}</div>
                    <div style={{fontSize:11, color:'var(--gx-text-muted)'}}>{u.email} · {u.subscription_plan||'free'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'var(--font-heading)', fontSize:18, fontWeight:800, color:'var(--gx-warning)'}}>{u.score} pts</div>
                    <div style={{fontSize:11, color:'var(--gx-text-muted)', ...mono}}>Day {u.day} · {u.streak}🔥</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INACTIVE */}
        {tab === 'inactive' && (
          <div>
            <div style={{...mono, fontSize:11, color:'var(--gx-danger)', letterSpacing:2, marginBottom:14}}>INACTIVE USERS — 7+ DAYS</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {(data?.inactiveUsers||[]).map((u,i) => (
                <div key={i} onClick={() => loadUser(u.id)} style={{...card, border:'1px solid var(--gx-danger-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, cursor:'pointer'}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:600, color:'var(--gx-text)'}}>{u.name||'Unknown'}</div>
                    <div style={{fontSize:11, color:'var(--gx-text-muted)'}}>{u.email}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11, color:'var(--gx-danger)', ...mono}}>Inactive: {u.lastActiveDays !== null ? u.lastActiveDays + 'd' : 'Never'}</div>
                    <div style={{fontSize:11, color:'var(--gx-text-muted)'}}>Score: {u.score} · Day {u.day}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVENUE */}
        {tab === 'revenue' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:20}}>
              {[
                {label:'Total Revenue', value:'₹'+(data?.stats?.monthRevenue||0).toLocaleString(), color:'var(--gx-success)'},
                {label:'Paid Users', value:Object.entries(data?.planBreakdown||{}).filter(([k])=>k!=='spectator'&&k!=='free').reduce((s,[,v])=>s+v,0), color:'var(--gx-accent)'},
              ].map(s => (
                <div key={s.label} style={{...card, textAlign:'center', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`}}>
                  <div style={{fontFamily:'var(--font-heading)', fontSize:28, fontWeight:800, color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11, color:'var(--gx-text-muted)', marginTop:4, ...mono}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{...card, padding:0, overflow:'hidden'}}>
              <div style={{padding:'12px 16px', borderBottom:'1px solid var(--gx-border)', ...mono, fontSize:10, color:'var(--gx-success)', letterSpacing:2}}>RECENT SUBSCRIPTIONS</div>
              {(data?.payments||[]).length===0
                ? <div style={{padding:32, textAlign:'center', color:'var(--gx-text-muted)', fontSize:13}}>No payments yet</div>
                : (data?.payments||[]).map((p,i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--gx-border)', flexWrap:'wrap', gap:8}}>
                    <div>
                      <div style={{fontSize:13, color:'var(--gx-text)', textTransform:'capitalize'}}>{p.plan||'Unknown'}</div>
                      <div style={{fontSize:11, color:'var(--gx-text-muted)', ...mono}}>{p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-IN') : '—'}</div>
                    </div>
                    <div style={{fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:'var(--gx-success)'}}>₹{p.amount||0}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* USER DETAIL */}
        {tab === 'user_detail' && userDetail && (
          <div>
            <button onClick={() => setTab('users')} style={{background:'transparent', border:'none', color:'var(--gx-accent)', cursor:'pointer', fontSize:13, fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:16}}>← Back to Users</button>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16}}>
              <div style={{...card, border:'1px solid var(--gx-border)'}}>
                <div style={{...mono, fontSize:10, color:'var(--gx-accent)', letterSpacing:2, marginBottom:14}}>STUDENT PROFILE</div>
                {[
                  ['Name', userDetail.user?.name],
                  ['Email', userDetail.user?.email],
                  ['Domain', userDetail.user?.domain_slug],
                  ['Plan', userDetail.user?.subscription_plan||userDetail.user?.plan||'spectator'],
                  ['Score', (userDetail.score?.total_score||0)+' pts'],
                  ['Day', 'Day '+(userDetail.progress?.current_day||0)],
                  ['Streak', (userDetail.progress?.streak||0)+' days 🔥'],
                  ['Joined', userDetail.user?.created_at ? new Date(userDetail.user.created_at).toLocaleDateString('en-IN') : '—'],
                ].map(([label,val]) => (
                  <div key={label} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--gx-border)'}}>
                    <span style={{fontSize:12, color:'var(--gx-text-muted)', ...mono}}>{label}</span>
                    <span style={{fontSize:12, color:'var(--gx-text)', fontWeight:600}}>{val||'N/A'}</span>
                  </div>
                ))}
                
                {userDetail.user && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                    <button onClick={() => extendTrial(userDetail.user.id, 30)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gx-success-border)', background: 'var(--gx-success-soft)', color: 'var(--gx-success)', cursor: 'pointer', fontSize: 12 }}>
                      +30 days trial
                    </button>
                    <button onClick={() => extendTrial(userDetail.user.id, 7)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gx-accent-border)', background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', cursor: 'pointer', fontSize: 12 }}>
                      +7 days trial
                    </button>
                    <button onClick={() => revokeTrial(userDetail.user.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gx-danger-border)', background: 'var(--gx-danger-soft)', color: 'var(--gx-danger)', cursor: 'pointer', fontSize: 12 }}>
                      Revoke trial
                    </button>
                    <select onChange={(e) => setPlan(userDetail.user.id, e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 12 }}>
                      <option value="">Set plan...</option>
                      <option value="spectator">Spectator (free)</option>
                      <option value="player">Player (₹99)</option>
                      <option value="performer">Performer (₹199)</option>
                      <option value="dominator">Dominator (₹499)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{...card, border:'1px solid var(--gx-warning-border)'}}>
                <div style={{...mono, fontSize:10, color:'var(--gx-warning)', letterSpacing:2, marginBottom:14}}>APTITUDE HISTORY</div>
                {!userDetail.aptitudeSessions?.length
                  ? <div style={{color:'var(--gx-text-muted)', fontSize:13}}>No sessions yet</div>
                  : userDetail.aptitudeSessions.map((s,i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--gx-border)'}}>
                      <span style={{fontSize:12, color:'var(--gx-text)'}}>{s.topic||'Session'}</span>
                      <span style={{fontSize:12, color:'var(--gx-warning)', fontWeight:700}}>{s.score}%</span>
                    </div>
                  ))
                }
              </div>

              <div style={{...card, border:'1px solid var(--gx-danger-border)'}}>
                <div style={{...mono, fontSize:10, color:'var(--gx-danger)', letterSpacing:2, marginBottom:14}}>INTERVIEW HISTORY</div>
                {!userDetail.interviewSessions?.length
                  ? <div style={{color:'var(--gx-text-muted)', fontSize:13}}>No interviews yet</div>
                  : userDetail.interviewSessions.map((s,i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--gx-border)'}}>
                      <span style={{fontSize:12, color:'var(--gx-text)'}}>{s.company_name||'Unknown'}</span>
                      <span style={{fontSize:12, color:s.verdict==='SELECTED'?'var(--gx-success)':'var(--gx-danger)', fontWeight:700}}>{s.verdict||'Incomplete'}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
