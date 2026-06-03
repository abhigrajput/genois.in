'use client';
import { useState, useEffect } from 'react';
import { useToken, apiFetch } from '@/lib/useApi';
import toast from 'react-hot-toast';
import CodeEditor from '@/components/CodeEditor';

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

  useEffect(() => {
    if (!ready || !token) return;
    apiFetch('/api/roadmap/daily', token)
      .then(r => {
        const day = r.data?.currentDay || 1;
        setCurrentDay(day);
        return apiFetch('/api/coding/day/' + day, token);
      })
      .then(r => {
        const tests = r.data.codingTests || (r.data.codingTest ? [r.data.codingTest] : []);
        setCodingTests(tests);
        setCodingTest(tests[0] || null);
      })
      .catch(err => toast.error('Failed to load challenge'))
      .finally(() => setPageLoading(false));
  }, [ready, token]);

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
      toast.error('Submit failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const card = { background:'#070f1f', border:'1px solid rgba(0,240,255,0.1)', borderRadius:14, padding:20, marginBottom:16 };

  if (!ready || pageLoading) return (
    <div style={{textAlign:'center',paddingTop:80,color:'#5a7a9a',fontFamily:'JetBrains Mono,monospace',fontSize:13}}>
      Loading challenge...
    </div>
  );

  if (!codingTest) return (
    <div style={{width:'100%', maxWidth: 1600, margin: '0 auto'}}>
      <div style={{...card,textAlign:'center',padding:48}}>
        <div style={{fontSize:48,marginBottom:16}}>{'{}'}</div>
        <div style={{color:'#e8f4ff',fontSize:16,fontWeight:600,marginBottom:8}}>No coding challenge loaded</div>
        <div style={{color:'#5a7a9a',fontSize:13}}>Visit Daily Roadmap first to initialize today&apos;s challenge</div>
      </div>
    </div>
  );

  return (
    <div style={{width:'100%', maxWidth: 1600, margin: '0 auto', fontFamily:'Outfit,sans-serif'}}>
      <h1 style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800,color:'#e8f4ff',marginBottom:6}}>Coding Challenge</h1>
      <p style={{color:'#5a7a9a',fontSize:13,marginBottom:20}}>Day {currentDay} · Submit your solution for AI review</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
{codingTests.length > 1 && (
  <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
    {codingTests.map((t,i) => (
      <button key={i}
        onClick={() => { setCurrentTestIndex(i); setCodingTest(codingTests[i]); setResult(null); setCode('// Write your solution here\n\n'); setCodeEligible(false); setCodeTimeLeft(30); }}
        style={{
          padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
          fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:600,
          background: currentTestIndex===i ? 'linear-gradient(135deg,#00f0ff,#7b5cff)' : 'rgba(255,255,255,0.05)',
          color: currentTestIndex===i ? '#020812' : '#5a7a9a',
        }}>
        Problem {i+1} {t.difficulty ? '· '+t.difficulty : ''}
      </button>
    ))}
  </div>
)}
          <div style={card}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'#e8f4ff',marginBottom:8}}>{codingTest.title}</div>
            <span style={{fontSize:11,fontFamily:'JetBrains Mono,monospace',color:'#1D9E75',background:'rgba(29,158,117,0.1)',padding:'2px 10px',borderRadius:20}}>{codingTest.difficulty}</span>
            <div style={{fontSize:13,color:'#c8d8e8',lineHeight:1.7,marginTop:12,marginBottom:16}}>{codingTest.problem}</div>
            {codingTest.example_input && (
              <div style={{background:'rgba(0,0,0,0.4)',borderRadius:8,padding:12,fontFamily:'JetBrains Mono,monospace',fontSize:12}}>
                <div style={{color:'#5a7a9a',marginBottom:4}}>Input: <span style={{color:'#00f0ff'}}>{codingTest.example_input}</span></div>
                <div style={{color:'#5a7a9a'}}>Output: <span style={{color:'#1D9E75'}}>{codingTest.example_output}</span></div>
              </div>
            )}
          </div>

          {(codingTest.hints||[]).length > 0 && (
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:'#EF9F27',marginBottom:10,fontFamily:'Syne,sans-serif'}}>Hints (costs 2 pts each)</div>
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
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'rgba(0,240,255,0.1)',color:'#00f0ff'}}>Score: {result.review?.score}/100</span>
                 <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,background:'rgba(186,117,23,0.1)',color:'#EF9F27'}}>+{result.points} pts</span>
               </div>
               <div style={{fontSize:13,color:'#c8d8e8',lineHeight:1.7}}>{result.review?.feedback}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
