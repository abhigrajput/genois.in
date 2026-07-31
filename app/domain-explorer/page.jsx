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
    : filter === 'high-pay' ? domains.filter(d => d.payBand === 'High')
    : filter === 'fast-job' ? domains.filter(d => d.timeToJob.includes('3-') || d.timeToJob.includes('4-'))
    : filter === 'easy' ? domains.filter(d => d.difficulty === 'Easy' || d.difficulty === 'Medium')
    : domains;

  if (loading) return <div style={{ color: 'var(--gx-text-muted)', padding: 80, textAlign: 'center' }}>Loading domains...</div>;

  if (selected) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
        <PublicNav />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
          <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gx-accent)', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← Back to Explorer</button>

          <div style={{ background: 'var(--gx-bg)', border: `2px solid color-mix(in srgb, ${selected.color} 19%, transparent)`, borderRadius: 16, padding: 32, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: selected.color }} />

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 64, lineHeight: 1, color: selected.color }}>{selected.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--gx-text)', margin: 0 }}>{selected.name}</h1>
                  {selected.hot && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'var(--gx-danger-soft)', color: 'var(--gx-danger)', fontFamily: 'var(--font-mono)' }}>🔥 HOT</span>}
                </div>
                <p style={{ color: 'var(--gx-text-muted)', fontSize: 15, marginTop: 8, lineHeight: 1.7 }}>{selected.longDesc}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Demand', value: selected.demand, color: 'var(--gx-success)' },
                { label: 'Difficulty', value: selected.difficulty, color: 'var(--gx-warning)' },
                { label: 'Time to Job', value: selected.timeToJob, color: 'var(--gx-accent)' },
                { label: 'Pay Band', value: selected.payBand, color: 'var(--gx-warning)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px', background: 'var(--gx-surface)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 20 }}>

            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 12 }}>TECH STACK YOU LEARN</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.stack.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-success-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-success)', letterSpacing: 2, marginBottom: 12 }}>CAREER ROLES</div>
              {selected.careers.map((c, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--gx-text)', padding: '5px 0' }}>• {c}</div>
              ))}
            </div>

            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-warning-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 2, marginBottom: 12 }}>TOP HIRING COMPANIES</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.companies.map((c, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'var(--gx-warning-soft)', color: 'var(--gx-warning)', fontWeight: 600 }}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-warning-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 2, marginBottom: 12 }}>PAY</div>
              <div style={{ fontSize: 13, color: 'var(--gx-text)', padding: '4px 0' }}>Relative band: <strong style={{ color: 'var(--gx-text)' }}>{selected.payBand}</strong></div>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', padding: '6px 0 0', lineHeight: 1.6 }}>Positioned against the other domains listed here. We do not publish salary figures &mdash; real offers vary widely by company, city, role and hiring cycle. Check current openings on the employer&apos;s careers page for actual numbers.</div>
            </div>
          </div>

          <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 10 }}>IS THIS FOR YOU?</div>
            <div style={{ fontSize: 15, color: 'var(--gx-text)', lineHeight: 1.7 }}>{selected.whoShould}</div>
          </div>

          <Link href={`/onboarding?domain=${selected.slug}`} style={{ display: 'block', textAlign: 'center', padding: '16px', borderRadius: 14, background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800 }}>
            Start {selected.name} Free →
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'quiz') {
    if (quizDone) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
          <PublicNav />
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>Your Top 3 Matches</h1>
              <p style={{ color: 'var(--gx-text-muted)', fontSize: 14 }}>Based on your answers. Click to explore each.</p>
            </div>
            {recommended.map((d, i) => (
              <div key={i} onClick={() => { setSelected(d); setMode('explore'); }} style={{ background: 'var(--gx-bg)', border: `2px solid color-mix(in srgb, ${d.color} 25%, transparent)`, borderRadius: 14, padding: 20, marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: d.color }} />
                <div style={{ fontSize: 32, color: 'var(--gx-accent)', fontWeight: 800, flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--gx-text-muted)', marginBottom: 6 }}>{d.shortDesc}</div>
                  <div style={{ fontSize: 11, color: 'var(--gx-text)', fontFamily: 'var(--font-mono)' }}>Pay: {d.payBand} · {d.timeToJob}</div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--gx-text-subtle)' }}>→</div>
              </div>
            ))}
            <button onClick={() => { setMode('explore'); setQuizDone(false); setQuizStep(0); setQuizAnswers({}); }} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14, marginTop: 14 }}>
              View All Domains Instead
            </button>
          </div>
        </div>
      );
    }

    const q = quizQuestions[quizStep];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
        <PublicNav />
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 2 }}>QUESTION {quizStep + 1} OF {quizQuestions.length}</div>
          </div>
          <div style={{ height: 4, background: 'var(--gx-surface)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((quizStep + 1) / quizQuestions.length) * 100}%`, background: 'var(--gx-accent)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {q && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 24, textAlign: 'center' }}>{q.question}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map(opt => {
                  const selected = quizAnswers[q.id] === opt.value;
                  return (
                    <button key={opt.value} onClick={() => selectQuizOption(q.id, opt.value)} style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1px solid ${selected ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`, background: selected ? 'var(--gx-accent-soft)' : 'var(--gx-surface)', color: selected ? 'var(--gx-accent)' : 'var(--gx-text)', fontSize: 15, fontFamily: 'var(--font-body)' }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {quizStep === quizQuestions.length - 1 && Object.keys(quizAnswers).length === quizQuestions.length && (
                <button onClick={submitQuiz} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, marginTop: 20 }}>
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
    <div style={{ minHeight: '100vh', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontFamily: 'var(--font-body)' }}>
      <PublicNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 10 }}>DOMAIN EXPLORER</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.15 }}>
            Pick the <span style={{ color: 'var(--gx-accent)' }}>right domain</span> for your career
          </h1>
          <p style={{ color: 'var(--gx-text-muted)', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            20 career paths with real package data, time to job, top companies, and what you will learn.
          </p>
        </div>

        <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 14, padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 36 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 4 }}>Not sure which domain to pick?</div>
            <div style={{ fontSize: 13, color: 'var(--gx-text-muted)' }}>Take our 5 question quiz and we will recommend your top 3 matches.</div>
          </div>
          <button onClick={() => { setMode('quiz'); setQuizStep(0); setQuizAnswers({}); setQuizDone(false); }} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
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
            <button key={f.slug} onClick={() => setFilter(f.slug)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filter === f.slug ? 'var(--gx-accent)' : 'var(--gx-surface)', color: filter === f.slug ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600 }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(d => (
            <div key={d.slug} onClick={() => setSelected(d)} style={{ background: 'var(--gx-bg)', border: `1px solid color-mix(in srgb, ${d.color} 15%, transparent)`, borderRadius: 14, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: d.color }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 36, color: d.color }}>{d.icon}</div>
                {d.hot && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'var(--gx-danger-soft)', color: 'var(--gx-danger)', fontFamily: 'var(--font-mono)' }}>🔥 HOT</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--gx-text)', marginBottom: 6 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{d.shortDesc}</div>
              <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'var(--gx-text)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--gx-success-soft)', color: 'var(--gx-success)' }}>Pay: {d.payBand}</span>
                <span style={{ padding: '2px 8px', borderRadius: 8, background: 'var(--gx-accent-soft)', color: 'var(--gx-accent)' }}>{d.timeToJob}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
