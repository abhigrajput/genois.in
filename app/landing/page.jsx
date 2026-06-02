import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import AnimatedStats from './AnimatedStats';
import ScrollReveal from './ScrollReveal';

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#8b5cf6';
const CYAN = '#06b6d4';
const BG = '#0a0a0a';
const BG2 = '#111111';
const BG3 = '#161616';

const COLLEGES = [
  'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'IIIT Hyderabad',
  'VTU', 'RGPV', 'SPPU', 'COEP', 'DTU', 'VIT Vellore',
];

const STEPS = [
  {
    emoji: '🎯',
    accentColor: PURPLE,
    title: 'Choose your domain',
    desc: 'Pick from 10 career paths. From Full Stack to Cybersecurity, every roadmap is tuned to industry hiring patterns.',
  },
  {
    emoji: '🗺️',
    accentColor: '#6366f1',
    title: 'Follow your AI roadmap',
    desc: 'Daily plan with videos, notes, coding problems and tests. Generated and adapted to your level.',
  },
  {
    emoji: '🏆',
    accentColor: CYAN,
    title: 'Earn verified badges',
    desc: 'Pass proctored skill tests, build projects, and graduate with credentials placement teams trust.',
  },
];

const FEATURES = [
  {
    icon: '◐',
    title: '365-Day AI Roadmap',
    desc: 'Personalised daily plan with videos, articles, projects and problems.',
    visual: 'barchart',
  },
  {
    icon: '◑',
    title: 'Skill Badge System',
    desc: 'Proctored exams with 60-day validity. Verifiable on your public profile.',
    visual: 'badges',
  },
  {
    icon: '◉',
    title: 'DSA Visualizer',
    desc: '30 algorithms with step-by-step animation. See how it actually works.',
    visual: 'tree',
  },
  {
    icon: '◇',
    title: 'AI Mentor 24/7',
    desc: 'Stuck on a concept? Ask the mentor for hints, code reviews and next steps.',
    visual: 'chat',
  },
  {
    icon: '◆',
    title: 'Leaderboards & Duels',
    desc: 'College war, domain war, 1v1 duels. Climb the ranks every day.',
    visual: 'leaderboard',
  },
  {
    icon: '◈',
    title: 'Verified Certificates',
    desc: 'Generate verifiable PDFs that recruiters can validate in one click.',
    visual: 'certificate',
  },
];

const DOMAINS = [
  { slug: 'fullstack',     name: 'Full Stack',    icon: '⬡', days: '365 days' },
  { slug: 'dsa',           name: 'DSA',           icon: '◈', days: '365 days' },
  { slug: 'cybersecurity', name: 'Cybersecurity', icon: '◆', days: '365 days' },
  { slug: 'aiml',          name: 'AI & ML',       icon: '◉', days: '365 days' },
  { slug: 'devops',        name: 'DevOps',        icon: '▷', days: '365 days' },
  { slug: 'android',       name: 'Android',       icon: '▣', days: '365 days' },
  { slug: 'datascience',   name: 'Data Science',  icon: '◇', days: '365 days' },
  { slug: 'blockchain',    name: 'Blockchain',    icon: '◎', days: '365 days' },
  { slug: 'gamedev',       name: 'Game Dev',      icon: '○', days: '365 days' },
  { slug: 'systemdesign',  name: 'System Design', icon: '▦', days: '365 days' },
];

const PLANS = [
  {
    key: 'spectator',
    name: 'Spectator',
    price: '₹0',
    cadence: '/forever',
    desc: 'Browse the platform and watch the action.',
    features: ['Public profile', 'Browse domains', 'Read blog', 'Leaderboard view'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    key: 'player',
    name: 'Player',
    price: '₹299',
    cadence: '/month',
    desc: 'Get the daily roadmap + AI mentor.',
    features: ['365-day roadmap', 'AI mentor', 'DSA visualizer', 'Aptitude tests'],
    cta: 'Choose Player',
    highlight: false,
  },
  {
    key: 'performer',
    name: 'Performer',
    price: '₹499',
    cadence: '/month',
    desc: 'Everything in Player + verified skill badges.',
    features: ['Everything in Player', 'Proctored badges', 'Mock interviews', 'Mentor sessions'],
    cta: 'Choose Performer',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    key: 'dominator',
    name: 'Dominator',
    price: '₹1999',
    cadence: '/month',
    desc: 'For students serious about elite placements.',
    features: ['Everything in Performer', 'Priority support', '1-on-1 mentoring', 'Resume reviews'],
    cta: 'Go Dominator',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Rahul Mehta',
    initials: 'RM',
    college: 'IIT Roorkee',
    domain: 'Full Stack',
    progress: 'Day 82 · 6,240 pts · 🔥 21 streak',
    stars: 5,
    quote: 'The daily roadmap pulled me out of tutorial hell. In 90 days I shipped 3 production apps and landed an offer at a Bangalore SaaS.',
    result: 'Got placed at Razorpay',
  },
  {
    name: 'Priya Sharma',
    initials: 'PS',
    college: 'NIT Surathkal',
    domain: 'AI & ML',
    progress: 'Day 67 · 4,200 pts · 🔥 12 streak',
    stars: 5,
    quote: 'AI mentor answers my doubts at 2 AM. The badge system gave me something concrete to put on my resume — not just a course certificate.',
    result: 'Cleared Amazon OA',
  },
  {
    name: 'Arjun Kashyap',
    initials: 'AK',
    college: 'VIT Vellore',
    domain: 'DSA',
    progress: 'Day 124 · 8,850 pts · 🔥 34 streak',
    stars: 5,
    quote: 'I went from 0 LeetCode solves to 250+ in four months. The DSA visualizer made trees and graphs finally click.',
    result: 'Got placed at TCS Digital',
  },
];

// ─── Task tabs data for dashboard mockup ───
const TASKS = [
  { label: 'Watch Video',      done: true },
  { label: 'Read Resource',    done: true },
  { label: 'Coding Challenge', done: true },
  { label: 'Daily Test',       done: false },
  { label: 'AI Notes',         done: false },
];

const BADGES_MOCKUP = [
  { label: 'DSA',      done: true },
  { label: 'C++',      done: true },
  { label: 'FullStack', done: false },
];

export default function LandingPage() {
  return (
    <div style={{ background: BG, color: '#e5e7eb', minHeight: '100vh', overflowX: 'hidden' }}>
      <ScrollReveal />
      <LandingNavbar />

      {/* ─────────── HERO ─────────── */}
      <section
        className="gen-hero gen-grid-bg gen-noise-overlay"
        style={{ position: 'relative', padding: '110px 28px 90px', overflow: 'hidden' }}
      >
        {/* Purple glow — top-left */}
        <div style={{
          position: 'absolute', top: -80, left: -120,
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 65%)`,
          filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Cyan glow — bottom-right */}
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 65%)`,
          filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        }} />

        <div className="gen-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left — text */}
          <div className="gen-hero-text">
            <div className="gen-fade-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
              color: PURPLE_LIGHT, fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-outfit), sans-serif', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
              Now live · 30-day free trial
            </div>

            <h1 className="gen-hero-enter gen-hero-h1" style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 60, fontWeight: 800,
              lineHeight: 1.06, letterSpacing: -1.5,
              margin: '0 0 22px', color: '#fff',
            }}>
              The Career OS for<br />
              <span style={{
                backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT} 0%, ${CYAN} 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>Engineering Students</span>
            </h1>

            <p className="gen-fade-up gen-fade-up-d2" style={{
              fontSize: 18, lineHeight: 1.65, color: '#9ca3af',
              maxWidth: 520, margin: '0 0 38px',
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
              365-day structured roadmap, AI mentor, verified skill badges, and placement prep —
              all in one platform.
            </p>

            <div className="gen-fade-up gen-fade-up-d3" style={{
              display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48,
            }}>
              <Link href="/signup" className="gen-cta-pulse" style={{
                padding: '15px 30px', borderRadius: 12, textDecoration: 'none',
                backgroundImage: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
                color: '#fff', fontFamily: 'var(--font-syne), sans-serif',
                fontWeight: 700, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                Start 30-Day Free Trial →
              </Link>
              <a href="#how" style={{
                padding: '15px 30px', borderRadius: 12, textDecoration: 'none',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#e5e7eb', fontFamily: 'var(--font-syne), sans-serif',
                fontWeight: 600, fontSize: 15,
              }}>
                See How It Works
              </a>
            </div>

            {/* Mini trust row */}
            <div className="gen-fade-up gen-fade-up-d4" style={{
              display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { icon: '✦', text: '500+ students' },
                { icon: '✦', text: '10 domains' },
                { icon: '✦', text: 'No credit card' },
              ].map(t => (
                <div key={t.text} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: '#6b7280',
                }}>
                  <span style={{ color: CYAN, fontSize: 10 }}>{t.icon}</span>
                  {t.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="gen-hero-mockup-wrap">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── SOCIAL PROOF ─────────── */}
      <section style={{
        padding: '36px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: BG2,
        overflow: 'hidden',
      }}>
        <div style={{
          textAlign: 'center', color: '#6b7280', fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase', marginBottom: 22,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          Trusted by students from
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div className="gen-marquee">
            {[...COLLEGES, ...COLLEGES].map((c, i) => (
              <div key={i} style={{
                color: '#9ca3af', fontSize: 15,
                fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600,
                whiteSpace: 'nowrap', opacity: 0.6,
              }}>{c}</div>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section id="how" className="gen-section" style={{ padding: '100px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal>
          <SectionHeader eyebrow="How it works" title="Three steps to job-ready" />
        </div>

        <div style={{ position: 'relative', marginTop: 64 }}>
          {/* Connecting gradient line (desktop only) */}
          <div className="gen-desktop-only" style={{
            position: 'absolute',
            top: 56,
            left: 'calc(16.67% + 36px)',
            right: 'calc(16.67% + 36px)',
            height: 1,
            background: `linear-gradient(90deg, ${PURPLE}, #6366f1 50%, ${CYAN})`,
            opacity: 0.35,
            zIndex: 0,
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28, position: 'relative', zIndex: 1,
          }}>
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-reveal
                data-reveal-delay={String(i + 1)}
                style={{
                  padding: '32px 28px 28px',
                  borderRadius: 20,
                  background: BG2,
                  border: `1px solid rgba(255,255,255,0.07)`,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
                className="gen-glow"
              >
                {/* Ghost step number */}
                <div style={{
                  position: 'absolute', top: 20, right: 24,
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 52, fontWeight: 800,
                  color: 'rgba(255,255,255,0.04)',
                  lineHeight: 1,
                }}>0{i + 1}</div>

                {/* Icon circle */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, ${s.accentColor}33, ${s.accentColor}11)`,
                  border: `1.5px solid ${s.accentColor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34, marginBottom: 24,
                  boxShadow: `0 0 28px ${s.accentColor}28`,
                }}>{s.emoji}</div>

                <h3 style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 19, fontWeight: 700, color: '#fff', margin: '0 0 10px',
                }}>{s.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                  {s.desc}
                </p>

                {/* Bottom accent */}
                <div style={{
                  position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
                  background: `linear-gradient(90deg, transparent, ${s.accentColor}44, transparent)`,
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── FEATURES ─────────── */}
      <section id="features" className="gen-section" style={{
        padding: '100px 28px',
        background: BG2,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div data-reveal>
            <SectionHeader eyebrow="What you get" title="Everything you need to land your first offer" />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20, marginTop: 56,
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                data-reveal-delay={String((i % 3) + 1)}
                className="gen-glow"
                style={{
                  padding: '26px 24px 22px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${PURPLE}33, ${CYAN}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#fff', marginBottom: 14,
                }}>{f.icon}</div>

                <h3 style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 8px',
                }}>{f.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>

                {/* Mini visual */}
                <FeatureVisual type={f.visual} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── STATS ─────────── */}
      <section style={{
        padding: '88px 28px',
        background: `linear-gradient(180deg, rgba(124,58,237,0.07) 0%, rgba(6,182,212,0.04) 100%)`,
        borderTop: '1px solid rgba(124,58,237,0.15)',
        borderBottom: '1px solid rgba(6,182,212,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow blob */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: 999,
              background: `rgba(124,58,237,0.12)`, border: `1px solid rgba(124,58,237,0.3)`,
              color: PURPLE_LIGHT, fontSize: 12, fontWeight: 600,
              letterSpacing: 1.5, textTransform: 'uppercase',
              marginBottom: 16, fontFamily: 'var(--font-outfit), sans-serif',
            }}>By the numbers</div>
            <h2 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1,
            }}>
              Built for scale.<br />
              <span style={{
                backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>Designed for results.</span>
            </h2>
          </div>
          <AnimatedStats />
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── DOMAINS ─────────── */}
      <section id="domains" className="gen-section" style={{ padding: '100px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div data-reveal>
          <SectionHeader eyebrow="10 domains" title="Choose your career path" />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginTop: 56,
        }}>
          {DOMAINS.map((d, i) => (
            <Link
              key={d.slug}
              href="/signup"
              data-reveal
              data-reveal-delay={String((i % 5) + 1)}
              className="gen-card"
              style={{
                padding: 22, borderRadius: 14, textDecoration: 'none',
                background: BG2, border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${PURPLE}33, ${CYAN}33)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff',
              }}>{d.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>{d.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.days}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── TESTIMONIALS ─────────── */}
      <section className="gen-section" style={{
        padding: '100px 28px',
        background: BG2,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div data-reveal>
            <SectionHeader eyebrow="What students say" title="From confusion to confidence" />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20, marginTop: 56,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                data-reveal
                data-reveal-delay={String(i + 1)}
                className="gen-card"
                style={{
                  padding: 28, borderRadius: 20,
                  background: '#0f0f0f',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column', gap: 0,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-syne), sans-serif',
                    fontWeight: 800, color: '#fff', fontSize: 16,
                    boxShadow: `0 0 16px rgba(124,58,237,0.3)`,
                  }}>{t.initials}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontWeight: 700, color: '#fff', fontSize: 15,
                    }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {t.college} · {t.domain}
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ color: '#fbbf24', fontSize: 12, letterSpacing: 1 }}>
                    {'★'.repeat(t.stars)}
                  </div>
                </div>

                {/* Progress pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 999, marginBottom: 16,
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  fontSize: 11, color: '#8b5cf6',
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}>
                  {t.progress}
                </div>

                {/* Quote */}
                <p style={{
                  color: '#d1d5db', fontSize: 14, lineHeight: 1.65,
                  margin: '0 0 20px', fontFamily: 'var(--font-outfit), sans-serif',
                  flex: 1,
                }}>
                  "{t.quote}"
                </p>

                {/* Result badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  fontSize: 12, fontWeight: 600, color: '#10b981',
                }}>
                  <span style={{ fontSize: 10 }}>✓</span>
                  {t.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── PRICING ─────────── */}
      <section id="pricing" className="gen-section" style={{ padding: '100px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div data-reveal>
            <SectionHeader eyebrow="Pricing" title="Choose the plan that fits your hustle" />
          </div>
          <div data-reveal style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#fbbf24', fontSize: 12, fontWeight: 600, marginTop: 16, marginBottom: 36,
          }}>⚡ Payments launching soon — start your free trial today</div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {PLANS.map((p, i) => (
              <div
                key={p.key}
                data-reveal
                data-reveal-delay={String(i + 1)}
                style={{
                  padding: 28, borderRadius: 18, position: 'relative',
                  background: p.highlight
                    ? 'linear-gradient(180deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))'
                    : 'rgba(255,255,255,0.02)',
                  border: p.highlight ? `1px solid ${PURPLE}` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: p.highlight ? `0 8px 32px ${PURPLE}33` : 'none',
                }}
              >
                {p.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 12px', borderRadius: 999,
                    background: PURPLE, color: '#fff', fontSize: 11, fontWeight: 700,
                    fontFamily: 'var(--font-syne), sans-serif', whiteSpace: 'nowrap',
                  }}>{p.badge}</div>
                )}
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 22, minHeight: 38 }}>{p.desc}</div>
                <div style={{ marginBottom: 22 }}>
                  <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 38, fontWeight: 800, color: '#fff' }}>{p.price}</span>
                  <span style={{ color: '#6b7280', fontSize: 14, marginLeft: 4 }}>{p.cadence}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, color: '#d1d5db', fontSize: 13 }}>
                      <span style={{ color: CYAN, marginTop: 2, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display: 'block', textAlign: 'center', padding: '12px 18px', borderRadius: 10,
                  background: p.highlight ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})` : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 14,
                  border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  textDecoration: 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ─────────── CTA ─────────── */}
      <section className="gen-section" style={{ padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, ${PURPLE}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div
          data-reveal
          style={{
            maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative',
            padding: '64px 40px', borderRadius: 24,
            background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(6,182,212,0.05))',
            border: `1px solid ${PURPLE}55`,
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontSize: 40, fontWeight: 800,
            color: '#fff', margin: '0 0 16px', lineHeight: 1.15,
          }}>
            Start your{' '}
            <span style={{
              backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>30-day Dominator</span>{' '}trial
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 16, margin: '0 0 32px' }}>
            Full access. Cancel anytime. No credit card required.
          </p>
          <Link href="/signup" className="gen-cta-pulse" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 36px', borderRadius: 12, textDecoration: 'none',
            backgroundImage: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
            color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16,
          }}>
            Start Free Trial →
          </Link>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer style={{
        padding: '56px 28px 32px', background: BG3,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: 22,
              backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              letterSpacing: 1.5, marginBottom: 12,
            }}>GENOIS</div>
            <div style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
              The career operating system for engineering students.
            </div>
          </div>
          <FooterCol title="Product" links={[
            { label: 'Features',    href: '#features' },
            { label: 'Pricing',     href: '#pricing' },
            { label: 'Domains',     href: '#domains' },
            { label: 'Leaderboard', href: '/leaderboard' },
          ]} />
          <FooterCol title="Company" links={[
            { label: 'About',   href: '/blog' },
            { label: 'Blog',    href: '/blog' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms',   href: '/terms' },
          ]} />
          <FooterCol title="Connect" links={[
            { label: 'GitHub',   href: 'https://github.com' },
            { label: 'LinkedIn', href: 'https://linkedin.com' },
            { label: 'Twitter',  href: 'https://twitter.com' },
            { label: 'Contact',  href: '/feedback' },
          ]} />
        </div>
        <div style={{
          maxWidth: 1200, margin: '40px auto 0', paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, color: '#6b7280', fontSize: 12,
        }}>
          <div>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function GradientDivider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 40%, rgba(6,182,212,0.5) 60%, transparent)`,
      margin: 0,
    }} />
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', padding: '5px 14px', borderRadius: 999,
        background: 'rgba(6,182,212,0.1)', border: `1px solid rgba(6,182,212,0.3)`,
        color: CYAN, fontSize: 11, fontWeight: 600,
        letterSpacing: 1.5, textTransform: 'uppercase',
        marginBottom: 18, fontFamily: 'var(--font-outfit), sans-serif',
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: 'var(--font-syne), sans-serif', fontSize: 40, fontWeight: 800,
        color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: -0.5,
      }}>{title}</h2>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 12,
        color: '#fff', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13 }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1030 0%, #0e1525 100%)',
      border: `1px solid rgba(124,58,237,0.45)`,
      borderRadius: 20,
      padding: '22px 22px 20px',
      boxShadow: `0 0 60px rgba(124,58,237,0.18), 0 0 120px rgba(6,182,212,0.07), inset 0 1px 0 rgba(255,255,255,0.07)`,
      animation: 'float 4s ease-in-out infinite',
      maxWidth: 420, width: '100%',
      position: 'relative',
    }}>
      {/* Top accent shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: `linear-gradient(90deg, transparent, rgba(139,92,246,0.8) 40%, rgba(6,182,212,0.8) 60%, transparent)`,
        borderRadius: 1,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: 10, color: '#6b7280',
            letterSpacing: 1.2, textTransform: 'uppercase',
            fontFamily: 'var(--font-outfit), sans-serif', marginBottom: 4,
          }}>DSA · Day 47</div>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700, color: '#fff', fontSize: 15,
          }}>Binary Trees in C++</div>
        </div>
        <div style={{
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.35)',
          borderRadius: 8, padding: '5px 11px',
          fontFamily: 'var(--font-syne), sans-serif',
          fontWeight: 700, fontSize: 13, color: PURPLE_LIGHT,
          flexShrink: 0,
        }}>5,385 pts</div>
      </div>

      {/* Task tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
        {TASKS.map((task, i) => (
          <div key={task.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 11px', borderRadius: 9,
            background: task.done ? 'rgba(6,182,212,0.07)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${task.done ? 'rgba(6,182,212,0.22)' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div style={{
              width: 19, height: 19, borderRadius: '50%', flexShrink: 0,
              background: task.done ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${task.done ? CYAN : 'rgba(255,255,255,0.14)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: task.done ? CYAN : '#6b7280',
            }}>{task.done ? '✓' : ''}</div>
            <span style={{ fontSize: 12.5, color: task.done ? '#d1d5db' : '#6b7280' }}>
              {task.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, color: '#6b7280' }}>Progress</span>
          <span style={{ fontSize: 10.5, color: PURPLE_LIGHT, fontWeight: 600 }}>3 / 5 tasks</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            width: '60%', height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
            boxShadow: `0 0 6px rgba(124,58,237,0.5)`,
          }} />
        </div>
      </div>

      {/* Streak + Badges row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 7,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.22)',
        }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>8 day streak</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {BADGES_MOCKUP.map(b => (
            <div key={b.label} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 600,
              background: b.done ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${b.done ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: b.done ? CYAN : '#6b7280',
            }}>
              {b.label} {b.done ? '✓' : '○'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BAR_HEIGHTS = [55, 80, 42, 90, 68, 50];
const BAR_COLORS  = [PURPLE, CYAN, PURPLE_LIGHT, CYAN, PURPLE, CYAN];

function FeatureVisual({ type }) {
  const wrap = {
    marginTop: 18,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 16,
  };

  if (type === 'barchart') {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="gen-bar"
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: '3px 3px 0 0',
              background: `linear-gradient(180deg, ${BAR_COLORS[i]}cc, ${BAR_COLORS[i]}33)`,
              animation: `gen-bar-grow 1s ${0.12 * i}s ease-out both`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'badges') {
    return (
      <div style={{ ...wrap, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {[
          { label: 'DSA',      color: PURPLE_LIGHT },
          { label: 'C++',      color: CYAN },
          { label: 'React',    color: '#38bdf8' },
        ].map(b => (
          <div key={b.label} style={{
            padding: '4px 11px', borderRadius: 999,
            background: `${b.color}12`,
            border: `1px solid ${b.color}44`,
            color: b.color, fontSize: 11, fontWeight: 700,
            boxShadow: `0 0 10px ${b.color}22`,
          }}>{b.label} ✓</div>
        ))}
      </div>
    );
  }

  if (type === 'tree') {
    return (
      <div style={wrap}>
        <svg width="100%" height="72" viewBox="0 0 200 72" style={{ opacity: 0.9 }}>
          {/* Root */}
          <circle cx="100" cy="12" r="10" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6" strokeWidth="1.5"/>
          <text x="100" y="16" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="600">42</text>
          {/* Edges L1 */}
          <line x1="92" y1="22" x2="56" y2="42" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
          <line x1="108" y1="22" x2="144" y2="42" stroke="rgba(6,182,212,0.3)" strokeWidth="1"/>
          {/* L2 nodes */}
          <circle cx="50" cy="50" r="10" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.55)" strokeWidth="1.5"/>
          <text x="50" y="54" textAnchor="middle" fill="rgba(139,92,246,0.85)" fontSize="9" fontWeight="600">25</text>
          <circle cx="150" cy="50" r="10" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.55)" strokeWidth="1.5"/>
          <text x="150" y="54" textAnchor="middle" fill="rgba(6,182,212,0.85)" fontSize="9" fontWeight="600">61</text>
          {/* Edges L2 */}
          <line x1="42" y1="60" x2="22" y2="70" stroke="rgba(139,92,246,0.2)" strokeWidth="1"/>
          <line x1="58" y1="60" x2="78" y2="70" stroke="rgba(139,92,246,0.2)" strokeWidth="1"/>
          <line x1="142" y1="60" x2="122" y2="70" stroke="rgba(6,182,212,0.2)" strokeWidth="1"/>
          <line x1="158" y1="60" x2="178" y2="70" stroke="rgba(6,182,212,0.2)" strokeWidth="1"/>
          {/* L3 nodes */}
          {[18, 82, 118, 182].map((cx, i) => (
            <circle key={cx} cx={cx} cy="70" r="6"
              fill="transparent"
              stroke={i < 2 ? 'rgba(139,92,246,0.4)' : 'rgba(6,182,212,0.4)'}
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '10px 10px 10px 3px', padding: '7px 11px',
          fontSize: 11.5, color: '#d1d5db', maxWidth: '82%',
        }}>How does a BST traversal work?</div>
        <div style={{
          background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.18)',
          borderRadius: '10px 10px 3px 10px', padding: '7px 11px',
          fontSize: 11.5, color: '#9ca3af', maxWidth: '88%', alignSelf: 'flex-end',
        }}>Inorder visits left → root → right, giving sorted output...</div>
      </div>
    );
  }

  if (type === 'leaderboard') {
    return (
      <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { rank: 1, name: 'Priya S.',  pts: '8,240', color: '#fbbf24' },
          { rank: 2, name: 'Arjun K.',  pts: '7,885', color: '#9ca3af' },
          { rank: 3, name: 'Rahul M.', pts: '7,220', color: '#c97a22' },
        ].map(r => (
          <div key={r.rank} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '5px 9px', borderRadius: 7,
            background: 'rgba(255,255,255,0.03)',
          }}>
            <span style={{ color: r.color, fontWeight: 700, fontSize: 12, width: 18 }}>#{r.rank}</span>
            <span style={{ flex: 1, color: '#d1d5db', fontSize: 12 }}>{r.name}</span>
            <span style={{ color: CYAN, fontWeight: 600, fontSize: 12 }}>{r.pts}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'certificate') {
    return (
      <div style={{ ...wrap }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
          border: '1px solid rgba(124,58,237,0.22)',
          borderRadius: 9, padding: '10px 12px',
          position: 'relative',
        }}>
          <div style={{ fontSize: 9.5, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
            Certificate of Completion
          </div>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: 13, color: '#fff', fontWeight: 700,
          }}>Full Stack Development</div>
          <div style={{ fontSize: 10.5, color: CYAN, marginTop: 3 }}>GENOIS · Verified · 2025</div>
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 30, height: 30, borderRadius: '50%',
            background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#fff', fontWeight: 700,
          }}>✓</div>
        </div>
      </div>
    );
  }

  return null;
}
