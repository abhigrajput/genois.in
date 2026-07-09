'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import {
  Rocket, Check, Zap, Calendar, Trophy, Bot, Code2, Award, BarChart3, TrendingUp, Mic, Flame,
} from 'lucide-react';

// ─── "Focused Intensity" palette ─────────────────────────────────────────────
const BG = '#0a0a0f';
const BG2 = '#12121a';
const BG3 = '#1a1a26';
const TEAL = '#00d9a3';
const TEAL_LT = '#2ee6b0';
const TEAL_DK = '#00b389';
const CORAL = '#ff6b4a';
const AMBER = '#ffb020';
const TEXT = '#e8e8ed';
const MUTED = '#8a8a99';

// ─── Data ───────────────────────────────────────────────────────────────────
const STEPS = [
  { n:'01', title:'60 seconds',    time:'just 1 min',    desc:'Tell us your target company and domain. That is the whole setup.' },
  { n:'02', title:'Daily 30 mins', time:'30 min / day',  desc:'Follow the AI-generated task waiting for you each morning.' },
  { n:'03', title:'Get placed',    time:'day 1 → offer', desc:'Beat your college rank, earn verified badges, walk into the interview ready.' },
];

const FEATURES = [
  { icon:Bot,         title:'AI Mentor',           desc:'Reads your real test and coding performance, then adapts every answer to your exact level. Not a generic chatbot — a mentor that knows where you struggle.', large:true },
  { icon:Calendar,    title:'Daily Roadmap',       desc:'A bite-sized daily plan that adapts to your pace.' },
  { icon:Code2,       title:'Coding Challenges',   desc:'Daily problems with AI code review and hints.' },
  { icon:Award,       title:'Skill Badges',        desc:'Proctored, verifiable credentials recruiters trust.' },
  { icon:BarChart3,   title:'Leaderboard',         desc:'Compete with your college and climb the ranks.' },
  { icon:TrendingUp,  title:'Progress Analytics',  desc:'Daily graphs and score breakdowns of your growth.' },
];

const PLANS = [
  { name:'Spectator', price:'₹0',   cadence:'/forever', desc:'Explore the platform free.',     features:['30-day full trial','1 career domain','Daily AI roadmap','Daily coding challenge'], cta:'Start Free',       highlight:false },
  { name:'Player',    price:'₹199', cadence:'/month',   desc:'Get serious about prep.',        features:['Everything in Spectator','3 domains at once','Daily + weekly tests','College leaderboard'],  cta:'Choose Player',    highlight:false },
  { name:'Performer', price:'₹299', cadence:'/month',   desc:'The complete placement engine.', features:['Everything in Player','All 10 domains','AI Mentor — 5 modes','Job-Ready badge'],            cta:'Choose Performer', highlight:true  },
  { name:'Dominator', price:'₹499', cadence:'/month',   desc:'For elite placement goals.',     features:['Everything in Performer','Company-specific prep','Priority mentor escalation','Shareable report'], cta:'Go Dominator', highlight:false },
];

// ─── Scroll reveal ──────────────────────────────────────────────────────────
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

// ─── Eyebrow + animated accent line ───────────────────────────────────────────
function Eyebrow({ children, align = 'left' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap:12, marginBottom:18 }}>
      <span className="gen-eyebrow">{children}</span>
      <div className="gen-accent-line" />
    </div>
  );
}

// ─── Product mockup card ────────────────────────────────────────────────────
function ProductCard() {
  return (
    <div style={{
      background:BG2, borderRadius:20, border:`1px solid rgba(0,217,163,0.22)`,
      padding:'22px 22px 24px', width:'100%', maxWidth:400,
      boxShadow:'0 40px 90px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,217,163,0.05)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:`linear-gradient(135deg, ${TEAL}, ${TEAL_DK})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-heading)', fontWeight:700, color:BG, fontSize:16 }}>R</div>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:TEXT, fontSize:15 }}>Rahul K.</div>
            <div style={{ fontSize:11.5, color:MUTED, fontFamily:'var(--font-mono)', marginTop:1 }}>Day 47 · DSA</div>
          </div>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20, background:'rgba(255,176,32,0.12)', border:'1px solid rgba(255,176,32,0.3)', color:AMBER, fontSize:12, fontWeight:700, fontFamily:'var(--font-mono)' }}><Flame size={13} strokeWidth={2} color={AMBER} /> 8</span>
      </div>

      <div className="gen-eyebrow" style={{ fontSize:9.5, letterSpacing:2, marginBottom:8 }}>TODAY&apos;S MISSION</div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7 }}>
        <span style={{ fontSize:13, color:'#cbccd6', fontWeight:600 }}>3 / 5 tasks done today</span>
        <span style={{ fontSize:11, color:MUTED, fontFamily:'var(--font-mono)' }}>60%</span>
      </div>
      <div style={{ height:7, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:18 }}>
        <div style={{ height:'100%', width:'60%', borderRadius:4, background:`linear-gradient(90deg, ${TEAL}, ${TEAL_LT})` }} />
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {[{ l:'Video', done:true }, { l:'Resource', done:true }, { l:'Code', done:false }].map(t => (
          <span key={t.l} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:20, fontSize:12.5, fontWeight:600, fontFamily:'var(--font-body)',
            background: t.done ? 'rgba(0,217,163,0.15)' : TEAL,
            color: t.done ? TEAL : BG,
            border: t.done ? '1px solid rgba(0,217,163,0.35)' : `1px solid ${TEAL}`,
          }}>{t.l} {t.done ? <Check size={13} strokeWidth={2.5} /> : '→'}</span>
        ))}
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1, background:BG3, borderRadius:12, padding:'12px 14px', border:'1px solid rgba(0,217,163,0.1)' }}>
          <div className="gen-eyebrow" style={{ fontSize:9.5, letterSpacing:1, marginBottom:4 }}>SCORE</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--font-mono)', fontSize:19, fontWeight:800, color:TEAL }}><Zap size={17} strokeWidth={2} color={TEAL} /> 5,385</div>
        </div>
        <div style={{ flex:1, background:BG3, borderRadius:12, padding:'12px 14px', border:'1px solid rgba(0,217,163,0.1)' }}>
          <div className="gen-eyebrow" style={{ fontSize:9.5, letterSpacing:1, marginBottom:4, color:CORAL }}>RANK</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'var(--font-mono)', fontSize:19, fontWeight:800, color:TEXT }}><Trophy size={17} strokeWidth={2} color={CORAL} /> #12</div>
        </div>
      </div>
    </div>
  );
}

// ─── Centered section header ──────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom:48, maxWidth:640 }} data-reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(28px,4.5vw,44px)', fontWeight:700, color:TEXT, margin:0, lineHeight:1.05, letterSpacing:-1 }}>{title}</h2>
      {sub && <p style={{ color:MUTED, fontSize:15.5, marginTop:16, marginBottom:0, maxWidth:560, lineHeight:1.6 }}>{sub}</p>}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();
  const heroRef = useRef(null);

  // Cursor-following ambient glow (desktop, respects reduced motion via CSS)
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
    <div style={{ background:BG, color:TEXT, minHeight:'100vh', overflowX:'hidden' }}>
      <LandingNavbar />

      <main>
      {/* ═══ HERO — asymmetric ═══ */}
      <section ref={heroRef} style={{ position:'relative', padding:'64px 28px 72px', overflow:'hidden' }}>
        <div className="gen-hero-glow" />
        {/* Bold geometric accent — large teal ring, offset behind the mockup */}
        <div style={{ position:'absolute', top:40, right:'-6%', width:520, height:520, borderRadius:'50%', border:'1px solid rgba(0,217,163,0.14)', boxShadow:'inset 0 0 120px rgba(0,217,163,0.06)', pointerEvents:'none', zIndex:0 }} />
        {/* Diagonal coral streak */}
        <div style={{ position:'absolute', bottom:-60, left:'-10%', width:'55%', height:2, background:`linear-gradient(90deg, transparent, ${CORAL}55, transparent)`, transform:'rotate(-8deg)', pointerEvents:'none', zIndex:0 }} />

        <div className="gen-hero-asym" style={{ position:'relative', zIndex:1, paddingTop:20 }}>
          {/* Left — copy */}
          <div className="gen-hero-copy">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:999, background:'rgba(255,107,74,0.1)', border:`1px solid ${CORAL}55`, color:CORAL, fontSize:12, fontWeight:600, marginBottom:26, fontFamily:'var(--font-mono)', letterSpacing:0.5 }}>
              <Rocket size={13} strokeWidth={2} color={CORAL} /> JUST LAUNCHED · FIRST 100 SEATS
            </div>
            <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(46px,8vw,88px)', fontWeight:700, lineHeight:0.95, letterSpacing:-2, margin:'0 0 22px', color:TEXT }}>
              Get placed.<br />
              <span style={{ color:TEAL }}>Not just</span> prepared.
            </h1>
            <p style={{ fontSize:17.5, color:'#b6b6c2', lineHeight:1.6, margin:'0 0 18px', maxWidth:500 }}>
              Your first coding challenge is ready in <span style={{ color:TEXT, fontWeight:700 }}>60 seconds</span> — built for <span style={{ color:TEXT, fontWeight:600 }}>your college</span>, <span style={{ color:TEXT, fontWeight:600 }}>your target company</span>, <span style={{ color:TEXT, fontWeight:600 }}>your timeline</span>.
            </p>
            <p style={{ fontSize:15, color:'#cbccd6', lineHeight:1.6, margin:'0 0 32px', maxWidth:500, fontWeight:500 }}>
              GENOIS learns <span style={{ color:TEAL_LT }}>your level</span>, <span style={{ color:TEAL_LT }}>your pace</span>, and <span style={{ color:TEAL_LT }}>your weak spots</span> — then adapts every single day.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:30 }}>
              <Link href="/signup" className="gen-press" style={{
                padding:'15px 30px', borderRadius:12, textDecoration:'none',
                background:TEAL, color:BG,
                fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15,
                display:'inline-flex', alignItems:'center', gap:8,
                boxShadow:'0 12px 34px rgba(0,217,163,0.32)',
              }}>Get My Free Roadmap →</Link>
              <a href="#how" className="gen-press" style={{
                padding:'15px 26px', borderRadius:12, textDecoration:'none',
                background:'transparent', border:`1px solid rgba(0,217,163,0.3)`, color:TEAL_LT,
                fontFamily:'var(--font-heading)', fontWeight:600, fontSize:15,
              }}>See how it works</a>
            </div>
            <div style={{ display:'flex', gap:'10px 20px', flexWrap:'wrap' }}>
              {['Ready in 60 seconds','Free forever','No credit card'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:MUTED, whiteSpace:'nowrap' }}>
                  <span className="gen-bullet" />{t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — product card, offset + rotated over the ring */}
          <div className="gen-hero-mockup" style={{ display:'flex', justifyContent:'center', transform:'rotate(2deg)' }}>
            <ProductCard />
          </div>
        </div>
      </section>

      {/* ═══ FEATURE BAR ═══ */}
      <div style={{ borderTop:'1px solid rgba(0,217,163,0.1)', borderBottom:'1px solid rgba(0,217,163,0.1)', background:'rgba(0,217,163,0.03)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px 18px', flexWrap:'wrap', padding:'16px 24px' }}>
          {['AI-Powered','10 Domains','Voice Interview','Personalized Roadmap'].map((p, i, arr) => (
            <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:18, whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:13.5, color:'#a6a6b3', letterSpacing:0.4 }}>
              {p}
              {i < arr.length - 1 && <span className="gen-bullet" style={{ opacity:0.7 }} />}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ HOW IT WORKS — horizontal timeline ═══ */}
      <section id="how" style={{ padding:'88px 28px', maxWidth:1100, margin:'0 auto' }}>
        <SectionHeader eyebrow="How it works" title="Three steps to your offer" />
        <div className="gen-timeline">
          {STEPS.map((s, i) => (
            <div key={s.n} data-reveal data-reveal-delay={i+1} style={{ position:'relative' }}>
              {/* Node on the line */}
              <div style={{ width:54, height:54, borderRadius:14, background:BG3, border:`1px solid rgba(0,217,163,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:TEAL, position:'relative', zIndex:1, marginBottom:20 }}>
                {s.n}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:1.5, color:CORAL, marginBottom:8, textTransform:'uppercase' }}>{s.time}</div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:21, fontWeight:700, color:TEXT, margin:'0 0 10px', letterSpacing:-0.5 }}>{s.title}</h3>
              <p style={{ color:'#a6a6b3', fontSize:14.5, lineHeight:1.6, margin:0, maxWidth:300 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES — bento ═══ */}
      <section id="features" style={{ padding:'88px 28px', background:BG2, borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <SectionHeader eyebrow="Everything you need" title="One platform. Every tool to get hired." sub="No more juggling ten tabs. Your entire placement prep, in one focused workspace." />

          {/* The moat: Voice Mock Interview */}
          <Link href="/signup" data-reveal className="gen-press" style={{
            display:'flex', alignItems:'center', gap:20, padding:'24px 26px', marginBottom:16,
            borderRadius:18, textDecoration:'none', flexWrap:'wrap',
            background:`linear-gradient(120deg, rgba(255,107,74,0.12), ${BG3})`, border:`1px solid ${CORAL}44`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:CORAL }} />
            <div style={{ width:64, height:64, borderRadius:16, flexShrink:0, background:`linear-gradient(135deg, ${CORAL}, #e6512f)`, display:'flex', alignItems:'center', justifyContent:'center' }}><Mic size={30} strokeWidth={1.8} color="#fff" /></div>
            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <h3 style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:TEXT, margin:0, letterSpacing:-0.5 }}>Voice Mock Interview</h3>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:1, color:CORAL, background:'rgba(255,107,74,0.14)', border:`1px solid ${CORAL}55`, borderRadius:6, padding:'3px 7px' }}>NEW · ONLY ON GENOIS</span>
              </div>
              <p style={{ color:MUTED, fontSize:14, lineHeight:1.6, margin:0 }}>Practice speaking your answers out loud. Our AI plays a tough interviewer and scores your clarity, accuracy, and confidence — the way a real panel would.</p>
            </div>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14, color:CORAL, whiteSpace:'nowrap' }}>Try it free →</div>
          </Link>

          <div className="gen-bento">
            {FEATURES.map((f, i) => (
              <div key={f.title} data-reveal data-reveal-delay={(i % 3) + 1}
                className={`gen-card ${f.large ? 'gen-bento-lg' : ''}`}
                style={{
                  padding:f.large ? '30px 28px' : '24px 22px', borderRadius:16,
                  background: f.large ? `linear-gradient(160deg, rgba(0,217,163,0.08), ${BG})` : BG,
                  border:`1px solid ${f.large ? 'rgba(0,217,163,0.28)' : 'rgba(0,217,163,0.1)'}`,
                  display:'flex', flexDirection:'column', justifyContent: f.large ? 'flex-end' : 'flex-start',
                }}>
                <div style={{ width:f.large ? 60 : 46, height:f.large ? 60 : 46, borderRadius:12, background:'rgba(0,217,163,0.1)', border:'1px solid rgba(0,217,163,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:f.large ? 22 : 14 }}><f.icon size={f.large ? 28 : 22} strokeWidth={1.6} color={TEAL_LT} /></div>
                {f.large && <span className="gen-eyebrow" style={{ marginBottom:10 }}>The moat</span>}
                <h3 style={{ fontFamily:'var(--font-heading)', fontSize:f.large ? 26 : 16.5, fontWeight:700, color:TEXT, margin:'0 0 8px', letterSpacing:-0.5 }}>{f.title}</h3>
                <p style={{ color:'#a6a6b3', fontSize:f.large ? 15 : 13.5, lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER STORY ═══ */}
      <section style={{ padding:'88px 28px' }}>
        <div data-reveal style={{ maxWidth:760, margin:'0 auto', display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex:'0 0 4px', alignSelf:'stretch', minHeight:120, width:4, borderRadius:2, background:`linear-gradient(${TEAL}, ${CORAL})` }} />
          <div style={{ flex:1, minWidth:260 }}>
            <Eyebrow>Why we built this</Eyebrow>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(24px,3.5vw,34px)', fontWeight:700, color:TEXT, margin:'0 0 18px', lineHeight:1.15, letterSpacing:-0.5 }}>
              Built by a student, for students
            </h2>
            <p style={{ color:'#cbccd6', fontSize:16, lineHeight:1.7, margin:'0 0 24px' }}>
              GENOIS is built by an engineering student who faced the same placement pressure you&apos;re facing now. No corporate BS. No fake promises. Just a tool that actually helps you prepare — one day at a time.
            </p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:13 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg, ${TEAL}, ${TEAL_DK})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-heading)', fontWeight:700, color:BG, fontSize:15 }}>L</div>
              <div>
                <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, color:TEXT, fontSize:15 }}>Laxshu R.</div>
                <div style={{ fontSize:12, color:MUTED, marginTop:2, fontFamily:'var(--font-mono)' }}>Founder, GENOIS · KLE Hubballi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding:'88px 28px', background:BG2, borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <SectionHeader eyebrow="Pricing" title="Start free. Upgrade when you're ready." />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:18 }}>
            {PLANS.map((p, i) => (
              <div key={p.name} data-reveal data-reveal-delay={(i % 4) + 1} style={{
                padding:'28px 24px', borderRadius:18, position:'relative', background: p.highlight ? 'rgba(0,217,163,0.06)' : BG,
                border:`1px solid ${p.highlight ? 'rgba(0,217,163,0.45)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: p.highlight ? '0 0 44px rgba(0,217,163,0.12)' : 'none',
                display:'flex', flexDirection:'column',
              }}>
                {p.highlight && <div style={{ position:'absolute', top:-11, left:24, padding:'4px 12px', borderRadius:999, background:TEAL, color:BG, fontSize:10, fontWeight:700, fontFamily:'var(--font-mono)', letterSpacing:1, whiteSpace:'nowrap' }}>MOST POPULAR</div>}
                <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:TEXT, marginBottom:6 }}>{p.name}</div>
                <div style={{ fontSize:13, color:'#a6a6b3', marginBottom:18, minHeight:36, lineHeight:1.4 }}>{p.desc}</div>
                <div style={{ marginBottom:20 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:38, fontWeight:800, color:TEXT, letterSpacing:-1 }}>{p.price}</span>
                  <span style={{ color:MUTED, fontSize:14, marginLeft:4 }}>{p.cadence}</span>
                </div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', flex:1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display:'flex', gap:10, marginBottom:11, color:'#cbccd6', fontSize:13, lineHeight:1.4, alignItems:'flex-start' }}>
                      <span className="gen-bullet" style={{ marginTop:6 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="gen-press" style={{
                  display:'block', textAlign:'center', padding:'12px 18px', borderRadius:10,
                  background: p.highlight ? TEAL : 'rgba(255,255,255,0.05)',
                  color: p.highlight ? BG : TEXT,
                  fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14,
                  border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  textDecoration:'none', boxShadow: p.highlight ? '0 8px 22px rgba(0,217,163,0.3)' : 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <p style={{ display:'inline-flex', alignItems:'center', gap:6, color:MUTED, fontSize:12.5, marginTop:22 }}>
            <Zap size={13} strokeWidth={2} color={AMBER} /> Payments launching soon — start your 30-day free trial today, no card required.
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding:'96px 28px' }}>
        <div data-reveal style={{
          maxWidth:820, margin:'0 auto', position:'relative', overflow:'hidden',
          padding:'56px 44px', borderRadius:24, background:BG2,
          border:'1px solid rgba(0,217,163,0.25)',
          boxShadow:'0 0 60px rgba(0,217,163,0.1)',
        }}>
          <div style={{ position:'absolute', top:-80, right:-40, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,74,0.14), transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative' }}>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(28px,4.5vw,40px)', fontWeight:700, color:TEXT, margin:'0 0 14px', lineHeight:1.05, letterSpacing:-1, maxWidth:520 }}>
              Don&apos;t open this tomorrow. Start now.
            </h2>
            <p style={{ color:'#a6a6b3', fontSize:16, margin:'0 0 30px', maxWidth:440 }}>
              Your personalized placement roadmap is ready. No credit card, no catch.
            </p>
            <Link href="/signup" className="gen-press" style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'16px 40px', borderRadius:12, textDecoration:'none',
              background:TEAL, color:BG,
              fontFamily:'var(--font-heading)', fontWeight:700, fontSize:16,
              boxShadow:'0 14px 36px rgba(0,217,163,0.34)',
            }}>Start My Journey — It&apos;s Free →</Link>
          </div>
        </div>
      </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:'44px 28px 28px', background:BG, borderTop:'1px solid rgba(0,217,163,0.1)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:28 }}>
          <div style={{ maxWidth:280 }}>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:22, marginBottom:10, letterSpacing:-0.5 }}>
              <span style={{ color:TEAL }}>GEN</span><span style={{ color:TEXT }}>OIS</span>
            </div>
            <div style={{ color:MUTED, fontSize:13, lineHeight:1.6 }}>The career operating system for engineering students.</div>
          </div>
          <div style={{ display:'flex', gap:48, flexWrap:'wrap' }}>
            {[
              { title:'Product', links:[{ l:'How it works', h:'#how' },{ l:'Features', h:'#features' },{ l:'Pricing', h:'#pricing' },{ l:'Blog', h:'/blog' }] },
              { title:'Company', links:[{ l:'Login', h:'/login' },{ l:'Sign up', h:'/signup' },{ l:'Privacy', h:'/privacy' },{ l:'Terms', h:'/terms' }] },
            ].map(col => (
              <div key={col.title}>
                <div className="gen-eyebrow" style={{ marginBottom:14 }}>{col.title}</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:9 }}>
                  {col.links.map(l => (
                    <li key={l.l}><Link href={l.h} style={{ color:'#a6a6b3', textDecoration:'none', fontSize:13 }}>{l.l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1100, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ color:MUTED, fontSize:12 }}>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div style={{ color:TEAL_LT, fontSize:12.5, fontWeight:500, fontFamily:'var(--font-mono)' }}>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}
