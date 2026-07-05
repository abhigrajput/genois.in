'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';
import {
  Rocket, Check, Zap, Calendar, Trophy, Bot, Code2, Award, BarChart3, TrendingUp, Mic, Flame,
} from 'lucide-react';

// ─── Theme ──────────────────────────────────────────────────────────────────
const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#818cf8';
const PURPLE_DARK = '#4f46e5';
const BG = '#0d0d14';
const BG2 = '#13131f';
const BG3 = '#1a1a2e';
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const MUTED = '#8b93a1';
const WHITE = '#e2e8f0';

// ─── Data ───────────────────────────────────────────────────────────────────
const STEPS = [
  { icon:Zap,      title:'60 seconds',    time:'just 1 min',    desc:'Tell us your target company and domain.' },
  { icon:Calendar, title:'Daily 30 mins', time:'30 min / day',  desc:'Follow your AI-generated daily task.' },
  { icon:Trophy,   title:'Get placed',    time:'day 1 → offer', desc:'Beat your college rank, earn verified badges.' },
];

const FEATURES = [
  { icon:Calendar,    title:'Daily Roadmap', desc:'A bite-sized daily plan that adapts to your level and pace.' },
  { icon:Bot,         title:'AI Mentor', desc:'AI-powered and personalized for you — it reads your real test and coding performance, then adapts every answer to your level.' },
  { icon:Code2,       title:'Coding Challenges', desc:'Daily problems with AI code review and hints.' },
  { icon:Award,       title:'Skill Badges', desc:'Earn proctored, verifiable credentials recruiters trust.' },
  { icon:BarChart3,   title:'Leaderboard', desc:'Compete with your college and climb the rankings.' },
  { icon:TrendingUp,  title:'Progress Analytics', desc:'See your growth with daily graphs and score breakdowns.' },
];

const PLANS = [
  { name:'Spectator', price:'₹0',   cadence:'/forever', desc:'Explore the platform free.',           features:['30-day full trial','1 career domain','Daily AI roadmap','Daily coding challenge'], cta:'Start Free',       highlight:false },
  { name:'Player',    price:'₹199', cadence:'/month',   desc:'Get serious about prep.',              features:['Everything in Spectator','3 domains at once','Daily + weekly tests','College leaderboard'],  cta:'Choose Player',    highlight:false },
  { name:'Performer', price:'₹299', cadence:'/month',   desc:'The complete placement engine.',       features:['Everything in Player','All 10 domains','AI Mentor — 5 modes','Job-Ready badge'],            cta:'Choose Performer', highlight:false },
  { name:'Dominator', price:'₹499', cadence:'/month',   desc:'For elite placement goals.',           features:['Everything in Performer','Company-specific prep','Priority mentor escalation','Shareable report'], cta:'Go Dominator', highlight:false },
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

// ─── Product mockup card ────────────────────────────────────────────────────
function ProductCard() {
  return (
    <div style={{
      background:BG2, borderRadius:20, border:'1px solid rgba(99,102,241,0.22)',
      padding:'22px 22px 24px', width:'100%', maxWidth:400,
      boxShadow:'0 30px 80px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.04)',
    }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, color:'#fff', fontSize:16 }}>R</div>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:WHITE, fontSize:15 }}>Rahul K.</div>
            <div style={{ fontSize:11.5, color:MUTED, fontFamily:'JetBrains Mono,monospace', marginTop:1 }}>Day 47 · DSA</div>
          </div>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', color:AMBER, fontSize:12, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}><Flame size={13} strokeWidth={2} color={AMBER} /> 8</span>
      </div>

      {/* Mission label */}
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9.5, letterSpacing:2, color:PURPLE_LIGHT, marginBottom:8 }}>TODAY&apos;S MISSION</div>

      {/* Progress */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7 }}>
        <span style={{ fontSize:13, color:'#cbd5e1', fontWeight:600 }}>3 / 5 tasks done today</span>
        <span style={{ fontSize:11, color:MUTED, fontFamily:'JetBrains Mono,monospace' }}>60%</span>
      </div>
      <div style={{ height:7, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:18 }}>
        <div style={{ height:'100%', width:'60%', borderRadius:4, background:`linear-gradient(90deg, ${PURPLE}, ${PURPLE_LIGHT})` }} />
      </div>

      {/* Task pills */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {[{ l:'Video', done:true }, { l:'Resource', done:true }, { l:'Code', done:false }].map(t => (
          <span key={t.l} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:20, fontSize:12.5, fontWeight:600, fontFamily:'Outfit,sans-serif',
            background: t.done ? 'rgba(99,102,241,0.15)' : '#fff',
            color: t.done ? PURPLE_LIGHT : '#0d0d14',
            border: t.done ? '1px solid rgba(99,102,241,0.35)' : '1px solid #fff',
          }}>{t.l} {t.done ? <Check size={13} strokeWidth={2.5} /> : '→'}</span>
        ))}
      </div>

      {/* Stats footer */}
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1, background:BG3, borderRadius:12, padding:'12px 14px', border:'1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ fontSize:9.5, color:MUTED, fontFamily:'JetBrains Mono,monospace', letterSpacing:1, marginBottom:4 }}>SCORE</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'JetBrains Mono,monospace', fontSize:19, fontWeight:800, color:PURPLE }}><Zap size={17} strokeWidth={2} color={PURPLE} /> 5,385</div>
        </div>
        <div style={{ flex:1, background:BG3, borderRadius:12, padding:'12px 14px', border:'1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ fontSize:9.5, color:MUTED, fontFamily:'JetBrains Mono,monospace', letterSpacing:1, marginBottom:4 }}>RANK</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:'Syne,sans-serif', fontSize:19, fontWeight:800, color:WHITE }}><Trophy size={17} strokeWidth={2} color={PURPLE} /> #12</div>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign:'center', marginBottom:48 }} data-reveal>
      <div style={{ display:'inline-block', padding:'4px 13px', borderRadius:999, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:PURPLE_LIGHT, fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', marginBottom:16, fontFamily:'Outfit,sans-serif' }}>{eyebrow}</div>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(28px,4vw,40px)', fontWeight:800, color:WHITE, margin:0, lineHeight:1.15, letterSpacing:-0.5 }}>{title}</h2>
      {sub && <p style={{ color:MUTED, fontSize:15.5, marginTop:14, marginBottom:0, maxWidth:560, marginLeft:'auto', marginRight:'auto', lineHeight:1.6 }}>{sub}</p>}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();

  return (
    <div style={{ background:BG, color:'#e5e7eb', minHeight:'100vh', overflowX:'hidden' }}>
      <LandingNavbar />

      <main>
      {/* ═══ HERO ═══ */}
      <section style={{ position:'relative', padding:'72px 28px 64px', overflow:'hidden' }}>
        {/* Purple glow top-left */}
        <div style={{ position:'absolute', top:-160, left:-120, width:620, height:620, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 62%)', pointerEvents:'none', zIndex:0 }} />
        {/* Subtle grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)', backgroundSize:'64px 64px', maskImage:'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)', pointerEvents:'none', zIndex:0 }} />

        <div className="gen-hero-grid" style={{ position:'relative', zIndex:1, paddingTop:24 }}>
          {/* Left — text */}
          <div className="gen-hero-text">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:999, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:PURPLE_LIGHT, fontSize:12.5, fontWeight:600, marginBottom:24 }}>
              <Rocket size={14} strokeWidth={2} color={PURPLE_LIGHT} /> Just launched · Be among the first 100
            </div>
            <h1 className="gen-hero-h1" style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(40px,6vw,64px)', fontWeight:800, lineHeight:1.05, letterSpacing:-1.5, margin:'0 0 20px', color:WHITE }}>
              Get placed.<br />Not just prepared.
            </h1>
            <p style={{ fontSize:17, color:'#9ca3af', lineHeight:1.65, margin:'0 0 18px', maxWidth:480 }}>
              Your first coding challenge is ready in <span style={{ color:WHITE, fontWeight:700 }}>60 seconds</span>.<br />
              Personalized for <span style={{ color:'#cbd5e1', fontWeight:600 }}>YOUR college</span>, <span style={{ color:'#cbd5e1', fontWeight:600 }}>YOUR target company</span>, <span style={{ color:'#cbd5e1', fontWeight:600 }}>YOUR timeline</span>.
            </p>
            <p style={{ fontSize:15, color:'#cbd5e1', lineHeight:1.6, margin:'0 0 30px', maxWidth:480, fontWeight:600 }}>
              GENOIS learns <span style={{ color:PURPLE_LIGHT }}>YOUR level</span>, <span style={{ color:PURPLE_LIGHT }}>YOUR pace</span>, <span style={{ color:PURPLE_LIGHT }}>YOUR weak spots</span> — and adapts every single day.
            </p>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:30 }}>
              <Link href="/signup" style={{
                padding:'15px 30px', borderRadius:12, textDecoration:'none',
                background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, color:'#fff',
                fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15,
                display:'inline-flex', alignItems:'center', gap:8,
                boxShadow:'0 10px 30px rgba(99,102,241,0.4)',
              }}>Get My Free Roadmap →</Link>
              <a href="#how" style={{
                padding:'15px 26px', borderRadius:12, textDecoration:'none',
                background:'transparent', border:'1px solid rgba(99,102,241,0.3)', color:PURPLE_LIGHT,
                fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:15,
              }}>See how it works</a>
            </div>
            <div style={{ display:'flex', gap:'10px 16px', flexWrap:'wrap' }}>
              {['Ready in 60 seconds','Free forever','No credit card'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:MUTED, whiteSpace:'nowrap' }}>
                  <Check size={13} strokeWidth={2.5} color={GREEN} style={{ flexShrink:0 }} />{t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — product card */}
          <div className="gen-hero-mockup-wrap" style={{ display:'flex', justifyContent:'center' }}>
            <ProductCard />
          </div>
        </div>
      </section>

      {/* ═══ FEATURE BAR — static ═══ */}
      <div style={{ borderTop:'1px solid rgba(99,102,241,0.1)', borderBottom:'1px solid rgba(99,102,241,0.1)', background:'rgba(99,102,241,0.03)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px 18px', flexWrap:'wrap', padding:'16px 24px' }}>
          {['AI-Powered','10 Domains','Voice Interview','Personalized Roadmap'].map((p, i, arr) => (
            <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:18, whiteSpace:'nowrap', fontFamily:'JetBrains Mono,monospace', fontSize:13.5, color:'#9ca3af', letterSpacing:0.4 }}>
              {p}
              {i < arr.length - 1 && <span style={{ color:PURPLE, opacity:0.55 }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding:'88px 28px', maxWidth:1100, margin:'0 auto' }}>
        <SectionHeader eyebrow="How it works" title="Three steps to your offer" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', gap:24 }}>
          {STEPS.map((s, i) => (
            <div key={s.title} data-reveal data-reveal-delay={i+1} style={{
              position:'relative', padding:'30px 26px', borderRadius:18, background:BG2,
              border:'1px solid rgba(99,102,241,0.12)',
            }}>
              <div style={{ position:'absolute', top:20, right:24, textAlign:'right' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:46, fontWeight:800, color:'rgba(99,102,241,0.1)', lineHeight:1 }}>0{i+1}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:MUTED, marginTop:4 }}>{s.time}</div>
              </div>
              <div style={{ width:60, height:60, borderRadius:14, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}><s.icon size={28} strokeWidth={1.5} color={PURPLE_LIGHT} /></div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:WHITE, margin:'0 0 9px' }}>{s.title}</h3>
              <p style={{ color:'#9ca3af', fontSize:14, lineHeight:1.6, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding:'88px 28px', background:BG2, borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <SectionHeader eyebrow="Everything you need" title="One platform. Every tool to get hired." sub="No more juggling ten tabs. Your entire placement prep, in one focused workspace." />

          {/* ── The moat: Voice Mock Interview ── */}
          <Link href="/signup" data-reveal style={{
            display:'flex', alignItems:'center', gap:20, padding:'24px 26px', marginBottom:18,
            borderRadius:18, textDecoration:'none', flexWrap:'wrap',
            background:`linear-gradient(120deg, ${PURPLE}1f, ${BG3})`, border:`1px solid ${PURPLE}55`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${PURPLE_LIGHT}, transparent)` }} />
            <div style={{ width:64, height:64, borderRadius:16, flexShrink:0, background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, display:'flex', alignItems:'center', justifyContent:'center' }}><Mic size={30} strokeWidth={1.8} color="#fff" /></div>
            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:WHITE, margin:0 }}>Voice Mock Interview</h3>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, letterSpacing:1, color:PURPLE_LIGHT, background:`${PURPLE}22`, border:`1px solid ${PURPLE}55`, borderRadius:6, padding:'3px 7px' }}>NEW · ONLY ON GENOIS</span>
              </div>
              <p style={{ color:MUTED, fontSize:14, lineHeight:1.6, margin:0 }}>Practice speaking your answers out loud. Our AI plays a tough interviewer and scores your clarity, accuracy, and confidence — the way a real panel would.</p>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:PURPLE_LIGHT, whiteSpace:'nowrap' }}>Try it free →</div>
          </Link>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:18 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} data-reveal data-reveal-delay={(i % 3) + 1} style={{
                padding:'26px 24px', borderRadius:16, background:BG,
                border:'1px solid rgba(99,102,241,0.1)', transition:'border-color 0.25s, transform 0.25s',
              }}>
                <div style={{ width:50, height:50, borderRadius:12, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}><f.icon size={24} strokeWidth={1.5} color={PURPLE_LIGHT} /></div>
                <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:16.5, fontWeight:700, color:WHITE, margin:'0 0 8px' }}>{f.title}</h3>
                <p style={{ color:'#9ca3af', fontSize:13.5, lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER STORY ═══ */}
      <section style={{ padding:'88px 28px' }}>
        <div data-reveal style={{
          maxWidth:680, margin:'0 auto', textAlign:'center',
          padding:'48px 36px', borderRadius:22, background:BG2,
          border:'1px solid rgba(99,102,241,0.18)',
        }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(24px,3.5vw,34px)', fontWeight:800, color:WHITE, margin:'0 0 20px', lineHeight:1.2, letterSpacing:-0.5 }}>
            Built by a student, for students
          </h2>
          <p style={{ color:'#cbd5e1', fontSize:16, lineHeight:1.7, margin:'0 0 28px' }}>
            GENOIS is built by an engineering student who faced the same placement pressure you&apos;re facing now. No corporate BS. No fake promises. Just a tool that actually helps you prepare — one day at a time.
          </p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:13 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:800, color:'#fff', fontSize:15 }}>L</div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, color:WHITE, fontSize:15 }}>Laxshu R.</div>
              <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>Founder, GENOIS · KLE Hubballi</div>
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
                padding:'28px 24px', borderRadius:18, position:'relative', background: p.highlight ? 'rgba(99,102,241,0.06)' : BG,
                border:`1px solid ${p.highlight ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: p.highlight ? '0 0 40px rgba(99,102,241,0.12)' : 'none',
                display:'flex', flexDirection:'column',
              }}>
                {p.badge && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'4px 13px', borderRadius:999, background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, color:'#fff', fontSize:11, fontWeight:700, fontFamily:'Syne,sans-serif', whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(99,102,241,0.4)' }}>{p.badge}</div>}
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:WHITE, marginBottom:6 }}>{p.name}</div>
                <div style={{ fontSize:13, color:'#9ca3af', marginBottom:18, minHeight:36, lineHeight:1.4 }}>{p.desc}</div>
                <div style={{ marginBottom:20 }}>
                  <span style={{ fontFamily:'Syne,sans-serif', fontSize:36, fontWeight:800, color:WHITE }}>{p.price}</span>
                  <span style={{ color:MUTED, fontSize:14, marginLeft:4 }}>{p.cadence}</span>
                </div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', flex:1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display:'flex', gap:9, marginBottom:10, color:'#d1d5db', fontSize:13, lineHeight:1.4 }}>
                      <Check size={14} strokeWidth={2.5} color={PURPLE_LIGHT} style={{ flexShrink:0, marginTop:1 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display:'block', textAlign:'center', padding:'12px 18px', borderRadius:10,
                  background: p.highlight ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})` : 'rgba(255,255,255,0.05)',
                  color: p.highlight ? '#fff' : '#e5e7eb',
                  fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14,
                  border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  textDecoration:'none', boxShadow: p.highlight ? '0 8px 22px rgba(99,102,241,0.32)' : 'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
          <p style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', textAlign:'center', color:MUTED, fontSize:12.5, marginTop:22 }}>
            <Zap size={13} strokeWidth={2} color={MUTED} /> Payments launching soon — start your 30-day free trial today, no card required.
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding:'88px 28px' }}>
        <div data-reveal style={{
          maxWidth:780, margin:'0 auto', textAlign:'center', position:'relative',
          padding:'56px 40px', borderRadius:24, background:BG2,
          border:'1px solid transparent',
          backgroundImage:`linear-gradient(${BG2}, ${BG2}), linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`,
          backgroundOrigin:'border-box', backgroundClip:'padding-box, border-box',
          boxShadow:'0 0 60px rgba(99,102,241,0.12)',
        }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(26px,4vw,36px)', fontWeight:800, color:WHITE, margin:'0 0 14px', lineHeight:1.15 }}>
            Don&apos;t open this tomorrow. Start now.
          </h2>
          <p style={{ color:'#9ca3af', fontSize:16, margin:'0 0 30px' }}>
            Your personalized placement roadmap is ready. No credit card, no catch.
          </p>
          <Link href="/signup" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'16px 40px', borderRadius:12, textDecoration:'none',
            background:`linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK})`, color:'#fff',
            fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16,
            boxShadow:'0 12px 34px rgba(99,102,241,0.42)',
          }}>Start My Journey — It&apos;s Free →</Link>
        </div>
      </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:'44px 28px 28px', background:BG, borderTop:'1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:28 }}>
          <div style={{ maxWidth:280 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, marginBottom:10 }}>
              <span style={{ color:PURPLE }}>GEN</span><span style={{ color:WHITE }}>OIS</span>
            </div>
            <div style={{ color:MUTED, fontSize:13, lineHeight:1.6 }}>The career operating system for engineering students.</div>
          </div>
          <div style={{ display:'flex', gap:48, flexWrap:'wrap' }}>
            {[
              { title:'Product', links:[{ l:'How it works', h:'#how' },{ l:'Features', h:'#features' },{ l:'Pricing', h:'#pricing' },{ l:'Blog', h:'/blog' }] },
              { title:'Company', links:[{ l:'Login', h:'/login' },{ l:'Sign up', h:'/signup' },{ l:'Privacy', h:'/privacy' },{ l:'Terms', h:'/terms' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11, color:PURPLE_LIGHT, marginBottom:14, letterSpacing:1, textTransform:'uppercase' }}>{col.title}</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:9 }}>
                  {col.links.map(l => (
                    <li key={l.l}><Link href={l.h} style={{ color:'#9ca3af', textDecoration:'none', fontSize:13 }}>{l.l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth:1100, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ color:MUTED, fontSize:12 }}>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div style={{ color:PURPLE_LIGHT, fontSize:12.5, fontWeight:500 }}>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}
