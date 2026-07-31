'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';
import VisualizerControls from './VisualizerControls';

const CODE = `int lcs(string S1, string S2, int m, int n) {
  vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
  for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
      if (S1[i - 1] == S2[j - 1])
        dp[i][j] = dp[i - 1][j - 1] + 1;
      else
        dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

export default function LCSVisualizer() {
  const [s1, setS1] = useState('AGGTAB');
  const [s2, setS2] = useState('GXTXAYB');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const computeSteps = useCallback((str1, str2) => {
    const tempSteps = [];
    const m = str1.length;
    const n = str2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    tempSteps.push({
      dp: dp.map(r => [...r]),
      currCell: null,
      candidates: [],
      traceback: [],
      match: false,
      codeLine: 1,
      explanation: 'Initializing (m+1)×(n+1) DP grid with zeros. Row 0 and column 0 are base cases (empty string).',
      status: 'info',
    });

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const charMatch = str1[i - 1] === str2[j - 1];
        const candidates = [];
        let formula = '';
        let desc = '';

        if (charMatch) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          candidates.push({ r: i - 1, c: j - 1, type: 'diagonal' });
          formula = `dp[${i-1}][${j-1}] + 1 = ${dp[i-1][j-1]} + 1 = ${dp[i][j]}`;
          desc = `s1[${i-1}]='${str1[i-1]}' == s2[${j-1}]='${str2[j-1]}'. Characters match! LCS extends! dp[${i}][${j}] = dp[${i-1}][${j-1}]+1 = ${dp[i-1][j-1]+1}. Taking diagonal.`;
        } else {
          const up = dp[i - 1][j];
          const left = dp[i][j - 1];
          dp[i][j] = Math.max(up, left);
          candidates.push({ r: i - 1, c: j, type: 'up', val: up });
          candidates.push({ r: i, c: j - 1, type: 'left', val: left });
          formula = `max(dp[${i-1}][${j}] (${up}), dp[${i}][${j-1}] (${left})) = ${dp[i][j]}`;
          desc = `s1[${i-1}]='${str1[i-1]}' != s2[${j-1}]='${str2[j-1]}'. dp[${i}][${j}] = max(dp[${i-1}][${j}]=${up}, dp[${i}][${j-1}]=${left}) = ${dp[i][j]}.`;
        }

        tempSteps.push({
          dp: dp.map(r => [...r]),
          currCell: { r: i, c: j },
          candidates,
          traceback: [],
          match: charMatch,
          codeLine: charMatch ? 5 : 7,
          explanation: desc,
          status: charMatch ? 'found' : 'compare',
        });
      }
    }

    // Traceback calculation for LCS string
    const tracebackPath = [];
    let r = m, c = n;
    let lcsChars = [];
    
    while (r > 0 && c > 0) {
      tracebackPath.push({ r, c });
      if (str1[r - 1] === str2[c - 1]) {
        lcsChars.unshift(str1[r - 1]);
        r--;
        c--;
      } else if (dp[r - 1][c] >= dp[r][c - 1]) {
        r--;
      } else {
        c--;
      }
    }
    if (r === 0 || c === 0) {
      tracebackPath.push({ r, c });
    }

    tempSteps.push({
      dp: dp.map(r => [...r]),
      currCell: { r: m, c: n },
      candidates: [],
      traceback: tracebackPath,
      lcsString: lcsChars.join(''),
      codeLine: 10,
      explanation: `Traceback complete! LCS is "${lcsChars.join('')}" (Length: ${dp[m][n]}). Reconstructing the common characters bottom-up.`,
      status: 'sorted',
    });

    return tempSteps;
  }, []);

  const rebuild = useCallback(() => {
    const s = computeSteps(s1, s2);
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, [s1, s2, computeSteps]);

  useEffect(() => {
    rebuild();
  }, [s1, s2, rebuild]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev + 1 >= steps.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps.length]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : {
    dp: Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0)),
    currCell: null,
    candidates: [],
    traceback: [],
    lcsString: '',
    codeLine: -1,
    description: 'Press Play or Step Forward to visualize the LCS bottom-up table construction.',
  };

  const getCellStyles = (r, c) => {
    const isCurrent = current.currCell && current.currCell.r === r && current.currCell.c === c;
    const cand = current.candidates.find(cand => cand.r === r && cand.c === c);
    const isTrace = current.traceback.some(pt => pt.r === r && pt.c === c);
    const isTraceMatch = isTrace && r > 0 && c > 0 && s1[r - 1] === s2[c - 1];

    let border = '1px solid var(--gx-border)';
    let color = 'var(--gx-text-subtle)';
    let background = 'transparent';
    let shadow = 'none';

    if (isCurrent) {
      border = '2px solid var(--gx-accent)';
      color = 'var(--gx-accent)';
      background = 'var(--gx-accent-soft)';
      shadow = 'none';
    } else if (isTraceMatch) {
      border = '2px solid var(--gx-success)';
      color = 'var(--gx-text)';
      background = 'var(--gx-success)';
      shadow = 'none';
    } else if (isTrace) {
      border = '2px solid var(--gx-success-border)';
      color = 'var(--gx-success)';
      background = 'var(--gx-success-soft)';
    } else if (cand) {
      border = '1.5px dashed var(--gx-warning)';
      color = 'var(--gx-warning)';
      background = 'var(--gx-warning-soft)';
    } else if (current.dp[r][c] > 0 || r === 0 || c === 0) {
      color = 'var(--gx-success)';
    }

    return { border, color, background, boxShadow: shadow };
  };

  const updateStrings = (val1, val2) => {
    const clean1 = val1.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
    const clean2 = val2.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
    setS1(clean1);
    setS2(clean2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Longest Common Subsequence (LCS)?"
        description="LCS finds the longest sequence of characters that appear in both strings in the same order (not necessarily contiguous). A 2D DP table: if characters match, extend the diagonal value; otherwise take the max of left or top neighbor. Used in diff tools and DNA sequence alignment."
        timeComplexity="O(m × n)"
        spaceComplexity="O(m × n)"
      />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'LCS Length', value: current.traceback.length ? current.dp[s1.length][s2.length] : '—', color: 'var(--gx-success)' },
          { label: 'LCS Subsequence', value: current.lcsString || '—', color: 'var(--gx-accent)' },
          { label: 'String 1 (S1)', value: s1, color: 'var(--gx-warning)' },
          { label: 'String 2 (S2)', value: s2, color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: s.color, wordBreak: 'break-all' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Side: String Configuration inputs */}
        <div style={{ minWidth: 220, flex: 0.7 }}>
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>STRING CONFIGURATION</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>S1 (Vertical String)</span>
              <input type="text" value={s1} onChange={e => updateStrings(e.target.value, s2)} style={inpStyle} placeholder="Max 8 chars" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>S2 (Horizontal String)</span>
              <input type="text" value={s2} onChange={e => updateStrings(s1, e.target.value)} style={inpStyle} placeholder="Max 8 chars" />
            </div>

            <button onClick={() => updateStrings('ABCDGH', 'AEDFHR')} style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', borderRadius: 8, color: 'var(--gx-accent)', padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
              🎲 Preset Strings
            </button>
          </div>
        </div>

        {/* Right Side: LCS 2D Grid */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, overflowX: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 12 }}>2D LCS COMPILER MATRIX [i][j]</div>
          
          <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: 6, borderBottom: '2px solid var(--gx-border)' }} />
                <th style={{ padding: 6, color: 'var(--gx-text-muted)', borderBottom: '2px solid var(--gx-border)', fontWeight: 'bold' }}>Ø</th>
                {s2.split('').map((char, j) => {
                  const isMatchHeader = current.currCell && current.currCell.c === j + 1;
                  return (
                    <th key={j} style={{
                      padding: 6,
                      color: isMatchHeader ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
                      borderBottom: '2px solid var(--gx-border)',
                      fontWeight: 'bold',
                      fontSize: 13,
                      transition: 'color 0.25s',
                    }}>
                      {char}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {current.dp.map((row, r) => (
                <tr key={r}>
                  {/* Vertical Label */}
                  <td style={{
                    padding: '8px 12px',
                    borderRight: '2px solid var(--gx-border)',
                    color: current.currCell && current.currCell.r === r ? 'var(--gx-accent)' : 'var(--gx-text-muted)',
                    fontWeight: 'bold',
                    fontSize: 13,
                    transition: 'color 0.25s',
                  }}>
                    {r === 0 ? 'Ø' : s1[r - 1]}
                  </td>
                  {row.map((val, c) => {
                    const cellStyle = getCellStyles(r, c);
                    return (
                      <td key={c} style={{
                        padding: 0,
                        border: '1px solid var(--gx-border)',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.25s',
                          fontWeight: 700,
                          borderRadius: 4,
                          margin: 2,
                          ...cellStyle,
                        }}>
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--gx-accent)', label: 'Computing cell [i][j]' },
          { color: 'var(--gx-warning)', label: 'Dependencies (Diagonal mismatch candidate)' },
          { color: 'var(--gx-success)', label: 'Match path cell / Traceback intersection' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, ${l.color} 13%, transparent)`, border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current.explanation}
        status={current.status}
      />

      {/* Controls */}
      <VisualizerControls
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(p => !p)}
        onStepForward={() => setStepIdx(p => Math.min(p + 1, steps.length - 1))}
        onStepBackward={() => setStepIdx(p => Math.max(p - 1, 0))}
        onReset={() => { setStepIdx(-1); setIsPlaying(false); }}
        speed={speed}
        onSpeedChange={setSpeed}
        currentStep={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        showArrayControls={false}
      />

      <CodePanel code={CODE} activeLine={current.codeLine} />
    </div>
  );
}

const inpStyle = {
  background: 'var(--gx-accent-soft)',
  border: '1px solid var(--gx-accent-border)',
  borderRadius: 8,
  padding: '6px 10px',
  color: 'var(--gx-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  outline: 'none',
};
