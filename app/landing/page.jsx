import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';

const PURPLE = '#7c3aed';
const PURPLE_LIGHT = '#8b5cf6';
const CYAN = '#06b6d4';
const BG = '#0a0a0a';
const BG2 = '#111111';
const BG3 = '#161616';

const STATS = [
  { value: '500+', label: 'Students' },
  { value: '10',   label: 'Domains' },
  { value: '365',  label: 'Day Roadmap' },
  { value: 'AI',   label: 'Powered' },
];

const COLLEGES = [
  'IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'IIIT Hyderabad',
  'VTU', 'RGPV', 'SPPU', 'COEP', 'DTU', 'VIT Vellore',
];

const STEPS = [
  {
    icon: '◎',
    title: 'Choose your domain',
    desc: 'Pick from 10 career paths. From Full Stack to Cybersecurity, every roadmap is tuned to industry hiring patterns.',
  },
  {
    icon: '◈',
    title: 'Follow your AI roadmap',
    desc: 'Daily plan with videos, notes, coding problems and tests. Generated and adapted to your level.',
  },
  {
    icon: '◆',
    title: 'Earn verified badges',
    desc: 'Pass proctored skill tests, build projects, and graduate with credentials placement teams trust.',
  },
];

const FEATURES = [
  { icon: '◐', title: '365-Day AI Roadmap',     desc: 'Personalised daily plan with videos, articles, projects and problems.' },
  { icon: '◑', title: 'Skill Badge System',     desc: 'Proctored exams with 60-day validity. Verifiable on your public profile.' },
  { icon: '◉', title: 'DSA Visualizer',         desc: '30 algorithms with step-by-step animation. See how it actually works.' },
  { icon: '◇', title: 'AI Mentor 24/7',         desc: 'Stuck on a concept? Ask the mentor for hints, code reviews and next steps.' },
  { icon: '◆', title: 'Leaderboards & Duels',   desc: 'College war, domain war, 1v1 duels. Climb the ranks every day.' },
  { icon: '◈', title: 'Verified Certificates',  desc: 'Generate verifiable PDFs that recruiters can validate in one click.' },
];

const DOMAINS = [
  { slug: 'fullstack',    name: 'Full Stack',       icon: '⬡', days: '365 days' },
  { slug: 'dsa',          name: 'DSA',              icon: '◈', days: '365 days' },
  { slug: 'cybersecurity',name: 'Cybersecurity',    icon: '◆', days: '365 days' },
  { slug: 'aiml',         name: 'AI & ML',          icon: '◉', days: '365 days' },
  { slug: 'devops',       name: 'DevOps',           icon: '▷', days: '365 days' },
  { slug: 'android',      name: 'Android',          icon: '▣', days: '365 days' },
  { slug: 'datascience',  name: 'Data Science',     icon: '◇', days: '365 days' },
  { slug: 'blockchain',   name: 'Blockchain',       icon: '◎', days: '365 days' },
  { slug: 'gamedev',      name: 'Game Dev',         icon: '○', days: '365 days' },
  { slug: 'systemdesign', name: 'System Design',    icon: '▦', days: '365 days' },
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
    college: 'IIT Roorkee · Final Year',
    domain: 'Full Stack Development',
    stars: 5,
    quote: 'The daily roadmap pulled me out of tutorial hell. In 90 days I shipped 3 production apps and landed an offer at a Bangalore SaaS.',
  },
  {
    name: 'Priya Sharma',
    college: 'NIT Surathkal · 3rd Year',
    domain: 'AI & Machine Learning',
    stars: 5,
    quote: 'AI mentor answers my doubts at 2 AM. The badge system gave me something concrete to put on my resume — not just a course certificate.',
  },
  {
    name: 'Arjun Kashyap',
    college: 'VIT Vellore · 2nd Year',
    domain: 'DSA & System Design',
    stars: 5,
    quote: 'I went from 0 LeetCode solves to 250+ in four months. The DSA visualizer made trees and graphs finally click.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: BG, color: '#e5e7eb', minHeight: '100vh', overflowX: 'hidden' }}>

      <LandingNavbar />

      {/* ───────────── HERO ───────────── */}
      <section className="gen-hero gen-grid-bg" style={{
        position: 'relative',
        padding: '120px 28px 100px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* purple glow */}
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800, borderRadius: '50%', pointerEvents: 'none',
          background: `radial-gradient(circle, ${PURPLE}33 0%, transparent 60%)`,
          filter: 'blur(40px)', zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto' }}>
          <div className="gen-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
            color: PURPLE_LIGHT, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-outfit), sans-serif',
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
            Now live · 30-day free trial
          </div>

          <h1 className="gen-fade-up gen-fade-up-d1 gen-hero-h1" style={{
            fontFamily: 'var(--font-syne), sans-serif', fontSize: 64, fontWeight: 800,
            lineHeight: 1.05, letterSpacing: -1.5, margin: '0 0 22px',
            color: '#fff',
          }}>
            The Career OS for<br />
            <span style={{
              backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT} 0%, ${CYAN} 100%)`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>Engineering Students</span>
          </h1>

          <p className="gen-fade-up gen-fade-up-d2" style={{
            fontSize: 19, lineHeight: 1.6, color: '#9ca3af', maxWidth: 680,
            margin: '0 auto 40px', fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            365-day structured roadmap, AI mentor, verified skill badges, and placement prep —
            all in one platform.
          </p>

          <div className="gen-fade-up gen-fade-up-d3" style={{
            display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: 64,
          }}>
            <Link href="/signup" className="gen-cta-pulse" style={{
              padding: '15px 32px', borderRadius: 12, textDecoration: 'none',
              backgroundImage: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
              color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 15,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Start 30-Day Free Trial →
            </Link>
            <a href="#how" style={{
              padding: '15px 32px', borderRadius: 12, textDecoration: 'none',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#e5e7eb', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600, fontSize: 15,
            }}>Watch Demo</a>
          </div>

          {/* stats */}
          <div className="gen-fade-up gen-fade-up-d4" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 24, maxWidth: 720, margin: '0 auto',
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-syne), sans-serif', fontSize: 36, fontWeight: 800,
                  backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── SOCIAL PROOF ───────────── */}
      <section style={{
        padding: '40px 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: BG2,
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, fontFamily: 'var(--font-outfit), sans-serif' }}>
          Trusted by students from
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div className="gen-marquee">
            {[...COLLEGES, ...COLLEGES].map((c, i) => (
              <div key={i} style={{
                color: '#9ca3af', fontSize: 16, fontFamily: 'var(--font-syne), sans-serif', fontWeight: 600,
                whiteSpace: 'nowrap', opacity: 0.7,
              }}>{c}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how" className="gen-section" style={{ padding: '100px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader eyebrow="How it works" title="Three steps to job-ready" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24, marginTop: 56,
        }}>
          {STEPS.map((s, i) => (
            <div key={s.title} className="gen-card" style={{
              padding: 32, borderRadius: 16,
              background: BG2, border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 24, right: 24,
                fontFamily: 'var(--font-syne), sans-serif', fontSize: 56, fontWeight: 800,
                color: 'rgba(255,255,255,0.04)',
              }}>0{i + 1}</div>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: `linear-gradient(135deg, ${PURPLE}22, ${CYAN}22)`,
                border: `1px solid ${PURPLE}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, color: PURPLE_LIGHT, marginBottom: 20,
              }}>{s.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-syne), sans-serif', fontSize: 20, fontWeight: 700, color: '#fff',
                margin: '0 0 10px',
              }}>{s.title}</h3>
              <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section id="features" className="gen-section" style={{
        padding: '100px 28px', background: BG2, borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader eyebrow="What you get" title="Everything you need to land your first offer" />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20, marginTop: 56,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} className="gen-glow" style={{
                padding: 28, borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `linear-gradient(135deg, ${PURPLE}33, ${CYAN}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#fff', marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-syne), sans-serif', fontSize: 17, fontWeight: 700, color: '#fff',
                  margin: '0 0 8px',
                }}>{f.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── DOMAINS ───────────── */}
      <section id="domains" className="gen-section" style={{ padding: '100px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader eyebrow="10 domains" title="Choose your career path" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginTop: 56,
        }}>
          {DOMAINS.map(d => (
            <Link key={d.slug} href="/signup" className="gen-card" style={{
              padding: 22, borderRadius: 14, textDecoration: 'none',
              background: BG2, border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${PURPLE}33, ${CYAN}33)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff',
              }}>{d.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>{d.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{d.days}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── PRICING ───────────── */}
      <section id="pricing" className="gen-section" style={{
        padding: '100px 28px', background: BG2,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader eyebrow="Pricing" title="Choose the plan that fits your hustle" />
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#fbbf24', fontSize: 12, fontWeight: 600, marginTop: -16, marginBottom: 32,
          }}>⚡ Payments launching soon — start your free trial today</div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20, marginTop: 24,
          }}>
            {PLANS.map(p => (
              <div key={p.key} style={{
                padding: 28, borderRadius: 16, position: 'relative',
                background: p.highlight ? 'linear-gradient(180deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))' : 'rgba(255,255,255,0.02)',
                border: p.highlight ? `1px solid ${PURPLE}` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: p.highlight ? `0 8px 32px ${PURPLE}33` : 'none',
              }}>
                {p.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 12px', borderRadius: 999,
                    background: PURPLE, color: '#fff', fontSize: 11, fontWeight: 700,
                    fontFamily: 'var(--font-syne), sans-serif', letterSpacing: 0.5,
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
                      <span style={{ color: CYAN, marginTop: 2 }}>✓</span>
                      <span>{f}</span>
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

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section className="gen-section" style={{ padding: '100px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader eyebrow="What students say" title="From confusion to confidence" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20, marginTop: 56,
        }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="gen-card" style={{
              padding: 28, borderRadius: 16,
              background: BG2, border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14, color: '#fbbf24' }}>
                {'★'.repeat(t.stars)}
              </div>
              <p style={{
                color: '#d1d5db', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px',
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, color: '#fff', fontSize: 16,
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, color: '#fff', fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{t.college} · {t.domain}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="gen-section" style={{ padding: '100px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at center, ${PURPLE}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative',
          padding: '64px 40px', borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(6,182,212,0.05))',
          border: `1px solid ${PURPLE}55`,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontSize: 40, fontWeight: 800, color: '#fff',
            margin: '0 0 16px', lineHeight: 1.15,
          }}>
            Start your <span style={{
              backgroundImage: `linear-gradient(135deg, ${PURPLE_LIGHT}, ${CYAN})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>30-day Dominator</span> trial
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 16, margin: '0 0 32px' }}>
            Full access. Cancel anytime. No credit card required.
          </p>
          <Link href="/signup" className="gen-cta-pulse" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 36px', borderRadius: 12, textDecoration: 'none',
            backgroundImage: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
            color: '#fff', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 16,
          }}>Start Free Trial →</Link>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
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
            { label: 'Features', href: '#features' },
            { label: 'Pricing',  href: '#pricing' },
            { label: 'Domains',  href: '#domains' },
            { label: 'Leaderboard', href: '/leaderboard' },
          ]} />
          <FooterCol title="Company" links={[
            { label: 'About', href: '/blog' },
            { label: 'Blog', href: '/blog' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          color: '#6b7280', fontSize: 12,
        }}>
          <div>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', padding: '5px 14px', borderRadius: 999,
        background: 'rgba(6,182,212,0.1)', border: `1px solid ${CYAN}44`,
        color: CYAN, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
        marginBottom: 18, fontFamily: 'var(--font-outfit), sans-serif',
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: 'var(--font-syne), sans-serif', fontSize: 40, fontWeight: 800, color: '#fff',
        margin: 0, lineHeight: 1.1, letterSpacing: -0.5,
      }}>{title}</h2>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: 13, color: '#fff',
        marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase',
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
