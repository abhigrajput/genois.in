'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import CodeEditor from '@/components/CodeEditor';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ErrorCard, { friendlyError } from '@/components/ui/ErrorCard';

export default function CodingPage() {
  const { token, ready } = useToken();
  const [codingTest, setCodingTest] = useState(null);
  const [codingTests, setCodingTests] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [code, setCode] = useState('// Write your solution here\n\n');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [hintIndex, setHintIndex] = useState(-1);
  const [codeEligible, setCodeEligible] = useState(false);
  const [codeTimeLeft, setCodeTimeLeft] = useState(30);
  const [loadError, setLoadError] = useState(null);
  // Practice by Company mode — additive; daily challenge flow is untouched
  const [mode, setMode] = useState('daily');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  // 30-second read gate: resets each time a new problem loads
  useEffect(() => {
    if (!codingTest) { setCodeEligible(false); setCodeTimeLeft(30); return; }
    setCodeEligible(false);
    setCodeTimeLeft(30);
    const interval = setInterval(() => {
      setCodeTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setCodeEligible(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [codingTest]);

  async function loadChallenge() {
    setLoadError(null);
    setPageLoading(true);

    function applyChallenge(r) {
      const tests = r.data.codingTests || (r.data.codingTest ? [r.data.codingTest] : []);
      setCodingTests(tests);
      setCodingTest(tests[0] || null);
    }

    try {
      const r = await apiFetch('/api/roadmap/daily', token);
      const day = r.data?.currentDay;
      if (!day) throw new Error('No current day');
      setCurrentDay(day);
      applyChallenge(await apiFetch('/api/coding/day/' + day, token));
    } catch {
      // Roadmap day unavailable — fall back to day 1 before giving up.
      try {
        setCurrentDay(1);
        applyChallenge(await apiFetch('/api/coding/day/1', token));
      } catch (err) {
        setLoadError(friendlyError(err, "load today's coding challenge"));
      }
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    if (!ready || !token) return;
    loadChallenge();
  }, [ready, token]);

  function resetWorkspace() {
    setResult(null);
    setCode('// Write your solution here\n\n');
    setHintIndex(-1);
    setCurrentTestIndex(0);
  }

  async function loadCompanyProblems(name) {
    setLoadError(null);
    setPageLoading(true);
    try {
      const r = await apiFetch('/api/coding/company?company=' + encodeURIComponent(name), token);
      const tests = r.data?.codingTests || [];
      setCompanyInfo({ focus: r.data?.focus, realCount: r.data?.realCount ?? 0, aiCount: r.data?.aiCount ?? 0 });
      setCodingTests(tests);
      setCodingTest(tests[0] || null);
    } catch (err) {
      setLoadError(friendlyError(err, `load ${name} practice problems`));
    } finally {
      setPageLoading(false);
    }
  }

  async function loadCompanyList() {
    setLoadError(null);
    setPageLoading(true);
    try {
      const r = await apiFetch('/api/coding/company', token);
      setCompanies(r.data?.companies || []);
      const def = r.data?.defaultCompany;
      if (def) {
        setSelectedCompany(def);
        await loadCompanyProblems(def);
      } else {
        setCodingTests([]);
        setCodingTest(null);
      }
    } catch (err) {
      setLoadError(friendlyError(err, 'load the company list'));
    } finally {
      setPageLoading(false);
    }
  }

  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    resetWorkspace();
    if (next === 'daily') {
      loadChallenge();
    } else if (!companies.length) {
      loadCompanyList();
    } else if (selectedCompany) {
      loadCompanyProblems(selectedCompany);
    } else {
      setCodingTests([]);
      setCodingTest(null);
    }
  }

  function selectCompany(name) {
    if (name === selectedCompany && codingTests.length) return;
    setSelectedCompany(name);
    resetWorkspace();
    loadCompanyProblems(name);
  }

  async function submitCode() {
    if (!codingTest || !code.trim() || !token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/coding/submit', token, 'POST', {
        codingTestId: codingTest.id,
        code,
        language,
      });
      setResult(res.data);
      toast.success('Code reviewed!');
    } catch (err) {
      toast.error(friendlyError(err, 'review your code — the AI reviewer may be busy'));
    } finally {
      setLoading(false);
    }
  }

  const card = { background:'#070f1f', border:'1px solid rgba(0,217,163,0.1)', borderRadius:14, padding:20, marginBottom:16 };

  const modeTab = (active) => ({
    padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
    fontFamily:'var(--font-heading)',fontSize:12,fontWeight:600,
    background: active ? 'linear-gradient(135deg,#00d9a3,#ff6b4a)' : 'rgba(255,255,255,0.05)',
    color: active ? '#020812' : '#5a7a9a',
  });
  const companyChip = (active) => ({
    padding:'6px 14px',borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,
    fontFamily:'var(--font-heading)',
    border: active ? '1px solid rgba(0,217,163,0.5)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(0,217,163,0.12)' : 'transparent',
    color: active ? '#00d9a3' : '#5a7a9a',
  });

  if (!ready || pageLoading) return <LoadingSkeleton variant="page" label={mode === 'company' ? 'Preparing company practice problems…' : "Loading today's coding challenge…"} />;

  if (loadError) return (
    <ErrorCard
      title={mode === 'company' ? "Couldn't load company practice" : "Couldn't load the challenge"}
      message={loadError}
      primaryLabel="↻ Retry"
      onPrimary={() => {
        if (mode === 'daily') return loadChallenge();
        if (selectedCompany) return loadCompanyProblems(selectedCompany);
        return loadCompanyList();
      }}
    />
  );

  return (
    <div style={{width:'100%', maxWidth: 1600, margin: '0 auto', fontFamily:'var(--font-body)'}}>
      <h1 style={{fontFamily:'var(--font-heading)',fontSize:24,fontWeight:800,color:'#e8e8ed',marginBottom:6}}>Coding Challenge</h1>
      <p style={{color:'#5a7a9a',fontSize:13,marginBottom:16}}>
        {mode === 'company'
          ? (selectedCompany ? `${selectedCompany} practice · real OA questions first, AI-generated to fill` : 'Pick a target company to practice its OA pattern')
          : `Day ${currentDay} · Submit your solution for AI review`}
      </p>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button onClick={() => switchMode('daily')} style={modeTab(mode === 'daily')}>Daily Challenge</button>
        <button onClick={() => switchMode('company')} style={modeTab(mode === 'company')}>Practice by Company</button>
      </div>

      {mode === 'company' && companies.length > 0 && (
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {companies.map(c => (
            <button key={c.name} onClick={() => selectCompany(c.name)} style={companyChip(selectedCompany === c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {mode === 'company' && selectedCompany && companyInfo && codingTest && (
        <div style={{...card, padding:'12px 16px'}}>
          <div style={{fontSize:12,color:'#c8d8e8',lineHeight:1.6}}>{companyInfo.focus}</div>
          <div style={{fontSize:11,color:'#5a7a9a',marginTop:6}}>
            {companyInfo.realCount > 0
              ? `${companyInfo.realCount} real past OA question${companyInfo.realCount > 1 ? 's' : ''} from verified placement data · ${companyInfo.aiCount} AI-generated practice`
              : `No verified past questions for ${selectedCompany} yet — all problems are AI-generated in its style`}
          </div>
        </div>
      )}

      {!codingTest ? (
        <div style={{...card,textAlign:'center',padding:48}}>
          <div style={{fontSize:48,marginBottom:16}}>{mode === 'company' ? '🎯' : '{}'}</div>
          <div style={{color:'#e8e8ed',fontSize:16,fontWeight:600,marginBottom:8}}>
            {mode === 'company' ? 'Pick a company to start practicing' : 'No coding challenge loaded'}
          </div>
          <div style={{color:'#5a7a9a',fontSize:13}}>
            {mode === 'company'
              ? 'Problems are matched to each company’s OA difficulty and topic pattern'
              : <>Visit Daily Roadmap first to initialize today&apos;s challenge</>}
          </div>
        </div>
      ) : (
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
{codingTests.length > 1 && (
  <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
    {codingTests.map((t,i) => (
      <button key={i}
        onClick={() => { setCurrentTestIndex(i); setCodingTest(codingTests[i]); setResult(null); setCode('// Write your solution here\n\n'); setCodeEligible(false); setCodeTimeLeft(30); }}
        style={{
          padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
          fontFamily:'var(--font-heading)',fontSize:12,fontWeight:600,
          background: currentTestIndex===i ? 'linear-gradient(135deg,#00d9a3,#ff6b4a)' : 'rgba(255,255,255,0.05)',
          color: currentTestIndex===i ? '#020812' : '#5a7a9a',
        }}>
        Problem {i+1} {t.difficulty ? '· '+t.difficulty : ''}{t.source === 'real' ? ' · Real' : ''}
      </button>
    ))}
  </div>
)}
          <div style={card}>
            <div style={{fontFamily:'var(--font-heading)',fontSize:16,fontWeight:700,color:'#e8e8ed',marginBottom:8}}>{codingTest.title}</div>
            <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'#1D9E75',background:'rgba(29,158,117,0.1)',padding:'2px 10px',borderRadius:20}}>{codingTest.difficulty}</span>
            {codingTest.source === 'real' && (
              <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'#00d9a3',background:'rgba(0,217,163,0.1)',padding:'2px 10px',borderRadius:20,marginLeft:6}}>✓ Real past OA question</span>
            )}
            {codingTest.source === 'ai' && (
              <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'#5a7a9a',background:'rgba(255,255,255,0.05)',padding:'2px 10px',borderRadius:20,marginLeft:6}}>AI-generated practice</span>
            )}
            <div style={{fontSize:13,color:'#c8d8e8',lineHeight:1.7,marginTop:12,marginBottom:16}}>{codingTest.problem}</div>
            {codingTest.example_input && (
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:8,padding:12,fontFamily:'var(--font-mono)',fontSize:12}}>
                <div style={{color:'#5a7a9a',marginBottom:4}}>Input: <span style={{color:'#00d9a3'}}>{codingTest.example_input}</span></div>
                <div style={{color:'#5a7a9a'}}>Output: <span style={{color:'#1D9E75'}}>{codingTest.example_output}</span></div>
              </div>
            )}
          </div>

          {(codingTest.hints||[]).length > 0 && (
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:'#EF9F27',marginBottom:10,fontFamily:'var(--font-heading)'}}>Hints (costs 2 pts each)</div>
              {hintIndex === -1 ? (
                <button onClick={() => setHintIndex(0)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid rgba(239,159,39,0.3)',background:'transparent',color:'#EF9F27',cursor:'pointer',fontSize:12}}>
                  Show Hint 1
                </button>
              ) : (
                codingTest.hints.slice(0, hintIndex+1).map((hint,i) => (
                  <div key={i} style={{fontSize:13,color:'#c8d8e8',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    💡 {hint}
                  </div>
                ))
              )}
              {hintIndex >= 0 && hintIndex < codingTest.hints.length - 1 && (
                <button onClick={() => setHintIndex(h => h+1)} style={{marginTop:8,padding:'6px 14px',borderRadius:8,border:'1px solid rgba(239,159,39,0.3)',background:'transparent',color:'#EF9F27',cursor:'pointer',fontSize:12}}>
                  Next Hint
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{...card,padding:0,overflow:'hidden'}}>
            <CodeEditor
              token={token}
              taskDescription={codingTest?.problem || 'Complete the coding challenge'}
              expectedOutput={codingTest?.example_output || null}
              onComplete={submitCode}
              isCompleted={!!result}
              runEligible={codeEligible}
              runTimeLeft={codeTimeLeft}
            />
          </div>

          {result && (
            <div style={{...card,borderColor: result.review?.isCorrect ? 'rgba(29,158,117,0.3)' : 'rgba(255,45,120,0.3)'}}>
               <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background: result.review?.isCorrect?'rgba(29,158,117,0.15)':'rgba(255,45,120,0.15)',color: result.review?.isCorrect?'#1D9E75':'#ff2d78'}}>
                   {result.review?.isCorrect ? '✓ Correct' : '✗ Needs Work'}
                 </span>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'rgba(0,217,163,0.1)',color:'#00d9a3'}}>Score: {result.review?.score}/100</span>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'rgba(186,117,23,0.1)',color:'#EF9F27'}}>+{result.points} pts</span>
               </div>
               <div style={{fontSize:13,color:'#c8d8e8',lineHeight:1.7}}>{result.review?.feedback}</div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
