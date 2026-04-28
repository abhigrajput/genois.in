'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const S = { background:'#020812', color:'#e8f4ff', fontFamily:'Outfit,sans-serif', minHeight:'100vh' };
const card = { background:'#070f1f', border:'1px solid rgba(0,240,255,0.08)', borderRadius:12, padding:20 };
const mono = { fontFamily:'JetBrains Mono,monospace' };

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [userDetail, setUserDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/admin', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { if (!d.success) setError(d.message || 'Unauthorized'); else setData(d.data); })
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

  if (loading) return <div style={{...S, display:'flex', alignItems:'center', justifyContent:'center', color:'#00f0ff', ...mono}}>Loading admin data...</div>;
  if (error) return <div style={{...S, display:'flex', alignItems:'center', justifyContent:'center', color:'#ff2d78', fontFamily:'Syne,sans-serif', fontSize:20}}>{error}</div>;

  const filtered = (data?.allUsers || []).filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div style={{background:'#070f1f', borderBottom:'1px solid rgba(0,240,255,0.1)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
        <div style={{fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'#00f0ff'}}>⚙️ GENOIS Admin</div>
        <div style={{fontSize:12, color:'#5a7a9a', ...mono}}>{data?.overview?.totalUsers} users · ₹{(data?.overview?.totalRevenue||0).toLocaleString()} revenue</div>
        <button onClick={() => router.push('/dashboard')} style={{background:'transparent', border:'1px solid rgba(0,240,255,0.2)', color:'#00f0ff', cursor:'pointer', padding:'6px 14px', borderRadius:8, fontSize:12}}>← Dashboard</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:8, padding:'14px 24px', flexWrap:'wrap', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', background:tab===t.key?'#00f0ff':'rgba(255,255,255,0.05)', color:tab===t.key?'#020812':'#5a7a9a', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600}}>
            {t.label}
          </button>
        ))}
        {userDetail && <button onClick={() => setTab('user_detail')} style={{padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', background:tab==='user_detail'?'#EF9F27':'rgba(255,255,255,0.05)', color:tab==='user_detail'?'#020812':'#5a7a9a', fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600}}>👤 User Detail</button>}
      </div>

      <div style={{padding:'24px', maxWidth:1400, margin:'0 auto'}}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24}}>
              {[
                {label:'Total Users', value:data?.overview?.totalUsers, color:'#00f0ff'},
                {label:'Active Today', value:data?.overview?.activeToday, color:'#1D9E75'},
                {label:'New This Week', value:data?.overview?.newThisWeek, color:'#7b5cff'},
                {label:'Avg Score', value:(data?.overview?.avgScore||0)+' pts', color:'#EF9F27'},
                {label:'Active Streaks', value:data?.overview?.activeStreaks, color:'#ff2d78'},
                {label:'Revenue (30d)', value:'₹'+(data?.overview?.totalRevenue||0).toLocaleString(), color:'#1D9E75'},
                {label:'Aptitude Sessions', value:data?.overview?.aptitudeAttempts, color:'#378ADD'},
                {label:'Interviews', value:data?.overview?.interviewAttempts, color:'#D85A30'},
              ].map(s => (
                <div key={s.label} style={{...card, textAlign:'center', border:`1px solid ${s.color}20`}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:s.color}}>{s.value}</div>
                  <div style={{fontSize:10, color:'#5a7a9a', marginTop:4, ...mono}}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16}}>
              <div style={card}>
                <div style={{...mono, fontSize:10, color:'#00f0ff', letterSpacing:2, marginBottom:14}}>PLAN BREAKDOWN</div>
                {Object.entries(data?.planBreakdown||{}).sort((a,b)=>b[1]-a[1]).map(([plan,count]) => (
                  <div key={plan} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <span style={{fontSize:13, color:'#c8d8e8', textTransform:'capitalize'}}>{plan}</span>
                    <span style={{fontSize:13, fontWeight:700, color:'#00f0ff', fontFamily:'Syne,sans-serif'}}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{...card, border:'1px solid rgba(123,92,255,0.1)'}}>
                <div style={{...mono, fontSize:10, color:'#7b5cff', letterSpacing:2, marginBottom:14}}>DOMAIN BREAKDOWN</div>
                {Object.entries(data?.domainBreakdown||{}).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([d,c]) => (
                  <div key={d} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <span style={{fontSize:12, color:'#c8d8e8', textTransform:'capitalize'}}>{d}</span>
                    <span style={{fontSize:12, fontWeight:700, color:'#7b5cff'}}>{c}</span>
                  </div>
                ))}
              </div>

              <div style={{...card, border:'1px solid rgba(29,158,117,0.1)'}}>
                <div style={{...mono, fontSize:10, color:'#1D9E75', letterSpacing:2, marginBottom:14}}>RECENT SIGNUPS</div>
                {(data?.recentUsers||[]).slice(0,8).map((u,i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <span style={{fontSize:12, color:'#c8d8e8'}}>{u.name||'Unknown'}</span>
                    <span style={{fontSize:11, color:'#5a7a9a', ...mono}}>{new Date(u.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." style={{width:'100%', padding:'11px 16px', borderRadius:10, border:'1px solid rgba(0,240,255,0.15)', background:'#070f1f', color:'#e8f4ff', fontSize:14, outline:'none', marginBottom:16, boxSizing:'border-box'}} />
            <div style={{...card, padding:0, overflow:'hidden'}}>
              {filtered.slice(0,60).map(u => (
                <div key={u.id} onClick={() => loadUser(u.id)} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,240,255,0.08)', marginBottom: 12, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#e8f4ff' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#5a7a9a', marginTop: 2 }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: u.plan === 'dominator' ? 'rgba(239,159,39,0.15)' : u.plan === 'performer' ? 'rgba(123,92,255,0.15)' : u.plan === 'player' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', color: u.plan === 'dominator' ? '#EF9F27' : u.plan === 'performer' ? '#7b5cff' : u.plan === 'player' ? '#00f0ff' : '#5a7a9a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, textTransform: 'uppercase' }}>{u.plan}</span>
                      {u.isOnTrial && <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>TRIAL {u.trialDaysLeft}d</span>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>COLLEGE</div><div style={{ fontSize: 13, color: '#e8f4ff' }}>{u.college}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>YEAR</div><div style={{ fontSize: 13, color: '#e8f4ff' }}>{u.year}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>DOMAIN</div><div style={{ fontSize: 13, color: '#e8f4ff' }}>{u.domain}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>SCORE</div><div style={{ fontSize: 13, color: '#7b5cff', fontWeight: 700 }}>{u.score}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>DAY</div><div style={{ fontSize: 13, color: '#1D9E75' }}>{u.day}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>STREAK</div><div style={{ fontSize: 13, color: '#EF9F27' }}>{u.streak}d</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>LAST ACTIVE</div><div style={{ fontSize: 13, color: u.lastActiveDays > 7 ? '#ff2d78' : '#e8f4ff' }}>{u.lastActiveDays !== null ? u.lastActiveDays + 'd ago' : 'Never'}</div></div>
                    <div><div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>JOINED</div><div style={{ fontSize: 13, color: '#e8f4ff' }}>{new Date(u.joined).toLocaleDateString()}</div></div>
                  </div>
                  <div style={{ fontSize: 10, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    ID: {u.id} · Hash: {u.passwordHashPreview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP STUDENTS */}
        {tab === 'top' && (
          <div>
            <div style={{...mono, fontSize:11, color:'#5a7a9a', letterSpacing:2, marginBottom:14}}>TOP 20 STUDENTS BY SCORE</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {(data?.topStudents||[]).map((u,i) => (
                <div key={i} onClick={() => loadUser(u.id)} style={{...card, border:`1px solid ${i<3?'rgba(239,159,39,0.2)':'rgba(255,255,255,0.04)'}`, display:'flex', alignItems:'center', gap:14, cursor:'pointer', flexWrap:'wrap'}}>
                  <div style={{width:32, height:32, borderRadius:8, background:i===0?'#EF9F27':i===1?'#888':i===2?'#D85A30':'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:i<3?'#020812':'#5a7a9a', flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1, minWidth:140}}>
                    <div style={{fontSize:14, fontWeight:600, color:'#e8f4ff'}}>{u.name}</div>
                    <div style={{fontSize:11, color:'#5a7a9a'}}>{u.email} · {u.subscription_plan||'free'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#EF9F27'}}>{u.score} pts</div>
                    <div style={{fontSize:11, color:'#5a7a9a', ...mono}}>Day {u.currentDay} · {u.streak}🔥</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INACTIVE */}
        {tab === 'inactive' && (
          <div>
            <div style={{...mono, fontSize:11, color:'#ff2d78', letterSpacing:2, marginBottom:14}}>INACTIVE USERS — 7+ DAYS</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {(data?.inactiveUsers||[]).map((u,i) => (
                <div key={i} onClick={() => loadUser(u.id)} style={{...card, border:'1px solid rgba(255,45,120,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, cursor:'pointer'}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:600, color:'#e8f4ff'}}>{u.name||'Unknown'}</div>
                    <div style={{fontSize:11, color:'#5a7a9a'}}>{u.email}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11, color:'#ff2d78', ...mono}}>Last: {u.lastActive ? new Date(u.lastActive).toLocaleDateString('en-IN') : 'Never'}</div>
                    <div style={{fontSize:11, color:'#5a7a9a'}}>Score: {u.score} · Day {u.currentDay}</div>
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
                {label:'Total Revenue', value:'₹'+(data?.overview?.totalRevenue||0).toLocaleString(), color:'#1D9E75'},
                {label:'Paid Users', value:Object.entries(data?.planBreakdown||{}).filter(([k])=>k!=='spectator'&&k!=='free').reduce((s,[,v])=>s+v,0), color:'#00f0ff'},
              ].map(s => (
                <div key={s.label} style={{...card, textAlign:'center', border:`1px solid ${s.color}20`}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11, color:'#5a7a9a', marginTop:4, ...mono}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{...card, padding:0, overflow:'hidden'}}>
              <div style={{padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', ...mono, fontSize:10, color:'#1D9E75', letterSpacing:2}}>RECENT SUBSCRIPTIONS</div>
              {(data?.recentPayments||[]).length===0
                ? <div style={{padding:32, textAlign:'center', color:'#5a7a9a', fontSize:13}}>No payments yet</div>
                : (data?.recentPayments||[]).map((p,i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.02)', flexWrap:'wrap', gap:8}}>
                    <div>
                      <div style={{fontSize:13, color:'#e8f4ff', textTransform:'capitalize'}}>{p.plan||'Unknown'}</div>
                      <div style={{fontSize:11, color:'#5a7a9a', ...mono}}>{p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-IN') : '—'}</div>
                    </div>
                    <div style={{fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#1D9E75'}}>₹{p.amount||0}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* USER DETAIL */}
        {tab === 'user_detail' && userDetail && (
          <div>
            <button onClick={() => setTab('users')} style={{background:'transparent', border:'none', color:'#00f0ff', cursor:'pointer', fontSize:13, fontFamily:'Syne,sans-serif', fontWeight:600, marginBottom:16}}>← Back to Users</button>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16}}>
              <div style={{...card, border:'1px solid rgba(0,240,255,0.1)'}}>
                <div style={{...mono, fontSize:10, color:'#00f0ff', letterSpacing:2, marginBottom:14}}>STUDENT PROFILE</div>
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
                  <div key={label} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <span style={{fontSize:12, color:'#5a7a9a', ...mono}}>{label}</span>
                    <span style={{fontSize:12, color:'#e8f4ff', fontWeight:600}}>{val||'N/A'}</span>
                  </div>
                ))}
                
                {userDetail.user && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                    <button onClick={() => extendTrial(userDetail.user.id, 30)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(29,158,117,0.3)', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', cursor: 'pointer', fontSize: 12 }}>
                      +30 days trial
                    </button>
                    <button onClick={() => extendTrial(userDetail.user.id, 7)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.3)', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', cursor: 'pointer', fontSize: 12 }}>
                      +7 days trial
                    </button>
                    <button onClick={() => revokeTrial(userDetail.user.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,45,120,0.3)', background: 'rgba(255,45,120,0.1)', color: '#ff2d78', cursor: 'pointer', fontSize: 12 }}>
                      Revoke trial
                    </button>
                    <select onChange={(e) => setPlan(userDetail.user.id, e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: '#e8f4ff', fontSize: 12 }}>
                      <option value="">Set plan...</option>
                      <option value="spectator">Spectator (free)</option>
                      <option value="player">Player (₹99)</option>
                      <option value="performer">Performer (₹199)</option>
                      <option value="dominator">Dominator (₹499)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{...card, border:'1px solid rgba(239,159,39,0.1)'}}>
                <div style={{...mono, fontSize:10, color:'#EF9F27', letterSpacing:2, marginBottom:14}}>APTITUDE HISTORY</div>
                {!userDetail.aptitudeSessions?.length
                  ? <div style={{color:'#5a7a9a', fontSize:13}}>No sessions yet</div>
                  : userDetail.aptitudeSessions.map((s,i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <span style={{fontSize:12, color:'#c8d8e8'}}>{s.topic||'Session'}</span>
                      <span style={{fontSize:12, color:'#EF9F27', fontWeight:700}}>{s.score}%</span>
                    </div>
                  ))
                }
              </div>

              <div style={{...card, border:'1px solid rgba(255,45,120,0.1)'}}>
                <div style={{...mono, fontSize:10, color:'#ff2d78', letterSpacing:2, marginBottom:14}}>INTERVIEW HISTORY</div>
                {!userDetail.interviewSessions?.length
                  ? <div style={{color:'#5a7a9a', fontSize:13}}>No interviews yet</div>
                  : userDetail.interviewSessions.map((s,i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <span style={{fontSize:12, color:'#c8d8e8'}}>{s.company_name||'Unknown'}</span>
                      <span style={{fontSize:12, color:s.verdict==='SELECTED'?'#1D9E75':'#ff2d78', fontWeight:700}}>{s.verdict||'Incomplete'}</span>
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
