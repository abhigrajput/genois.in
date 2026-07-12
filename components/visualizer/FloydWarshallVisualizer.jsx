'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Floyd-Warshall All-Pairs Shortest Path
void floydWarshall(int dist[][V], int V) {
  // Initialize dist matrix from edges
  for(int k = 0; k < V; k++) {        // via k
    for(int i = 0; i < V; i++) {      // from i
      for(int j = 0; j < V; j++) {    // to j
        if(dist[i][k] + dist[k][j]
             < dist[i][j]) {
          dist[i][j] = dist[i][k]
                     + dist[k][j];
        }
      }
    }
  }
}`;

const SPEEDS = { 1: 900, 2: 400, 3: 180, 4: 60 };
const INF = 999;

const INIT_MATRIX = [
  [0,   3,   INF, 7  ],
  [8,   0,   2,   INF],
  [5,   INF, 0,   1  ],
  [2,   INF, INF, 0  ],
];

function computeFloydSteps(mat) {
  const V = 4;
  const d = mat.map(r => [...r]);
  const steps = [];

  for (let k = 0; k < V; k++) {
    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        const valIK = d[i][k];
        const valKJ = d[k][j];
        const valIJ = d[i][j];
        const via = valIK + valKJ;
        const updated = via < valIJ;
        
        const explanation = updated
          ? `Shorter path found via intermediate node ${k}! dist[${i}][${k}] + dist[${k}][${j}] = ${valIK} + ${valKJ} = ${via} < dist[${i}][${j}] = ${valIJ === INF ? '∞' : valIJ}. Updating to ${via}.`
          : `Checking path ${i}→${k}→${j}. dist[${i}][${k}] + dist[${k}][${j}] = ${valIK === INF ? '∞' : valIK} + ${valKJ === INF ? '∞' : valKJ} = ${via >= INF ? '∞' : via} which is NOT less than current dist[${i}][${j}] = ${valIJ === INF ? '∞' : valIJ}. Current path is better.`;

        if (updated) d[i][j] = via;
        steps.push({
          matrix: d.map(r => [...r]),
          k, i, j,
          updated,
          codeLine: updated ? 8 : 6,
          label: updated
            ? `d[${i}][${j}] updated via k=${k}: ${valIK}+${valKJ}=${via}`
            : `d[${i}][${j}]: no update via k=${k}`,
          explanation,
          status: updated ? 'found' : 'compare'
        });
      }
    }
  }
  steps.push({
    matrix: d.map(r=>[...r]),
    k:-1, i:-1, j:-1,
    updated:false,
    done:true,
    codeLine:-1,
    label:'Floyd-Warshall complete! All-pairs shortest paths found.',
    explanation: 'Floyd-Warshall complete! All-pairs shortest paths computed.',
    status: 'sorted'
  });
  return steps;
}

export default function FloydWarshallVisualizer() {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [animCell, setAnimCell] = useState(null);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const displayMatrix = current ? current.matrix : INIT_MATRIX;

  const start = () => {
    const s = computeFloydSteps(INIT_MATRIX);
    setSteps(s); setStepIdx(0); setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev + 1 >= steps.length) { setIsPlaying(false); return prev; }
          const next = prev + 1;
          if (steps[next]?.updated) setAnimCell(`${steps[next].i}-${steps[next].j}`);
          return next;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps]);

  const reset = () => { setSteps([]); setStepIdx(-1); setIsPlaying(false); setAnimCell(null); clearInterval(intervalRef.current); };

  function cellStyle(i, j) {
    if (!current) return { bg: '#0d1a2a', border: 'rgba(0,217,163,0.08)', color: '#5a7a9a' };
    const isCurrent = current.i === i && current.j === j;
    const isK_row = current.k === i || current.k === j;
    const isUpdated = isCurrent && current.updated;
    const isDiag = i === j;
    if (isDiag) return { bg: 'rgba(239,159,39,0.08)', border: 'rgba(239,159,39,0.2)', color: '#ef9f27' };
    if (isUpdated) return { bg: 'rgba(29,158,117,0.2)', border: 'rgba(29,158,117,0.5)', color: '#1d9e75' };
    if (isCurrent) return { bg: 'rgba(0,217,163,0.12)', border: 'rgba(0,217,163,0.4)', color: '#00d9a3' };
    if (isK_row) return { bg: 'rgba(255,107,74,0.06)', border: 'rgba(255,107,74,0.15)', color: '#ff6b4a' };
    return { bg: '#0d1a2a', border: 'rgba(0,217,163,0.08)', color: '#e8e8ed' };
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Floyd-Warshall?"
        description="Floyd-Warshall finds shortest paths between ALL pairs of nodes in a weighted graph. For each intermediate node k, it checks if routing through k makes any path dist[i][j] shorter. A simple O(V³) triple nested loop that handles negative weights (but not negative cycles)."
        timeComplexity="O(V³)"
        spaceComplexity="O(V²)"
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Vertices', value:4, color:'#00d9a3' },
          { label:'k (via)', value:current?.k>=0?current.k:'-', color:'#ff6b4a' },
          { label:'i (from)', value:current?.i>=0?current.i:'-', color:'#ef9f27' },
          { label:'j (to)', value:current?.j>=0?current.j:'-', color:'#1d9e75' },
        ].map(s=>(
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Distance matrix */}
      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,217,163,0.1)', borderRadius:12, padding:24, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', letterSpacing:1, marginBottom:16 }}>DISTANCE MATRIX dist[i][j]</div>

        {/* Column headers */}
        <div style={{ display:'flex', marginBottom:4, marginLeft:48 }}>
          {[0,1,2,3].map(j=>(
            <div key={j} style={{ width:64, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color: current?.k===j?'#ff6b4a':current?.j===j?'#1d9e75':'#2a3a4a', fontWeight:600 }}>j={j}</div>
          ))}
        </div>

        {displayMatrix.map((row, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: current?.k===i?'#ff6b4a':current?.i===i?'#ef9f27':'#2a3a4a', width:44, textAlign:'right', paddingRight:8, fontWeight:600 }}>i={i}</span>
            {row.map((v, j) => {
              const cs = cellStyle(i, j);
              const key = `${i}-${j}`;
              return (
                <div key={j} style={{
                  width:64, height:52, display:'flex', alignItems:'center', justifyContent:'center',
                  background:cs.bg, border:`2px solid ${cs.border}`, borderRadius:8, margin:2,
                  transition:'all 0.35s ease',
                  animation: animCell===key ? 'flash 0.4s ease' : 'none',
                  boxShadow: cs.color==='#1d9e75' ? '0 0 12px rgba(29,158,117,0.3)' : cs.color==='#00d9a3' ? '0 0 8px rgba(0,217,163,0.2)' : 'none',
                }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700, color:cs.color }}>
                    {v >= INF ? '∞' : v}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Loop state indicator */}
      {current && current.k >= 0 && (
        <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(255,107,74,0.15)', borderRadius:10, padding:'10px 16px', fontFamily:'var(--font-mono)', fontSize:12, color:'#ff6b4a' }}>
          <span style={{ color:'#5a7a9a' }}>for(</span>
          <span style={{ color:'#ff6b4a', fontWeight:700 }}>k={current.k}</span>
          <span style={{ color:'#5a7a9a' }}>)  for(</span>
          <span style={{ color:'#ef9f27', fontWeight:700 }}>i={current.i}</span>
          <span style={{ color:'#5a7a9a' }}>)  for(</span>
          <span style={{ color:'#1d9e75', fontWeight:700 }}>j={current.j}</span>
          <span style={{ color:'#5a7a9a' }}>)</span>
        </div>
      )}

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current?.explanation}
        status={current?.status}
      />

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={start} style={btn('#00d9a3')}>▶ Run Floyd-Warshall</button>
        <button onClick={()=>setIsPlaying(p=>!p)} style={btn('#ff6b4a')}>{isPlaying?'⏸ Pause':'▶ Resume'}</button>
        <button onClick={()=>setStepIdx(p=>Math.min(p+1,steps.length-1))} style={btn('#ef9f27')}>⏭ Step</button>
        <button onClick={()=>setStepIdx(p=>Math.max(p-1,0))} style={btn('#5a7a9a')}>⏮ Back</button>
        <div style={{ display:'flex', gap:4 }}>
          {[1,2,3,4].map(s=>(
            <button key={s} onClick={()=>setSpeed(s)} style={{ padding:'3px 10px', borderRadius:6, border:speed===s?'1px solid #00d9a3':'1px solid rgba(0,217,163,0.15)', background:speed===s?'rgba(0,217,163,0.12)':'transparent', color:speed===s?'#00d9a3':'#5a7a9a', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#ff6b4a','via k (intermediate)'],['#00d9a3','d[i][j] checking'],['#1d9e75','Updated (shorter path)'],['#ef9f27','Diagonal (self)']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c+'44', border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={current?.codeLine??-1} />
      <style>{`@keyframes flash { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }`}</style>
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid ${color}30`, background:`${color}10`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
