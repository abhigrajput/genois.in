'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Dijkstra's Algorithm
void dijkstra(vector<vector<pair<int,int>>>& adj,
              int src, int n) {
  vector<int> dist(n, INT_MAX);
  priority_queue<pair<int,int>,
    vector<pair<int,int>>, greater<>> pq;
  dist[src] = 0;
  pq.push({0, src});
  while(!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if(d > dist[u]) continue;
    for(auto [v, w] : adj[u]) {
      if(dist[u]+w < dist[v]) {
        dist[v] = dist[u]+w;
        pq.push({dist[v], v});
      }
    }
  }
}`;

const SPEEDS = { 1: 1000, 2: 600, 3: 280, 4: 120 };

const NODES = [
  { id: 0, x: 120, y: 80  }, { id: 1, x: 300, y: 50  }, { id: 2, x: 480, y: 80  },
  { id: 3, x: 100, y: 230 }, { id: 4, x: 300, y: 250 }, { id: 5, x: 480, y: 230 },
];
const EDGES = [
  { u:0,v:1,w:4 }, { u:0,v:3,w:2 }, { u:1,v:2,w:3 }, { u:1,v:4,w:6 },
  { u:2,v:5,w:1 }, { u:3,v:4,w:5 }, { u:4,v:5,w:7 }, { u:1,v:3,w:8 },
];
const ADJ = Array.from({length:6},()=>[]);
EDGES.forEach(({u,v,w})=>{ ADJ[u].push({to:v,w}); ADJ[v].push({to:u,w}); });
const INF = 1e9;

function computeDijkstraSteps(src) {
  const steps = [];
  const dist = new Array(6).fill(INF);
  const visited = new Array(6).fill(false);
  const pq = [[0, src]]; // [dist, node]
  dist[src] = 0;
  steps.push({
    dist: [...dist],
    visited: [...visited],
    current: -1,
    relaxing: null,
    codeLine: 6,
    label: `Init: dist[${src}]=0`,
    explanation: `Initializing distances. Source node ${src} = 0, all others = ∞.`,
    status: 'info'
  });

  while (pq.length) {
    pq.sort((a,b)=>a[0]-b[0]);
    const [d, u] = pq.shift();
    if (visited[u]) {
      steps.push({
        dist: [...dist],
        visited: [...visited],
        current: u,
        relaxing: null,
        codeLine: 10,
        label: `Skip ${u} (already visited)`,
        explanation: `Node ${u} already finalized with shortest dist=${dist[u]}. Skipping.`,
        status: 'info'
      });
      continue;
    }
    visited[u] = true;
    steps.push({
      dist: [...dist],
      visited: [...visited],
      current: u,
      relaxing: null,
      codeLine: 9,
      label: `Process node ${u} (dist=${d})`,
      explanation: `Picking unvisited node with minimum distance: node ${u} with dist=${d}.`,
      status: 'info'
    });

    for (const {to:v, w} of ADJ[u]) {
      steps.push({
        dist: [...dist],
        visited: [...visited],
        current: u,
        relaxing: {u,v,w},
        codeLine: 12,
        label: `Check edge ${u}→${v}`,
        explanation: `Checking edge ${u}→${v} (weight=${w}). dist[${u}]+weight(${w}) = ${dist[u] + w} vs dist[${v}]=${dist[v]===INF?'∞':dist[v]}. No update.`,
        status: 'compare'
      });
      if (dist[u] + w < dist[v]) {
        const oldDist = dist[v];
        dist[v] = dist[u] + w;
        pq.push([dist[v], v]);
        steps.push({
          dist: [...dist],
          visited: [...visited],
          current: u,
          relaxing: {u,v,w},
          codeLine: 13,
          label: `Relax! dist[${v}] updated`,
          explanation: `Relaxing edge ${u}→${v}. dist[${u}]+weight(${w}) = ${dist[v]} < dist[${v}]=${oldDist===INF?'∞':oldDist}. dist[${v}] updated!`,
          status: 'found'
        });
      }
    }
  }
  steps.push({
    dist: [...dist],
    visited: [...visited],
    current: -1,
    relaxing: null,
    codeLine: -1,
    label: 'Dijkstra complete!',
    explanation: "Dijkstra's complete! All shortest distances from source finalized.",
    status: 'sorted',
    done: true
  });
  return steps;
}

function nodeColor(id, step, src) {
  if (!step) return src === id ? 'var(--gx-accent)' : 'var(--gx-surface-2)';
  if (step.current === id) return 'var(--gx-accent)';
  if (step.visited?.[id]) return 'var(--gx-success)';
  return 'var(--gx-surface-2)';
}

export default function DijkstraVisualizer() {
  const [src, setSrc] = useState(0);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const start = () => {
    const s = computeDijkstraSteps(src);
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
  const SVG_W = 600, SVG_H = 320;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Dijkstra's Algorithm?"
        description="Dijkstra's algorithm finds the shortest paths from a source node to all others in a weighted graph with non-negative edges. It uses a priority queue to always process the closest unvisited node first, greedily building shortest paths."
        timeComplexity="O(E log V)"
        spaceComplexity="O(V)"
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Source', value:src, color:'var(--gx-accent)' },
          { label:'Current', value:current?.current>=0?current.current:'-', color:'var(--gx-accent)' },
          { label:'Visited', value:current?.visited?.filter(Boolean).length??0, color:'var(--gx-success)' },
          { label:'Step', value:stepIdx>=0?stepIdx+1:0, color:'var(--gx-warning)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'var(--gx-surface)', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {/* Graph */}
        <div style={{ flex:2, background:'var(--gx-surface)', border:'1px solid var(--gx-border)', borderRadius:12, overflow:'hidden', minWidth:280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display:'block' }}>
            {EDGES.map((e,i) => {
              const nu=NODES[e.u], nv=NODES[e.v];
              const isRelaxing = current?.relaxing && ((current.relaxing.u===e.u&&current.relaxing.v===e.v)||(current.relaxing.u===e.v&&current.relaxing.v===e.u));
              const mid = { x:(nu.x+nv.x)/2, y:(nu.y+nv.y)/2 };
              return (
                <g key={i}>
                  <line x1={nu.x} y1={nu.y} x2={nv.x} y2={nv.y} stroke={isRelaxing?'var(--gx-warning)':'var(--gx-accent-border)'} strokeWidth={isRelaxing?2.5:1.5} style={{transition:'all 0.3s'}} />
                  <rect x={mid.x-12} y={mid.y-10} width={24} height={18} rx={4} fill={isRelaxing?'var(--gx-warning-soft)':'var(--gx-surface)'} stroke={isRelaxing?'var(--gx-warning)':'var(--gx-border)'} strokeWidth={1} />
                  <text x={mid.x} y={mid.y+4} textAnchor="middle" style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, fill: isRelaxing ? 'var(--gx-warning)' : 'var(--gx-text-muted)' }}>{e.w}</text>
                </g>
              );
            })}
            {NODES.map(n => {
              const color = nodeColor(n.id, current, src);
              const isActive = current?.current===n.id;
              return (
                <g key={n.id}>
                  {isActive && <circle cx={n.x} cy={n.y} r={28} fill="none" stroke="var(--gx-accent)" strokeWidth={1} opacity={0.4} />}
                  <circle cx={n.x} cy={n.y} r={22} fill={color==='var(--gx-surface-2)'?'var(--gx-surface)':`color-mix(in srgb, ${color} 13%, transparent)`} stroke={color} strokeWidth={isActive?2.5:1.5} style={{transition:'all 0.3s ease'}} />
                  <text x={n.x} y={n.y+5} textAnchor="middle" style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, fill:color }}>{n.id}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* dist[] table */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ background:'var(--gx-surface)', border:'1px solid var(--gx-border)', borderRadius:10, padding:12 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)', letterSpacing:1, marginBottom:10 }}>DIST[] TABLE</div>
            {NODES.map(n => {
              const d = current?.dist?.[n.id] ?? INF;
              const isVisited = current?.visited?.[n.id];
              const isCurrent = current?.current === n.id;
              return (
                <div key={n.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, padding:'4px 8px', borderRadius:6, background:isCurrent?'var(--gx-accent-soft)':isVisited?'var(--gx-success-soft)':'transparent', border:`1px solid ${isCurrent?'var(--gx-accent-border)':isVisited?'var(--gx-success-border)':'transparent'}`, transition:'all 0.3s' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:nodeColor(n.id,current,src), fontWeight:700, minWidth:20 }}>{n.id}</span>
                  <div style={{ flex:1, height:6, borderRadius:3, background:'var(--gx-accent-soft)', overflow:'hidden' }}>
                     <div style={{ height:'100%', borderRadius:3, background:isCurrent?'var(--gx-accent)':isVisited?'var(--gx-success)':'var(--gx-accent-soft)', width:d===INF?'0%':`${Math.min(100,(100/(d+1))*10)}%`, transition:'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:d===INF?'var(--gx-text-subtle)':isCurrent?'var(--gx-accent)':isVisited?'var(--gx-success)':'var(--gx-text)', minWidth:24, textAlign:'right' }}>{d===INF?'∞':d}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current?.explanation}
        status={current?.status}
      />

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)' }}>SRC</span>
        {NODES.map(n=>(
          <button key={n.id} onClick={()=>setSrc(n.id)} style={{ padding:'4px 12px', borderRadius:6, border:`1px solid ${src===n.id?'var(--gx-accent)':'var(--gx-border)'}`, background:src===n.id?'var(--gx-accent-soft)':'transparent', color:src===n.id?'var(--gx-accent)':'var(--gx-text-muted)', fontSize:12, fontFamily:'var(--font-mono)', cursor:'pointer' }}>{n.id}</button>
        ))}
        <button onClick={start} style={btn('var(--gx-accent)')}>▶ Run Dijkstra</button>
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
        {[['var(--gx-accent)','Current'],['var(--gx-warning)','Relaxing Edge'],['var(--gx-success)','Finalized']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:`color-mix(in srgb, ${c} 27%, transparent)`, border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'var(--gx-text-muted)', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={current?.codeLine??-1} />
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid color-mix(in srgb, ${color} 19%, transparent)`, background:`color-mix(in srgb, ${color} 6%, transparent)`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
