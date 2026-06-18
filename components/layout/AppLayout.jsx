'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import DailyCheckIn from '@/components/DailyCheckIn';
import {
  Home, Calendar, FileText, Map, Code2, Play, Bot, Mic, Zap, User, CreditCard,
  Flame, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, FolderGit2,
} from 'lucide-react';

const G = '#6366f1';
const G10 = 'rgba(99,102,241,0.1)';
const G20 = 'rgba(99,102,241,0.2)';
const G08 = 'rgba(99,102,241,0.08)';
const G04 = 'rgba(99,102,241,0.04)';
const AMBER = '#fbbf24';
const SB_BG = '#0a0a14';

// The 11 working features — grouped visually in the sidebar.
const NAV_ITEMS = [
  { group: 'MAIN',     href:'/dashboard',       label:'Dashboard',       icon:Home },
  { group: 'LEARN',    href:'/roadmap',         label:'Daily Roadmap',   icon:Calendar },
  { group: 'LEARN',    href:'/notes',           label:'AI Notes',        icon:FileText },
  { group: 'LEARN',    href:'/dsa-roadmap',     label:'DSA Roadmap',     icon:Map },
  { group: 'PRACTICE', href:'/coding',          label:'Coding',          icon:Code2 },
  { group: 'PRACTICE', href:'/dsa-visualizer',  label:'DSA Visualizer',  icon:Play },
  { group: 'PRACTICE', href:'/projects',        label:'Projects',        icon:FolderGit2 },
  { group: 'PRACTICE', href:'/chatbot',         label:'AI Mentor',       icon:Bot },
  { group: 'PRACTICE', href:'/voice-interview', label:'Voice Interview', icon:Mic },
  { group: 'PRACTICE', href:'/ai-vs-human',     label:'AI vs Human',     icon:Zap },
  { group: 'ACCOUNT',  href:'/profile',         label:'Profile',         icon:User },
  { group: 'ACCOUNT',  href:'/subscription',    label:'Subscription',    icon:CreditCard },
];

const DOMAIN_LABELS = {
  fullstack:'Full Stack', dsa:'DSA', aiml:'AI/ML', datascience:'Data Science',
  cybersecurity:'Cyber', devops:'DevOps', android:'Mobile', systemdesign:'Sys Design',
  blockchain:'Blockchain', gamedev:'Game Dev',
};

function NavItem({ href, label, icon: Icon, active, collapsed }) {
  const [hover, setHover] = useState(false);
  const iconColor = active ? G : hover ? '#818cf8' : '#6b7280';
  return (
    <Link href={href} title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        padding: collapsed ? '10px 0' : '8px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8, marginBottom: 1,
        fontSize: 12, fontWeight: active ? 600 : 400,
        background: active ? G08 : hover ? G04 : 'transparent',
        color: active ? G : hover ? '#c0c0c0' : '#6b7a8d',
        borderLeft: active ? `3px solid ${G}` : '3px solid transparent',
        textDecoration: 'none', transition: 'all 0.15s',
        fontFamily: 'Outfit,sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} strokeWidth={1.8} color={iconColor} />
      </span>
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
    </Link>
  );
}

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, progress, score, isAuthenticated, logout, setAuth } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [checking, setChecking] = useState(!isAuthenticated);
  const [navToken, setNavToken] = useState(null);

  // Init from localStorage
  useEffect(() => {
    const t = localStorage.getItem('genois_token');
    setNavToken(t);
    const savedCollapsed = localStorage.getItem('genois_sidebar_collapsed') === 'true';
    setCollapsed(savedCollapsed);
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  // Auth check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('genois_token') : null;
    if (!isAuthenticated && !token) { router.push('/login'); return; }
    if (!isAuthenticated && token) {
      authAPI.getProfile()
        .then(res => { setAuth(res.data.user, token, res.data.progress, res.data.score, res.data.skill); setChecking(false); })
        .catch(() => { localStorage.removeItem('genois_token'); router.push('/login'); });
    } else { setChecking(false); }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('genois_sidebar_collapsed', String(next));
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="genois-loading" style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800 }}>
            <span style={{ color: G }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#444', marginTop: 8, letterSpacing: 2 }}>LOADING...</div>
        </div>
      </div>
    );
  }

  const domainLabel = DOMAIN_LABELS[user?.domain_slug] || user?.domain_slug?.toUpperCase() || 'DSA';
  const currentDay = progress?.current_day || progress?.currentDay || 1;
  const streak = progress?.streak || 0;
  const totalScore = score?.total_score || 0;
  const weeklyPts = score?.weekly_score || Math.min(totalScore, 500);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'GN';

  const sbWidth = isMobile ? 240 : (collapsed ? 68 : 240);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d0d14', overflow: 'hidden', position: 'relative' }}>
      {/* Matrix grid bg */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,102,241,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 40 }} />
      )}

      {/* SIDEBAR */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        left: 0, top: 0, bottom: 0,
        width: sbWidth,
        zIndex: 50,
        flexShrink: 0,
        display: isMobile ? (sidebarOpen ? 'flex' : 'none') : 'flex',
        flexDirection: 'column',
        background: SB_BG,
        borderRight: `1px solid rgba(99,102,241,0.08)`,
        overflowY: 'hidden',
        height: '100%',
        transition: 'width 0.2s ease',
      }}>

        {/* TOP: Logo + toggle */}
        <div style={{ padding: collapsed ? '16px 0 12px' : '16px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
              <span style={{ color: G }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
            </div>
          )}
          <button onClick={isMobile ? () => setSidebarOpen(false) : toggleCollapsed}
            style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s', lineHeight: 0, display: 'flex', alignItems: 'center' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {isMobile ? <X size={18} strokeWidth={2} /> : (collapsed ? <PanelLeftOpen size={18} strokeWidth={1.8} /> : <PanelLeftClose size={18} strokeWidth={1.8} />)}
          </button>
        </div>

        {/* USER CARD */}
        <div style={{ padding: collapsed ? '8px 0' : '8px 14px', marginBottom: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            {/* Avatar */}
            <div className={streak > 0 ? 'pulse-amber' : ''}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(129,140,248,0.12))', border: `2px solid ${G}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 800, color: G, flexShrink: 0 }}>
              {initials}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, color: '#e8f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ padding: '1px 7px', borderRadius: 20, background: G10, border: `1px solid ${G20}`, fontSize: 9, color: G, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{domainLabel}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#555' }}>D{currentDay} · <Flame size={10} strokeWidth={2} color={AMBER} />{streak}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Dashboard — always first, no group label */}
          {NAV_ITEMS.filter(n => n.group === 'MAIN').map(n => (
            <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={collapsed} />
          ))}

          {['LEARN', 'PRACTICE', 'ACCOUNT'].map(group => (
            <div key={group}>
              {!collapsed
                ? <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#333', letterSpacing: 2, padding: '10px 8px 4px', fontWeight: 600 }}>{group}</div>
                : <div style={{ height: 8 }} />}
              {NAV_ITEMS.filter(n => n.group === group).map(n => (
                <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* SCORE BAR (bottom) */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderTop: '1px solid rgba(99,102,241,0.06)', flexShrink: 0 }}>
          {!collapsed && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: G }}><Zap size={13} strokeWidth={2} color={G} /> {totalScore.toLocaleString()} pts</span>
                <button onClick={() => { logout(); router.push('/login'); }} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e8f4ff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                  logout
                </button>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (weeklyPts / 500) * 100)}%`, background: `linear-gradient(90deg, ${G}, #818cf8)`, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: '#333', marginTop: 4 }}>weekly progress</div>
            </>
          )}
          {collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Zap size={14} strokeWidth={2} color={G} />
              <button onClick={() => { logout(); router.push('/login'); }} style={{ background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', padding: 0, lineHeight: 0, display: 'flex' }} title="Logout">
                <LogOut size={14} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ height: 48, flexShrink: 0, background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(99,102,241,0.07)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, backdropFilter: 'blur(20px)', overflow: 'visible' }}>
          <button onClick={() => { if (isMobile) setSidebarOpen(s => !s); else toggleCollapsed(); }}
            style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 4, flexShrink: 0, lineHeight: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = G}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}>
            <Menu size={20} strokeWidth={2} />
          </button>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#444', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pathname.replace(/^\//, '').toUpperCase() || 'DASHBOARD'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, background: 'rgba(251,191,36,0.1)', color: AMBER, padding: '3px 8px', borderRadius: 20 }}><Flame size={12} strokeWidth={2} color={AMBER} /> {streak}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: 10, background: 'rgba(99,102,241,0.08)', color: G, padding: '3px 8px', borderRadius: 20 }}><Zap size={12} strokeWidth={2} color={G} /> {totalScore.toLocaleString()}</span>
            <div style={{ position: 'relative', zIndex: 9999 }}>
              <NotificationBell token={navToken} />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, width: '100%', overflowY: 'auto', padding: isMobile ? '16px 12px' : '24px' }} className="page-fade">
          {children}
        </main>

        {/* Floating daily check-in — logged-in users only */}
        {(isAuthenticated || user) && <DailyCheckIn name={user?.name} />}
      </div>
    </div>
  );
}
