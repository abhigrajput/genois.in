'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import {
  Rocket, Check, Zap, Calendar, Bot, Code2, Award, BarChart3, TrendingUp,
  Mic, Flame, Target, Play, BookOpen, ClipboardCheck, Brain, X, ArrowRight, Sparkles,
} from 'lucide-react';

// ─── "Focused Intensity" palette — identical to dashboard / auth / sidebar ────
const BG = '#0a0a0f';
const BG2 = '#12121a';
const BG3 = '#1a1a26';
const TEAL = '#00d9a3';
const TEAL_LT = '#2ee6b0';
const TEAL_DK = '#00b389';
const CORAL = '#ff6b4a';
const CORAL_LT = '#ff8a6f';
const AMBER = '#ffb020';
const TEXT = '#e8e8ed';
const MUTED = '#8a8a99';

// ─── Consistent spacing scale (4pt-based) ─────────────────────────────────────
const SP = { xs: 8, sm: 12, md: 20, lg: 32, xl: 52, xxl: 88 };

// ─── Data ─────────────────────────────────────────────────────────────────────
// Every step is framed around "what do I do today", not "here are resources".
const STEPS = [
  { n: '01', time: 'takes 60 seconds', title: 'Tell us your target', desc: 'Your target company and domain. That is the entire setup — no forms, no fluff.' },
  { n: '02', time: 'every morning',    title: 'Open one task',       desc: 'Not a syllabus. Not a playlist. One concrete task, sized for the time you actually have.' },
  { n: '03', time: 'day by day',       title: 'Finish it. Repeat.',  desc: 'Momentum compounds. 90 finished days is the difference between "prepared" and "placed".' },
];

// Features reframed: each is a reason execution beats information.
const FEATURES = [
  { icon: Bot,        title: 'AI Mentor',          desc: 'Reads your real test and coding performance, then decides what you should do next. Not a chatbot to ask — a mentor that already knows your weak spot and hands you the fix.', large: true },
  { icon: Calendar,   title: 'Daily Milestone',    desc: 'One task a day that adapts to your pace. Never a blank page.' },
  { icon: Code2,      title: 'Coding Challenges',  desc: 'A problem picked for you, with hints and AI review the moment you submit.' },
  { icon: Award,      title: 'Skill Badges',       desc: 'Proctored, verifiable proof you actually did the work — not just watched it.' },
  { icon: BarChart3,  title: 'Leaderboard',        desc: 'Your streak, ranked against your college. Execution has a scoreboard.' },
  { icon: TrendingUp, title: 'Progress Analytics', desc: 'See the days you shipped stack up. Proof that consistency is working.' },
];

const PLANS = [
  { name: 'Spectator', price: '₹0',   cadence: '/forever', desc: 'Explore the platform free.',     features: ['30-day full trial', '1 career domain', 'Daily milestone', 'Daily coding challenge'], cta: 'Start Free',       highlight: false },
  { name: 'Player',    price: '₹199', cadence: '/month',   desc: 'Get serious about prep.',        features: ['Everything in Spectator', '3 domains at once', 'Daily + weekly tests', 'College leaderboard'],  cta: 'Choose Player',    highlight: false },
  { name: 'Performer', price: '₹299', cadence: '/month',   desc: 'The complete placement engine.', features: ['Everything in Player', 'All 10 domains', 'AI Mentor — 5 modes', 'Job-Ready badge'],            cta: 'Choose Performer', highlight: true  },
  { name: 'Dominator', price: '₹499', cadence: '/month',   desc: 'For elite placement goals.',     features: ['Everything in Performer', 'Company-specific prep', 'Priority mentor escalation', 'Shareable report'], cta: 'Go Dominator', highlight: false },
];

// The single day-1 task the interactive demo walks through.
const DEMO_TASK = {
  day: 1,
  domain: 'DSA',
  company: 'Amazon',
  topic: 'Two Pointers Pattern',
  minutes: 30,
  subtasks: [
    { icon: BookOpen,       label: 'Read the concept', meta: 'Two-pointer intuition · 5 min' },
    { icon: Play,           label: 'Watch the walkthrough', meta: 'Converging pointers, visualized · 8 min' },
    { icon: Code2,          label: 'Solve one problem', meta: 'Two Sum II — sorted array · 12 min' },
    { icon: ClipboardCheck, label: 'Pass the checkpoint', meta: '3-question self-test · 5 min' },
  ],
  aiNote: 'Amazon’s online assessment leans hard on array and two-pointer problems — they test whether you can cut an O(n²) brute force down to O(n) under a ticking clock. Nail this one pattern and you’ve covered roughly 1 in 5 of their screening questions.',
};

// ─── Scroll reveal ──────────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('gen-revealed'));
      return;
    }
    const ob = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('gen-revealed'); ob.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => ob.observe(el));
    return () => ob.disconnect();
  }, []);
}

// ─── Eyebrow + animated accent line ─────────────────────────────────────────────
function Eyebrow({ children, align = 'left' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: SP.sm, marginBottom: 18 }}>
      <span className="gen-eyebrow">{children}</span>
      <div className="gen-accent-line" />
    </div>
  );
}

// ─── Centered / left section header ─────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: SP.xl, maxWidth: 660 }} data-reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.05, letterSpacing: -1 }}>{title}</h2>
      {sub && <p style={{ color: MUTED, fontSize: 'clamp(14px, 1.6vw, 16px)', marginTop: SP.md, marginBottom: 0, maxWidth: 580, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

// ─── INTERACTIVE DEMO — a real Day-1 task the visitor can complete, no login ────
function DemoTask({ onClose }) {
  const total = DEMO_TASK.subtasks.length;
  const [checked, setChecked] = useState(() => new Array(total).fill(false));
  const doneCount = checked.filter(Boolean).length;
  const pct = Math.round((doneCount / total) * 100);
  const complete = doneCount === total;

  const toggle = (i) => setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div style={{
      background: BG2, borderRadius: 20, border: `1px solid rgba(0,217,163,0.28)`,
      padding: 'clamp(18px, 3vw, 26px)', width: '100%', maxWidth: 'min(460px, calc(100vw - 40px))',
      boxShadow: '0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,217,163,0.05)',
      position: 'relative', textAlign: 'left',
    }}>
      {/* Live badge + close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: SP.sm }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5, color: TEAL, textTransform: 'uppercase' }}>
          <span className="gen-live-dot" /> Live demo · no signup
        </span>
        <button onClick={onClose} aria-label="Close demo" className="gen-press" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: MUTED,
          fontSize: 12, fontFamily: 'var(--font-body)', padding: '6px 10px', cursor: 'pointer',
        }}><X size={13} strokeWidth={2} /> Close</button>
      </div>

      {complete ? (
        // ─── Completion state ───────────────────────────────────────────────────
        <div style={{ textAlign: 'center', padding: '10px 4px 6px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px', background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 34px rgba(0,217,163,0.34)' }}>
            <Check size={32} strokeWidth={3} color={BG} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 25px)', fontWeight: 700, color: TEXT, margin: '0 0 10px', letterSpacing: -0.5, lineHeight: 1.15 }}>
            That&apos;s one day. Done.
          </h3>
          <p style={{ color: '#cbccd6', fontSize: 15, lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 340 }}>
            Now imagine <span style={{ color: TEAL_LT, fontWeight: 700 }}>90 of these</span> — each one picked for your level, your target company, your timeline.
          </p>
          <Link href="/signup" className="gen-press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 12,
            textDecoration: 'none', background: TEAL, color: BG, fontFamily: 'var(--font-heading)',
            fontWeight: 700, fontSize: 15, boxShadow: '0 12px 34px rgba(0,217,163,0.32)',
          }}>Start Free <ArrowRight size={17} strokeWidth={2.5} /></Link>
          <button onClick={() => setChecked(new Array(total).fill(false))} className="gen-press" style={{
            display: 'block', margin: '16px auto 0', background: 'transparent', border: 'none',
            color: MUTED, fontSize: 12.5, fontFamily: 'var(--font-body)', cursor: 'pointer', textDecoration: 'underline',
          }}>Replay the demo</button>
        </div>
      ) : (
        // ─── Active task state ──────────────────────────────────────────────────
        <>
          {/* Meta row: day, domain, target, time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SP.xs, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: BG, background: TEAL, borderRadius: 6, padding: '4px 9px' }}>DAY {DEMO_TASK.day}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: TEAL, background: 'rgba(0,217,163,0.1)', border: '1px solid rgba(0,217,163,0.25)', borderRadius: 6, padding: '4px 9px' }}>{DEMO_TASK.domain}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: CORAL_LT, background: 'rgba(255,107,74,0.1)', border: '1px solid rgba(255,107,74,0.28)', borderRadius: 6, padding: '4px 9px' }}><Target size={11} strokeWidth={2} /> {DEMO_TASK.company}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: MUTED, marginLeft: 'auto' }}><Zap size={11} strokeWidth={2} color={AMBER} /> {DEMO_TASK.minutes} min</span>
          </div>

          <div className="gen-eyebrow" style={{ fontSize: 9.5, letterSpacing: 2, marginBottom: 6 }}>Today&apos;s milestone</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(19px, 2.6vw, 23px)', fontWeight: 700, color: TEXT, margin: '0 0 16px', letterSpacing: -0.5 }}>{DEMO_TASK.topic}</h3>

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span style={{ fontSize: 13, color: '#cbccd6', fontWeight: 600 }}>{doneCount} / {total} steps done</span>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: `linear-gradient(90deg, ${TEAL}, ${TEAL_LT})`, transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          {/* Subtasks — clickable checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP.xs, marginBottom: 18 }}>
            {DEMO_TASK.subtasks.map((s, i) => {
              const on = checked[i];
              return (
                <button key={s.label} onClick={() => toggle(i)} className="gen-press" style={{
                  display: 'flex', alignItems: 'center', gap: SP.sm, textAlign: 'left', width: '100%',
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: on ? 'rgba(0,217,163,0.08)' : BG3,
                  border: `1px solid ${on ? 'rgba(0,217,163,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}>
                  <span style={{
                    width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? TEAL : 'transparent', border: `1.5px solid ${on ? TEAL : 'rgba(255,255,255,0.2)'}`,
                    transition: 'background 0.2s, border-color 0.2s',
                  }}>{on && <Check size={14} strokeWidth={3} color={BG} />}</span>
                  <s.icon size={17} strokeWidth={1.8} color={on ? TEAL : MUTED} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: on ? TEXT : '#cbccd6', textDecoration: on ? 'line-through' : 'none', textDecorationColor: 'rgba(0,217,163,0.5)' }}>{s.label}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.meta}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* AI mentor note */}
          <div style={{ background: 'rgba(255,107,74,0.06)', border: '1px solid rgba(255,107,74,0.2)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Brain size={14} strokeWidth={2} color={CORAL_LT} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 1.5, color: CORAL_LT, textTransform: 'uppercase' }}>Why Amazon tests this</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dfe6f0', lineHeight: 1.6, margin: 0 }}>{DEMO_TASK.aiNote}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Default hero teaser — invites the visitor to launch the demo ───────────────
function HeroTeaser({ onStart }) {
  return (
    <div style={{
      background: BG2, borderRadius: 20, border: `1px solid rgba(0,217,163,0.22)`,
      padding: 'clamp(20px, 3vw, 28px)', width: '100%', maxWidth: 'min(460px, calc(100vw - 40px))',
      boxShadow: '0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,217,163,0.05)', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SP.sm, marginBottom: 18 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: BG, background: TEAL, borderRadius: 6, padding: '4px 9px' }}>DAY 1</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: TEAL, background: 'rgba(0,217,163,0.1)', border: '1px solid rgba(0,217,163,0.25)', borderRadius: 6, padding: '4px 9px' }}>DSA · Amazon</span>
      </div>
      <div className="gen-eyebrow" style={{ fontSize: 9.5, letterSpacing: 2, marginBottom: 6 }}>Today&apos;s milestone</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 2.6vw, 24px)', fontWeight: 700, color: TEXT, margin: '0 0 8px', letterSpacing: -0.5 }}>Two Pointers Pattern</h3>
      <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
        This is exactly what shows up when you log in on your first morning. Not a course. Not a to-do list. One task.
      </p>
      <button onClick={onStart} className="gen-press" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
        padding: '14px 24px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${TEAL}`,
        background: 'rgba(0,217,163,0.1)', color: TEAL_LT, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
      }}><Play size={15} strokeWidth={2.5} /> Try the 2-min demo</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12, color: MUTED, fontSize: 12 }}>
        <span className="gen-bullet" /> No signup · complete it right here
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();
  const heroRef = useRef(null);
  const previewRef = useRef(null);
  const [isDemoActive, setIsDemoActive] = useState(false);

  const startDemo = () => {
    setIsDemoActive(true);
    // On mobile the preview stacks below the copy — scroll it into view.
    requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  // Cursor-following ambient glow (desktop; disabled for coarse pointers & reduced-motion via CSS)
  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />

      <main>
        {/* ═══ HERO — asymmetric ═══ */}
        <section ref={heroRef} style={{ position: 'relative', padding: 'clamp(48px, 7vw, 72px) clamp(20px, 5vw, 28px)', overflow: 'hidden' }}>
          <div className="gen-hero-glow" />
          {/* Large teal ring, offset behind the preview */}
          <div style={{ position: 'absolute', top: 40, right: '-6%', width: '38%', maxWidth: 520, aspectRatio: '1 / 1', borderRadius: '50%', border: '1px solid rgba(0,217,163,0.14)', boxShadow: 'inset 0 0 120px rgba(0,217,163,0.06)', pointerEvents: 'none', zIndex: 0 }} />
          {/* Diagonal coral streak */}
          <div style={{ position: 'absolute', bottom: -60, left: '-10%', width: '55%', height: 2, background: `linear-gradient(90deg, transparent, ${CORAL}55, transparent)`, transform: 'rotate(-8deg)', pointerEvents: 'none', zIndex: 0 }} />

          <div className="gen-hero-asym" style={{ position: 'relative', zIndex: 1, paddingTop: SP.md }}>
            {/* Left — copy */}
            <div className="gen-hero-copy">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: SP.xs, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,107,74,0.1)', border: `1px solid ${CORAL}55`, color: CORAL, fontSize: 12, fontWeight: 600, marginBottom: 26, fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
                <Rocket size={13} strokeWidth={2} color={CORAL} /> JUST LAUNCHED · FIRST 100 SEATS
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 7vw, 82px)', fontWeight: 700, lineHeight: 0.98, letterSpacing: -2, margin: '0 0 22px', color: TEXT }}>
                You don&apos;t lack<br />resources.<br />
                <span style={{ color: TEAL }}>You lack a plan</span><br />for today.
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: '#b6b6c2', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 520 }}>
                Every student has a thousand PDFs, ten YouTube playlists, and a 500-problem sheet. That&apos;s not why placements go wrong. They go wrong because on any given morning, <span style={{ color: TEXT, fontWeight: 600 }}>you don&apos;t know what to actually do next.</span>
              </p>
              <p style={{ fontSize: 15, color: '#cbccd6', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 520, fontWeight: 500 }}>
                GENOIS gives you <span style={{ color: TEAL_LT, fontWeight: 700 }}>one milestone a day</span> — the single right task for your level, your target company, your timeline. Open it. Finish it. That&apos;s the whole system.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: SP.lg }}>
                <Link href="/signup" className="gen-press" style={{
                  padding: '15px 30px', borderRadius: 12, textDecoration: 'none', background: TEAL, color: BG,
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
                  display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 12px 34px rgba(0,217,163,0.32)',
                }}>Get My Daily Milestone <ArrowRight size={17} strokeWidth={2.5} /></Link>
                <button onClick={startDemo} className="gen-press" style={{
                  padding: '15px 26px', borderRadius: 12, cursor: 'pointer',
                  background: 'transparent', border: `1px solid rgba(0,217,163,0.3)`, color: TEAL_LT,
                  fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}><Play size={15} strokeWidth={2.5} /> Try 2-Min Demo</button>
              </div>
              <div style={{ display: 'flex', gap: '10px 20px', flexWrap: 'wrap' }}>
                {['Set up in 60 seconds', 'Free forever', 'No credit card'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED, whiteSpace: 'nowrap' }}>
                    <span className="gen-bullet" />{t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — interactive preview: teaser by default, live demo when active */}
            <div ref={previewRef} className="gen-hero-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
              {isDemoActive
                ? <DemoTask onClose={() => setIsDemoActive(false)} />
                : <HeroTeaser onStart={startDemo} />}
            </div>
          </div>
        </section>

        {/* ═══ THESIS STRIP ═══ */}
        <div style={{ borderTop: '1px solid rgba(0,217,163,0.1)', borderBottom: '1px solid rgba(0,217,163,0.1)', background: 'rgba(0,217,163,0.03)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) clamp(20px, 5vw, 28px)', textAlign: 'center' }} data-reveal>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3.4vw, 34px)', fontWeight: 700, color: TEXT, lineHeight: 1.35, letterSpacing: -0.5, margin: 0 }}>
              Most students don&apos;t fail placements because they lack resources.
              <br />
              <span style={{ color: MUTED }}>They fail because they don&apos;t know what to do today.</span>
              <br />
              <span style={{ color: TEAL }}>GENOIS gives you your daily milestone.</span>
            </p>
          </div>
        </div>

        {/* ═══ INFORMATION vs EXECUTION ═══ */}
        <section style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)', maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader eyebrow="The real problem" title="Information is not the bottleneck. Execution is." sub="You already have more study material than you could finish in five years. The gap is turning all of it into what you do in the next 30 minutes." />
          <div className="gen-compare">
            <div data-reveal style={{ padding: 'clamp(22px, 3vw, 30px)', borderRadius: 18, background: BG2, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="gen-eyebrow" style={{ color: MUTED, marginBottom: 16 }}>What you already have</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['10 browser tabs you’ll never finish', '3 unfinished DSA sheets', 'Endless YouTube playlists', 'A vague plan to "start tomorrow"'].map(t => (
                  <li key={t} style={{ display: 'flex', gap: SP.sm, alignItems: 'center', color: '#a6a6b3', fontSize: 15, lineHeight: 1.4 }}>
                    <X size={17} strokeWidth={2.2} color={CORAL} style={{ flexShrink: 0 }} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal data-reveal-delay="1" style={{ padding: 'clamp(22px, 3vw, 30px)', borderRadius: 18, background: `linear-gradient(160deg, rgba(0,217,163,0.08), ${BG2})`, border: '1px solid rgba(0,217,163,0.35)', boxShadow: '0 0 44px rgba(0,217,163,0.1)' }}>
              <div className="gen-eyebrow" style={{ marginBottom: 16 }}>What GENOIS gives you</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['One task, chosen for today', 'Sized to the time you actually have', 'Picked for your target company', 'A streak that makes it stick'].map(t => (
                  <li key={t} style={{ display: 'flex', gap: SP.sm, alignItems: 'center', color: TEXT, fontSize: 15, lineHeight: 1.4, fontWeight: 500 }}>
                    <Check size={17} strokeWidth={2.5} color={TEAL} style={{ flexShrink: 0 }} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS — horizontal timeline ═══ */}
        <section id="how" style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)', maxWidth: 1100, margin: '0 auto', background: BG2, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <SectionHeader eyebrow="How it works" title="The whole loop is three steps" sub="No dashboards to configure, no 40-hour course to pick from. The system is deliberately small so you never have an excuse not to start." />
          <div className="gen-timeline">
            {STEPS.map((s, i) => (
              <div key={s.n} data-reveal data-reveal-delay={i + 1} style={{ position: 'relative' }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: BG3, border: `1px solid rgba(0,217,163,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: TEAL, position: 'relative', zIndex: 1, marginBottom: SP.md }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.5, color: CORAL, marginBottom: 8, textTransform: 'uppercase' }}>{s.time}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 700, color: TEXT, margin: '0 0 10px', letterSpacing: -0.5 }}>{s.title}</h3>
                <p style={{ color: '#a6a6b3', fontSize: 14.5, lineHeight: 1.6, margin: 0, maxWidth: 320 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ VIDEO WALKTHROUGH SLOT ═══ */}
        <section style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)', maxWidth: 900, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: SP.lg }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Eyebrow align="center">See it in 45 seconds</Eyebrow></div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.1, letterSpacing: -1 }}>
              Watch one day become a habit
            </h2>
          </div>
          {/* Responsive 16:9 slot — a real video URL drops straight into <video>/<iframe> later */}
          <div data-reveal style={{
            position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 20, overflow: 'hidden',
            background: `radial-gradient(circle at 50% 45%, ${BG3}, ${BG})`, border: '1px solid rgba(0,217,163,0.2)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SP.md }}>
              <button aria-label="Play walkthrough video (coming soon)" className="gen-press" style={{
                width: 'clamp(64px, 9vw, 84px)', aspectRatio: '1 / 1', borderRadius: '50%', cursor: 'pointer',
                background: TEAL, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 16px 44px rgba(0,217,163,0.4)',
              }}>
                <Play size={30} strokeWidth={2} color={BG} fill={BG} style={{ marginLeft: 4 }} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(15px, 2vw, 18px)', color: TEXT }}>Demo video coming soon</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: MUTED, marginTop: 6, letterSpacing: 0.5 }}>A 45-second walkthrough of your first milestone</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES — bento ═══ */}
        <section id="features" style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)', background: BG2, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <SectionHeader eyebrow="Built to keep you moving" title="Every tool here has one job: get you to done." sub="Not more to read. More finished. Each feature exists to remove a reason you might stall today." />

            {/* The moat: Voice Mock Interview */}
            <Link href="/signup" data-reveal className="gen-press" style={{
              display: 'flex', alignItems: 'center', gap: SP.md, padding: 'clamp(20px, 3vw, 26px)', marginBottom: 16,
              borderRadius: 18, textDecoration: 'none', flexWrap: 'wrap',
              background: `linear-gradient(120deg, rgba(255,107,74,0.12), ${BG3})`, border: `1px solid ${CORAL}44`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: CORAL }} />
              <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: `linear-gradient(135deg, ${CORAL}, #e6512f)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={30} strokeWidth={1.8} color="#fff" /></div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: -0.5 }}>Voice Mock Interview</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: CORAL, background: 'rgba(255,107,74,0.14)', border: `1px solid ${CORAL}55`, borderRadius: 6, padding: '3px 7px' }}>NEW · ONLY ON GENOIS</span>
                </div>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, margin: 0 }}>Some days the task is to speak, not read. Our AI plays a tough interviewer and scores your clarity, accuracy, and confidence — the way a real panel would.</p>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: CORAL, whiteSpace: 'nowrap' }}>Try it free →</div>
            </Link>

            <div className="gen-bento">
              {FEATURES.map((f, i) => (
                <div key={f.title} data-reveal data-reveal-delay={(i % 3) + 1}
                  className={`gen-card ${f.large ? 'gen-bento-lg' : ''}`}
                  style={{
                    padding: f.large ? 'clamp(24px, 3vw, 30px)' : 'clamp(20px, 2.5vw, 24px)', borderRadius: 16,
                    background: f.large ? `linear-gradient(160deg, rgba(0,217,163,0.08), ${BG})` : BG,
                    border: `1px solid ${f.large ? 'rgba(0,217,163,0.28)' : 'rgba(0,217,163,0.1)'}`,
                    display: 'flex', flexDirection: 'column', justifyContent: f.large ? 'flex-end' : 'flex-start',
                  }}>
                  <div style={{ width: f.large ? 60 : 46, height: f.large ? 60 : 46, borderRadius: 12, background: 'rgba(0,217,163,0.1)', border: '1px solid rgba(0,217,163,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: f.large ? 22 : 14 }}><f.icon size={f.large ? 28 : 22} strokeWidth={1.6} color={TEAL_LT} /></div>
                  {f.large && <span className="gen-eyebrow" style={{ marginBottom: 10 }}>The engine</span>}
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: f.large ? 26 : 16.5, fontWeight: 700, color: TEXT, margin: '0 0 8px', letterSpacing: -0.5 }}>{f.title}</h3>
                  <p style={{ color: '#a6a6b3', fontSize: f.large ? 15 : 13.5, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FOUNDER STORY ═══ */}
        <section style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)' }}>
          <div data-reveal style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: SP.lg, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 4px', alignSelf: 'stretch', minHeight: 120, width: 4, borderRadius: 2, background: `linear-gradient(${TEAL}, ${CORAL})` }} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <Eyebrow>Why we built this</Eyebrow>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: TEXT, margin: '0 0 18px', lineHeight: 1.15, letterSpacing: -0.5 }}>
                I had all the resources. I still froze every morning.
              </h2>
              <p style={{ color: '#cbccd6', fontSize: 16, lineHeight: 1.7, margin: '0 0 24px' }}>
                GENOIS is built by an engineering student who drowned in the same bookmarks and sheets you have open right now. The fix was never more content — it was one honest answer to &ldquo;what do I do <em>today</em>?&rdquo; So I built the thing I wish I&apos;d had.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, color: BG, fontSize: 15 }}>L</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: TEXT, fontSize: 15 }}>Laxshu R.</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2, fontFamily: 'var(--font-mono)' }}>Founder, GENOIS · KLE Hubballi</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" style={{ padding: 'clamp(56px, 9vw, 88px) clamp(20px, 5vw, 28px)', background: BG2, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <SectionHeader eyebrow="Pricing" title="Start free. Upgrade when the streak is real." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              {PLANS.map((p, i) => (
                <div key={p.name} data-reveal data-reveal-delay={(i % 4) + 1} style={{
                  padding: 'clamp(24px, 3vw, 28px)', borderRadius: 18, position: 'relative', background: p.highlight ? 'rgba(0,217,163,0.06)' : BG,
                  border: `1px solid ${p.highlight ? 'rgba(0,217,163,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: p.highlight ? '0 0 44px rgba(0,217,163,0.12)' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {p.highlight && <div style={{ position: 'absolute', top: -11, left: 24, padding: '4px 12px', borderRadius: 999, background: TEAL, color: BG, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: 1, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#a6a6b3', marginBottom: 18, minHeight: 36, lineHeight: 1.4 }}>{p.desc}</div>
                  <div style={{ marginBottom: SP.md }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 800, color: TEXT, letterSpacing: -1 }}>{p.price}</span>
                    <span style={{ color: MUTED, fontSize: 14, marginLeft: 4 }}>{p.cadence}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 10, marginBottom: 11, color: '#cbccd6', fontSize: 13, lineHeight: 1.4, alignItems: 'flex-start' }}>
                        <span className="gen-bullet" style={{ marginTop: 6 }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="gen-press" style={{
                    display: 'block', textAlign: 'center', padding: '12px 18px', borderRadius: 10,
                    background: p.highlight ? TEAL : 'rgba(255,255,255,0.05)',
                    color: p.highlight ? BG : TEXT,
                    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                    border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    textDecoration: 'none', boxShadow: p.highlight ? '0 8px 22px rgba(0,217,163,0.3)' : 'none',
                  }}>{p.cta}</Link>
                </div>
              ))}
            </div>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: MUTED, fontSize: 12.5, marginTop: 22 }}>
              <Zap size={13} strokeWidth={2} color={AMBER} /> Payments launching soon — start your 30-day free trial today, no card required.
            </p>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section style={{ padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 28px)' }}>
          <div data-reveal style={{
            maxWidth: 820, margin: '0 auto', position: 'relative', overflow: 'hidden',
            padding: 'clamp(36px, 6vw, 56px) clamp(28px, 5vw, 44px)', borderRadius: 24, background: BG2,
            border: '1px solid rgba(0,217,163,0.25)', boxShadow: '0 0 60px rgba(0,217,163,0.1)',
          }}>
            <div style={{ position: 'absolute', top: -80, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,74,0.14), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.5, color: TEAL, textTransform: 'uppercase' }}>
                <Sparkles size={13} strokeWidth={2} color={TEAL} /> Your day 1 is already waiting
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 700, color: TEXT, margin: '0 0 14px', lineHeight: 1.05, letterSpacing: -1, maxWidth: 540 }}>
                Stop collecting resources. Start finishing days.
              </h2>
              <p style={{ color: '#a6a6b3', fontSize: 16, margin: '0 0 30px', maxWidth: 460 }}>
                One task, ready in 60 seconds, built around your target company. No credit card, no catch.
              </p>
              <Link href="/signup" className="gen-press" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 40px', borderRadius: 12, textDecoration: 'none', background: TEAL, color: BG,
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, boxShadow: '0 14px 36px rgba(0,217,163,0.34)',
              }}>Start My Day 1 — It&apos;s Free <ArrowRight size={18} strokeWidth={2.5} /></Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: 'clamp(36px, 6vw, 44px) clamp(20px, 5vw, 28px) 28px', background: BG, borderTop: '1px solid rgba(0,217,163,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: SP.lg }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, marginBottom: 10, letterSpacing: -0.5 }}>
              <span style={{ color: TEAL }}>GEN</span><span style={{ color: TEXT }}>OIS</span>
            </div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>One milestone a day. The execution engine for engineering placements.</div>
          </div>
          <nav style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }} aria-label="Footer">
            {[
              { title: 'Product', links: [{ l: 'How it works', h: '#how' }, { l: 'Features', h: '#features' }, { l: 'Pricing', h: '#pricing' }, { l: 'Blog', h: '/blog' }] },
              { title: 'Company', links: [{ l: 'Login', h: '/login' }, { l: 'Sign up', h: '/signup' }, { l: 'Privacy', h: '/privacy' }, { l: 'Terms', h: '/terms' }] },
            ].map(col => (
              <div key={col.title}>
                <div className="gen-eyebrow" style={{ marginBottom: 14 }}>{col.title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {col.links.map(l => (
                    <li key={l.l}><Link href={l.h} style={{ color: '#a6a6b3', textDecoration: 'none', fontSize: 13 }}>{l.l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div style={{ maxWidth: 1100, margin: '32px auto 0', paddingTop: SP.md, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: SP.sm }}>
          <div style={{ color: MUTED, fontSize: 12 }}>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div style={{ color: TEAL_LT, fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}
