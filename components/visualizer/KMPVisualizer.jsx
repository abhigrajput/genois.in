'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';
import VisualizerControls from './VisualizerControls';

const CODE = `void computeLPSArray(string pat, int M, vector<int>& lps) {
  int len = 0;
  lps[0] = 0;
  int i = 1;
  while (i < M) {
    if (pat[i] == pat[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len != 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
}

void KMPSearch(string pat, string txt) {
  int M = pat.length();
  int N = txt.length();
  vector<int> lps(M);
  computeLPSArray(pat, M, lps);

  int i = 0, j = 0;
  while (i < N) {
    if (pat[j] == txt[i]) {
      i++; j++;
    }
    if (j == M) {
      // Found match at i - j
      j = lps[j - 1];
    } else if (i < N && pat[j] != txt[i]) {
      if (j != 0) j = lps[j - 1];
      else i++;
    }
  }
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

export default function KMPVisualizer() {
  const [txt, setTxt] = useState('ABABDABACDABABCABAB');
  const [pat, setPat] = useState('ABABCABAB');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const computeSteps = useCallback((text, pattern) => {
    const tempSteps = [];
    const N = text.length;
    const M = pattern.length;

    if (N === 0 || M === 0) {
      tempSteps.push({
        phase: 'search',
        lps: [],
        textIdx: -1,
        patIdx: -1,
        matchesFound: [],
        offset: 0,
        codeLine: -1,
        explanation: 'Please enter a valid text and pattern to visualize.',
        status: 'info',
      });
      return tempSteps;
    }

    // Phase 1: Compute LPS Array
    const lps = Array(M).fill(0);
    let len = 0;
    if (M > 0) lps[0] = 0;
    let i = 1;

    tempSteps.push({
      phase: 'lps',
      lps: [...lps],
      currPatI: 0,
      currPatLen: 0,
      lpsCodeLine: 2,
      explanation: 'Phase 1: Building LPS (failure function) array for the pattern. lps[0] is always 0 by definition.',
      status: 'info',
    });

    while (i < M) {
      if (pattern[i] === pattern[len]) {
        const prevLen = len;
        len++;
        lps[i] = len;
        tempSteps.push({
          phase: 'lps',
          lps: [...lps],
          currPatI: i,
          currPatLen: prevLen,
          match: true,
          lpsCodeLine: 7,
          explanation: `pattern[${i}]='${pattern[i]}' matches pattern[${prevLen}]='${pattern[prevLen]}'. lps[${i}] = ${len}.`,
          status: 'found',
        });
        i++;
      } else {
        if (len !== 0) {
          const oldLen = len;
          len = lps[len - 1];
          tempSteps.push({
            phase: 'lps',
            lps: [...lps],
            currPatI: i,
            currPatLen: oldLen,
            match: false,
            lpsCodeLine: 11,
            explanation: `Mismatch! pattern[${i}]='${pattern[i]}' ≠ pattern[${oldLen}]='${pattern[oldLen]}'. Falling back prefix length to lps[${oldLen-1}] = ${len}.`,
            status: 'mismatch',
          });
        } else {
          lps[i] = 0;
          tempSteps.push({
            phase: 'lps',
            lps: [...lps],
            currPatI: i,
            currPatLen: 0,
            match: false,
            lpsCodeLine: 13,
            explanation: `Mismatch! pattern[${i}]='${pattern[i]}' has no proper prefix that is also a suffix. lps[${i}] = 0.`,
            status: 'mismatch',
          });
          i++;
        }
      }
    }

    tempSteps.push({
      phase: 'lps',
      lps: [...lps],
      currPatI: -1,
      currPatLen: -1,
      lpsCodeLine: -1,
      explanation: `LPS table construction complete! Array values: [${lps.join(', ')}]. Moving to Phase 2 (Text Search).`,
      status: 'info',
    });

    // Phase 2: Search KMP
    let textIdx = 0;
    let patIdx = 0;
    const matchesFound = [];

    while (textIdx < N) {
      const match = pattern[patIdx] === text[textIdx];

      tempSteps.push({
        phase: 'search',
        lps: [...lps],
        textIdx,
        patIdx,
        match,
        matchesFound: [...matchesFound],
        offset: textIdx - patIdx,
        codeLine: 33,
        explanation: `Checking pattern[${patIdx}]='${pattern[patIdx]}' vs text[${textIdx}]='${text[textIdx]}'.`,
        status: 'compare',
      });

      if (match) {
        textIdx++;
        patIdx++;
        
        if (patIdx === M) {
          matchesFound.push(textIdx - patIdx);
          const start = textIdx - patIdx;
          tempSteps.push({
            phase: 'search',
            lps: [...lps],
            textIdx: textIdx - 1,
            patIdx: patIdx - 1,
            match: true,
            matchesFound: [...matchesFound],
            offset: start,
            codeLine: 38,
            explanation: `🎉 Pattern found starting at index ${start}! Matched in KMP steps instead of brute force.`,
            status: 'found',
          });
          patIdx = lps[patIdx - 1];
        }
      } else {
        if (patIdx !== 0) {
          const oldPatIdx = patIdx;
          patIdx = lps[patIdx - 1];
          tempSteps.push({
            phase: 'search',
            lps: [...lps],
            textIdx,
            patIdx: oldPatIdx, // show before jump
            jumpTo: patIdx,
            match: false,
            matchesFound: [...matchesFound],
            offset: textIdx - oldPatIdx,
            codeLine: 40,
            explanation: `Mismatch at pattern[${oldPatIdx}]. Using lps[${oldPatIdx-1}]=${patIdx} to skip. No need to recheck!`,
            status: 'mismatch',
          });
        } else {
          textIdx++;
          tempSteps.push({
            phase: 'search',
            lps: [...lps],
            textIdx,
            patIdx: 0,
            match: false,
            matchesFound: [...matchesFound],
            offset: textIdx,
            codeLine: 41,
            explanation: `Mismatch and pattern index is 0. Shifting pattern by advancing text pointer i to ${textIdx}.`,
            status: 'mismatch',
          });
        }
      }
    }

    tempSteps.push({
      phase: 'search',
      lps: [...lps],
      textIdx: N,
      patIdx: 0,
      matchesFound: [...matchesFound],
      offset: N,
      codeLine: -1,
      explanation: `KMP Search complete! Found ${matchesFound.length} occurrences.`,
      status: 'sorted',
    });

    return tempSteps;
  }, []);

  const rebuild = useCallback(() => {
    const s = computeSteps(txt, pat);
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, [txt, pat, computeSteps]);

  useEffect(() => {
    rebuild();
  }, [txt, pat, rebuild]);

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
    phase: 'search',
    lps: Array(pat.length).fill(0),
    textIdx: -1,
    patIdx: -1,
    matchesFound: [],
    offset: 0,
    codeLine: -1,
    explanation: 'Press Play or Step Forward to run KMP string matching.',
    status: 'info',
  };

  const handleInputsChange = (textIn, patIn) => {
    const cleanText = textIn.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 22);
    const cleanPat = patIn.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
    setTxt(cleanText);
    setPat(cleanPat);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is KMP String Search?"
        description="KMP (Knuth-Morris-Pratt) searches for a pattern in text efficiently by precomputing an LPS (Longest Proper Prefix that is also Suffix) array. On mismatch, instead of restarting, KMP uses the LPS table to skip positions it already knows will match. Runs in O(n+m) total."
        timeComplexity="O(n + m)"
        spaceComplexity="O(m) for LPS"
      />

      {/* Top stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Matches Found', value: current.matchesFound?.length ?? 0, color: 'var(--gx-success)' },
          { label: 'Current Phase', value: current.phase === 'lps' ? 'LPS Construction' : 'Pattern Search', color: 'var(--gx-accent)' },
          { label: 'Text Length', value: txt.length, color: 'var(--gx-warning)' },
          { label: 'Pattern Length', value: pat.length, color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Side: LPS Table Display */}
        <div style={{ minWidth: 240, flex: 0.8 }}>
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>LPS / PREFIX TABLE (pi[])</div>
            
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {pat.split('').map((char, index) => {
                const isLpsActive = current.phase === 'lps' && current.currPatI === index;
                const borderCol = isLpsActive ? 'var(--gx-accent)' : 'var(--gx-border)';
                return (
                  <div key={index} style={{
                    flex: 1, height: 48, borderRadius: 6,
                    border: `1.5px solid ${borderCol}`,
                    background: isLpsActive ? 'var(--gx-accent-soft)' : 'var(--gx-surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 'bold', color: isLpsActive ? 'var(--gx-accent)' : 'var(--gx-text)' }}>{char}</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: isLpsActive ? 'var(--gx-accent)' : 'var(--gx-success)' }}>
                      {current.lps[index] !== undefined ? current.lps[index] : 0}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ borderTop: '1px solid var(--gx-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-mono)' }}>INPUT STRINGS:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--gx-text-muted)' }}>TXT (Text, Max 22 chars):</span>
                <input type="text" value={txt} onChange={e => handleInputsChange(e.target.value, pat)} style={inpStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--gx-text-muted)' }}>PAT (Pattern, Max 10 chars):</span>
                <input type="text" value={pat} onChange={e => handleInputsChange(txt, e.target.value)} style={inpStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Shift Canvas */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 24, overflowX: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>KMP STRING SHIFT VISUALIZATION</div>

          {/* Text Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gx-text-muted)' }}>TEXT INDEXES (i)</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {txt.split('').map((char, index) => {
                const isComparing = current.phase === 'search' && current.textIdx === index;
                const isInsideMatch = current.matchesFound?.some(start => index >= start && index < start + pat.length);
                
                let border = '1px solid var(--gx-border)';
                let bg = 'var(--gx-surface)';
                let col = 'var(--gx-text)';

                if (isComparing) {
                  border = `2.5px solid ${current.match ? 'var(--gx-success)' : 'var(--gx-danger)'}`;
                  bg = current.match ? 'var(--gx-success-soft)' : 'var(--gx-danger-soft)';
                  col = current.match ? 'var(--gx-success)' : 'var(--gx-danger)';
                } else if (isInsideMatch) {
                  border = '1px solid var(--gx-success)';
                  bg = 'var(--gx-success-soft)';
                  col = 'var(--gx-success)';
                }

                return (
                  <div key={index} style={{
                    width: 26, height: 26, borderRadius: 4, border: border, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 'bold', color: col,
                    transition: 'all 0.25s',
                  }}>
                    {char}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pattern Slide Row */}
          {current.phase === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gx-text-muted)' }}>PATTERN ALIGNMENT (j)</span>
              
              {/* We apply a margin-left offset representing pattern shift under text */}
              <div style={{
                display: 'flex',
                gap: 2,
                marginLeft: current.offset * 28, // 26px box + 2px gap = 28px width
                transition: 'margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {pat.split('').map((char, index) => {
                  const isComparing = current.patIdx === index;
                  let border = '1px solid var(--gx-border)';
                  let bg = 'var(--gx-surface)';
                  let col = 'var(--gx-text-muted)';

                  if (isComparing) {
                    border = `2.5px solid ${current.match ? 'var(--gx-success)' : 'var(--gx-danger)'}`;
                    bg = current.match ? 'var(--gx-success-soft)' : 'var(--gx-danger-soft)';
                    col = current.match ? 'var(--gx-success)' : 'var(--gx-danger)';
                  }

                  return (
                    <div key={index} style={{
                      width: 26, height: 26, borderRadius: 4, border: border, background: bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 'bold', color: col,
                      transition: 'all 0.25s',
                    }}>
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--gx-success)', label: 'Character match / fully matching substrings' },
          { color: 'var(--gx-danger)', label: 'Mismatch (triggers slide jump)' },
          { color: 'var(--gx-accent)', label: 'Normal grid cells' },
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

      <CodePanel code={CODE} activeLine={current.phase === 'lps' ? current.lpsCodeLine : current.codeLine} />
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
