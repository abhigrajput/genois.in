'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/LandingNavbar';

// ─── Theme ────────────────────────────────────────────────────────────────────
const G  = '#00ff41';   // matrix green
const GD = '#00cc33';   // dim green
const BG  = '#000000';
const BG2 = '#050505';
const BG3 = '#0a0a0a';

// ─── Static data ──────────────────────────────────────────────────────────────
const SUBTEXTS = [
  '365-day AI roadmap. Built for engineers.',
  'DSA visualizer. Learn by actually seeing it.',
  'Earn verified badges. Land your first offer.',
  'AI Mentor at 2 AM. Always available.',
  'Outperform your college rival. Every single day.',
];

const TICKER_ITEMS = [
  '🔥 Arjun K. just hit a 50-day streak',
  '✓  Priya S. earned the Full Stack badge',
  '⚔️  Rahul M. won a 1v1 duel in DSA',
  '🏆 VIT Vellore leads this week\'s College War',
  '📈 Neha T. crossed 5,000 pts today',
  '🚀 Siddharth P. completed Day 100',
  '✓  Kavya R. earned the C++ badge',
  '⚔️  BITS Pilani vs NIT Trichy — live now',
];

const DOMAINS = [
  { slug:'dsa',          name:'DSA',          icon:'◈', color:G,        desc:'Master arrays to graphs. 365 days. 250+ problems. Visualised step by step.', stat:'86% placement rate', tags:['Arrays','Trees','DP','Graphs'] },
  { slug:'fullstack',    name:'Full Stack',    icon:'⬡', color:'#00d4ff',desc:'React, Node, Postgres, Docker. Build 3 production apps. Ship real code.',    stat:'4 live projects',   tags:['React','Node.js','SQL','Docker'] },
  { slug:'aiml',         name:'AI & ML',       icon:'◉', color:'#ff6b35',desc:'ML fundamentals to model deployment. Build models that run in prod.',         stat:'Kaggle-ready',      tags:['Python','PyTorch','NLP','CV'] },
  { slug:'cybersecurity',name:'Cybersecurity', icon:'◆', color:'#ff2d78',desc:'Ethical hacking, network security, CTF challenges. CEH prep included.',       stat:'CTF challenges',    tags:['Linux','Networks','Crypto','Web'] },
  { slug:'devops',       name:'DevOps',        icon:'▷', color:'#f59e0b',desc:'CI/CD, Kubernetes, monitoring. Get cloud-certified as you learn.',             stat:'AWS certified path', tags:['Docker','K8s','CI/CD','AWS'] },
  { slug:'systemdesign', name:'System Design', icon:'▦', color:'#8b5cf6',desc:'Crack FAANG system design rounds. CAP theorem to real architectures.',        stat:'FAANG-focused',     tags:['HLD','LLD','Scalability','DBs'] },
];

const STEPS = [
  { emoji:'🎯', title:'Choose your domain',     desc:'Pick from 10 career paths tuned to industry hiring patterns.' },
  { emoji:'🗺️', title:'Follow your AI roadmap', desc:'Daily videos, notes, coding problems and tests. Adapts to your level.' },
  { emoji:'🏆', title:'Earn verified badges',    desc:'Pass proctored tests, build projects, get credentials recruiters trust.' },
];

const STATS = [
  { target:500, suffix:'+', label:'Students Enrolled' },
  { target:10,  suffix:'',  label:'Career Domains' },
  { target:365, suffix:'',  label:'Day Roadmap' },
  { target:30,  suffix:'+', label:'Algorithms Visualized' },
];

const BAR_DATA = [
  { label:'HTML/CSS', pct:78 },
  { label:'JS',       pct:92 },
  { label:'React',    pct:85 },
  { label:'Node',     pct:70 },
  { label:'SQL',      pct:65 },
  { label:'Docker',   pct:55 },
];

const LB_INIT = [
  { name:'Priya S.',     college:'NIT Surathkal', domain:'DSA',         score:8240, streak:34 },
  { name:'Arjun K.',     college:'VIT Vellore',   domain:'Full Stack',  score:7885, streak:50 },
  { name:'Rahul M.',     college:'IIT Roorkee',   domain:'DSA',         score:7220, streak:28 },
  { name:'Neha T.',      college:'BITS Pilani',   domain:'AI/ML',       score:6980, streak:22 },
  { name:'Siddharth P.', college:'DTU',           domain:'DevOps',      score:6540, streak:18 },
];

const TESTIMONIALS = [
  { name:'Rahul Mehta',    initials:'RM', college:'IIT Roorkee',   domain:'Full Stack', progress:'Day 82 · 6,240 pts · 🔥 21 streak', stars:5, quote:'The daily roadmap pulled me out of tutorial hell. In 90 days I shipped 3 production apps and landed an offer at a Bangalore SaaS.',          result:'Got placed at Razorpay' },
  { name:'Priya Sharma',   initials:'PS', college:'NIT Surathkal', domain:'AI & ML',    progress:'Day 67 · 4,200 pts · 🔥 12 streak', stars:5, quote:'AI mentor answers my doubts at 2 AM. The badge system gave me something concrete to put on my resume — not just a course certificate.',      result:'Cleared Amazon OA' },
  { name:'Arjun Kashyap',  initials:'AK', college:'VIT Vellore',   domain:'DSA',        progress:'Day 124 · 8,850 pts · 🔥 34 streak',stars:5, quote:'I went from 0 LeetCode solves to 250+ in four months. The DSA visualizer made trees and graphs finally click.',                               result:'Got placed at TCS Digital' },
];

const PLANS = [
  { key:'spectator', name:'Spectator', price:'₹0',    cadence:'/forever', desc:'Browse the platform and watch the action.',           features:['Public profile','Browse domains','Read blog','Leaderboard view'],                       cta:'Start Free',        highlight:false },
  { key:'player',    name:'Player',    price:'₹299',  cadence:'/month',   desc:'Get the daily roadmap + AI mentor.',                  features:['365-day roadmap','AI mentor','DSA visualizer','Aptitude tests'],                          cta:'Choose Player',     highlight:false },
  { key:'performer', name:'Performer', price:'₹499',  cadence:'/month',   desc:'Everything in Player + verified skill badges.',       features:['Everything in Player','Proctored badges','Mock interviews','Mentor sessions'],             cta:'Choose Performer',  highlight:true,  badge:'Most Popular' },
  { key:'dominator', name:'Dominator', price:'₹1999', cadence:'/month',   desc:'For students serious about elite placements.',        features:['Everything in Performer','Priority support','1-on-1 mentoring','Resume reviews'],         cta:'Go Dominator',      highlight:false },
];

const TERM_LINES = [
  { t:'$ genois init --domain=dsa --student=you', c:G },
  { t:'> Analysing skill gaps...', c:'#6b7280' },
  { t:'> Generating 365-day roadmap ✓', c:'#9ca3af' },
  { t:'> Day 1  : Arrays & Time Complexity', c:'#6b7280' },
  { t:'> Day 47 : Binary Trees (you are here)', c:G },
  { t:'> Streak : 🔥 8 days · Score: 5,385 pts', c:'#9ca3af' },
  { t:'> Type "start" to continue your journey_', c:G },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useTypewriter(texts, speed = 58, pause = 2400) {
  const [display, setDisplay] = useState('');
  const state = useRef({ idx:0, char:0, del:false });

  useEffect(() => {
    const s = state.current;
    const cur = texts[s.idx];
    let tid;
    if (!s.del) {
      if (s.char < cur.length) {
        tid = setTimeout(() => { s.char++; setDisplay(cur.slice(0, s.char)); }, speed);
      } else {
        tid = setTimeout(() => { s.del = true; setDisplay(d => d); }, pause);
      }
    } else {
      if (s.char > 0) {
        tid = setTimeout(() => { s.char--; setDisplay(cur.slice(0, s.char)); }, speed / 2.2);
      } else {
        s.del = false;
        s.idx = (s.idx + 1) % texts.length;
        setDisplay('');
      }
    }
    return () => clearTimeout(tid);
  });

  return display;
}

function useCounter(target, started) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!started) return;
    let t0 = null;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1800, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target]);
  return n;
}

function useInView(ref, threshold = 0.15) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); ob.disconnect(); } }, { threshold });
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return v;
}

// ─── ParticleCanvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const pts = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 1.1 + 0.4,
      o: Math.random() * 0.35 + 0.12,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 115) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,255,65,${0.11 * (1 - d / 115)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,65,${p.o})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} className="gen-particle-canvas" style={{
      position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0,
    }} />
  );
}

// ─── TerminalCard ─────────────────────────────────────────────────────────────
function TerminalCard() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= TERM_LINES.length) return;
    const t = setTimeout(() => setShown(n => n + 1), 500);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="gen-terminal-hide" style={{
      background: BG3, borderRadius: 16,
      border: '1px solid rgba(0,255,65,0.28)',
      padding: '20px 24px',
      fontFamily: 'var(--font-jetbrains), monospace',
      boxShadow: '0 0 48px rgba(0,255,65,0.07), inset 0 1px 0 rgba(0,255,65,0.06)',
      maxWidth: 480, width: '100%',
    }}>
      {/* Chrome dots */}
      <div style={{ display:'flex', gap:6, marginBottom:18, alignItems:'center' }}>
        {['#ff5f57','#febc2e','#28c840'].map((c,i) => (
          <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c }} />
        ))}
        <div style={{ flex:1, textAlign:'center', fontSize:11, color:'#4b5563', marginTop:-1 }}>
          genois — bash — 80×24
        </div>
      </div>
      {TERM_LINES.slice(0, shown).map((line, i) => (
        <div key={i} style={{ fontSize:12.5, color:line.c, marginBottom:6, lineHeight:1.5 }}>
          {line.t}
          {i === shown - 1 && shown < TERM_LINES.length && (
            <span className="gen-blink" style={{ color:G, marginLeft:1 }}>█</span>
          )}
        </div>
      ))}
      {shown >= TERM_LINES.length && (
        <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:G, fontSize:12 }}>$</span>
          <span className="gen-blink" style={{ color:G, fontSize:13 }}>█</span>
        </div>
      )}
    </div>
  );
}

// ─── LiveTicker ───────────────────────────────────────────────────────────────
function LiveTicker() {
  return (
    <div style={{ background:'#030303', borderTop:`1px solid rgba(0,255,65,0.1)`, borderBottom:`1px solid rgba(0,255,65,0.08)`, padding:'9px 0', overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:88, background:'linear-gradient(90deg, #030303 60%, transparent)', zIndex:1, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:14 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:G, boxShadow:`0 0 6px ${G}`, animation:'gen-cursor-blink 1.2s step-end infinite' }} />
          <span style={{ fontSize:9.5, fontWeight:700, color:G, letterSpacing:2, textTransform:'uppercase', fontFamily:'var(--font-jetbrains), monospace' }}>LIVE</span>
        </div>
      </div>
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:48, background:'linear-gradient(270deg, #030303 60%, transparent)', zIndex:1 }} />
      <div className="gen-ticker" style={{ paddingLeft:100 }}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} style={{ fontSize:12.5, color:'#9ca3af', whiteSpace:'nowrap', fontFamily:'var(--font-outfit), sans-serif' }}>
            <span style={{ color:G, marginRight:8 }}>·</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── DomainPicker ─────────────────────────────────────────────────────────────
function DomainPicker() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const select = i => {
    if (i === active) return;
    setFading(true);
    setTimeout(() => { setActive(i); setFading(false); }, 200);
  };

  const d = DOMAINS[active];

  return (
    <div className="gen-domain-split" style={{ display:'flex', border:`1px solid rgba(0,255,65,0.12)`, borderRadius:18, overflow:'hidden', background:BG2 }}>
      {/* Left nav */}
      <div className="gen-domain-nav" style={{ width:185, flexShrink:0, borderRight:`1px solid rgba(0,255,65,0.1)` }}>
        {DOMAINS.map((dom, i) => (
          <button key={dom.slug} onClick={() => select(i)} style={{
            display:'flex', alignItems:'center', gap:10,
            width:'100%', padding:'12px 18px',
            background: active === i ? 'rgba(0,255,65,0.06)' : 'transparent',
            border:'none', borderLeft:`2px solid ${active === i ? G : 'transparent'}`,
            color: active === i ? G : '#6b7280',
            cursor:'pointer', textAlign:'left', fontSize:13,
            fontFamily:'var(--font-outfit), sans-serif',
            transition:'all 0.15s ease',
          }}>
            <span style={{ fontSize:15, opacity: active === i ? 1 : 0.6 }}>{dom.icon}</span>
            {dom.name}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div style={{
        flex:1, padding:'30px 34px',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateX(10px)' : 'translateX(0)',
        transition:'opacity 0.2s ease, transform 0.2s ease',
        minHeight:260,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:18 }}>
          <div style={{
            width:52, height:52, borderRadius:12, flexShrink:0,
            background:`${d.color}15`, border:`1px solid ${d.color}44`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
          }}>{d.icon}</div>
          <div>
            <div style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:22, fontWeight:800, color:'#fff' }}>{d.name}</div>
            <span style={{
              display:'inline-block', marginTop:5, padding:'2px 9px', borderRadius:5,
              background:`${d.color}12`, border:`1px solid ${d.color}33`,
              color:d.color, fontSize:11, fontWeight:700,
            }}>{d.stat}</span>
          </div>
        </div>

        <p style={{ color:'#9ca3af', fontSize:14, lineHeight:1.75, margin:'0 0 20px' }}>{d.desc}</p>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:26 }}>
          {d.tags.map(tag => (
            <span key={tag} style={{
              padding:'4px 11px', borderRadius:6, fontSize:12, fontWeight:600,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#9ca3af',
            }}>{tag}</span>
          ))}
        </div>

        <Link href="/signup" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'11px 22px', borderRadius:10, textDecoration:'none',
          background:`${d.color}15`, border:`1px solid ${d.color}44`,
          color:d.color, fontFamily:'var(--font-syne), sans-serif', fontWeight:700, fontSize:14,
          transition:'all 0.2s',
        }}>
          Start {d.name} Path →
        </Link>
      </div>
    </div>
  );
}

// ─── LiveLeaderboard ──────────────────────────────────────────────────────────
function LiveLeaderboard() {
  const [rows, setRows] = useState(LB_INIT.map(r => ({ ...r })));

  useEffect(() => {
    const iv = setInterval(() => {
      setRows(prev => {
        const i = Math.floor(Math.random() * prev.length);
        const next = prev.map((r, idx) => idx === i ? { ...r, score: r.score + Math.floor(Math.random() * 40) + 8 } : r);
        return [...next].sort((a, b) => b.score - a.score);
      });
    }, 1900);
    return () => clearInterval(iv);
  }, []);

  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {rows.map((r, i) => (
        <div key={r.name} style={{
          display:'flex', alignItems:'center', gap:14, padding:'12px 18px', borderRadius:12,
          background: i === 0 ? 'rgba(0,255,65,0.05)' : 'rgba(255,255,255,0.02)',
          border:`1px solid ${i === 0 ? 'rgba(0,255,65,0.2)' : 'rgba(255,255,255,0.06)'}`,
          transition:'all 0.3s ease',
        }}>
          <span style={{ fontSize:18, width:24, textAlign:'center' }}>{medals[i] || `#${i+1}`}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-syne), sans-serif', fontWeight:700, color:'#fff', fontSize:14 }}>{r.name}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{r.college} · {r.domain}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div key={r.score} className="gen-score-flash" style={{
              fontFamily:'var(--font-syne), sans-serif', fontWeight:800, fontSize:15,
              color: i === 0 ? G : '#fff',
            }}>{r.score.toLocaleString()} pts</div>
            <div style={{ fontSize:11, color:'#fbbf24', marginTop:1 }}>🔥 {r.streak} days</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── StatCounter ─────────────────────────────────────────────────────────────
function StatCounter({ stat }) {
  const ref = useRef(null);
  const v = useInView(ref);
  const n = useCounter(stat.target, v);
  return (
    <div ref={ref} style={{ textAlign:'center' }}>
      <div style={{
        fontFamily:'var(--font-syne), sans-serif', fontSize:54, fontWeight:800, lineHeight:1,
        color:G, textShadow:'0 0 24px rgba(0,255,65,0.35)',
      }}>{n}{stat.suffix}</div>
      <div style={{ fontSize:11.5, color:'#6b7280', letterSpacing:1.5, textTransform:'uppercase', marginTop:10 }}>
        {stat.label}
      </div>
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────
function BarChart() {
  const ref = useRef(null);
  const v = useInView(ref);
  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {BAR_DATA.map((item, i) => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:56, fontSize:11.5, color:'#6b7280', textAlign:'right', flexShrink:0 }}>{item.label}</div>
          <div style={{ flex:1, height:7, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:4,
              background:`linear-gradient(90deg, ${G}, rgba(0,255,65,0.4))`,
              boxShadow:'0 0 6px rgba(0,255,65,0.35)',
              width: v ? `${item.pct}%` : '0%',
              transition:`width 1s ${0.12 * i}s cubic-bezier(0.4,0,0.2,1)`,
            }} />
          </div>
          <div style={{ width:32, fontSize:11.5, color:G, fontWeight:700 }}>{item.pct}%</div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub, center = true }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left' }}>
      <div style={{
        display:'inline-block', padding:'4px 12px', borderRadius:999,
        background:'rgba(0,255,65,0.07)', border:'1px solid rgba(0,255,65,0.22)',
        color:G, fontSize:11, fontWeight:600, letterSpacing:1.5, textTransform:'uppercase',
        marginBottom:14, fontFamily:'var(--font-outfit), sans-serif',
      }}>{eyebrow}</div>
      <h2 style={{
        fontFamily:'var(--font-syne), sans-serif', fontSize:38, fontWeight:800,
        color:'#fff', margin:0, lineHeight:1.1, letterSpacing:-0.5,
      }}>{title}</h2>
      {sub && <p style={{ color:'#6b7280', fontSize:15, marginTop:12, marginBottom:0 }}>{sub}</p>}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(0,255,65,0.18) 40%, rgba(0,255,65,0.14) 60%, transparent)' }} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const subtext = useTypewriter(SUBTEXTS);

  return (
    <div style={{ background:BG, color:'#e5e7eb', minHeight:'100vh', overflowX:'hidden' }}>
      <LandingNavbar />

      {/* ═══ HERO ═══ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'100px 28px 80px', overflow:'hidden' }}>
        <ParticleCanvas />
        {/* Radial glow center */}
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,255,65,0.04) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }} />

        <div className="gen-hero-split" style={{ position:'relative', zIndex:1 }}>
          {/* Left */}
          <div>
            {/* Live badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:999, background:'rgba(0,255,65,0.07)', border:'1px solid rgba(0,255,65,0.22)', color:G, fontSize:11.5, fontWeight:600, fontFamily:'var(--font-outfit), sans-serif', marginBottom:26 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:G, boxShadow:`0 0 8px ${G}`, animation:'gen-cursor-blink 1.5s step-end infinite' }} />
              Now live · 30-day free trial
            </div>

            {/* Glitch headline */}
            <h1 style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:'clamp(36px, 5vw, 58px)', fontWeight:800, lineHeight:1.06, letterSpacing:-1.5, margin:'0 0 6px', color:'#fff' }}>
              The Career OS for<br />
              <span
                className="gen-glitch"
                data-text="Engineering Students"
                style={{ color:G, textShadow:'0 0 28px rgba(0,255,65,0.35)', display:'inline-block' }}
              >Engineering Students</span>
            </h1>

            {/* Typewriter */}
            <div style={{ fontSize:17, color:'#9ca3af', margin:'18px 0 36px', fontFamily:'var(--font-outfit), sans-serif', minHeight:28 }}>
              {subtext}<span className="gen-blink" style={{ color:G, marginLeft:1 }}>|</span>
            </div>

            {/* CTAs */}
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:38 }}>
              <Link href="/signup" className="gen-cta-green" style={{
                padding:'15px 34px', borderRadius:12, textDecoration:'none',
                background:G, color:'#000',
                fontFamily:'var(--font-syne), sans-serif', fontWeight:800, fontSize:15,
                display:'inline-flex', alignItems:'center', gap:8,
                boxShadow:'0 0 28px rgba(0,255,65,0.3)',
              }}>
                Start Free Trial <span className="gen-blink" style={{ fontSize:16 }}>→</span>
              </Link>
              <a href="#domains" style={{
                padding:'15px 26px', borderRadius:12, textDecoration:'none',
                background:'transparent', border:'1px solid rgba(0,255,65,0.28)',
                color:G, fontFamily:'var(--font-syne), sans-serif', fontWeight:600, fontSize:15,
                transition:'all 0.2s ease',
              }}>Explore Domains</a>
            </div>

            {/* Trust strip */}
            <div style={{ display:'flex', gap:22, flexWrap:'wrap' }}>
              {['500+ students enrolled','10 career domains','No credit card needed'].map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#6b7280' }}>
                  <span style={{ color:G, fontSize:10 }}>✓</span>{t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — terminal */}
          <TerminalCard />
        </div>
      </section>

      {/* ═══ LIVE TICKER ═══ */}
      <LiveTicker />
      <Divider />

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding:'100px 28px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <SectionHeader eyebrow="How it works" title="Three steps to job-ready" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:28, position:'relative' }}>
          <div className="gen-desktop-only" style={{ position:'absolute', top:56, left:'18%', right:'18%', height:1, background:`linear-gradient(90deg, rgba(0,255,65,0.25), rgba(0,255,65,0.08))`, zIndex:0 }} />
          {STEPS.map((s, i) => (
            <div key={s.title} style={{
              padding:'32px 28px', borderRadius:18, background:BG2,
              border:'1px solid rgba(0,255,65,0.1)', position:'relative', zIndex:1,
              transition:'border-color 0.3s, box-shadow 0.3s',
            }}>
              <div style={{ position:'absolute', top:18, right:22, fontFamily:'var(--font-syne), sans-serif', fontSize:52, fontWeight:800, color:'rgba(0,255,65,0.04)', lineHeight:1 }}>0{i+1}</div>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(0,255,65,0.06)', border:'1.5px solid rgba(0,255,65,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, marginBottom:24, boxShadow:'0 0 22px rgba(0,255,65,0.1)' }}>{s.emoji}</div>
              <h3 style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:19, fontWeight:700, color:'#fff', margin:'0 0 10px' }}>{s.title}</h3>
              <p style={{ color:'#9ca3af', fontSize:14, lineHeight:1.65, margin:0 }}>{s.desc}</p>
              <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg, transparent, rgba(0,255,65,0.2), transparent)' }} />
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ═══ STATS ═══ */}
      <section style={{ padding:'80px 28px', background:'linear-gradient(180deg, rgba(0,255,65,0.03) 0%, transparent 100%)', borderTop:'1px solid rgba(0,255,65,0.07)', borderBottom:'1px solid rgba(0,255,65,0.07)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <SectionHeader eyebrow="By the numbers" title={<>Built for scale. <span style={{ color:G }}>Designed for results.</span></>} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:48 }}>
            {STATS.map(s => <StatCounter key={s.label} stat={s} />)}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ DOMAIN PICKER ═══ */}
      <section id="domains" style={{ padding:'100px 28px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom:48 }}>
          <SectionHeader eyebrow="10 domains" title="Choose your career path" center={false} sub="Every path is 365 days. Every path ends with a verified badge." />
        </div>
        <DomainPicker />
      </section>

      <Divider />

      {/* ═══ LEADERBOARD + BAR CHART ═══ */}
      <section id="leaderboard" style={{ padding:'100px 28px', background:BG2, borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))', gap:60, alignItems:'start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
              <SectionHeader eyebrow="Live rankings" title="Leaderboard" center={false} />
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:G }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:G, animation:'gen-cursor-blink 1s step-end infinite' }} />
                Updating live
              </div>
            </div>
            <LiveLeaderboard />
          </div>
          <div>
            <div style={{ marginBottom:28 }}>
              <SectionHeader eyebrow="Skill coverage" title="What you'll master" center={false} />
            </div>
            <BarChart />
            <p style={{ color:'#6b7280', fontSize:13, marginTop:22, lineHeight:1.65 }}>
              Full Stack domain shown. Each of the 10 domains has its own depth chart across 365 days of structured content.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{ padding:'100px 28px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <SectionHeader eyebrow="What students say" title="From confusion to confidence" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ padding:28, borderRadius:20, background:BG2, border:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', flexShrink:0, background:'rgba(0,255,65,0.1)', border:'1px solid rgba(0,255,65,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-syne), sans-serif', fontWeight:800, color:G, fontSize:16 }}>{t.initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-syne), sans-serif', fontWeight:700, color:'#fff', fontSize:15 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{t.college} · {t.domain}</div>
                </div>
                <div style={{ color:'#fbbf24', fontSize:12, letterSpacing:1 }}>{'★'.repeat(t.stars)}</div>
              </div>
              <div style={{ display:'inline-block', padding:'4px 10px', borderRadius:999, marginBottom:14, background:'rgba(0,255,65,0.06)', border:'1px solid rgba(0,255,65,0.18)', fontSize:11, color:G }}>{t.progress}</div>
              <p style={{ color:'#d1d5db', fontSize:14, lineHeight:1.65, margin:'0 0 18px', flex:1 }}>"{t.quote}"</p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:8, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.22)', fontSize:12, fontWeight:600, color:'#10b981' }}>
                <span style={{ fontSize:10 }}>✓</span>{t.result}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding:'100px 28px', background:BG2, borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <SectionHeader eyebrow="Pricing" title="Choose the plan that fits your hustle" />
            <div style={{ display:'inline-block', padding:'5px 14px', borderRadius:999, marginTop:16, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.28)', color:'#fbbf24', fontSize:12, fontWeight:600 }}>
              ⚡ Payments launching soon — start your free trial today
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20 }}>
            {PLANS.map(p => (
              <div key={p.key} style={{ padding:28, borderRadius:18, position:'relative', background: p.highlight ? 'rgba(0,255,65,0.04)' : 'rgba(255,255,255,0.02)', border:`1px solid ${p.highlight ? 'rgba(0,255,65,0.32)' : 'rgba(255,255,255,0.08)'}`, boxShadow: p.highlight ? '0 0 32px rgba(0,255,65,0.07)' : 'none' }}>
                {p.badge && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'4px 12px', borderRadius:999, background:G, color:'#000', fontSize:11, fontWeight:800, fontFamily:'var(--font-syne), sans-serif', whiteSpace:'nowrap' }}>{p.badge}</div>}
                <div style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:18, fontWeight:700, color:'#fff', marginBottom:6 }}>{p.name}</div>
                <div style={{ fontSize:13, color:'#9ca3af', marginBottom:22, minHeight:38 }}>{p.desc}</div>
                <div style={{ marginBottom:22 }}>
                  <span style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:38, fontWeight:800, color:'#fff' }}>{p.price}</span>
                  <span style={{ color:'#6b7280', fontSize:14, marginLeft:4 }}>{p.cadence}</span>
                </div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display:'flex', gap:10, marginBottom:10, color:'#d1d5db', fontSize:13 }}>
                      <span style={{ color:G, flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={p.highlight ? 'gen-cta-green' : ''} style={{
                  display:'block', textAlign:'center', padding:'12px 18px', borderRadius:10,
                  background: p.highlight ? G : 'rgba(255,255,255,0.06)',
                  color: p.highlight ? '#000' : '#fff',
                  fontFamily:'var(--font-syne), sans-serif', fontWeight:800, fontSize:14,
                  border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  textDecoration:'none',
                }}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══ CTA ═══ */}
      <section style={{ padding:'100px 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(0,255,65,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{
          maxWidth:780, margin:'0 auto', textAlign:'center', position:'relative',
          padding:'64px 40px', borderRadius:24,
          background:'rgba(0,255,65,0.025)', border:'1px solid rgba(0,255,65,0.18)',
          boxShadow:'0 0 60px rgba(0,255,65,0.05)',
        }}>
          <div style={{ fontFamily:'var(--font-jetbrains), monospace', fontSize:12, color:GD, marginBottom:16, letterSpacing:2 }}>
            $ genois start --plan=dominator --trial=30d
          </div>
          <h2 style={{ fontFamily:'var(--font-syne), sans-serif', fontSize:38, fontWeight:800, color:'#fff', margin:'0 0 14px', lineHeight:1.15 }}>
            Start your{' '}
            <span style={{ color:G, textShadow:'0 0 20px rgba(0,255,65,0.4)' }}>30-day Dominator</span>
            {' '}trial
          </h2>
          <p style={{ color:'#9ca3af', fontSize:16, margin:'0 0 32px' }}>
            Full access. Cancel anytime. No credit card required.
          </p>
          <Link href="/signup" className="gen-cta-green" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'16px 40px', borderRadius:12, textDecoration:'none',
            background:G, color:'#000',
            fontFamily:'var(--font-syne), sans-serif', fontWeight:800, fontSize:16,
            boxShadow:'0 0 36px rgba(0,255,65,0.32)',
          }}>
            Start Free Trial <span className="gen-blink" style={{ fontSize:18 }}>→</span>
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:'48px 28px 28px', background:'#030303', borderTop:'1px solid rgba(0,255,65,0.1)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:32 }}>
          <div>
            <div style={{ fontFamily:'var(--font-syne), sans-serif', fontWeight:800, fontSize:24, color:G, letterSpacing:1.5, marginBottom:10, textShadow:'0 0 16px rgba(0,255,65,0.35)' }}>GENOIS</div>
            <div style={{ color:'#6b7280', fontSize:13, lineHeight:1.65 }}>The career operating system for engineering students.</div>
          </div>
          {[
            { title:'Product', links:[{ l:'Domains', h:'#domains' },{ l:'Pricing', h:'#pricing' },{ l:'Leaderboard', h:'#leaderboard' },{ l:'Blog', h:'/blog' }] },
            { title:'Company', links:[{ l:'About', h:'/blog' },{ l:'Blog', h:'/blog' },{ l:'Privacy', h:'/privacy' },{ l:'Terms', h:'/terms' }] },
            { title:'Connect', links:[{ l:'GitHub', h:'https://github.com' },{ l:'LinkedIn', h:'https://linkedin.com' },{ l:'Twitter', h:'https://twitter.com' },{ l:'Contact', h:'/feedback' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily:'var(--font-syne), sans-serif', fontWeight:700, fontSize:11, color:G, marginBottom:14, letterSpacing:1, textTransform:'uppercase' }}>{col.title}</div>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
                {col.links.map(l => (
                  <li key={l.l}><Link href={l.h} style={{ color:'#9ca3af', textDecoration:'none', fontSize:13 }}>{l.l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth:1200, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid rgba(0,255,65,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ color:'#6b7280', fontSize:12 }}>© {new Date().getFullYear()} GENOIS. All rights reserved.</div>
          <div style={{ color:G, fontSize:12, textShadow:'0 0 8px rgba(0,255,65,0.3)' }}>Built for India · Made for engineers</div>
        </div>
      </footer>
    </div>
  );
}
