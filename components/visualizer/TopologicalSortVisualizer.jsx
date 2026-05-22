'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';

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
    steps.push({ visited:[...visited], result:[...result], callStack:[...callStack], current:node, phase:'enter', codeLine:3 });
    for (const nbr of ADJ[node]) {
      if (!visited[nbr]) {
        steps.push({ visited:[...visited], result:[...result], callStack:[...callStack], current:node, checking:nbr, phase:'check', codeLine:5 });
        dfs(nbr);
        callStack.push(node); // restore
      }
    }
    result.unshift(node);
    callStack.pop();
    steps.push({ visited:[...visited], result:[...result], callStack:[...callStack], current:node, phase:'push', codeLine:8, label:`Push ${node} to result` });
  }

  for (let i = 0; i < 6; i++) {
    if (!visited[i]) dfs(i);
  }
  steps.push({ visited:[...visited], result:[...result], callStack:[], current:-1, phase:'done', codeLine:-1, label:'Topological sort complete!' });
  return steps;
}

function nodeColor(id, step) {
  if (!step) return '#1a2a3a';
  if (step.current === id && step.phase === 'push') return '#1d9e75';
  if (step.current === id) return '#00f0ff';
  if (step.checking === id) return '#ef9f27';
  if (step.callStack?.includes(id)) return '#7b5cff';
  if (step.visited?.[id]) return '#1d9e75';
  return '#1a2a3a';
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
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Vertices', value:6, color:'#00f0ff' },
          { label:'Edges', value:EDGES.length, color:'#7b5cff' },
          { label:'Visited', value:current?.visited?.filter(Boolean).length??0, color:'#1d9e75' },
          { label:'Result Size', value:current?.result?.length??0, color:'#ef9f27' },
        ].map(s=>(
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {current?.label && (
        <div style={{ background:current.phase==='push'?'rgba(29,158,117,0.08)':'rgba(0,240,255,0.05)', border:`1px solid ${current.phase==='push'?'rgba(29,158,117,0.3)':'rgba(0,240,255,0.15)'}`, borderRadius:8, padding:'8px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:11, color:current.phase==='push'?'#1d9e75':'#00f0ff' }}>
          {current.phase==='push'?'✓ ':'▶ '}{current.label || `Processing node ${current.current}`}
        </div>
      )}

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {/* DAG SVG */}
        <div style={{ flex:2, background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, overflow:'hidden', minWidth:280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display:'block' }}>
            <defs>
              <marker id="topo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,240,255,0.4)" />
              </marker>
            </defs>
            {EDGES.map(([u,v],i)=>{
              const nu=NODES[u], nv=NODES[v];
              const dx=nv.x-nu.x, dy=nv.y-nu.y, len=Math.sqrt(dx*dx+dy*dy);
              const ex=nv.x-(dx/len)*24, ey=nv.y-(dy/len)*24;
              const isActive = current?.current===u && current?.checking===v;
              return (
                <line key={i} x1={nu.x} y1={nu.y+50} x2={ex} y2={ey+50}
                  stroke={isActive?'#ef9f27':'rgba(0,240,255,0.2)'} strokeWidth={isActive?2.5:1.5}
                  markerEnd="url(#topo-arrow)" style={{transition:'all 0.3s'}} />
              );
            })}
            {NODES.map(n=>{
              const color=nodeColor(n.id,current);
              const isActive=current?.current===n.id;
              return (
                <g key={n.id}>
                  {isActive&&<circle cx={n.x} cy={n.y+50} r={28} fill="none" stroke={color} strokeWidth={1} opacity={0.4}/>}
                  <circle cx={n.x} cy={n.y+50} r={22} fill={color==='#1a2a3a'?'#0d1a2a':color+'22'} stroke={color} strokeWidth={isActive?2.5:1.5} style={{transition:'all 0.3s ease'}}/>
                  <text x={n.x} y={n.y+55} textAnchor="middle" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, fill:color, transition:'fill 0.3s ease' }}>{n.id}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: call stack + result */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:180 }}>
          <div style={{ background:'rgba(10,15,30,0.8)', border:'1px solid rgba(123,92,255,0.2)', borderRadius:10, padding:12 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#7b5cff', letterSpacing:1, marginBottom:8 }}>CALL STACK</div>
            <div style={{ display:'flex', flexDirection:'column', gap:3, minHeight:60 }}>
              {[...(current?.callStack||[])].reverse().map((v,i)=>(
                <div key={i} style={{ padding:'4px 10px', borderRadius:6, background:i===0?'rgba(0,240,255,0.12)':'rgba(123,92,255,0.08)', border:`1px solid ${i===0?'rgba(0,240,255,0.3)':'rgba(123,92,255,0.15)'}`, fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color:i===0?'#00f0ff':'#7b5cff', display:'flex', justifyContent:'space-between' }}>
                  dfs({v}){i===0&&<span style={{fontSize:9,opacity:0.6}}>← top</span>}
                </div>
              ))}
              {(!current?.callStack?.length)&&<span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#2a3a4a' }}>empty</span>}
            </div>
          </div>

          <div style={{ background:'rgba(10,15,30,0.8)', border:'1px solid rgba(29,158,117,0.2)', borderRadius:10, padding:12 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#1d9e75', letterSpacing:1, marginBottom:8 }}>TOPOLOGICAL ORDER</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:36 }}>
              {(current?.result||[]).map((v,i)=>(
                <span key={i} style={{ padding:'4px 12px', borderRadius:6, background:'rgba(29,158,117,0.15)', border:'1px solid rgba(29,158,117,0.3)', fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:'#1d9e75', animation:'nodeAppear 0.3s ease' }}>{v}</span>
              ))}
              {(!current?.result?.length)&&<span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#2a3a4a' }}>—</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={start} style={btn('#00f0ff')}>▶ Run Topo Sort</button>
        <button onClick={()=>setIsPlaying(p=>!p)} style={btn('#7b5cff')}>{isPlaying?'⏸ Pause':'▶ Resume'}</button>
        <button onClick={()=>setStepIdx(p=>Math.min(p+1,steps.length-1))} style={btn('#ef9f27')}>⏭ Step</button>
        <div style={{ display:'flex', gap:4 }}>
          {[1,2,3,4].map(s=>(
            <button key={s} onClick={()=>setSpeed(s)} style={{ padding:'3px 10px', borderRadius:6, border:speed===s?'1px solid #00f0ff':'1px solid rgba(0,240,255,0.15)', background:speed===s?'rgba(0,240,255,0.12)':'transparent', color:speed===s?'#00f0ff':'#5a7a9a', fontSize:11, fontFamily:'JetBrains Mono,monospace', cursor:'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#00f0ff','Current'],['#7b5cff','In Call Stack'],['#ef9f27','Checking'],['#1d9e75','Finished']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:c+'44', border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={current?.codeLine??-1} />
      <style>{`@keyframes nodeAppear { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid ${color}30`, background:`${color}10`, color, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
