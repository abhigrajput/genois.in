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
  // The code and language live inside <CodeEditor/> — the page must never keep
  // its own copy, because the copy is what used to get submitted (a blank
  // placeholder) instead of the student's actual solution.
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
    setHintIndex(-1);
    setCurrentTestIndex(0);
  }

  async function loadCompanyProblems(name) {
    setLoadError(null);
    setPageLoading(true);
    try {
      const r = await apiFetch('/api/coding/company?company=' + encodeURIComponent(name), token);
      const tests = r.data?.codingTests || [];
      setCompanyInfo({ focus: r.data?.focus });
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

  // `code`/`language` come from the editor itself — see CodeEditor's onComplete.
  async function submitCode(code, language) {
    if (!codingTest || !code?.trim() || !token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/coding/submit', token, 'POST', {
        codingTestId: codingTest.id,
        code,
        language: language || 'javascript',
      });
      setResult(res.data);
      toast.success('Code reviewed!');
    } catch (err) {
      toast.error(friendlyError(err, 'review your code — the AI reviewer may be busy'));
    } finally {
      setLoading(false);
    }
  }

  const card = { background:'var(--gx-bg)', border:'1px solid var(--gx-border)', borderRadius:14, padding:20, marginBottom:16 };

  const modeTab = (active) => ({
    padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
    fontFamily:'var(--font-heading)',fontSize:12,fontWeight:600,
    background: active ? 'var(--gx-accent)' : 'var(--gx-surface)',
    color: active ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)',
  });
  const companyChip = (active) => ({
    padding:'6px 14px',borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,
    fontFamily:'var(--font-heading)',
    border: active ? '1px solid var(--gx-accent-border)' : '1px solid var(--gx-border)',
    background: active ? 'var(--gx-accent-soft)' : 'transparent',
    color: active ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
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
      <h1 style={{fontFamily:'var(--font-heading)',fontSize:24,fontWeight:800,color:'var(--gx-text)',marginBottom:6}}>Coding Challenge</h1>
      <p style={{color:'var(--gx-text-muted)',fontSize:13,marginBottom:16}}>
        {mode === 'company'
          ? (selectedCompany ? `${selectedCompany} practice · problems written in the style of its OA` : 'Pick a target company to practice its OA pattern')
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
          <div style={{fontSize:12,color:'var(--gx-text)',lineHeight:1.6}}>{companyInfo.focus}</div>
          <div style={{fontSize:11,color:'var(--gx-text-muted)',marginTop:6}}>
            Practice problems written in the style of {selectedCompany}&apos;s OA — not real past questions.
          </div>
        </div>
      )}

      {!codingTest ? (
        <div style={{...card,textAlign:'center',padding:48}}>
          <div style={{fontSize:48,marginBottom:16}}>{mode === 'company' ? '🎯' : '{}'}</div>
          <div style={{color:'var(--gx-text)',fontSize:16,fontWeight:600,marginBottom:8}}>
            {mode === 'company' ? 'Pick a company to start practicing' : 'No coding challenge loaded'}
          </div>
          <div style={{color:'var(--gx-text-muted)',fontSize:13}}>
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
        onClick={() => { setCurrentTestIndex(i); setCodingTest(codingTests[i]); setResult(null); setCodeEligible(false); setCodeTimeLeft(30); }}
        style={{
          padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
          fontFamily:'var(--font-heading)',fontSize:12,fontWeight:600,
          background: currentTestIndex===i ? 'var(--gx-accent)' : 'var(--gx-surface)',
          color: currentTestIndex===i ? 'var(--gx-text-inverse)' : 'var(--gx-text-muted)',
        }}>
        Problem {i+1} {t.difficulty ? '· '+t.difficulty : ''}
      </button>
    ))}
  </div>
)}
          <div style={card}>
            <div style={{fontFamily:'var(--font-heading)',fontSize:16,fontWeight:700,color:'var(--gx-text)',marginBottom:8}}>{codingTest.title}</div>
            <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--gx-success)',background:'var(--gx-success-soft)',padding:'2px 10px',borderRadius:20}}>{codingTest.difficulty}</span>
            {/* One honest label for every company-practice problem. Nothing in
                the bank is a sourced past exam question, so no problem carries
                a "real OA" claim. */}
            {codingTest.source && (
              <span style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--gx-text-muted)',background:'var(--gx-surface)',padding:'2px 10px',borderRadius:20,marginLeft:6}}>
                Practice{selectedCompany ? ` · in the style of ${selectedCompany}` : ''}
              </span>
            )}
            <div style={{fontSize:13,color:'var(--gx-text)',lineHeight:1.7,marginTop:12,marginBottom:16}}>{codingTest.problem}</div>
            {codingTest.example_input && (
              <div style={{background:'rgba(16,24,40,0.4)',borderRadius:8,padding:12,fontFamily:'var(--font-mono)',fontSize:12}}>
                <div style={{color:'var(--gx-text-muted)',marginBottom:4}}>Input: <span style={{color:'var(--gx-accent)'}}>{codingTest.example_input}</span></div>
                <div style={{color:'var(--gx-text-muted)'}}>Output: <span style={{color:'var(--gx-success)'}}>{codingTest.example_output}</span></div>
              </div>
            )}
          </div>

          {(codingTest.hints||[]).length > 0 && (
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--gx-warning)',marginBottom:10,fontFamily:'var(--font-heading)'}}>Hints (costs 2 pts each)</div>
              {hintIndex === -1 ? (
                <button onClick={() => setHintIndex(0)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--gx-warning-border)',background:'transparent',color:'var(--gx-warning)',cursor:'pointer',fontSize:12}}>
                  Show Hint 1
                </button>
              ) : (
                codingTest.hints.slice(0, hintIndex+1).map((hint,i) => (
                  <div key={i} style={{fontSize:13,color:'var(--gx-text)',padding:'8px 0',borderBottom:'1px solid var(--gx-border)'}}>
                    💡 {hint}
                  </div>
                ))
              )}
              {hintIndex >= 0 && hintIndex < codingTest.hints.length - 1 && (
                <button onClick={() => setHintIndex(h => h+1)} style={{marginTop:8,padding:'6px 14px',borderRadius:8,border:'1px solid var(--gx-warning-border)',background:'transparent',color:'var(--gx-warning)',cursor:'pointer',fontSize:12}}>
                  Next Hint
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{...card,padding:0,overflow:'hidden'}}>
            {/* Keyed on the problem so switching problems gives a fresh editor —
                otherwise problem 1's code stayed in the box and got submitted
                as the answer to problem 2. */}
            <CodeEditor
              key={codingTest.id || currentTestIndex}
              token={token}
              taskDescription={codingTest?.problem || 'Complete the coding challenge'}
              expectedOutput={codingTest?.example_output || null}
              onComplete={submitCode}
              isCompleted={!!result}
              submitting={loading}
              runEligible={codeEligible}
              runTimeLeft={codeTimeLeft}
            />
          </div>

          {result && (
            <div style={{...card,borderColor: result.review?.isCorrect ? 'var(--gx-success-border)' : 'var(--gx-danger-border)'}}>
               <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background: result.review?.isCorrect?'var(--gx-success-soft)':'var(--gx-danger-soft)',color: result.review?.isCorrect?'var(--gx-success)':'var(--gx-danger)'}}>
                   {result.review?.isCorrect ? '✓ Correct' : '✗ Needs Work'}
                 </span>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'var(--gx-accent-soft)',color:'var(--gx-accent)'}}>Score: {result.review?.score}/100</span>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'var(--gx-warning-soft)',color:'var(--gx-warning)'}}>+{result.points} pts</span>
               </div>
               <div style={{fontSize:13,color:'var(--gx-text)',lineHeight:1.7}}>{result.review?.feedback}</div>
               {/* This verdict comes from an AI reviewer reading the code — not
                   from running it against test cases. Saying "Correct" without
                   that qualifier claims a guarantee we don't have. */}
               <div style={{fontSize:11,color:'var(--gx-text-subtle)',lineHeight:1.6,marginTop:12,fontFamily:'var(--font-mono)'}}>
                 AI-evaluated — a reviewer read your code and judged the approach. It was not run against hidden test cases.
               </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
