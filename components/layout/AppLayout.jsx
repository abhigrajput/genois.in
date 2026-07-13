'use client';
import { useState, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import DailyCheckIn from '@/components/DailyCheckIn';
import {
  Home, Calendar, FileText, Map, Code2, Play, Bot, Mic, Zap, User, Rocket,
  Flame, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, FolderGit2, Brain,
} from 'lucide-react';

// GENOIS design system — green is the established brand accent used across all app pages.
const G = '#00d9a3';
const G10 = 'rgba(0,217,163,0.1)';
const G20 = 'rgba(0,217,163,0.2)';
const AMBER = '#ffb020';
const SB_BG = '#0a0a0f';

// The 13 nav items — grouped visually in the sidebar (MAIN / LEARN / PRACTICE / ACCOUNT).
const NAV_ITEMS = [
  { group: 'MAIN',     href:'/dashboard',       label:'Dashboard',       icon:Home },
  { group: 'LEARN',    href:'/roadmap',         label:'Daily Roadmap',   icon:Calendar },
  { group: 'LEARN',    href:'/notes',           label:'AI Notes',        icon:FileText },
  { group: 'LEARN',    href:'/dsa-roadmap',     label:'DSA Roadmap',     icon:Map },
  { group: 'LEARN',    href:'/aptitude',        label:'Aptitude',        icon:Brain },
  { group: 'PRACTICE', href:'/coding',          label:'Coding',          icon:Code2 },
  { group: 'PRACTICE', href:'/dsa-visualizer',  label:'DSA Visualizer',  icon:Play },
  { group: 'PRACTICE', href:'/projects',        label:'Projects',        icon:FolderGit2 },
  { group: 'PRACTICE', href:'/chatbot',         label:'AI Mentor',       icon:Bot },
  { group: 'PRACTICE', href:'/voice-interview', label:'Voice Interview', icon:Mic },
  { group: 'PRACTICE', href:'/ai-vs-human',     label:'AI vs Human',     icon:Zap },
  { group: 'ACCOUNT',  href:'/profile',         label:'Profile',         icon:User },
  { group: 'ACCOUNT',  href:'/subscription',    label:'Beta Access',     icon:Rocket },
];

const DOMAIN_LABELS = {
  fullstack:'Full Stack', dsa:'DSA', aiml:'AI/ML', datascience:'Data Science',
  cybersecurity:'Cyber', devops:'DevOps', android:'Mobile', systemdesign:'Sys Design',
  blockchain:'Blockchain', gamedev:'Game Dev',
};

const GROUPS = ['LEARN', 'PRACTICE', 'ACCOUNT'];

// Hover/active states are pure CSS (group-hover / active classes) so hovering a link
// never triggers a React re-render. memo() keeps items static across header state changes.
const NavItem = memo(function NavItem({ href, label, icon: Icon, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{ fontFamily: 'var(--font-body)' }}
      className={[
        'group relative mb-px flex items-center overflow-hidden rounded-lg border-l-4 text-xs',
        'transition-colors duration-150',
        collapsed ? 'justify-center gap-0 px-0 py-2.5' : 'justify-start gap-2.5 px-3 py-2',
        active
          ? 'border-[#00d9a3] bg-[rgba(0,217,163,0.08)] font-semibold text-[#00d9a3]'
          : 'border-transparent font-normal text-[#6b7a8d] hover:bg-[rgba(0,217,163,0.04)] hover:text-[#c0c0c0]',
      ].join(' ')}
    >
      <span
        className={[
          'flex w-[18px] shrink-0 items-center justify-center',
          active ? 'text-[#00d9a3]' : 'text-[#6b7280] group-hover:text-[#2ee6b0]',
        ].join(' ')}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>
      {!collapsed && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
      )}
    </Link>
  );
});

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, progress, score, isAuthenticated, logout, setAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [checking, setChecking] = useState(!isAuthenticated);
  const [navToken, setNavToken] = useState(null);

  // Init from localStorage (token + persisted collapse preference).
  useEffect(() => {
    setNavToken(localStorage.getItem('genois_token'));
    setCollapsed(localStorage.getItem('genois_sidebar_collapsed') === 'true');
  }, []);

  // Track the md breakpoint (768px) only to gate desktop-specific *content* (collapse look
  // + which toggle behaviour applies). Layout/positioning itself is handled purely by CSS
  // `md:` classes, so there is no hydration flash or runtime reflow on resize.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Close the mobile drawer whenever the route changes (no-op on desktop where CSS forces it open).
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Auth gate — runs once on mount.
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
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('genois_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('genois_plan');
    document.cookie = 'genois_token=; path=/; max-age=0';
    router.push('/login');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="genois-loading" style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800 }}>
            <span style={{ color: G }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#444', marginTop: 8, letterSpacing: 2 }}>LOADING...</div>
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

  // Collapse is a desktop-only affordance — never render the icon-only look inside the mobile drawer.
  const showCollapsed = collapsed && isDesktop;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Matrix grid bg */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(0,217,163,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,217,163,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
      />

      {/* Mobile overlay — fades in behind the drawer, hidden entirely on desktop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — fixed off-canvas drawer below md, in-flow static column at md+ */}
      <aside
        style={{ background: SB_BG, borderRight: '1px solid rgba(0,217,163,0.08)' }}
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col overflow-hidden',
          'transition-[transform,width] duration-300 ease-in-out md:duration-200',
          'md:static md:z-auto md:h-full md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-[68px]' : 'md:w-[240px]',
        ].join(' ')}
      >
        {/* TOP: Logo + toggle */}
        <div className={`flex flex-shrink-0 items-center ${showCollapsed ? 'justify-center px-0 pb-3 pt-4' : 'justify-between px-3.5 pb-3 pt-4'}`}>
          {!showCollapsed && (
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
              <span style={{ color: G }}>GEN</span><span style={{ color: '#e8e8ed' }}>OIS</span>
            </div>
          )}
          {/* Mobile: close drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center rounded-md p-1 leading-none text-[#555] transition-colors hover:text-[#00d9a3] md:hidden"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={2} />
          </button>
          {/* Desktop: collapse/expand */}
          <button
            onClick={toggleCollapsed}
            className="hidden items-center rounded-md p-1 leading-none text-[#555] transition-colors hover:text-[#00d9a3] md:flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.8} /> : <PanelLeftClose size={18} strokeWidth={1.8} />}
          </button>
        </div>

        {/* USER CARD */}
        <div className={`mb-1 flex-shrink-0 ${showCollapsed ? 'px-0 py-2' : 'px-3.5 py-2'}`}>
          <div className={`flex items-center ${showCollapsed ? 'justify-center gap-0' : 'justify-start gap-2.5'}`}>
            {/* Avatar */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${streak > 0 ? 'pulse-amber' : ''}`}
              style={{ background: 'linear-gradient(135deg, rgba(0,217,163,0.35), rgba(46,230,176,0.12))', border: `2px solid ${G}55`, fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 800, color: G }}
            >
              {initials}
            </div>
            {!showCollapsed && (
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#e8e8ed' }}>{user?.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span style={{ padding: '1px 7px', borderRadius: 20, background: G10, border: `1px solid ${G20}`, fontSize: 9, color: G, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{domainLabel}</span>
                  <span className="inline-flex items-center gap-[3px]" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#555' }}>D{currentDay} · <Flame size={10} strokeWidth={2} color={AMBER} />{streak}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2">
          {/* Dashboard — always first, no group label */}
          {NAV_ITEMS.filter(n => n.group === 'MAIN').map(n => (
            <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={showCollapsed} />
          ))}

          {GROUPS.map(group => (
            <div key={group}>
              {!showCollapsed
                ? <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#333', letterSpacing: 2, padding: '10px 8px 4px', fontWeight: 600 }}>{group}</div>
                : <div className="h-2" />}
              {NAV_ITEMS.filter(n => n.group === group).map(n => (
                <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={showCollapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* SCORE BAR + LOGOUT (bottom) */}
        <div className={`flex-shrink-0 ${showCollapsed ? 'px-2 py-3' : 'px-3.5 py-3'}`} style={{ borderTop: '1px solid rgba(0,217,163,0.06)' }}>
          {!showCollapsed ? (
            <>
              <div className="mb-1.5 flex items-center">
                <span className="inline-flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: G }}><Zap size={13} strokeWidth={2} color={G} /> {totalScore.toLocaleString()} pts</span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-sm" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (weeklyPts / 500) * 100)}%`, background: `linear-gradient(90deg, ${G}, #2ee6b0)`, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#333', marginTop: 4, marginBottom: 10 }}>weekly progress</div>
            </>
          ) : (
            <div className="mb-2.5 flex flex-col items-center">
              <Zap size={14} strokeWidth={2} color={G} />
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ fontFamily: 'var(--font-body)' }}
            className={[
              'flex w-full items-center gap-2 rounded-lg text-[13px] text-[#6b7280]',
              'transition-colors duration-150 hover:bg-[rgba(239,68,68,0.08)] hover:text-[#ef4444]',
              showCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start px-3.5 py-2.5',
            ].join(' ')}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!showCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-12 flex-shrink-0 items-center gap-2.5 px-4 backdrop-blur-xl"
          style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(0,217,163,0.07)' }}
        >
          {/* Mobile: open drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-shrink-0 items-center p-1 leading-none text-[#555] transition-colors hover:text-[#00d9a3] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          {/* Desktop: collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden flex-shrink-0 items-center p-1 leading-none text-[#555] transition-colors hover:text-[#00d9a3] md:flex"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#444', letterSpacing: 1 }}>
            {pathname.replace(/^\//, '').toUpperCase() || 'DASHBOARD'}
          </span>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(251,191,36,0.1)', color: AMBER, padding: '3px 8px', borderRadius: 20 }}><Flame size={12} strokeWidth={2} color={AMBER} /> {streak}</span>
            <span className="inline-flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,217,163,0.08)', color: G, padding: '3px 8px', borderRadius: 20 }}><Zap size={12} strokeWidth={2} color={G} /> {totalScore.toLocaleString()}</span>
            <div className="relative z-[9999]">
              <NotificationBell token={navToken} />
            </div>
          </div>
        </header>

        <main
          className="page-fade min-w-0 flex-1 overflow-y-auto p-4 md:p-6"
          style={{ paddingBottom: isDesktop ? 'calc(40px + env(safe-area-inset-bottom))' : 'calc(96px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>

        {/* Floating daily check-in — logged-in users only */}
        {(isAuthenticated || user) && <DailyCheckIn name={user?.name} />}
      </div>
    </div>
  );
}
