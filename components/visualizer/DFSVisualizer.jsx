'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `void dfs(vector<vector<int>>& adj, int node,
         vector<bool>& visited) {
  visited[node] = true;
  // process node
  for(int nbr : adj[node]) {
    if(!visited[nbr]) {
      dfs(adj, nbr, visited);
    }
  }
}`;

const SPEEDS = { 1: 1000, 2: 600, 3: 280, 4: 120 };

const GRAPH_NODES = [
  { id: 0, x: 200, y: 80 }, { id: 1, x: 100, y: 180 }, { id: 2, x: 300, y: 180 },
  { id: 3, x: 60,  y: 280 }, { id: 4, x: 180, y: 280 }, { id: 5, x: 340, y: 280 },
  { id: 6, x: 500, y: 180 }, { id: 7, x: 500, y: 80  },
];
const GRAPH_EDGES = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[2,6],[6,7],[0,7]];
const ADJ = Array.from({ length: 8 }, () => []);
GRAPH_EDGES.forEach(([a,b]) => { ADJ[a].push(b); ADJ[b].push(a); });

function computeDFSSteps(src) {
  const steps = [];
  const visited = new Array(8).fill(false);
  const stack = [];

  function dfs(node) {
    visited[node] = true;
    stack.push(node);
    steps.push({
      visited: [...visited],
      stack: [...stack],
      current: node,
      codeLine: 2,
      explanation: `Visiting node ${node}. Push to call stack. Stack depth: ${stack.length}.`,
      status: 'compare'
    });
    for (const nbr of ADJ[node]) {
      steps.push({
        visited: [...visited],
        stack: [...stack],
        current: node,
        checking: nbr,
        codeLine: 5,
        explanation: `Checking neighbor ${nbr}. Is it visited? ${visited[nbr] ? 'Yes, skip.' : 'No, recurse into it.'}`,
        status: visited[nbr] ? 'info' : 'compare'
      });
      if (!visited[nbr]) {
        dfs(nbr);
        stack.pop();
        steps.push({
          visited: [...visited],
          stack: [...stack],
          current: node,
          returning: true,
          codeLine: 6,
          explanation: `No unvisited neighbors from ${nbr}. Backtracking. Pop from call stack.`,
          status: 'mismatch'
        });
      }
    }
  }
  dfs(src);
  steps.push({
    visited: [...visited],
    stack: [],
    current: -1,
    done: true,
    codeLine: -1,
    explanation: 'DFS complete! All nodes explored depth-first.',
    status: 'sorted'
  });
  return steps;
}

function nodeColor(id, step) {
  if (!step) return 'var(--gx-surface-2)';
  if (step.current === id) return 'var(--gx-accent)';
  if (step.checking === id) return 'var(--gx-warning)';
  if (step.stack?.includes(id)) return 'var(--gx-warning)';
  if (step.visited?.[id]) return 'var(--gx-success)';
  return 'var(--gx-surface-2)';
}

export default function DFSVisualizer() {
  const [src, setSrc] = useState(0);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const start = () => {
    const s = computeDFSSteps(src);
    setSteps(s); setStepIdx(0); setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev + 1 >= steps.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps.length]);

  const reset = () => { setSteps([]); setStepIdx(-1); setIsPlaying(false); clearInterval(intervalRef.current); };
  const SVG_W = 600, SVG_H = 360;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is DFS (Depth-First Search)?"
        description="Depth-First Search explores as far as possible along each branch before backtracking. Uses a call stack (recursion). DFS is used for cycle detection, topological sort, finding connected components, and maze solving."
        timeComplexity="O(V + E)"
        spaceComplexity="O(V)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Source', value: src, color: 'var(--gx-accent)' },
          { label: 'Current', value: current?.current >= 0 ? current.current : '-', color: 'var(--gx-accent)' },
          { label: 'Stack Depth', value: current?.stack?.length ?? 0, color: 'var(--gx-warning)' },
          { label: 'Visited', value: current?.visited?.filter(Boolean).length ?? 0, color: 'var(--gx-success)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, overflow: 'hidden', minWidth: 280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
            {GRAPH_EDGES.map(([a,b],i) => (
              <line key={i} x1={GRAPH_NODES[a].x} y1={GRAPH_NODES[a].y+60} x2={GRAPH_NODES[b].x} y2={GRAPH_NODES[b].y+60} stroke="var(--gx-accent)" strokeWidth={1.5} />
            ))}
            {GRAPH_NODES.map(n => {
              const color = nodeColor(n.id, current);
              const isActive = current?.current === n.id;
              return (
                <g key={n.id}>
                  {isActive && <circle cx={n.x} cy={n.y+60} r={28} fill="none" stroke="var(--gx-accent)" strokeWidth={1} opacity={0.4} />}
                  <circle cx={n.x} cy={n.y+60} r={22} fill={color==='var(--gx-surface-2)'?'var(--gx-surface)':`color-mix(in srgb, ${color} 13%, transparent)`} stroke={color} strokeWidth={isActive?2.5:1.5} style={{ transition:'all 0.3s ease' }} />
                  <text x={n.x} y={n.y+65} textAnchor="middle" style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, fill:color, transition:'fill 0.3s ease' }}>{n.id}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          {/* Recursion Stack */}
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-warning-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 1, marginBottom: 8 }}>CALL STACK (top→)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 60 }}>
              {[...(current?.stack || [])].reverse().map((v, i) => (
                <div key={i} style={{ padding: '4px 12px', borderRadius: 6, background: i === 0 ? 'var(--gx-accent-soft)' : 'var(--gx-warning-soft)', border: `1px solid ${i===0?'var(--gx-accent-border)':'var(--gx-warning-border)'}`, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--gx-accent)' : 'var(--gx-warning)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>dfs({v})</span>
                  {i === 0 && <span style={{ fontSize: 10, opacity: 0.6 }}>← top</span>}
                </div>
              ))}
              {(!current?.stack || current.stack.length === 0) && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-subtle)' }}>empty</span>
              )}
            </div>
          </div>
          {/* Adj list */}
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 8 }}>ADJACENCY LIST</div>
            {ADJ.map((nbrs, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: nodeColor(i, current), minWidth: 18, fontWeight: 700 }}>{i}:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-muted)' }}>[{nbrs.join(', ')}]</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current?.explanation}
        status={current?.status}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)' }}>SRC</span>
        {GRAPH_NODES.map(n => (
          <button key={n.id} onClick={() => setSrc(n.id)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${src===n.id?'var(--gx-warning)':'var(--gx-border)'}`, background: src===n.id?'var(--gx-warning-soft)':'transparent', color: src===n.id?'var(--gx-warning)':'var(--gx-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{n.id}</button>
        ))}
        <button onClick={start} style={btn('var(--gx-warning)')}>▶ Start DFS</button>
        <button onClick={() => setIsPlaying(p => !p)} style={btn('var(--gx-accent)')}>{isPlaying ? '⏸ Pause' : '▶ Resume'}</button>
        <button onClick={() => setStepIdx(p => Math.min(p+1, steps.length-1))} style={btn('var(--gx-warning)')}>⏭ Step</button>
        <div style={{ display:'flex', gap:4 }}>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding:'3px 10px', borderRadius:6, border: speed===s?'1px solid var(--gx-warning)':'1px solid var(--gx-border)', background: speed===s?'var(--gx-warning-soft)':'transparent', color: speed===s?'var(--gx-warning)':'var(--gx-text-muted)', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('var(--gx-danger)')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['var(--gx-accent)','Current'],['var(--gx-warning)','In Call Stack'],['var(--gx-warning)','Checking'],['var(--gx-success)','Visited']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:`color-mix(in srgb, ${c} 27%, transparent)`, border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'var(--gx-text-muted)', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={current?.codeLine ?? -1} />
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid color-mix(in srgb, ${color} 19%, transparent)`, background:`color-mix(in srgb, ${color} 6%, transparent)`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
