'use client';
import { useState, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { authAPI } from '@/lib/api';
import { useToken } from '@/lib/useApi';
import NotificationBell from '@/components/NotificationBell';
import DailyCheckIn from '@/components/DailyCheckIn';
import { Progress } from '@/components/ui';
import {
  Home, Calendar, FileText, Map, Code2, Play, Bot, Mic, Zap, User, Rocket,
  Flame, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, FolderGit2, Brain,
  ClipboardList, BarChart3, FileSearch, Target, Building2, Send,
} from 'lucide-react';

// Nav items — grouped visually in the sidebar (MAIN / LEARN / PRACTICE / APPLY / INSIGHTS / ACCOUNT).
const NAV_ITEMS = [
  { group: 'MAIN',     href:'/dashboard',       label:'Dashboard',       icon:Home },
  { group: 'LEARN',    href:'/roadmap',         label:'Daily Roadmap',   icon:Calendar },
  { group: 'LEARN',    href:'/notes',           label:'Notes',           icon:FileText },
  { group: 'LEARN',    href:'/dsa-roadmap',     label:'DSA Roadmap',     icon:Map },
  { group: 'LEARN',    href:'/aptitude',        label:'Aptitude',        icon:Brain },
  { group: 'LEARN',    href:'/resume',          label:'Resume ATS',      icon:FileSearch },
  { group: 'PRACTICE', href:'/coding',          label:'Coding',          icon:Code2 },
  { group: 'PRACTICE', href:'/dsa-visualizer',  label:'DSA Visualizer',  icon:Play },
  { group: 'PRACTICE', href:'/projects',        label:'Projects',        icon:FolderGit2 },
  { group: 'PRACTICE', href:'/chatbot',         label:'Mentor',          icon:Bot },
  { group: 'PRACTICE', href:'/voice-interview', label:'Voice Interview', icon:Mic },
  { group: 'PRACTICE', href:'/ai-vs-human',     label:'Your Edge',       icon:Zap },
  { group: 'PRACTICE', href:'/review',          label:'Answer Review',   icon:ClipboardList },
  // APPLY sits after PRACTICE and before INSIGHTS: it's the step the journey
  // reaches once prep is under way, not an analytics view of it.
  { group: 'APPLY',    href:'/apply',           label:'Where to Apply',  icon:Building2 },
  { group: 'APPLY',    href:'/applications',    label:'My Applications', icon:Send },
  { group: 'INSIGHTS', href:'/readiness',       label:'Readiness',       icon:Target },
  { group: 'INSIGHTS', href:'/analytics',       label:'Analytics',       icon:BarChart3 },
  { group: 'ACCOUNT',  href:'/profile',         label:'Profile',         icon:User },
  { group: 'ACCOUNT',  href:'/subscription',    label:'Beta Access',     icon:Rocket },
];

const DOMAIN_LABELS = {
  fullstack:'Full Stack', dsa:'DSA', aiml:'AI/ML', datascience:'Data Science',
  cybersecurity:'Cyber', devops:'DevOps', android:'Mobile', systemdesign:'Sys Design',
  blockchain:'Blockchain', gamedev:'Game Dev',
};

const GROUPS = ['LEARN', 'PRACTICE', 'APPLY', 'INSIGHTS', 'ACCOUNT'];

// Hover/active states are pure CSS (group-hover / active classes) so hovering a link
// never triggers a React re-render. memo() keeps items static across header state changes.
const NavItem = memo(function NavItem({ href, label, icon: Icon, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative mb-px flex items-center overflow-hidden rounded-md border-l-2 text-[13px]',
        'transition-colors duration-150',
        collapsed ? 'justify-center gap-0 px-0 py-2.5' : 'justify-start gap-2.5 px-3 py-2',
        active
          ? 'border-[var(--gx-accent)] bg-[var(--gx-accent-soft)] font-semibold text-[var(--gx-accent)]'
          : 'border-transparent font-normal text-[var(--gx-text-muted)] hover:bg-[var(--gx-surface-2)] hover:text-[var(--gx-text)]',
      ].join(' ')}
    >
      <span
        className={[
          'flex w-[18px] shrink-0 items-center justify-center',
          active ? 'text-[var(--gx-accent)]' : 'text-[var(--gx-text-subtle)] group-hover:text-[var(--gx-accent)]',
        ].join(' ')}
      >
        <Icon size={17} strokeWidth={1.8} />
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

  // The header's NotificationBell needs a token. Reading localStorage directly
  // handed it null for every cookie session, so the bell sent `Bearer null` and
  // 401'd on every page. useToken() yields the COOKIE_SESSION sentinel instead,
  // which authHeaders() resolves to "let the cookie do it".
  const { token: navToken } = useToken();

  // Persisted collapse preference.
  useEffect(() => {
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
    if (isAuthenticated) { setChecking(false); return; }

    // FIX P4 follow-up, mirroring lib/usePermission.js: the session lives in the
    // httpOnly `genois_token` cookie that JS cannot read, so treating a missing
    // localStorage token as "logged out" bounced cookie-authenticated users to
    // /login before the page mounted — ahead of usePermission's own cookie-first
    // fetch, which then never got the chance to run.
    //
    // Ask the server instead. authAPI sends the cookie with credentials:
    // 'include' and attaches the Bearer header only while a pre-migration token
    // still exists (lib/api.js), and getUserFromRequest accepts either
    // (lib/auth.js) — so no server change is needed. The cost is that a genuinely
    // logged-out visitor makes one /api/auth/profile call that 401s before the
    // redirect, the same trade already accepted in usePermission.
    //
    // This one stays a raw localStorage read on purpose — it is not a header,
    // it is the value handed to setAuth(), and setAuth writes any truthy token
    // straight back to localStorage. Feeding it useToken()'s COOKIE_SESSION
    // sentinel would persist the sentinel as if it were a real JWT, and every
    // later authHeaders() call would then send it as a Bearer token and 401.
    const token = typeof window !== 'undefined' ? localStorage.getItem('genois_token') : null;
    authAPI.getProfile()
      .then(res => { setAuth(res.data.user, token, res.data.progress, res.data.score, res.data.skill); setChecking(false); })
      .catch(() => { localStorage.removeItem('genois_token'); router.push('/login'); });
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
      <div className="gx-app flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="genois-loading" style={{ fontFamily: 'var(--gx-font-display)', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
          </div>
          <div className="gx-section-label" style={{ marginTop: 8 }}>Loading</div>
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
    <div className="gx-app relative flex h-screen overflow-hidden">
      {/* Mobile overlay — fades in behind the drawer, hidden entirely on desktop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(16,24,40,0.4)] md:hidden"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — fixed off-canvas drawer below md, in-flow static column at md+ */}
      <aside
        style={{ background: 'var(--gx-surface)', borderRight: '1px solid var(--gx-border)' }}
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
            <div style={{ fontFamily: 'var(--gx-font-display)', fontSize: 20, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
              <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span style={{ color: 'var(--gx-text)' }}>OIS</span>
            </div>
          )}
          {/* Mobile: close drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center rounded-md p-1 leading-none text-[var(--gx-text-subtle)] transition-colors hover:text-[var(--gx-text)] md:hidden"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={2} />
          </button>
          {/* Desktop: collapse/expand */}
          <button
            onClick={toggleCollapsed}
            className="hidden items-center rounded-md p-1 leading-none text-[var(--gx-text-subtle)] transition-colors hover:text-[var(--gx-text)] md:flex"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: 'var(--gx-accent-soft)',
                border: '1px solid var(--gx-accent-border)',
                fontFamily: 'var(--gx-font-display)',
                fontSize: 13, fontWeight: 700, color: 'var(--gx-accent)',
              }}
            >
              {initials}
            </div>
            {!showCollapsed && (
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gx-text)' }}>{user?.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="gx-badge gx-badge--accent">{domainLabel}</span>
                  <span className="gx-num inline-flex items-center gap-[3px]" style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>
                    D{currentDay} · <Flame size={10} strokeWidth={2} color="var(--gx-warning)" />{streak}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-1">
          {/* Dashboard — always first, no group label */}
          {NAV_ITEMS.filter(n => n.group === 'MAIN').map(n => (
            <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={showCollapsed} />
          ))}

          {GROUPS.map(group => (
            <div key={group}>
              {!showCollapsed
                ? <div className="gx-section-label" style={{ padding: '12px 8px 4px' }}>{group}</div>
                : <div className="mx-2 my-2 h-px" style={{ background: 'var(--gx-border)' }} />}
              {NAV_ITEMS.filter(n => n.group === group).map(n => (
                <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={pathname === n.href} collapsed={showCollapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* SCORE BAR + LOGOUT (bottom) */}
        <div className={`flex-shrink-0 ${showCollapsed ? 'px-2 py-3' : 'px-3.5 py-3'}`} style={{ borderTop: '1px solid var(--gx-border)' }}>
          {!showCollapsed ? (
            <>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="gx-num inline-flex items-center gap-1" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gx-text)' }}>
                  <Zap size={13} strokeWidth={2} color="var(--gx-accent)" /> {totalScore.toLocaleString()}
                </span>
                <span style={{ fontSize: 11, color: 'var(--gx-text-subtle)' }}>pts</span>
              </div>
              <Progress value={Math.min(weeklyPts, 500)} max={500} label="Weekly progress" style={{ height: 4 }} />
              <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', marginTop: 5, marginBottom: 10 }}>Weekly progress</div>
            </>
          ) : (
            <div className="mb-2.5 flex flex-col items-center">
              <Zap size={14} strokeWidth={2} color="var(--gx-accent)" />
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className={[
              'flex w-full items-center gap-2 rounded-md text-[13px] text-[var(--gx-text-muted)]',
              'transition-colors duration-150 hover:bg-[var(--gx-danger-soft)] hover:text-[var(--gx-danger)]',
              showCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start px-3 py-2.5',
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
          className="flex h-12 flex-shrink-0 items-center gap-2.5 px-4"
          style={{ background: 'var(--gx-bg)', borderBottom: '1px solid var(--gx-border)' }}
        >
          {/* Mobile: open drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-shrink-0 items-center p-1 leading-none text-[var(--gx-text-muted)] transition-colors hover:text-[var(--gx-text)] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          {/* Desktop: collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden flex-shrink-0 items-center p-1 leading-none text-[var(--gx-text-muted)] transition-colors hover:text-[var(--gx-text)] md:flex"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <span className="gx-section-label overflow-hidden text-ellipsis whitespace-nowrap">
            {pathname.replace(/^\//, '').toUpperCase() || 'DASHBOARD'}
          </span>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <span className="gx-badge gx-badge--warning gx-num"><Flame size={11} strokeWidth={2} /> {streak}</span>
            <span className="gx-badge gx-badge--accent gx-num"><Zap size={11} strokeWidth={2} /> {totalScore.toLocaleString()}</span>
            <div className="relative z-[9999]">
              <NotificationBell token={navToken} />
            </div>
          </div>
        </header>

        <main
          className="page-fade min-w-0 flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: 'var(--gx-surface)', paddingBottom: isDesktop ? 'calc(40px + env(safe-area-inset-bottom))' : 'calc(96px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>

        {/* Floating daily check-in — logged-in users only */}
        {(isAuthenticated || user) && <DailyCheckIn name={user?.name} />}
      </div>
    </div>
  );
}
