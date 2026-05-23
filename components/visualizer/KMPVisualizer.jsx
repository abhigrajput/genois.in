'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
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
        description: 'Please enter a valid text and pattern to visualize.',
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
      lpsCodeLine: 3,
      description: 'Phase 1: Computing LPS (Longest Prefix Suffix) table for pattern. lps[0] is always 0.',
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
          lpsCodeLine: 6,
          description: `Characters match! pat[${i}] ('${pattern[i]}') === pat[${prevLen}] ('${pattern[prevLen]}'). Increment suffix length to ${len}. lps[${i}] = ${len}.`,
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
            description: `Mismatch! pat[${i}] ('${pattern[i]}') !== pat[${oldLen}] ('${pattern[oldLen]}'). Fall back suffix length to lps[${oldLen-1}] = ${len}.`,
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
            description: `Mismatch and prefix length is 0. pat[${i}] ('${pattern[i]}') has no prefix match. lps[${i}] = 0.`,
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
      description: `LPS Table construction complete! Table: [${lps.join(', ')}]. Now starting search in Text...`,
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
        codeLine: 29,
        description: `Comparing txt[${textIdx}] ('${text[textIdx]}') and pat[${patIdx}] ('${pattern[patIdx]}').`,
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
            codeLine: 34,
            description: `✓ Match Found! Pattern exists starting at index ${start}.`,
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
            codeLine: 36,
            description: `✗ Mismatch! Fall back pattern pointer 'j' from ${oldPatIdx} to lps[${oldPatIdx - 1}] = ${patIdx}. Shift pattern.`,
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
            codeLine: 37,
            description: `✗ Mismatch and pattern pointer 'j' is 0. Shift pattern right by incrementing text index 'i' to ${textIdx}.`,
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
      description: `KMP Search complete! Found ${matchesFound.length} occurrence(s) at indices: ${matchesFound.length ? matchesFound.join(', ') : 'None'}.`,
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
    description: 'Press Play or Step Forward to run KMP string matching.',
  };

  const handleInputsChange = (textIn, patIn) => {
    const cleanText = textIn.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 22);
    const cleanPat = patIn.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
    setTxt(cleanText);
    setPat(cleanPat);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Matches Found', value: current.matchesFound?.length ?? 0, color: '#1d9e75' },
          { label: 'Current Phase', value: current.phase === 'lps' ? 'LPS Construction' : 'Pattern Search', color: '#00f0ff' },
          { label: 'Text Length', value: txt.length, color: '#7b5cff' },
          { label: 'Pattern Length', value: pat.length, color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Narrative feed */}
      <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Side: LPS Table Display */}
        <div style={{ minWidth: 240, flex: 0.8 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>LPS / PREFIX TABLE (pi[])</div>
            
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {pat.split('').map((char, index) => {
                const isLpsActive = current.phase === 'lps' && current.currPatI === index;
                const borderCol = isLpsActive ? '#00f0ff' : 'rgba(0,240,255,0.1)';
                return (
                  <div key={index} style={{
                    flex: 1, height: 48, borderRadius: 6,
                    border: `1.5px solid ${borderCol}`,
                    background: isLpsActive ? 'rgba(0,240,255,0.08)' : 'rgba(10,15,30,0.6)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 'bold', color: isLpsActive ? '#00f0ff' : '#e8f4ff' }}>{char}</span>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: isLpsActive ? '#00f0ff' : '#1d9e75' }}>
                      {current.lps[index] !== undefined ? current.lps[index] : 0}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ borderTop: '1px solid rgba(0,240,255,0.05)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#5a7a9a', fontFamily: 'JetBrains Mono,monospace' }}>INPUT STRINGS:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#5a7a9a' }}>TXT (Text, Max 22 chars):</span>
                <input type="text" value={txt} onChange={e => handleInputsChange(e.target.value, pat)} style={inpStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#5a7a9a' }}>PAT (Pattern, Max 10 chars):</span>
                <input type="text" value={pat} onChange={e => handleInputsChange(txt, e.target.value)} style={inpStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Shift Canvas */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 24, overflowX: 'auto' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>KMP STRING SHIFT VISUALIZATION</div>

          {/* Text Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#5a7a9a' }}>TEXT INDEXES (i)</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {txt.split('').map((char, index) => {
                const isComparing = current.phase === 'search' && current.textIdx === index;
                const isInsideMatch = current.matchesFound?.some(start => index >= start && index < start + pat.length);
                
                let border = '1px solid rgba(0,240,255,0.06)';
                let bg = 'rgba(10,15,30,0.7)';
                let col = '#e8f4ff';

                if (isComparing) {
                  border = `2.5px solid ${current.match ? '#1d9e75' : '#ff2d78'}`;
                  bg = current.match ? 'rgba(29,158,117,0.12)' : 'rgba(255,45,120,0.1)';
                  col = current.match ? '#1d9e75' : '#ff2d78';
                } else if (isInsideMatch) {
                  border = '1px solid #1d9e75';
                  bg = 'rgba(29, 158, 117, 0.08)';
                  col = '#1d9e75';
                }

                return (
                  <div key={index} style={{
                    width: 26, height: 26, borderRadius: 4, border: border, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 'bold', color: col,
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
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#5a7a9a' }}>PATTERN ALIGNMENT (j)</span>
              
              {/* We apply a margin-left offset representing pattern shift under text */}
              <div style={{
                display: 'flex',
                gap: 2,
                marginLeft: current.offset * 28, // 26px box + 2px gap = 28px width
                transition: 'margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                {pat.split('').map((char, index) => {
                  const isComparing = current.patIdx === index;
                  let border = '1px solid rgba(0,240,255,0.1)';
                  let bg = 'rgba(10,15,30,0.7)';
                  let col = '#5a7a9a';

                  if (isComparing) {
                    border = `2.5px solid ${current.match ? '#1d9e75' : '#ff2d78'}`;
                    bg = current.match ? 'rgba(29,158,117,0.12)' : 'rgba(255,45,120,0.1)';
                    col = current.match ? '#1d9e75' : '#ff2d78';
                  }

                  return (
                    <div key={index} style={{
                      width: 26, height: 26, borderRadius: 4, border: border, background: bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 'bold', color: col,
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
          { color: '#1d9e75', label: 'Character match / fully matching substrings' },
          { color: '#ff2d78', label: 'Mismatch (triggers slide jump)' },
          { color: 'rgba(0,240,255,0.2)', label: 'Normal grid cells' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'Outfit,sans-serif' }}>{l.label}</span>
          </div>
        ))}
      </div>

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
  background: 'rgba(0,240,255,0.04)',
  border: '1px solid rgba(0,240,255,0.2)',
  borderRadius: 8,
  padding: '6px 10px',
  color: '#e8f4ff',
  fontFamily: 'JetBrains Mono,monospace',
  fontSize: 12,
  outline: 'none',
};
