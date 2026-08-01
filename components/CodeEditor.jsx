'use client';
import { useState, useEffect } from 'react';
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

/**
 * @param {(code: string, language: string) => void} props.onComplete
 *   Called with the code actually in the editor. It used to take no arguments,
 *   which meant every caller submitted its own untouched placeholder string
 *   instead of the student's solution.
 */
export default function CodeEditor({ token, taskDescription, expectedOutput, onComplete, isCompleted, submitting = false, runEligible = true, runTimeLeft = 0 }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [showStdin, setShowStdin] = useState(false);
  // null = not checked yet. Knowing this up front lets us tell the student that
  // Run is unavailable *before* they write a solution and hit a failure.
  const [execAvailable, setExecAvailable] = useState(null);
  const [execNotice, setExecNotice] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/code/execute', { headers: { Authorization: 'Bearer ' + token } });
        const d = await r.json();
        if (cancelled) return;
        setExecAvailable(!!d?.data?.configured);
        setExecNotice(d?.data?.configured ? null : d?.data?.message || null);
      } catch {
        // A failed preflight is not itself a failure — leave Run enabled and let
        // the real run report the specific reason.
        if (!cancelled) setExecAvailable(true);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  function changeLanguage(lang) {
    setLanguage(lang);
    setCode(STARTERS[lang]);
    setResult(null);
    setRunError(null);
  }

  function isUntouched() {
    return code.trim() === STARTERS[language].trim();
  }

  async function runCode() {
    if (!code.trim()) { toast.error('Write some code first'); return; }
    setRunning(true);
    setResult(null);
    setRunError(null);
    try {
      const r = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin, expectedOutput }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setResult(d.data);
      } else {
        // The server always sends a specific reason now — show it in place,
        // not as a toast that disappears before it can be read.
        setRunError(d?.message || `The code runner failed (HTTP ${r.status}).`);
        if (r.status === 503) setExecAvailable(false);
      }
    } catch {
      setRunError("Couldn't reach the server to run your code — check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  function submitForReview() {
    if (!code.trim()) { toast.error('Write some code first'); return; }
    if (isUntouched()) { toast.error('Write your solution before submitting — this is still the starter template.'); return; }
    onComplete?.(code, language);
  }

  const statusColors = {
    accepted: 'var(--gx-success)',
    wrong_answer: 'var(--gx-danger)',
    compilation_error: 'var(--gx-warning)',
    runtime_error: 'var(--gx-danger)',
    time_limit_exceeded: 'var(--gx-warning)',
    internal_error: 'var(--gx-warning)',
    runner_error: 'var(--gx-warning)',
  };

  const runDisabled = running || isCompleted || !runEligible || execAvailable === false;
  const submitDisabled = submitting || isCompleted || !runEligible;

  const btnBase = {
    flex: 1, padding: '13px', borderRadius: 10, border: 'none',
    fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
    transition: 'all 0.4s ease',
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', width: '100%' }}>
      {taskDescription && (
        <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-accent)', letterSpacing: 2, marginBottom: 6 }}>TASK</div>
          <div style={{ fontSize: 14, color: 'var(--gx-text)', lineHeight: 1.6 }}>{taskDescription}</div>
          {expectedOutput && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Expected output: <span style={{ color: 'var(--gx-success)' }}>{expectedOutput}</span>
            </div>
          )}
        </div>
      )}

      {execAvailable === false && execNotice && (
        <div style={{ background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: 'var(--gx-warning)', lineHeight: 1.6 }}>
          {execNotice}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGUAGES.map(l => (
            <button key={l} onClick={() => changeLanguage(l)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${language === l ? 'var(--gx-accent-border)' : 'var(--gx-border)'}`, background: language === l ? 'var(--gx-accent-soft)' : 'transparent', color: language === l ? 'var(--gx-accent)' : 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowStdin(!showStdin)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 11 }}>
            {showStdin ? 'Hide Input' : 'Add Input'}
          </button>
          <button onClick={() => { setCode(STARTERS[language]); setResult(null); setRunError(null); }} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'transparent', color: 'var(--gx-text-muted)', cursor: 'pointer', fontSize: 11 }}>
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
          border: '1px solid var(--gx-border)',
          background: 'var(--gx-surface)',
          color: 'var(--gx-text)',
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
          <div style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>STDIN (input for your program)</div>
          <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={3} placeholder="Enter program input here..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gx-border)', background: 'var(--gx-surface)', color: 'var(--gx-text)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* Run and Submit are separate actions. Submission used to fire only as a
          side effect of a passing run, so whenever the runner was down or the
          output formatting differed, nothing was ever submitted — no score, no
          evidence, no way forward. */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={() => !runDisabled && runCode()}
          disabled={runDisabled}
          title={execAvailable === false ? 'Running code is unavailable right now' : undefined}
          style={{
            ...btnBase,
            cursor: runDisabled ? 'not-allowed' : 'pointer',
            background: runDisabled ? 'var(--gx-surface)' : running ? 'var(--gx-accent-soft)' : 'transparent',
            border: `1px solid ${runDisabled ? 'var(--gx-border)' : 'var(--gx-accent-border)'}`,
            color: runDisabled ? 'var(--gx-text-subtle)' : 'var(--gx-accent)',
          }}>
          {execAvailable === false ? '▶ Run unavailable' : !runEligible ? `⏳ ${runTimeLeft}s` : running ? '⚙️ Running…' : '▶ Run Code'}
        </button>

        <button
          onClick={() => !submitDisabled && submitForReview()}
          disabled={submitDisabled}
          style={{
            ...btnBase,
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
            background: isCompleted ? 'var(--gx-success-soft)' : !runEligible ? 'var(--gx-surface)' : submitting ? 'var(--gx-accent-soft)' : 'var(--gx-accent)',
            color: isCompleted ? 'var(--gx-success)' : !runEligible ? 'var(--gx-text-subtle)' : 'var(--gx-text-inverse)',
          }}>
          {isCompleted ? '✓ Submitted' : !runEligible ? `Read problem for ${runTimeLeft}s` : submitting ? '⏳ Reviewing…' : '✓ Submit for Review'}
        </button>
      </div>

      {runError && (
        <div style={{ marginTop: 14, background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>COULDN&apos;T RUN</div>
          <div style={{ fontSize: 13, color: 'var(--gx-text)', lineHeight: 1.6 }}>{runError}</div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 14, background: 'var(--gx-surface)', border: `1px solid ${statusColors[result.status] || 'var(--gx-border)'}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{result.ran ? '✅' : '❌'}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: statusColors[result.status] || 'var(--gx-text-muted)' }}>
                {result.statusDescription || result.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            {result.time && (
              <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {result.time}s · {result.memory}KB
              </span>
            )}
          </div>

          {result.statusNote && (
            <div style={{ fontSize: 12, color: 'var(--gx-text-muted)', lineHeight: 1.6, marginBottom: 10 }}>{result.statusNote}</div>
          )}

          {result.outputMatches === false && (
            <div style={{ fontSize: 12, color: 'var(--gx-warning)', lineHeight: 1.6, marginBottom: 10 }}>
              Your output doesn&apos;t match the example output (<code style={{ fontFamily: 'var(--font-mono)' }}>{result.expectedOutput}</code>). That may just be formatting — submit for review to get judged on the logic.
            </div>
          )}
          {result.outputMatches === true && (
            <div style={{ fontSize: 12, color: 'var(--gx-success)', lineHeight: 1.6, marginBottom: 10 }}>
              Output matches the example. Submit for review to record it.
            </div>
          )}

          {result.stdout && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>OUTPUT</div>
              <pre style={{ background: 'var(--gx-surface-2)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: 'var(--gx-success)', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.stdout}</pre>
            </div>
          )}

          {result.stderr && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--gx-danger)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>ERROR</div>
              <pre style={{ background: 'var(--gx-danger-soft)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: 'var(--gx-danger)', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.stderr}</pre>
            </div>
          )}

          {result.compile_output && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>COMPILE OUTPUT</div>
              <pre style={{ background: 'var(--gx-warning-soft)', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: 'var(--gx-warning)', fontFamily: 'var(--font-mono)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.compile_output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
