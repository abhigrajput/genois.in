'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      { href:'/dashboard', label:'Dashboard', icon:'▦', color:'#7F77DD' },
      { href:'/roadmap', label:'Daily Roadmap', icon:'◈', color:'#1D9E75' },
      { href:'/custom-roadmap', label:'Custom Roadmap', icon:'🗺️', color:'#1D9E75' },
    ]
  },
  {
    label: 'LEARN',
    items: [
      { href:'/tests', label:'Tests', icon:'✎', color:'#D4537E' },
      { href:'/coding', label:'Coding', icon:'{}', color:'#1D9E75' },
      { href:'/projects', label:'Projects', icon:'◆', color:'#BA7517' },
      { href:'/notes', label:'AI Notes', icon:'≡', color:'#378ADD' },
      { href:'/aptitude', label:'Aptitude', icon:'🧠', color:'#7b5cff' },
      { href:'/dsa-guide', label:'DSA Guide', icon:'📘', color:'#378ADD' },
      { href:'/dsa-roadmap', label:'DSA Roadmap', icon:'📘', color:'#7F77DD' },
    ]
  },
  {
    label: 'AI TOOLS',
    items: [
      { href:'/mentor', label:'AI Mentor', icon:'◉', color:'#D85A30' },
      { href:'/chatbot', label:'Chatbot', icon:'○', color:'#378ADD' },
      { href:'/anxiety', label:'2AM Chat', icon:'🌙', color:'#7b5cff' },
    ]
  },
  {
    label: 'COMPETE',
    items: [
      { href:'/leaderboard', label:'Leaderboard', icon:'🏆', color:'#EF9F27' },
      { href:'/duels', label:'Duels', icon:'⚔️', color:'#ff2d78' },
      { href:'/rival', label:'Your Rival', icon:'🎯', color:'#ff2d78' },
      { href:'/college-war', label:'College War', icon:'⚔️', color:'#EF9F27' },
      { href:'/confessions', label:'Confession Wall', icon:'🤫', color:'#7b5cff' },
      { href:'/shame-board', label:'Shame Board', icon:'😴', color:'#ff2d78' },
      { href:'/graveyard', label:'Graveyard', icon:'☠️', color:'#ff2d78' },
    ]
  },
  {
    label: 'GROW',
    items: [
      { href:'/github', label:'GitHub Profile', icon:'🐙', color:'#e8f4ff' },
      { href:'/rank-card', label:'Rank Card', icon:'🎴', color:'#EF9F27' },
      { href:'/glow-up', label:'Glow Up Card', icon:'🔥', color:'#D85A30' },
      { href:'/certificate', label:'Certificate', icon:'🎓', color:'#EF9F27' },
      { href:'/linkedin-badge', label:'LinkedIn Badge', icon:'💼', color:'#0077B5' },
      { href:'/referral', label:'Refer and Earn', icon:'🎁', color:'#1D9E75' },
    ]
  },
  {
    label: 'CAREER',
    items: [
      { href:'/mock-interview', label:'Mock Interview', icon:'🎤', color:'#1D9E75' },
      { href:'/challenges', label:'Company Challenges', icon:'🏢', color:'#378ADD' },
      { href:'/prep-packs', label:'Company Prep', icon:'📦', color:'#378ADD' },
      { href:'/mentors', label:'1-on-1 Mentors', icon:'🎓', color:'#1D9E75' },
      { href:'/auction', label:'Skill Auction', icon:'⚡', color:'#EF9F27' },
      { href:'/interview-simulator', label:'Interview Simulator', icon:'🎯', color:'#ff2d78' },
    ]
  },
  {
    label: 'ANALYTICS',
    items: [
      { href:'/diagnostic', label:'Diagnostic Test', icon:'🎯', color:'#00f0ff' },
      { href:'/analytics', label:'Analytics', icon:'◇', color:'#7F77DD' },
      { href:'/skill-levels', label:'Skill Levels', icon:'📊', color:'#EF9F27' },
      { href:'/skills', label:'Mastery Trials', icon:'⚒️', color:'#D85A30' },
      { href:'/outcomes', label:'Outcomes', icon:'📊', color:'#1D9E75' },
      { href:'/profile', label:'Profile', icon:'▣', color:'#5a7a9a' },
    ]
  },
  {
    label: 'ACCOUNT',
    items: [
      { href:'/subscription', label:'Subscription', icon:'⭐', color:'#EF9F27' },
      { href:'/legend', label:'Legend Access', icon:'👑', color:'#7b5cff' },
    ]
  },
];

const DOMAIN_MAP = {
  fullstack:{label:'Full Stack',icon:'⬡',color:'#7F77DD'},
  dsa:{label:'DSA',icon:'◈',color:'#1D9E75'},
  ml:{label:'Machine Learning',icon:'◉',color:'#D85A30'},
  ai:{label:'AI',icon:'◎',color:'#BA7517'},
  ds:{label:'Data Science',icon:'◇',color:'#378ADD'},
  cybersec:{label:'Cybersecurity',icon:'◆',color:'#D4537E'},
  cloud:{label:'Cloud',icon:'○',color:'#639922'},
  mobile:{label:'Mobile',icon:'▣',color:'#E24B4A'},
  devops:{label:'Devops',icon:'▷',color:'#888780'},
  sysdesign:{label:'System Design',icon:'▦',color:'#534AB7'},
};

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, progress, score, isAuthenticated, logout, setAuth } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checking, setChecking] = useState(!isAuthenticated);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navToken, setNavToken] = useState(null);

  useEffect(() => { setNavToken(localStorage.getItem('genois_token')); }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('genois_token')
      : null;

    if (!isAuthenticated && !token) {
      router.push('/login');
      return;
    }

    if (!isAuthenticated && token) {
      authAPI.getProfile()
        .then(res => {
          setAuth(
            res.data.user,
            token,
            res.data.progress,
            res.data.score,
            res.data.skill
          );
          setChecking(false);
        })
        .catch(() => {
          localStorage.removeItem('genois_token');
          router.push('/login');
        });
    } else {
      setChecking(false);
    }
  }, []);

  // Load notifications
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('genois_token') : null;
    if (!t) return;
    fetch('/api/notifications', {
      headers: { Authorization: 'Bearer ' + t }
    }).then(r => r.json()).then(d => {
      const notifs = d.data?.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  if (checking) {
    return (
      <div style={{minHeight:'100vh',background:'#020812',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <div className="genois-loading" style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:800}}>
            <span style={{color:'#00f0ff'}}>GEN</span><span style={{color:'#e8f4ff'}}>OIS</span>
          </div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#5a7a9a',marginTop:8,letterSpacing:2}}>LOADING...</div>
        </div>
      </div>
    );
  }

  const domain = DOMAIN_MAP[user?.domain_slug] || DOMAIN_MAP.fullstack;
  const currentDay = progress?.current_day || 1;
  const progressPercent = Math.round(progress?.progress_percent || 0);
  const streak = progress?.streak || 0;
  const totalScore = score?.total_score || 0;

  return (
    <div style={{display:'flex',height:'100vh',background:'#020812',overflow:'hidden',position:'relative'}}>

      {/* Grid background */}
      <div style={{
        position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(0,240,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.025) 1px,transparent 1px)',
        backgroundSize:'60px 60px',
      }}/>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:40}}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'relative',
          left: 0,
          top: 0,
          bottom: 0,
          width: 240,
          zIndex: 50,
          flexShrink: 0,
          display: sidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          background: 'rgba(6,15,30,0.98)',
          borderRight: '1px solid rgba(0,240,255,0.1)',
          backdropFilter: 'blur(20px)',
          overflowY: 'auto',
          height: isMobile ? '100%' : 'auto',
        }}
      >
        <div style={{padding:'20px 16px 12px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,letterSpacing:-1}}>
              <span style={{color:'#00f0ff'}}>GEN</span><span style={{color:'#e8f4ff'}}>OIS</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{background:'transparent',border:'none',color:'#5a7a9a',fontSize:20,cursor:'pointer',padding:4}}
            >✕</button>
          </div>
          <div style={{
            padding:'10px 12px',borderRadius:10,
            background:domain.color+'0f',
            border:`1px solid ${domain.color}25`,
          }}>
            <div style={{fontSize:18,marginBottom:4}}>{domain.icon}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,color:domain.color}}>{domain.label}</div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'#5a7a9a',marginTop:3}}>
              Day {currentDay} · {progressPercent}%
            </div>
            <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',marginTop:8,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${progressPercent}%`,background:`linear-gradient(90deg,${domain.color},#00f0ff)`,borderRadius:2}}/>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:'0 8px'}}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              <div style={{
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: 9,
                color: '#2a3a4a',
                letterSpacing: 2,
                padding: '8px 12px 4px',
                fontWeight: 600,
              }}>
                {group.label}
              </div>
              {group.items.map(n => {
                const active = pathname === n.href;
                return (
                  <Link key={n.href} href={n.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, marginBottom: 1,
                    fontSize: 12, fontWeight: active ? 500 : 400,
                    background: active ? `${n.color}12` : 'transparent',
                    color: active ? n.color : '#5a7a9a',
                    borderLeft: active ? `2px solid ${n.color}` : '2px solid transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                    fontFamily: 'Outfit,sans-serif',
                  }}>
                    <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
                    {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(0,240,255,0.08)'}}>
          <div style={{fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:500,color:'#e8f4ff',marginBottom:2}}>{user?.name}</div>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'#5a7a9a',marginBottom:10}}>{user?.email}</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#EF9F27',background:'rgba(186,117,23,0.12)',padding:'2px 8px',borderRadius:20}}>🔥 {streak}</span>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'#00f0ff',background:'rgba(0,240,255,0.08)',padding:'2px 8px',borderRadius:20}}>{totalScore} pts</span>
            <button onClick={() => { logout(); router.push('/login'); }} style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,color:'#5a7a9a',background:'transparent',border:'none',cursor:'pointer'}}>out</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <header style={{
          height:48,flexShrink:0,
          background:'rgba(6,15,30,0.9)',
          borderBottom:'1px solid rgba(0,240,255,0.08)',
          display:'flex',alignItems:'center',
          padding:'0 16px',gap:10,
          backdropFilter:'blur(20px)',
          overflow: 'visible',
        }}>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{
              background:'transparent',border:'none',
              color:'#5a7a9a',cursor:'pointer',
              fontSize:20,padding:4,flexShrink:0,
            }}>☰</button>
          <span style={{
            fontFamily:'JetBrains Mono,monospace',
            fontSize:10,color:'#5a7a9a',letterSpacing:1,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
          }}>
            {pathname.replace('/','').toUpperCase()||'DASHBOARD'}
          </span>
          <div style={{marginLeft:'auto',display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,background:'rgba(186,117,23,0.12)',color:'#EF9F27',padding:'3px 8px',borderRadius:20}}>🔥 {streak}</span>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:10,background:'rgba(0,240,255,0.08)',color:'#00f0ff',padding:'3px 8px',borderRadius:20}}>{totalScore} pts</span>
            {/* Notification Bell */}
            <div style={{ position: 'relative', zIndex: 9999 }}>
              <NotificationBell token={navToken} />
            </div>
          </div>
        </header>

        <main style={{flex: 1, minWidth: 0, width: '100%', overflowY: 'auto', padding: '24px'}} className="page-fade">
          {children}
        </main>
      </div>
    </div>
  );
}
