'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Topological Sort (DFS-based)
void dfs(int node, vector<vector<int>>& adj,
         vector<bool>& visited, stack<int>& st) {
  visited[node] = true;
  for(int nbr : adj[node]) {
    if(!visited[nbr])
      dfs(nbr, adj, visited, st);
  }
  st.push(node); // push AFTER all neighbors
}

void topoSort(int V, vector<vector<int>>& adj) {
  vector<bool> visited(V, false);
  stack<int> st;
  for(int i = 0; i < V; i++)
    if(!visited[i]) dfs(i, adj, visited, st);
  while(!st.empty()) {
    cout << st.top() << " "; st.pop();
  }
}`;

const SPEEDS = { 1: 900, 2: 500, 3: 230, 4: 100 };

// DAG: 6 nodes
const NODES = [
  { id: 0, x: 80,  y: 80  },
  { id: 1, x: 240, y: 50  },
  { id: 2, x: 400, y: 80  },
  { id: 3, x: 100, y: 220 },
  { id: 4, x: 280, y: 220 },
  { id: 5, x: 460, y: 220 },
];
const EDGES = [[0,2],[0,3],[1,2],[1,4],[2,5],[3,4],[4,5]];
const ADJ = Array.from({length:6},()=>[]);
EDGES.forEach(([u,v])=>ADJ[u].push(v));

function computeTopoSteps() {
  const steps = [];
  const visited = new Array(6).fill(false);
  const result = [];
  const callStack = [];

  function dfs(node) {
    visited[node] = true;
    callStack.push(node);
    steps.push({
      visited: [...visited],
      result: [...result],
      callStack: [...callStack],
      current: node,
      phase: 'enter',
      codeLine: 3,
      explanation: `DFS visiting node ${node}. Push to call stack. Stack depth: ${callStack.length}.`,
      status: 'info',
    });
    for (const nbr of ADJ[node]) {
      if (!visited[nbr]) {
        steps.push({
          visited: [...visited],
          result: [...result],
          callStack: [...callStack],
          current: node,
          checking: nbr,
          phase: 'check',
          codeLine: 5,
          explanation: `Checking unvisited neighbor ${nbr} of node ${node}. Recursing in...`,
          status: 'compare',
        });
        dfs(nbr);
        callStack.push(node); // restore
      } else {
        steps.push({
          visited: [...visited],
          result: [...result],
          callStack: [...callStack],
          current: node,
          checking: nbr,
          phase: 'check',
          codeLine: 5,
          explanation: `Checking neighbor ${nbr} of node ${node}. Already visited, skipping.`,
          status: 'compare',
        });
      }
    }
    result.unshift(node);
    callStack.pop();
    steps.push({
      visited: [...visited],
      result: [...result],
      callStack: [...callStack],
      current: node,
      phase: 'push',
      codeLine: 8,
      explanation: `Node ${node} fully processed. All dependencies done. Pushing ${node} to result stack.`,
      status: 'found',
      label: `Push ${node} to result`,
    });
  }

  for (let i = 0; i < 6; i++) {
    if (!visited[i]) dfs(i);
  }
  steps.push({
    visited: [...visited],
    result: [...result],
    callStack: [],
    current: -1,
    phase: 'done',
    codeLine: -1,
    explanation: `Topological order: [${result.join(', ')}]. This is a valid order where each node comes before its dependents.`,
    status: 'sorted',
    label: 'Topological sort complete!',
  });
  return steps;
}

function nodeColor(id, step) {
  if (!step) return 'var(--gx-surface-2)';
  if (step.current === id && step.phase === 'push') return 'var(--gx-success)';
  if (step.current === id) return 'var(--gx-accent)';
  if (step.checking === id) return 'var(--gx-warning)';
  if (step.callStack?.includes(id)) return 'var(--gx-warning)';
  if (step.visited?.[id]) return 'var(--gx-success)';
  return 'var(--gx-surface-2)';
}

export default function TopologicalSortVisualizer() {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const start = () => {
    const s = computeTopoSteps();
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
  const SVG_W = 580, SVG_H = 310;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Topological Sort?"
        description="Topological Sort orders nodes in a Directed Acyclic Graph (DAG) so every node appears before all nodes it points to. DFS-based: when a node finishes (all descendants processed), it pushes to stack. Used for task scheduling and package dependency resolution."
        timeComplexity="O(V + E)"
        spaceComplexity="O(V)"
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Vertices', value:6, color:'var(--gx-accent)' },
          { label:'Edges', value:EDGES.length, color:'var(--gx-warning)' },
          { label:'Visited', value:current?.visited?.filter(Boolean).length??0, color:'var(--gx-success)' },
          { label:'Result Size', value:current?.result?.length??0, color:'var(--gx-warning)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--gx-surface)', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {current?.label && (
        <div style={{ background:current.phase==='push'?'var(--gx-success-soft)':'var(--gx-accent-soft)', border:`1px solid ${current.phase==='push'?'var(--gx-success-border)':'var(--gx-border)'}`, borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:11, color:current.phase==='push'?'var(--gx-success)':'var(--gx-accent)' }}>
          {current.phase==='push'?'✓ ':'▶ '}{current.label || `Processing node ${current.current}`}
        </div>
      )}

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {/* DAG SVG */}
        <div style={{ flex:2, background:'var(--gx-surface)', border:'1px solid var(--gx-border)', borderRadius:12, overflow:'hidden', minWidth:280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display:'block' }}>
            <defs>
              <marker id="topo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="var(--gx-accent)" />
              </marker>
            </defs>
            {EDGES.map(([u,v],i)=>{
              const nu=NODES[u], nv=NODES[v];
              const dx=nv.x-nu.x, dy=nv.y-nu.y, len=Math.sqrt(dx*dx+dy*dy);
              const ex=nv.x-(dx/len)*24, ey=nv.y-(dy/len)*24;
              const isActive = current?.current===u && current?.checking===v;
              return (
                <line key={i} x1={nu.x} y1={nu.y+50} x2={ex} y2={ey+50}
                  stroke={isActive?'var(--gx-warning)':'var(--gx-accent-border)'} strokeWidth={isActive?2.5:1.5}
                  markerEnd="url(#topo-arrow)" style={{transition:'all 0.3s'}} />
              );
            })}
            {NODES.map(n=>{
              const color=nodeColor(n.id,current);
              const isActive=current?.current===n.id;
              return (
                <g key={n.id}>
                  {isActive&&<circle cx={n.x} cy={n.y+50} r={28} fill="none" stroke={color} strokeWidth={1} opacity={0.4}/>}
                  <circle cx={n.x} cy={n.y+50} r={22} fill={color==='var(--gx-surface-2)'?'var(--gx-surface)':`color-mix(in srgb, ${color} 13%, transparent)`} stroke={color} strokeWidth={isActive?2.5:1.5} style={{transition:'all 0.3s ease'}}/>
                  <text x={n.x} y={n.y+55} textAnchor="middle" style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, fill:color, transition:'fill 0.3s ease' }}>{n.id}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: call stack + result */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:180 }}>
          <div style={{ background:'var(--gx-surface)', border:'1px solid var(--gx-warning-border)', borderRadius:10, padding:12 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-warning)', letterSpacing:1, marginBottom:8 }}>CALL STACK</div>
            <div style={{ display:'flex', flexDirection:'column', gap:3, minHeight:60 }}>
              {[...(current?.callStack||[])].reverse().map((v,i)=>(
                <div key={i} style={{ padding:'4px 10px', borderRadius:6, background:i===0?'var(--gx-accent-soft)':'var(--gx-warning-soft)', border:`1px solid ${i===0?'var(--gx-accent-border)':'var(--gx-warning-border)'}`, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:i===0?'var(--gx-accent)':'var(--gx-warning)', display:'flex', justifyContent:'space-between' }}>
                  dfs({v}){i===0&&<span style={{fontSize:9,opacity:0.6}}>← top</span>}
                </div>
              ))}
              {(!current?.callStack?.length)&&<span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gx-text-subtle)' }}>empty</span>}
            </div>
          </div>

          <div style={{ background:'var(--gx-surface)', border:'1px solid var(--gx-success-border)', borderRadius:10, padding:12 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-success)', letterSpacing:1, marginBottom:8 }}>TOPOLOGICAL ORDER</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:36 }}>
              {(current?.result||[]).map((v,i)=>(
                <span key={i} style={{ padding:'4px 12px', borderRadius:6, background:'var(--gx-success-soft)', border:'1px solid var(--gx-success-border)', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--gx-success)', animation:'nodeAppear 0.3s ease' }}>{v}</span>
              ))}
              {(!current?.result?.length)&&<span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--gx-text-subtle)' }}>—</span>}
            </div>
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : undefined}
        totalSteps={steps.length}
        explanation={current?.explanation}
        status={current?.status}
      />

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={start} style={btn('var(--gx-accent)')}>▶ Run Topo Sort</button>
        <button onClick={()=>setIsPlaying(p=>!p)} style={btn('var(--gx-warning)')}>{isPlaying?'⏸ Pause':'▶ Resume'}</button>
        <button onClick={()=>setStepIdx(p=>Math.min(p+1,steps.length-1))} style={btn('var(--gx-warning)')}>⏭ Step</button>
        <div style={{ display:'flex', gap:4 }}>
          {[1,2,3,4].map(s=>(
            <button key={s} onClick={()=>setSpeed(s)} style={{ padding:'3px 10px', borderRadius:6, border:speed===s?'1px solid var(--gx-accent)':'1px solid var(--gx-border)', background:speed===s?'var(--gx-accent-soft)':'transparent', color:speed===s?'var(--gx-accent)':'var(--gx-text-muted)', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('var(--gx-danger)')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['var(--gx-accent)','Current'],['var(--gx-warning)','In Call Stack'],['var(--gx-warning)','Checking'],['var(--gx-success)','Finished']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:`color-mix(in srgb, ${c} 27%, transparent)`, border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'var(--gx-text-muted)', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={current?.codeLine??-1} />
      <style>{`@keyframes nodeAppear { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid color-mix(in srgb, ${color} 19%, transparent)`, background:`color-mix(in srgb, ${color} 6%, transparent)`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
