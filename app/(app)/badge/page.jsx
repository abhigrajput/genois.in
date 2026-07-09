'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const DOMAINS = [
  { slug:'fullstack',    label:'Full Stack',      icon:'🌐' },
  { slug:'dsa',          label:'DSA',              icon:'🧠' },
  { slug:'cybersecurity',label:'Cybersecurity',    icon:'🔒' },
  { slug:'aiml',         label:'AI & ML',          icon:'🤖' },
  { slug:'devops',       label:'DevOps',           icon:'⚙️' },
  { slug:'android',      label:'Android',          icon:'📱' },
  { slug:'datascience',  label:'Data Science',     icon:'📊' },
  { slug:'blockchain',   label:'Blockchain',       icon:'⛓️' },
  { slug:'gamedev',      label:'Game Dev',         icon:'🎮' },
  { slug:'systemdesign', label:'System Design',    icon:'🏗️' },
];

const LEVEL_COLOR = { proficient:'#4f9cf9', expert:'#EF9F27', master:'#1D9E75' };

const S = {
  page: { fontFamily:'var(--font-body)', minHeight:'100vh', background:'#020812', color:'#e8e8ed', padding:'28px 16px' },
  card: { maxWidth:820, margin:'0 auto', background:'#070f1f', border:'1px solid rgba(0,240,255,0.12)', borderRadius:20, padding:28 },
  btn:  { padding:'13px 28px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, background:'linear-gradient(135deg,#00f0ff,#ff6b4a)', color:'#020812' },
  ghost:{ padding:'9px 18px', borderRadius:8, border:'1px solid rgba(0,240,255,0.2)', background:'transparent', cursor:'pointer', color:'#00f0ff', fontSize:12, fontFamily:'var(--font-heading)', fontWeight:600 },
  mono: { fontFamily:'var(--font-mono)' },
  h1:   { fontFamily:'var(--font-heading)', fontSize:26, fontWeight:800, color:'#e8e8ed', margin:'0 0 6px' },
  sub:  { color:'#5a7a9a', fontSize:13, margin:'0 0 24px' },
};

// ── Screen 1: Domain Select ───────────────────────────────────────────────
function DomainSelect({ badges, cooldowns, onSelect }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>🎖️ Skill Verification</h1>
        <p style={S.sub}>Earn verified skill badges. Pass 70%+ to get a 60-day badge. Proctored · 30 questions · 45 min</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:12 }}>
          {DOMAINS.map(d => {
            const badge   = badges.find(b => b.domain === d.slug);
            const cooldown = cooldowns[d.slug];
            const active  = badge?.status === 'active';
            const inactive = badge?.status === 'inactive';
            const cd = cooldown ? Math.ceil((new Date(cooldown) - Date.now()) / 86400000) : 0;
            return (
              <button key={d.slug} onClick={() => onSelect(d, cd)}
                style={{ background: active ? 'rgba(29,158,117,0.08)' : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${active ? 'rgba(29,158,117,0.3)' : inactive ? 'rgba(239,159,39,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius:12, padding:'16px 12px', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{d.icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#e8e8ed', marginBottom:6 }}>{d.label}</div>
                {active  && <div style={{ fontSize:10, color:'#1D9E75', ...S.mono }}>✅ {badge.daysLeft}d left</div>}
                {inactive && <div style={{ fontSize:10, color:'#EF9F27', ...S.mono }}>↻ Renew</div>}
                {cd > 0   && <div style={{ fontSize:10, color:'#ff2d78', ...S.mono }}>🕐 {cd}d cooldown</div>}
                {!badge && !cd && <div style={{ fontSize:10, color:'#5a7a9a', ...S.mono }}>Not earned</div>}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:20, textAlign:'right' }}>
          <a href="/badge?screen=mybadges" style={{ ...S.ghost, textDecoration:'none', display:'inline-block' }}>My Badges →</a>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: Test ────────────────────────────────────────────────────────
function TestScreen({ questions, domain, onSubmit, submitting }) {
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [strikes, setStrikes] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0; } return t-1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Proctoring
  useEffect(() => {
    function onVisChange() {
      if (document.hidden) {
        setStrikes(s => {
          const ns = s + 1;
          if (ns >= 3) { toast.error('3 strikes — auto-submitting!'); doSubmit(true); }
          else toast.error(`⚠️ Warning ${ns}/3: Tab switch detected!`, { duration: 4000 });
          return ns;
        });
      }
    }
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [answers]);

  const doSubmit = useCallback((auto = false) => {
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const built = questions.map(q => ({
      questionId: q.id, topic: q.topic, type: q.type,
      selected: answers[q.id] || null,
      correct: answers[q.id] === q.correct,
    }));
    onSubmit(built, timeTaken);
  }, [answers, questions, startTime, onSubmit]);

  const q = questions[current];
  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerColor = timeLeft < 180 ? '#ff2d78' : timeLeft < 600 ? '#EF9F27' : '#00f0ff';
  const answered = Object.keys(answers).length;
  const canSubmit = answered >= 25;

  return (
    <div style={S.page}>
      {/* Warning banner */}
      <div style={{ maxWidth:820, margin:'0 auto 12px', background:'rgba(255,45,120,0.08)', border:'1px solid rgba(255,45,120,0.2)', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, color:'#ff2d78' }}>🔒 PROCTORED TEST — Tab switching detected. Strikes: </span>
        {[0,1,2].map(i => <span key={i} style={{ fontSize:14, color: i < strikes ? '#ff2d78' : '#2a3a4a' }}>⚠️</span>)}
      </div>

      {/* Top bar */}
      <div style={{ maxWidth:820, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:18 }}>{DOMAINS.find(d=>d.slug===domain)?.icon}</span>
          <span style={{ fontSize:12, color:'#5a7a9a', ...S.mono }}>Q {current+1}/{questions.length}</span>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:12, background:'rgba(0,240,255,0.08)', color:'#00f0ff' }}>{q?.type}</span>
        </div>
        <span style={{ fontSize:16, fontWeight:700, color:timerColor, ...S.mono }}>⏱ {mm}:{ss}</span>
      </div>

      {/* Progress */}
      <div style={{ maxWidth:820, margin:'0 auto 14px', height:3, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
        <div style={{ height:'100%', width:`${(answered/questions.length)*100}%`, background:'linear-gradient(90deg,#00f0ff,#ff6b4a)', borderRadius:2, transition:'width 0.3s' }} />
      </div>

      {/* Question card */}
      <div style={{ ...S.card, marginBottom:12 }}>
        <div style={{ fontSize:14, color:'#e8e8ed', lineHeight:1.7, marginBottom: q?.code ? 14 : 20, fontWeight:500 }}>{q?.question}</div>
        {q?.code && (
          <pre style={{ background:'#0a0f1e', border:'1px solid rgba(255,107,74,0.2)', borderRadius:10, padding:14, overflowX:'auto', fontSize:12, lineHeight:1.6, color:'#c8d8e8', marginBottom:18, ...S.mono }}>
            {q.code}
          </pre>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {['A','B','C','D'].map(opt => {
            const sel = answers[q?.id] === opt;
            return (
              <button key={opt} onClick={() => setAnswers(p => ({...p, [q.id]: opt}))}
                style={{ display:'flex', gap:10, padding:'11px 14px', borderRadius:10,
                  border:`1px solid ${sel ? '#00f0ff' : 'rgba(255,255,255,0.05)'}`,
                  background: sel ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.02)',
                  color: sel ? '#00f0ff' : '#c8d8e8', cursor:'pointer', textAlign:'left', fontSize:13, fontFamily:'var(--font-body)' }}>
                <span style={{ ...S.mono, fontSize:11, fontWeight:700, color: sel ? '#00f0ff' : '#5a7a9a', flexShrink:0, marginTop:2 }}>{opt}.</span>
                <span>{q?.options?.[opt]}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:12, textAlign:'right' }}>
          <button onClick={() => setFlagged(p => ({...p, [q?.id]: !p[q?.id]}))}
            style={{ ...S.ghost, fontSize:11, color: flagged[q?.id] ? '#EF9F27' : '#5a7a9a', borderColor: flagged[q?.id] ? 'rgba(239,159,39,0.3)' : 'rgba(255,255,255,0.06)' }}>
            {flagged[q?.id] ? '🚩 Flagged' : '⚑ Flag'}
          </button>
        </div>
      </div>

      {/* Nav + palette */}
      <div style={{ maxWidth:820, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <button onClick={() => setCurrent(c => Math.max(0,c-1))} disabled={current===0} style={{ ...S.ghost, opacity: current===0 ? 0.3 : 1 }}>← Prev</button>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center', flex:1 }}>
          {questions.map((qs,i) => (
            <button key={qs.id} onClick={() => setCurrent(i)}
              style={{ width:26, height:26, borderRadius:5, border:'none', cursor:'pointer', fontSize:9,
                ...S.mono, fontWeight:700,
                background: i===current ? '#00f0ff' : flagged[qs.id] ? '#EF9F27' : answers[qs.id] ? '#1D9E75' : 'rgba(255,255,255,0.05)',
                color: i===current || flagged[qs.id] || answers[qs.id] ? '#020812' : '#5a7a9a' }}>
              {i+1}
            </button>
          ))}
        </div>
        {current < questions.length-1
          ? <button onClick={() => setCurrent(c=>c+1)} style={S.ghost}>Next →</button>
          : <button onClick={() => doSubmit(false)} disabled={!canSubmit||submitting}
              style={{ ...S.btn, fontSize:12, padding:'9px 18px', opacity:(!canSubmit||submitting)?0.5:1 }}>
              {submitting ? 'Evaluating...' : canSubmit ? 'Submit →' : `${25-answered} more needed`}
            </button>
        }
      </div>
      {canSubmit && current < questions.length-1 && (
        <div style={{ maxWidth:820, margin:'10px auto 0', textAlign:'right' }}>
          <button onClick={() => doSubmit(false)} disabled={submitting} style={{ ...S.btn, fontSize:13, padding:'10px 22px' }}>
            {submitting ? 'Evaluating...' : 'Submit Test →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Screen 3: Result ─────────────────────────────────────────────────────
function ResultScreen({ result, domain, onViewBadges }) {
  const d = DOMAINS.find(x => x.slug === domain);
  const lc = LEVEL_COLOR[result.level] || '#4f9cf9';
  const shareUrl = result.badge?.id ? `https://genois.in/verify/${result.badge.id}` : 'https://genois.in';
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const topics = Object.entries(result.topicBreakdown || {});

  return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth:680 }}>
        {result.passed ? (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:60, marginBottom:10 }}>🎖️</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:`${lc}15`,
                border:`2px solid ${lc}40`, borderRadius:40, padding:'10px 28px', marginBottom:10 }}>
                <span style={{ fontSize:20 }}>{d?.icon}</span>
                <span style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:800, color:lc }}>
                  {d?.label} {result.level?.charAt(0).toUpperCase()+result.level?.slice(1)} Verified
                </span>
              </div>
              <div style={{ fontSize:34, fontWeight:700, ...S.mono, color:'#e8e8ed', marginBottom:4 }}>
                {result.score}<span style={{ fontSize:16, color:'#5a7a9a' }}>/100</span>
              </div>
              {result.badge?.expiresAt && (
                <div style={{ fontSize:12, color:'#5a7a9a' }}>
                  Valid until {new Date(result.badge.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {topics.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, color:'#5a7a9a', letterSpacing:2, ...S.mono, marginBottom:10 }}>TOPIC BREAKDOWN</div>
                {topics.map(([t, pct]) => (
                  <div key={t} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:11, color:'#c8d8e8' }}>{t}</span>
                      <span style={{ fontSize:11, ...S.mono, color: pct>=70?'#1D9E75':pct>=50?'#EF9F27':'#ff2d78' }}>{pct}%</span>
                    </div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:2, background: pct>=70?'#1D9E75':pct>=50?'#EF9F27':'#ff2d78', transition:'width 0.8s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.feedback && (
              <div style={{ background:'rgba(0,240,255,0.04)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:16, marginBottom:20 }}>
                <div style={{ fontSize:10, color:'#00f0ff', letterSpacing:2, ...S.mono, marginBottom:6 }}>🤖 FEEDBACK</div>
                <p style={{ fontSize:13, color:'#c8d8e8', lineHeight:1.7, margin:0 }}>{result.feedback}</p>
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <a href={linkedinShare} target="_blank" rel="noreferrer"
                style={{ ...S.btn, textDecoration:'none', background:'#0077b5', color:'#fff', display:'inline-flex', alignItems:'center', gap:6 }}>
                Share on LinkedIn
              </a>
              <button onClick={onViewBadges} style={S.ghost}>View My Badges</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:56, marginBottom:10 }}>😔</div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:800, color:'#ff2d78', marginBottom:6 }}>Not Passed Yet</div>
              <div style={{ fontSize:32, fontWeight:700, ...S.mono, color:'#e8e8ed', marginBottom:4 }}>
                {result.score}<span style={{ fontSize:14, color:'#5a7a9a' }}>/100 (need 70+)</span>
              </div>
              {result.cooldown && (
                <div style={{ fontSize:12, color:'#ff2d78', marginTop:6 }}>
                  🕐 Retry available in {result.cooldown.daysLeft} days
                </div>
              )}
            </div>

            {result.weaknesses?.length > 0 && (
              <div style={{ background:'rgba(255,45,120,0.06)', border:'1px solid rgba(255,45,120,0.15)', borderRadius:12, padding:16, marginBottom:16 }}>
                <div style={{ fontSize:10, color:'#ff2d78', letterSpacing:2, ...S.mono, marginBottom:10 }}>FOCUS AREAS</div>
                {result.weaknesses.map(w => (
                  <div key={w} style={{ fontSize:12, color:'#c8d8e8', marginBottom:5, paddingLeft:10, borderLeft:'2px solid #ff2d78' }}>{w}</div>
                ))}
              </div>
            )}

            {result.feedback && (
              <div style={{ background:'rgba(0,240,255,0.03)', border:'1px solid rgba(0,240,255,0.08)', borderRadius:12, padding:14, marginBottom:20 }}>
                <p style={{ fontSize:13, color:'#c8d8e8', lineHeight:1.7, margin:0 }}>{result.feedback}</p>
              </div>
            )}

            <div style={{ textAlign:'center' }}>
              <button onClick={onViewBadges} style={S.ghost}>← Back to Domains</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Screen 4: My Badges ───────────────────────────────────────────────────
function MyBadgesScreen({ badges, onRenew, onBack }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h1 style={{ ...S.h1, margin:0 }}>My Badges</h1>
          <button onClick={onBack} style={S.ghost}>← All Domains</button>
        </div>
        {badges.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#5a7a9a' }}>
            No badges yet. Start a verification test to earn your first badge.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
            {badges.map(b => {
              const d = DOMAINS.find(x => x.slug === b.domain);
              const active = b.status === 'active';
              const lc = active ? (LEVEL_COLOR[b.level] || '#4f9cf9') : '#3a4a5a';
              const shareUrl = `https://genois.in/verify/${b.id}`;
              return (
                <div key={b.id} style={{ background: active ? `${lc}10` : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${active ? lc+'40' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius:14, padding:18, textAlign:'center',
                  boxShadow: active ? `0 0 18px ${lc}15` : 'none' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{d?.icon || '🎖️'}</div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color: active ? lc : '#5a7a9a', marginBottom:4 }}>
                    {d?.label || b.domain}
                  </div>
                  <div style={{ fontSize:11, ...S.mono, color:'#5a7a9a', marginBottom:6 }}>
                    {b.score}/100 · {b.level}
                  </div>
                  {active
                    ? <div style={{ fontSize:11, color:'#1D9E75', background:'rgba(29,158,117,0.1)', borderRadius:20, padding:'3px 10px', display:'inline-block', marginBottom:10 }}>
                        ✅ {b.daysLeft}d remaining
                      </div>
                    : <div style={{ fontSize:11, color:'#EF9F27', marginBottom:10 }}>Expired</div>
                  }
                  <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                    {!active && (
                      <button onClick={() => onRenew(b.domain)} style={{ ...S.btn, fontSize:10, padding:'6px 12px' }}>Renew</button>
                    )}
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank" rel="noreferrer"
                      style={{ ...S.ghost, textDecoration:'none', fontSize:10, padding:'5px 10px', display:'inline-block' }}>
                      Share
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function BadgePage() {
  const { token, ready } = useToken();
  const router = useRouter();
  const [screen, setScreen] = useState('select');
  const [badges, setBadges] = useState([]);
  const [cooldowns, setCooldowns] = useState({});
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/badge/status', token)
      .then(r => { setBadges(r.data.badges || []); setCooldowns(r.data.cooldowns || {}); })
      .catch(() => {});
  }, [ready, token]);

  async function handleDomainSelect(domain, cooldownDays) {
    if (cooldownDays > 0) {
      toast.error(`Cooldown active — ${cooldownDays} days remaining`); return;
    }
    setSelectedDomain(domain);
    setLoadingQ(true);
    try {
      const r = await apiFetch(`/api/badge/generate?domain=${domain.slug}`, token);
      setQuestions(r.data.questions);
      setScreen('test');
    } catch (e) { toast.error(e.message || 'Failed to load questions'); }
    setLoadingQ(false);
  }

  async function handleSubmit(answers, timeTaken) {
    setSubmitting(true);
    setScreen('evaluating');
    try {
      const r = await apiFetch('/api/badge/evaluate', token, 'POST', { answers, domain: selectedDomain.slug, timeTaken });
      if (r.data.blocked) {
        toast.error(`Domain locked — ${r.data.daysLeft} day cooldown`);
        setScreen('select'); return;
      }
      setResult(r.data);
      setScreen('result');
      // Refresh badges
      const statusR = await apiFetch('/api/badge/status', token);
      setBadges(statusR.data.badges || []); setCooldowns(statusR.data.cooldowns || {});
    } catch (e) { toast.error(e.message || 'Evaluation failed'); setScreen('select'); }
    setSubmitting(false);
  }

  if (loadingQ) return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚙️</div>
        <p style={{ color:'#5a7a9a' }}>Generating 30 advanced questions via Claude AI...</p>
      </div>
    </div>
  );

  if (screen === 'evaluating') return (
    <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🤖</div>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:20, color:'#e8e8ed', marginBottom:8 }}>DeepSeek R1 is evaluating...</h2>
        <p style={{ color:'#5a7a9a', fontSize:13 }}>Analyzing topic mastery, code understanding, and skill level.</p>
      </div>
    </div>
  );

  if (screen === 'test' && questions.length > 0)
    return <TestScreen questions={questions} domain={selectedDomain?.slug} onSubmit={handleSubmit} submitting={submitting} />;

  if (screen === 'result' && result)
    return <ResultScreen result={result} domain={selectedDomain?.slug} onViewBadges={() => setScreen('mybadges')} />;

  if (screen === 'mybadges')
    return <MyBadgesScreen badges={badges} onRenew={(slug) => handleDomainSelect(DOMAINS.find(d=>d.slug===slug), 0)} onBack={() => setScreen('select')} />;

  return <DomainSelect badges={badges} cooldowns={cooldowns} onSelect={handleDomainSelect} />;
}
