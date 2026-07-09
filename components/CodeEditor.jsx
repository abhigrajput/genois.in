'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c'];
const LANGUAGE_LABELS = { python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++', c: 'C' };

const STARTERS = {
  python: '# Write your solution here\n\ndef solution():\n    pass\n\nprint(solution())',
  javascript: '// Write your solution here\n\nfunction solution() {\n    \n}\n\nconsole.log(solution());',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
};

export default function CodeEditor({ token, taskDescription, expectedOutput, onComplete, isCompleted, runEligible = true, runTimeLeft = 0 }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [showStdin, setShowStdin] = useState(false);

  function changeLanguage(lang) {
    setLanguage(lang);
    setCode(STARTERS[lang]);
    setResult(null);
  }

  async function runCode() {
    if (!code.trim()) { toast.error('Write some code first'); return; }
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin, expectedOutput }),
      });
      const d = await r.json();
      if (d.success) {
        setResult(d.data);
        if (d.data.passed && onComplete && !isCompleted) {
          toast.success('Tests passed! +20 pts');
          onComplete();
        }
      } else {
        toast.error(d.message);
      }
    } catch (e) { toast.error('Execution failed'); }
    setRunning(false);
  }

  const statusColors = {
    accepted: '#1D9E75',
    wrong_answer: '#ff2d78',
    compilation_error: '#EF9F27',
    runtime_error: '#ff2d78',
    time_limit_exceeded: '#EF9F27',
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      {taskDescription && (
        <div style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00f0ff', letterSpacing: 2, marginBottom: 6 }}>TASK</div>
          <div style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.6 }}>{taskDescription}</div>
          {expectedOutput && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
              Expected output: <span style={{ color: '#1D9E75' }}>{expectedOutput}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGUAGES.map(l => (
            <button key={l} onClick={() => changeLanguage(l)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${language === l ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`, background: language === l ? 'rgba(0,240,255,0.08)' : 'transparent', color: language === l ? '#00f0ff' : '#5a7a9a', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowStdin(!showStdin)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 11 }}>
            {showStdin ? 'Hide Input' : 'Add Input'}
          </button>
          <button onClick={() => { setCode(STARTERS[language]); setResult(null); }} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontSize: 11 }}>
            Reset
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 280,
          padding: '14px 16px',
          borderRadius: 10,
          border: '1px solid rgba(0,240,255,0.1)',
          background: '#050d1a',
          color: '#e8e8ed',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          lineHeight: 1.6,
          tabSize: 2,
        }}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + '  ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
          }
        }}
      />

      {showStdin && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>STDIN (input for your program)</div>
          <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={3} placeholder="Enter program input here..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0,240,255,0.1)', background: '#050d1a', color: '#e8e8ed', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}

      <button
        onClick={() => runEligible && !running && !isCompleted && runCode()}
        disabled={running || isCompleted || !runEligible}
        style={{
          width: '100%', padding: '13px', borderRadius: 10, border: 'none', marginTop: 10,
          cursor: running || isCompleted || !runEligible ? 'not-allowed' : 'pointer',
          background: isCompleted ? 'rgba(29,158,117,0.2)' : !runEligible ? 'rgba(255,255,255,0.07)' : running ? 'rgba(0,240,255,0.15)' : 'linear-gradient(135deg,#00f0ff,#1D9E75)',
          color: isCompleted ? '#1D9E75' : !runEligible ? '#555' : '#020812',
          fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
          transition: 'all 0.4s ease',
        }}>
        {isCompleted ? '✓ Code Submitted' : !runEligible ? `⏳ Read problem for ${runTimeLeft}s before running` : running ? '⚙️ Running...' : '▶ Run Code'}
      </button>

      {result && (
        <div style={{ marginTop: 14, background: '#050d1a', border: `1px solid ${statusColors[result.status] || 'rgba(255,255,255,0.1)'}30`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{result.passed ? '✅' : '❌'}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: statusColors[result.status] || '#5a7a9a' }}>
                {result.statusDescription || result.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            {result.time && (
              <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>
                {result.time}s · {result.memory}KB
              </span>
            )}
          </div>

          {result.stdout && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>OUTPUT</div>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: '#1D9E75', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.stdout}</pre>
            </div>
          )}

          {result.stderr && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#ff2d78', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>ERROR</div>
              <pre style={{ background: 'rgba(255,45,120,0.05)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: '#ff2d78', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.stderr}</pre>
            </div>
          )}

          {result.compile_output && (
            <div>
              <div style={{ fontSize: 10, color: '#EF9F27', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>COMPILE OUTPUT</div>
              <pre style={{ background: 'rgba(239,159,39,0.05)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: '#EF9F27', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.compile_output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
