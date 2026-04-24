'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PublicNav from '@/components/PublicNav';

const STUDENTS = [
  { name: 'Rahul M.', college: 'LNCT Bhopal', domain: 'Full Stack', day: 18, score: 1240, rank: 23 },
  { name: 'Priya S.', college: 'RGPV Indore', domain: 'DSA', day: 22, score: 1890, rank: 7 },
  { name: 'Arjun K.', college: 'CSVTU Bhilai', domain: 'ML', day: 14, score: 980, rank: 41 },
  { name: 'Sneha P.', college: 'DBATU Lonere', domain: 'Cybersecurity', day: 26, score: 2340, rank: 3 },
  { name: 'Vikram T.', college: 'SPPU Pune', domain: 'DevOps', day: 11, score: 760, rank: 67 },
];

const STEPS = [
  { icon: '🎯', title: 'Pick your domain', desc: 'Choose from 10 career paths. Full Stack, DSA, ML, Cybersecurity and more.' },
  { icon: '⚔️', title: 'Grind every day', desc: '5 tasks every morning. Video, resource, coding, test, notes. All 5 or tomorrow does not unlock.' },
  { icon: '🏆', title: 'Get ranked', desc: 'Your GENOIS score updates daily. Share your public profile. Let the data talk.' },
];

const DOMAINS = [
  { icon: '⬡', label: 'Full Stack', color: '#7F77DD', hot: true },
  { icon: '◈', label: 'DSA', color: '#1D9E75', hot: true },
  { icon: '◉', label: 'Machine Learning', color: '#D85A30' },
  { icon: '◎', label: 'AI', color: '#BA7517' },
  { icon: '◇', label: 'Data Science', color: '#378ADD' },
  { icon: '◆', label: 'Cybersecurity', color: '#D4537E', hot: true },
  { icon: '○', label: 'Cloud', color: '#639922' },
  { icon: '▣', label: 'Mobile Dev', color: '#E24B4A' },
  { icon: '▷', label: 'DevOps', color: '#888780' },
  { icon: '▦', label: 'System Design', color: '#534AB7' },
];

const TRUTHS = [
  { stat: '93%', label: 'cannot write working code in their claimed language' },
  { stat: '1 in 8', label: 'gets a job that actually uses their engineering degree' },
  { stat: '4 years', label: 'of college. 3 months of prep. That gap is why you get rejected.' },
  { stat: '₹3.5 LPA', label: 'average mass recruiting package. Is that worth 4 years?' },
];

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [count, setCount] = useState(2847);
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    const si = setInterval(() => setActiveIdx(p => (p + 1) % STUDENTS.length), 2800);
    const ci = setInterval(() => setCount(p => p + Math.floor(Math.random() * 3)), 4000);
    function tick() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const d = midnight - now;
      setTime({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    }
    tick();
    const ti = setInterval(tick, 1000);
    return () => { clearInterval(si); clearInterval(ci); clearInterval(ti); };
  }, []);

  const pad = n => String(n).padStart(2, '0');

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8f4ff', fontFamily: 'Outfit,sans-serif', opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease', overflowX: 'hidden' }}>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .steps-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .domains-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; }
        .compare-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width:900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2,1fr) !important; }
          .steps-row { grid-template-columns: 1fr !important; }
          .domains-row { grid-template-columns: repeat(3,1fr) !important; }
          .compare-row { grid-template-columns: 1fr !important; }
        }
        @media(max-width:500px) {
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .domains-row { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,240,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

      <PublicNav />

      {/* LIVE BAR */}
      <div style={{ background: 'rgba(255,45,120,0.07)', borderBottom: '1px solid rgba(255,45,120,0.12)', padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff2d78', animation: 'blink 1.4s infinite' }} />
          <span style={{ fontSize: 12, color: '#ff2d78', fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>LIVE</span>
          <span style={{ fontSize: 12, color: '#c8d8e8' }}><span style={{ color: '#00f0ff', fontWeight: 700 }}>{count.toLocaleString()}</span> students being ranked</span>
        </div>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 12, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>
          Resets in <span style={{ color: '#EF9F27', fontWeight: 700 }}>{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO — two column */}
        <section style={{ padding: 'clamp(48px,7vw,80px) clamp(24px,5vw,64px)' }}>
          <div className="hero-grid">

            {/* LEFT */}
            <div>
              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.22)', color: '#EF9F27', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1, marginBottom: 28 }}>
                🔥 FOR TIER 2 &amp; TIER 3 ENGINEERING STUDENTS
              </div>

              <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(32px,4.5vw,62px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, marginBottom: 20 }}>
                3 lakh engineers<br />graduate every year.<br />
                <span style={{ background: 'linear-gradient(135deg,#ff2d78,#EF9F27)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Less than 10%<br />matter.
                </span>
              </h1>

              <p style={{ fontSize: 'clamp(14px,1.5vw,17px)', color: '#5a7a9a', lineHeight: 1.85, marginBottom: 36, maxWidth: 480 }}>
                Not because they are not smart. Because they could not prove it.
                GENOIS ranks you on <strong style={{ color: '#e8f4ff' }}>real daily performance</strong> — not your resume, not your CGPA. Just your actual skill.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <Link href="/onboarding" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 800, boxShadow: '0 0 40px rgba(0,240,255,0.25)' }}>
                  Find Out Where You Stand →
                </Link>
                <Link href="/pricing" style={{ padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: '#5a7a9a', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 600 }}>
                  See Plans
                </Link>
              </div>

              <p style={{ fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
                30 days free · No credit card · Your batchmates are already inside
              </p>
            </div>

            {/* RIGHT — Live leaderboard */}
            <div>
              <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.12)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,240,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', animation: 'blink 2s infinite' }} />
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#1D9E75', letterSpacing: 1 }}>GLOBAL LEADERBOARD · LIVE</span>
                </div>

                {STUDENTS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', background: i === activeIdx ? 'rgba(0,240,255,0.04)' : 'transparent', borderLeft: `3px solid ${i === activeIdx ? '#00f0ff' : 'transparent'}`, transition: 'all 0.35s ease' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, width: 28, flexShrink: 0, textAlign: 'center' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ color: '#3a4a5a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>#{s.rank}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: i === activeIdx ? '#e8f4ff' : '#6a7a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace', marginTop: 1 }}>{s.college} · {s.domain}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: i === activeIdx ? '#00f0ff' : '#3a4a5a' }}>{s.score.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>Day {s.day} · 🔥{s.day}</div>
                    </div>
                  </div>
                ))}

                <div style={{ padding: '13px 20px', borderTop: '1px solid rgba(0,240,255,0.06)', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#5a7a9a' }}>{STUDENTS[activeIdx].name} is on Day {STUDENTS[activeIdx].day}. </span>
                  <Link href="/onboarding" style={{ fontSize: 13, color: '#00f0ff', textDecoration: 'none', fontWeight: 600 }}>Where are you? →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,45,120,0.2),transparent)' }} />

        {/* BRUTAL TRUTHS */}
        <section style={{ padding: 'clamp(56px,7vw,80px) clamp(24px,5vw,64px)', background: 'rgba(255,45,120,0.025)' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#ff2d78', letterSpacing: 2, marginBottom: 12 }}>NOBODY WILL SAY THIS TO YOUR FACE</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 800, color: '#e8f4ff', lineHeight: 1.15 }}>
              The placement system is designed<br />for you to fail.
            </h2>
            <p style={{ color: '#5a7a9a', fontSize: 15, marginTop: 12 }}>4 facts your college will never put on the brochure.</p>
          </div>

          <div className="stats-row">
            {TRUTHS.map((t, i) => (
              <div key={i} style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.1)', borderRadius: 14, padding: '28px 20px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(255,45,120,0.4),transparent)' }} />
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 800, color: '#ff2d78', marginBottom: 12, lineHeight: 1 }}>{t.stat}</div>
                <div style={{ fontSize: 13, color: '#6a7a8a', lineHeight: 1.7 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,240,255,0.15),transparent)' }} />

        {/* RESUME VS GENOIS */}
        <section style={{ padding: 'clamp(56px,7vw,80px) clamp(24px,5vw,64px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12 }}>THE DIFFERENCE</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 800, color: '#e8f4ff' }}>Resume vs Reality</h2>
          </div>

          <div className="compare-row">
            <div style={{ background: '#070f1f', border: '1px solid rgba(255,45,120,0.18)', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ff2d78', letterSpacing: 2, marginBottom: 18 }}>❌ TYPICAL RESUME</div>
              {['Proficient in React, Node.js, MongoDB', 'Built Netflix clone (YouTube tutorial)', '20+ Coursera certificates', '8.2 CGPA from tier 3 college', '"Passionate about technology"', 'Team player. Fast learner.'].map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: '#2a3a4a', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', lineHeight: 1.5 }}>{l}</div>
              ))}
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,45,120,0.07)', borderRadius: 8, fontSize: 12, color: '#ff2d78', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>
                Recruiter reads 6 seconds → Rejects
              </div>
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(0,240,255,0.18)', borderRadius: 14, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00f0ff,transparent)' }} />
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 18 }}>✓ GENOIS PROFILE</div>
              {['GENOIS Score: 1,840 / 2,000', 'Global Rank: #47 of 2,847 students', 'Day 22/30 streak — 0 days missed', 'Strong: DSA, System Design', 'Live project: Password Manager (link)', '94% test accuracy this week'].map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5 }}>{l}</div>
              ))}
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,240,255,0.07)', borderRadius: 8, fontSize: 12, color: '#00f0ff', fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>
                Recruiter clicks → Calls next day
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,240,255,0.12),transparent)' }} />

        {/* HOW IT WORKS */}
        <section style={{ padding: 'clamp(56px,7vw,80px) clamp(24px,5vw,64px)', background: 'rgba(0,240,255,0.015)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff', letterSpacing: 2, marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 800, color: '#e8f4ff' }}>3 steps. 30 days. Different person.</h2>
          </div>
          <div className="steps-row">
            {STEPS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '36px 24px', background: '#070f1f', border: '1px solid rgba(0,240,255,0.07)', borderRadius: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 800, color: '#020812' }}>{i + 1}</div>
                <div style={{ fontSize: 40, marginBottom: 14, marginTop: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f4ff', marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#5a7a9a', lineHeight: 1.75 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(123,92,255,0.2),transparent)' }} />

        {/* DAILY SYSTEM + DOMAINS side by side */}
        <section style={{ padding: 'clamp(56px,7vw,80px) clamp(24px,5vw,64px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="compare-row">

            {/* Daily timeline */}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#7b5cff', letterSpacing: 2, marginBottom: 12 }}>YOUR MORNING</div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 800, color: '#e8f4ff', marginBottom: 32 }}>
                3 hours. Every morning.<br />
                <span style={{ color: '#7b5cff' }}>No exceptions.</span>
              </h2>
              {[
                { time: '6:00 AM', task: 'Roadmap unlocks', note: '5 tasks appear. Miss even one — tomorrow stays locked.', color: '#00f0ff' },
                { time: '6:15 AM', task: 'Watch concept video', note: '15 minutes. Focused. Not a 4-hour tutorial.', color: '#7b5cff' },
                { time: '6:45 AM', task: 'Read the resource', note: 'One article. One doc page. Understand it.', color: '#7F77DD' },
                { time: '7:15 AM', task: 'Solve coding challenge', note: 'One problem. AI reviews your code live.', color: '#1D9E75' },
                { time: '8:00 AM', task: 'Take daily test', note: '5 questions. Anti-cheat on. Score updates rank.', color: '#D85A30' },
                { time: '8:30 AM', task: 'Generate AI notes', note: 'Bullet points. Emoji-tagged. Ready to revise.', color: '#EF9F27' },
                { time: '8:45 AM', task: '✓ All done', note: 'Streak +1. Rank updated. Tomorrow unlocked.', color: '#1D9E75', done: true },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.done ? '#1D9E75' : t.color, marginTop: 5, flexShrink: 0 }} />
                    {i < 6 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: 3 }} />}
                  </div>
                  <div style={{ paddingBottom: i < 6 ? 18 : 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#3a4a5a' }}>{t.time}</span>
                      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: t.done ? '#1D9E75' : '#e8f4ff' }}>{t.task}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.6 }}>{t.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Domains */}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#7b5cff', letterSpacing: 2, marginBottom: 12 }}>PICK YOUR BATTLEFIELD</div>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 800, color: '#e8f4ff', marginBottom: 8 }}>
                10 domains.<br />One daily system.
              </h2>
              <p style={{ color: '#5a7a9a', fontSize: 14, marginBottom: 28 }}>Pick one. Master it in 30 days. Switch anytime.</p>
              <div className="domains-row">
                {DOMAINS.map(d => (
                  <div key={d.label} style={{ padding: '16px 10px', borderRadius: 12, background: '#070f1f', border: `1px solid ${d.color}22`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    {d.hot && <div style={{ position: 'absolute', top: 5, right: 5, fontSize: 8, padding: '1px 5px', borderRadius: 10, background: 'rgba(255,45,120,0.12)', color: '#ff2d78', fontFamily: 'JetBrains Mono,monospace' }}>HOT</div>}
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{d.icon}</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 10, fontWeight: 600, color: d.color, lineHeight: 1.3 }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,240,255,0.15),transparent)' }} />

        {/* FINAL CTA */}
        <section style={{ padding: 'clamp(70px,9vw,110px) clamp(24px,5vw,64px)', textAlign: 'center', background: 'linear-gradient(180deg,transparent,rgba(0,240,255,0.02))' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 20 }}>THE ONLY QUESTION THAT MATTERS</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,5vw,58px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 28 }}>
            Is your skill real?<br />
            <span style={{ background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Or just your resume?
            </span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, maxWidth: 640, margin: '0 auto 44px', textAlign: 'left' }}>
            {['30 days free trial', 'No credit card needed', 'Real projects you build', 'AI code review daily', 'Live rank among students', 'Public profile for recruiters'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#6a7a8a' }}>
                <span style={{ color: '#00f0ff', flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
          </div>

          <Link href="/onboarding" style={{ display: 'inline-block', padding: '16px 52px', borderRadius: 14, background: 'linear-gradient(135deg,#00f0ff,#7b5cff)', color: '#020812', textDecoration: 'none', fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, boxShadow: '0 0 50px rgba(0,240,255,0.35)', letterSpacing: -0.3 }}>
            Start Free — Prove Yourself →
          </Link>
          <p style={{ marginTop: 14, fontSize: 12, color: '#3a4a5a', fontFamily: 'JetBrains Mono,monospace' }}>
            Free for 30 days · No card · Cancel anytime
          </p>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid rgba(0,240,255,0.06)', padding: '28px clamp(24px,5vw,64px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
              <span style={{ color: '#00f0ff' }}>GEN</span><span style={{ color: '#e8f4ff' }}>OIS</span>
            </div>
            <div style={{ color: '#2a3a4a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>Built for students who are done pretending.</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{ color: '#3a4a5a', textDecoration: 'none', fontSize: 13 }}>Pricing</Link>
            <Link href="/college-war" style={{ color: '#3a4a5a', textDecoration: 'none', fontSize: 13 }}>College War</Link>
            <Link href="/shame-board" style={{ color: '#3a4a5a', textDecoration: 'none', fontSize: 13 }}>Shame Board</Link>
            <Link href="/domain-explorer" style={{ color: '#3a4a5a', textDecoration: 'none', fontSize: 13 }}>Domain Explorer</Link>
            <Link href="/login" style={{ color: '#3a4a5a', textDecoration: 'none', fontSize: 13 }}>Login</Link>
            <Link href="/onboarding" style={{ color: '#00f0ff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Start Free →</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
