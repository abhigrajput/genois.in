'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';

export default function DomainExplorerPage() {
  const [domains, setDomains] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('explore');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    fetch('/api/domain-explorer').then(r => r.json()).then(d => {
      setDomains(d.data?.domains || []);
      setLoading(false);
    });
    fetch('/api/domain-explorer/quiz').then(r => r.json()).then(d => {
      setQuizQuestions(d.data?.questions || []);
    });
  }, []);

  async function submitQuiz() {
    const r = await fetch('/api/domain-explorer/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: quizAnswers }),
    });
    const d = await r.json();
    setRecommended(d.data?.recommended || []);
    setQuizDone(true);
  }

  function selectQuizOption(questionId, value) {
    setQuizAnswers(p => ({ ...p, [questionId]: value }));
    if (quizStep < quizQuestions.length - 1) {
      setTimeout(() => setQuizStep(s => s + 1), 250);
    }
  }

  const filtered = filter === 'all' ? domains
    : filter === 'hot' ? domains.filter(d => d.hot)
    : filter === 'high-pay' ? domains.filter(d => parseInt(d.packages.entry) >= 10)
    : filter === 'fast-job' ? domains.filter(d => d.timeToJob.includes('3-') || d.timeToJob.includes('4-'))
    : filter === 'easy' ? domains.filter(d => d.difficulty === 'Easy' || d.difficulty === 'Medium')
    : domains;

  if (loading) return <div style={{ color: '#5a7a9a', padding: 80, textAlign: 'center' }}>Loading domains...</div>;

  if (selected) {
    return (
      <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
        <PublicNav />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
          <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#00d9a3', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← Back to Explorer</button>

          <div style={{ background: '#070f1f', border: `2px solid ${selected.color}30`, borderRadius: 16, padding: 32, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${selected.color},transparent)` }} />

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 64, lineHeight: 1, color: selected.color }}>{selected.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: '#e8e8ed', margin: 0 }}>{selected.name}</h1>
                  {selected.hot && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,45,120,0.12)', color: '#ff2d78', fontFamily: 'var(--font-mono)' }}>🔥 HOT</span>}
                </div>
                <p style={{ color: '#5a7a9a', fontSize: 15, marginTop: 8, lineHeight: 1.7 }}>{selected.longDesc}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Demand', value: selected.demand, color: '#1D9E75' },
                { label: 'Difficulty', value: selected.difficulty, color: '#EF9F27' },
                { label: 'Time to Job', value: selected.timeToJob, color: '#00d9a3' },
                { label: 'Entry Package', value: selected.packages.entry, color: '#ff6b4a' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#5a7a9a', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 20 }}>

            <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.08)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 12 }}>TECH STACK YOU LEARN</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.stack.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,217,163,0.06)', color: '#00d9a3', fontFamily: 'var(--font-mono)' }}>{s}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.1)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 12 }}>CAREER ROLES</div>
              {selected.careers.map((c, i) => (
                <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '5px 0' }}>• {c}</div>
              ))}
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.1)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>TOP HIRING COMPANIES</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.companies.map((c, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,159,39,0.06)', color: '#EF9F27', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#070f1f', border: '1px solid rgba(255,107,74,0.12)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b4a', letterSpacing: 2, marginBottom: 12 }}>PACKAGE RANGE</div>
              <div style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>Entry: <strong style={{ color: '#e8e8ed' }}>{selected.packages.entry}</strong></div>
              <div style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>Mid (3-5 yrs): <strong style={{ color: '#e8e8ed' }}>{selected.packages.mid}</strong></div>
              <div style={{ fontSize: 13, color: '#c8d8e8', padding: '4px 0' }}>Senior (5+ yrs): <strong style={{ color: '#e8e8ed' }}>{selected.packages.senior}</strong></div>
            </div>
          </div>

          <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.15)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 10 }}>IS THIS FOR YOU?</div>
            <div style={{ fontSize: 15, color: '#e8e8ed', lineHeight: 1.7 }}>{selected.whoShould}</div>
          </div>

          <Link href={`/onboarding?domain=${selected.slug}`} style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: 14, background: `linear-gradient(135deg,${selected.color},${selected.color}99)`, color: '#020812', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>
            Start {selected.name} Free →
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'quiz') {
    if (quizDone) {
      return (
        <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
          <PublicNav />
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>Your Top 3 Matches</h1>
              <p style={{ color: '#5a7a9a', fontSize: 14 }}>Based on your answers. Click to explore each.</p>
            </div>
            {recommended.map((d, i) => (
              <div key={i} onClick={() => { setSelected(d); setMode('explore'); }} style={{ background: '#070f1f', border: `2px solid ${d.color}40`, borderRadius: 14, padding: 20, marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${d.color},transparent)` }} />
                <div style={{ fontSize: 32, color: d.color, fontWeight: 800, flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 6 }}>{d.shortDesc}</div>
                  <div style={{ fontSize: 11, color: '#c8d8e8', fontFamily: 'var(--font-mono)' }}>{d.packages.entry} · {d.timeToJob}</div>
                </div>
                <div style={{ fontSize: 20, color: d.color }}>→</div>
              </div>
            ))}
            <button onClick={() => { setMode('explore'); setQuizDone(false); setQuizStep(0); setQuizAnswers({}); }} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14, marginTop: 14 }}>
              View All Domains Instead
            </button>
          </div>
        </div>
      );
    }

    const q = quizQuestions[quizStep];
    return (
      <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
        <PublicNav />
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 2 }}>QUESTION {quizStep + 1} OF {quizQuestions.length}</div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((quizStep + 1) / quizQuestions.length) * 100}%`, background: 'linear-gradient(90deg,#00d9a3,#ff6b4a)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {q && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#e8e8ed', marginBottom: 24, textAlign: 'center' }}>{q.question}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map(opt => {
                  const selected = quizAnswers[q.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => selectQuizOption(q.id, opt.value)} style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1px solid ${selected ? 'rgba(0,217,163,0.5)' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(0,217,163,0.08)' : 'rgba(255,255,255,0.02)', color: selected ? '#00d9a3' : '#c8d8e8', fontSize: 15, fontFamily: 'var(--font-body)' }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {quizStep === quizQuestions.length - 1 && Object.keys(quizAnswers).length === quizQuestions.length && (
                <button onClick={submitQuiz} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginTop: 20 }}>
                  Get My 3 Matches →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020812', color: '#e8e8ed', fontFamily: 'var(--font-body)' }}>
      <PublicNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d9a3', letterSpacing: 2, marginBottom: 10 }}>DOMAIN EXPLORER</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.15 }}>
            Pick the <span style={{ color: '#00d9a3' }}>right domain</span> for your career
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            20 career paths with real package data, time to job, top companies, and what you will learn.
          </p>
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(0,217,163,0.06),rgba(255,107,74,0.03))', border: '1px solid rgba(0,217,163,0.15)', borderRadius: 14, padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 36 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#e8e8ed', marginBottom: 4 }}>Not sure which domain to pick?</div>
            <div style={{ fontSize: 13, color: '#5a7a9a' }}>Take our 5 question quiz and we will recommend your top 3 matches.</div>
          </div>
          <button onClick={() => { setMode('quiz'); setQuizStep(0); setQuizAnswers({}); setQuizDone(false); }} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            Take 2-min Quiz →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>
          {[
            { slug: 'all', label: 'All Domains' },
            { slug: 'hot', label: '🔥 Hot' },
            { slug: 'high-pay', label: '💰 High Pay' },
            { slug: 'fast-job', label: '⚡ Fast Job' },
            { slug: 'easy', label: '🌱 Easy Start' },
          ].map(f => (
            <button key={f.slug} onClick={() => setFilter(f.slug)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filter === f.slug ? '#00d9a3' : 'rgba(255,255,255,0.05)', color: filter === f.slug ? '#020812' : '#5a7a9a', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(d => (
            <div key={d.slug} onClick={() => setSelected(d)} style={{ background: '#070f1f', border: `1px solid ${d.color}25`, borderRadius: 14, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${d.color},transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 36, color: d.color }}>{d.icon}</div>
                {d.hot && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,45,120,0.12)', color: '#ff2d78', fontFamily: 'var(--font-mono)' }}>🔥 HOT</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: d.color, marginBottom: 6 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: '#5a7a9a', marginBottom: 12, lineHeight: 1.5 }}>{d.shortDesc}</div>
              <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#c8d8e8', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(29,158,117,0.08)', color: '#1D9E75' }}>{d.packages.entry}</span>
                <span style={{ padding: '2px 8px', borderRadius: 8, background: 'rgba(0,217,163,0.06)', color: '#00d9a3' }}>{d.timeToJob}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
