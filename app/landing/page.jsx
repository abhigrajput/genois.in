'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import { Button, Card, CardBody, Badge, SectionLabel, Progress } from '@/components/ui';
import {
  Check, X, ArrowRight, Play, BookOpen, Code2, ClipboardCheck, ClipboardList,
  FileSearch, FileText, Mic, Calendar, Brain, BarChart3, Bot, Map, FolderGit2,
  Zap, Target, Rocket, Sparkles,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   LIGHT theme — the same system as the dashboard (app/design-tokens.css +
   components/ui/*). White surfaces, dark text, one deep-green accent. No
   gradients, no neon, no glow shadows. Every colour below is a token
   reference; this page hard-codes no palette value of its own.

   CONTENT RULE: every feature named here maps to a live route in the sidebar
   (components/layout/AppLayout.jsx NAV_ITEMS). Nothing descoped, nothing
   coming-soon, no unsourced numbers.
   ────────────────────────────────────────────────────────────────────────── */

const TEXT = 'var(--gx-text)';
const MUTED = 'var(--gx-text-muted)';
const SUBTLE = 'var(--gx-text-subtle)';
const ACCENT = 'var(--gx-accent)';
const BORDER = 'var(--gx-border)';
const SURFACE = 'var(--gx-surface)';

const SP = { xs: 8, sm: 12, md: 20, lg: 32, xl: 48 };
const SECTION_PAD = 'clamp(52px, 8vw, 80px) clamp(20px, 5vw, 28px)';

const DISPLAY = { fontFamily: 'var(--gx-font-display)', fontWeight: 700, letterSpacing: -0.5 };

// ─── Data ─────────────────────────────────────────────────────────────────────
// The real onboarding flow: /diagnostic (15 questions) → generated roadmap →
// one task a day on /roadmap.
const STEPS = [
  {
    n: '01', time: '15 questions',
    title: 'Take the diagnostic',
    desc: 'Answer 15 questions in your domain. That sets your starting level, so the plan is not built on a guess about what you already know.',
  },
  {
    n: '02', time: 'generated for you',
    title: 'Get your roadmap',
    desc: 'A day-by-day plan for the domain you picked at signup — with a separate DSA track alongside it if that is the part you keep avoiding.',
  },
  {
    n: '03', time: 'every morning',
    title: 'Open one task',
    desc: 'A video, a reading, a coding problem, a short test, notes. Tick them off. That is the day — no syllabus to plan, no blank page.',
  },
];

// Every entry below is a live sidebar route.
const LEAD_FEATURE = {
  icon: Calendar,
  href: '/roadmap',
  title: 'Your daily roadmap',
  desc: 'One day at a time, generated for your domain and the level the diagnostic found. Each day is a small stack — watch, read, code, test, take notes — that you close out and move on from.',
};

const FEATURES = [
  {
    icon: FileSearch, href: '/resume', title: 'Resume ATS breakdown',
    desc: 'Paste in your resume and a target company. You get missing keywords, weak bullets rewritten, bullets with no measurable impact, and the formatting that trips ATS parsers.',
  },
  {
    icon: Mic, href: '/voice-interview', title: 'Voice mock interview',
    desc: 'Speak your answers to an AI interviewer instead of typing them, then get a category-by-category breakdown of how the round went. Retake it as often as you want.',
  },
  {
    icon: Code2, href: '/coding', title: 'Coding practice',
    desc: 'A daily challenge, or practice by company — problems written in the style of that company’s online assessment, with AI review on what you submit.',
  },
  {
    icon: Play, href: '/dsa-visualizer', title: 'DSA visualizer',
    desc: '40 algorithms across sorting, searching, trees, graphs, DP, backtracking and more — running step by step, instead of another static explanation.',
  },
  {
    icon: Brain, href: '/aptitude', title: 'Aptitude shortcuts',
    desc: 'The tricks that make the aptitude round survivable — quant, logical and verbal, aimed at TCS NQT, Infosys SP and Wipro NLTH, with answer review after each set.',
  },
  {
    icon: BarChart3, href: '/analytics', title: 'Progress analytics',
    desc: 'Points earned, days completed, where your accuracy actually sits. Your streak and score are on every screen, so progress is a number and not a feeling.',
  },
  {
    icon: Bot, href: '/chatbot', title: 'AI mentor',
    desc: 'An always-on mentor that knows your domain, with separate modes for coding, project and career questions. For the 1am doubt that would otherwise end the session.',
  },
];

// The remaining live sidebar routes — listed, not oversold.
const ALSO_INCLUDED = [
  { icon: Map, label: 'DSA Roadmap', href: '/dsa-roadmap' },
  { icon: FileText, label: 'AI Notes', href: '/notes' },
  { icon: FolderGit2, label: 'Projects', href: '/projects' },
  { icon: ClipboardList, label: 'Answer Review', href: '/review' },
  { icon: Zap, label: 'AI vs Human', href: '/ai-vs-human' },
];

// The day-1 task the interactive demo walks through. The four sub-steps are the
// real task types a roadmap day is built from (video / resource / coding / test).
const DEMO_TASK = {
  day: 1,
  domain: 'DSA',
  company: 'Amazon',
  topic: 'Two Pointers Pattern',
  minutes: 30,
  subtasks: [
    { icon: BookOpen, label: 'Read the concept', meta: 'Two-pointer intuition · 5 min' },
    { icon: Play, label: 'Watch the walkthrough', meta: 'Converging pointers, visualized · 8 min' },
    { icon: Code2, label: 'Solve one problem', meta: 'Two Sum II — sorted array · 12 min' },
    { icon: ClipboardCheck, label: 'Pass the checkpoint', meta: '3-question self-test · 5 min' },
  ],
  aiNote: 'Array and two-pointer questions are a staple of online assessments — they are how a company checks whether you can cut an O(n²) brute force down to O(n) with the clock running.',
};

// ─── Scroll reveal ────────────────────────────────────────────────────────────
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

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub, center = false }) {
  return (
    <div
      data-reveal
      style={{
        marginBottom: SP.xl, maxWidth: 680,
        marginInline: center ? 'auto' : undefined,
        textAlign: center ? 'center' : 'left',
      }}
    >
      <SectionLabel style={{ marginBottom: 12 }}>{eyebrow}</SectionLabel>
      <h2 style={{ ...DISPLAY, fontSize: 'clamp(26px, 4vw, 38px)', color: TEXT, margin: 0, lineHeight: 1.12, letterSpacing: -1 }}>
        {title}
      </h2>
      {sub && (
        <p style={{ color: MUTED, fontSize: 'clamp(15px, 1.6vw, 16px)', lineHeight: 1.65, marginTop: SP.sm, marginBottom: 0, marginInline: center ? 'auto' : undefined, maxWidth: 600 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/** Small accent tick used for the trust bullets. */
function Tick({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: MUTED, whiteSpace: 'nowrap' }}>
      <Check size={14} strokeWidth={2.5} color={ACCENT} /> {children}
    </span>
  );
}

// ─── INTERACTIVE DEMO — a day-1 task the visitor can complete, no login ────────
function DemoTask({ onClose }) {
  const total = DEMO_TASK.subtasks.length;
  const [checked, setChecked] = useState(() => new Array(total).fill(false));
  const doneCount = checked.filter(Boolean).length;
  const pct = Math.round((doneCount / total) * 100);
  const complete = doneCount === total;

  const toggle = (i) => setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <Card accent style={{ width: '100%', maxWidth: 'min(460px, calc(100vw - 40px))', textAlign: 'left' }}>
      <CardBody>
        {/* Live badge + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md, gap: SP.sm }}>
          <Badge tone="accent" pill>Live demo · no signup</Badge>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close demo">
            <X size={13} strokeWidth={2} /> Close
          </Button>
        </div>

        {complete ? (
          // ─── Completion state ─────────────────────────────────────────────
          <div style={{ textAlign: 'center', padding: '4px 0 2px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={28} strokeWidth={3} color={ACCENT} />
            </div>
            <h3 style={{ ...DISPLAY, fontSize: 'clamp(19px, 3vw, 22px)', color: TEXT, margin: '0 0 8px', lineHeight: 1.2 }}>
              That&apos;s one day. Done.
            </h3>
            <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 auto 20px', maxWidth: 320 }}>
              Every morning looks like this — one task, picked for your domain and the level your diagnostic set.
            </p>
            <Button href="/signup">Start free <ArrowRight size={16} strokeWidth={2.5} /></Button>
            <div style={{ marginTop: 12 }}>
              <Button variant="ghost" size="sm" onClick={() => setChecked(new Array(total).fill(false))}>
                Replay the demo
              </Button>
            </div>
          </div>
        ) : (
          // ─── Active task state ────────────────────────────────────────────
          <>
            {/* Meta row: day, domain, target, time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: SP.sm }}>
              <Badge tone="solid" className="gx-num">DAY {DEMO_TASK.day}</Badge>
              <Badge tone="accent">{DEMO_TASK.domain}</Badge>
              <Badge tone="neutral" icon={Target}>{DEMO_TASK.company}</Badge>
              <span className="gx-num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: SUBTLE, marginLeft: 'auto' }}>
                <Zap size={11} strokeWidth={2} color="var(--gx-warning)" /> {DEMO_TASK.minutes} min
              </span>
            </div>

            <SectionLabel style={{ marginBottom: 4 }}>Today&apos;s task</SectionLabel>
            <h3 style={{ ...DISPLAY, fontSize: 'clamp(18px, 2.6vw, 21px)', color: TEXT, margin: '0 0 14px' }}>{DEMO_TASK.topic}</h3>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span className="gx-num" style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{doneCount} / {total} steps done</span>
              <span className="gx-num" style={{ fontSize: 12, color: SUBTLE }}>{pct}%</span>
            </div>
            <Progress value={doneCount} max={total} label="Demo task progress" style={{ marginBottom: SP.md }} />

            {/* Subtasks — clickable checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: SP.md }}>
              {DEMO_TASK.subtasks.map((s, i) => {
                const on = checked[i];
                return (
                  <button
                    key={s.label}
                    onClick={() => toggle(i)}
                    aria-pressed={on}
                    style={{
                      display: 'flex', alignItems: 'center', gap: SP.sm, textAlign: 'left', width: '100%',
                      padding: '10px 12px', borderRadius: 'var(--gx-radius)', cursor: 'pointer',
                      background: on ? 'var(--gx-accent-soft)' : 'var(--gx-bg)',
                      border: `1px solid ${on ? 'var(--gx-accent-border)' : BORDER}`,
                      transition: 'background-color var(--gx-transition), border-color var(--gx-transition)',
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: 'var(--gx-radius-sm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: on ? ACCENT : 'transparent',
                      border: `1.5px solid ${on ? ACCENT : 'var(--gx-border-strong)'}`,
                      transition: 'background-color var(--gx-transition), border-color var(--gx-transition)',
                    }}>
                      {on && <Check size={13} strokeWidth={3} color="var(--gx-text-inverse)" />}
                    </span>
                    <s.icon size={16} strokeWidth={1.8} color={on ? ACCENT : SUBTLE} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {/* Shorthand only — mixing it with textDecorationColor warns on rerender. */}
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: TEXT, textDecoration: on ? 'line-through var(--gx-text-subtle)' : 'none' }}>
                        {s.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: SUBTLE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.meta}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mentor note */}
            <div className="gx-well" style={{ padding: '11px 13px' }}>
              <SectionLabel icon={Brain} style={{ marginBottom: 5 }}>Why this shows up in OAs</SectionLabel>
              <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, margin: 0 }}>{DEMO_TASK.aiNote}</p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Default hero teaser — invites the visitor to launch the demo ──────────────
function HeroTeaser({ onStart }) {
  return (
    <Card accent style={{ width: '100%', maxWidth: 'min(460px, calc(100vw - 40px))', textAlign: 'left' }}>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: SP.md }}>
          <Badge tone="solid" className="gx-num">DAY 1</Badge>
          <Badge tone="accent">DSA · Amazon</Badge>
        </div>
        <SectionLabel style={{ marginBottom: 4 }}>Today&apos;s task</SectionLabel>
        <h3 style={{ ...DISPLAY, fontSize: 'clamp(19px, 2.6vw, 22px)', color: TEXT, margin: '0 0 8px' }}>Two Pointers Pattern</h3>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>
          This is what is waiting when you log in on your first morning. Not a course, not a to-do list. One task.
        </p>
        <Button variant="outline" block onClick={onStart}>
          <Play size={15} strokeWidth={2.5} /> Try the 2-min demo
        </Button>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <Tick>No signup · finish it right here</Tick>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, lead = false }) {
  return (
    <Card accent={lead} padded style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        width: lead ? 44 : 38, height: lead ? 44 : 38, borderRadius: 'var(--gx-radius)',
        background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: lead ? 16 : 12, flexShrink: 0,
      }}>
        <Icon size={lead ? 22 : 19} strokeWidth={1.8} color={ACCENT} />
      </div>
      <h3 style={{ ...DISPLAY, fontSize: lead ? 20 : 16, color: TEXT, margin: '0 0 6px' }}>{title}</h3>
      <p style={{ color: MUTED, fontSize: lead ? 14.5 : 13.5, lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();
  const previewRef = useRef(null);
  const [isDemoActive, setIsDemoActive] = useState(false);

  const startDemo = () => {
    setIsDemoActive(true);
    // On mobile the preview stacks below the copy — scroll it into view.
    requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    // `gx-app` activates the light theme (see app/design-tokens.css).
    <div className="gx-app" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNavbar />

      <main>
        {/* ═══ HERO ═══ */}
        <section style={{ padding: 'clamp(36px, 6vw, 64px) clamp(20px, 5vw, 28px)' }}>
          <div className="gen-hero-asym">
            {/* Left — copy */}
            <div className="gen-hero-copy">
              <Badge tone="accent" pill icon={Rocket} style={{ marginBottom: SP.md }}>
                Placement beta · every feature free
              </Badge>
              <h1 style={{ ...DISPLAY, fontSize: 'clamp(32px, 4.8vw, 48px)', lineHeight: 1.1, letterSpacing: -1.2, margin: '0 0 18px', color: TEXT, maxWidth: 560 }}>
                Placement prep that tells you{' '}
                <span style={{ color: ACCENT }}>what to do today.</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: MUTED, lineHeight: 1.65, margin: '0 0 14px', maxWidth: 540 }}>
                A 15-question diagnostic sets your level. From there you get a day-by-day roadmap for your
                domain — and one task each morning: a video, a reading, a coding problem, a short test, notes.
              </p>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: '0 0 26px', maxWidth: 540 }}>
                Plus the rounds you are actually screened on:{' '}
                <span style={{ color: TEXT, fontWeight: 600 }}>ATS resume analysis</span>,{' '}
                <span style={{ color: TEXT, fontWeight: 600 }}>voice mock interviews</span>,
                company-style coding practice and aptitude.
              </p>
              <div style={{ display: 'flex', gap: SP.sm, flexWrap: 'wrap', marginBottom: SP.md }}>
                <Button href="/signup" size="lg">Start free <ArrowRight size={17} strokeWidth={2.5} /></Button>
                <Button variant="secondary" size="lg" onClick={startDemo}>
                  <Play size={15} strokeWidth={2.5} /> Try the 2-min demo
                </Button>
              </div>
              <div style={{ display: 'flex', gap: '8px 18px', flexWrap: 'wrap' }}>
                <Tick>Free during the beta</Tick>
                <Tick>No credit card</Tick>
                <Tick>Every feature unlocked</Tick>
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
        <div style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(36px, 6vw, 56px) clamp(20px, 5vw, 28px)', textAlign: 'center' }} data-reveal>
            <p style={{ ...DISPLAY, fontSize: 'clamp(19px, 3vw, 28px)', color: TEXT, lineHeight: 1.4, margin: 0 }}>
              Most students don&apos;t fail placements because they lack resources.
              <br />
              <span style={{ color: MUTED }}>They fail because they don&apos;t know what to do today.</span>
              <br />
              <span style={{ color: ACCENT }}>GENOIS gives you the day.</span>
            </p>
          </div>
        </div>

        {/* ═══ INFORMATION vs EXECUTION ═══ */}
        <section style={{ padding: SECTION_PAD, maxWidth: 1080, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="The real problem"
            title="Information is not the bottleneck. Execution is."
            sub="You already have more study material than you could finish in five years. The gap is turning all of it into what you do in the next 30 minutes."
          />
          <div className="gen-compare">
            <Card muted padded data-reveal>
              <SectionLabel style={{ marginBottom: 14 }}>What you already have</SectionLabel>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  '10 browser tabs you’ll never finish',
                  '3 unfinished DSA sheets',
                  'Endless YouTube playlists',
                  'A vague plan to "start tomorrow"',
                ].map(t => (
                  <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', color: MUTED, fontSize: 14.5, lineHeight: 1.45 }}>
                    <X size={16} strokeWidth={2.2} color="var(--gx-danger)" style={{ flexShrink: 0 }} /> {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card accent padded data-reveal data-reveal-delay="1">
              <SectionLabel style={{ marginBottom: 14, color: ACCENT }}>What GENOIS gives you</SectionLabel>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'One task, already chosen for today',
                  'Pitched at the level your diagnostic found',
                  'Company-style practice for the OA you’ll sit',
                  'A streak and analytics that show it’s working',
                ].map(t => (
                  <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', color: TEXT, fontSize: 14.5, lineHeight: 1.45, fontWeight: 500 }}>
                    <Check size={16} strokeWidth={2.5} color={ACCENT} style={{ flexShrink: 0 }} /> {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ padding: SECTION_PAD, maxWidth: 1080, margin: '0 auto' }}>
            <SectionHeader
              eyebrow="How it works"
              title="The whole loop is three steps"
              sub="No dashboard to configure and no 40-hour course to choose from. The system is deliberately small, so there is never an excuse not to start."
            />
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.n} data-reveal data-reveal-delay={i + 1}>
                  <div className="gx-num" style={{
                    width: 44, height: 44, borderRadius: 'var(--gx-radius)',
                    background: 'var(--gx-bg)', border: `1px solid var(--gx-accent-border)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--gx-font-display)', fontSize: 16, fontWeight: 700,
                    color: ACCENT, marginBottom: SP.md,
                  }}>
                    {s.n}
                  </div>
                  <SectionLabel style={{ marginBottom: 6 }}>{s.time}</SectionLabel>
                  <h3 style={{ ...DISPLAY, fontSize: 19, color: TEXT, margin: '0 0 8px' }}>{s.title}</h3>
                  <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: 0, maxWidth: 320 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section id="features" style={{ padding: SECTION_PAD }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <SectionHeader
              eyebrow="What you get"
              title="Every tool here has one job: get you to done."
              sub="Not more to read — more finished. Each of these is a live screen in your account from the day you sign up."
            />

            <div data-reveal style={{ marginBottom: 14 }}>
              <FeatureCard {...LEAD_FEATURE} lead />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div key={f.title} data-reveal data-reveal-delay={(i % 3) + 1}>
                  <FeatureCard {...f} />
                </div>
              ))}
            </div>

            {/* The remaining live routes — named, not oversold */}
            <div data-reveal style={{ marginTop: SP.lg }}>
              <Card muted padded>
                <div style={{ display: 'flex', alignItems: 'center', gap: SP.md, flexWrap: 'wrap' }}>
                  <SectionLabel>Also in your account</SectionLabel>
                  <div style={{ display: 'flex', gap: SP.sm, flexWrap: 'wrap' }}>
                    {ALSO_INCLUDED.map(a => (
                      <span key={a.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED }}>
                        <a.icon size={15} strokeWidth={1.8} color={SUBTLE} /> {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ═══ FOUNDER STORY ═══ */}
        <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div data-reveal style={{ padding: SECTION_PAD, maxWidth: 760, margin: '0 auto' }}>
            <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: SP.md }}>
              <SectionLabel style={{ marginBottom: 12 }}>Why we built this</SectionLabel>
              <h2 style={{ ...DISPLAY, fontSize: 'clamp(22px, 3.2vw, 30px)', color: TEXT, margin: '0 0 16px', lineHeight: 1.2, letterSpacing: -0.8 }}>
                I had all the resources. I still froze every morning.
              </h2>
              {/* Deliberately unattributed — no name, no college. The story is the
                  claim; a byline would be one more thing to have to stand behind. */}
              <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
                GENOIS is built by an engineering student who drowned in the same bookmarks and sheets you have
                open right now. The fix was never more content — it was one honest answer to &ldquo;what do I do{' '}
                <em>today</em>?&rdquo; So I built the thing I wish I&apos;d had.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ BETA ACCESS — no price matrix during the Placement Beta ═══ */}
        <section id="beta" style={{ padding: SECTION_PAD }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }} data-reveal>
            <SectionHeader
              center
              eyebrow="Beta access"
              title={<>No plans. No card. <span style={{ color: ACCENT }}>Just the beta.</span></>}
              sub="GENOIS is free while it is in the placement beta — every feature above is unlocked, voice mock interviews and resume analysis included. Paid plans may return later; beta users keep founder pricing."
            />
            <Button href="/signup" size="lg">Create your free account <ArrowRight size={18} strokeWidth={2.5} /></Button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px 18px', flexWrap: 'wrap', marginTop: SP.md }}>
              <Tick>Every feature unlocked</Tick>
              <Tick>No credit card</Tick>
              <Tick>Free during the beta</Tick>
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section style={{ padding: '0 clamp(20px, 5vw, 28px) clamp(56px, 9vw, 88px)' }}>
          <Card data-reveal accent style={{ maxWidth: 820, margin: '0 auto' }}>
            <CardBody style={{ padding: 'clamp(28px, 5vw, 44px)' }}>
              <SectionLabel icon={Sparkles} style={{ marginBottom: 14 }}>Your day 1 is already waiting</SectionLabel>
              <h2 style={{ ...DISPLAY, fontSize: 'clamp(24px, 4vw, 34px)', color: TEXT, margin: '0 0 12px', lineHeight: 1.15, letterSpacing: -1, maxWidth: 520 }}>
                Stop collecting resources. Start finishing days.
              </h2>
              <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.65, margin: '0 0 26px', maxWidth: 480 }}>
                Take the diagnostic, get your roadmap, open day 1. It takes one sitting and it costs nothing.
              </p>
              <Button href="/signup" size="lg">Start my day 1 <ArrowRight size={18} strokeWidth={2.5} /></Button>
            </CardBody>
          </Card>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(32px, 5vw, 44px) clamp(20px, 5vw, 28px) 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: SP.lg }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ ...DISPLAY, fontSize: 20, marginBottom: 8 }}>
              <span style={{ color: ACCENT }}>GEN</span><span style={{ color: TEXT }}>OIS</span>
            </div>
            <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
              One task a day. Placement prep for engineering students.
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }} aria-label="Footer">
            {[
              { title: 'Product', links: [{ l: 'How it works', h: '#how' }, { l: 'Features', h: '#features' }, { l: 'Beta access', h: '#beta' }] },
              { title: 'Company', links: [{ l: 'Log in', h: '/login' }, { l: 'Sign up', h: '/signup' }, { l: 'Privacy', h: '/privacy' }, { l: 'Terms', h: '/terms' }] },
            ].map(col => (
              <div key={col.title}>
                <SectionLabel style={{ marginBottom: 12 }}>{col.title}</SectionLabel>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(l => (
                    <li key={l.l}><Link href={l.h} className="gx-nav-link" style={{ fontSize: 13 }}>{l.l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div style={{ maxWidth: 1080, margin: '28px auto 0', paddingTop: SP.md, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: SP.sm }}>
          <div style={{ color: SUBTLE, fontSize: 12 }}>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div style={{ color: MUTED, fontSize: 12.5, fontWeight: 500 }}>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}
