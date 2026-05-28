'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `void bfs(vector<vector<int>>& adj, int src, int n) {
  vector<bool> visited(n, false);
  queue<int> q;
  visited[src] = true;
  q.push(src);
  while(!q.empty()) {
    int node = q.front(); q.pop();
    // process node
    for(int nbr : adj[node]) {
      if(!visited[nbr]) {
        visited[nbr] = true;
        q.push(nbr);
      }
    }
  }
}`;

const SPEEDS = { 1: 1000, 2: 600, 3: 280, 4: 120 };

// Fixed graph: 8 nodes
const GRAPH_NODES = [
  { id: 0, x: 200, y: 80 },
  { id: 1, x: 100, y: 180 },
  { id: 2, x: 300, y: 180 },
  { id: 3, x: 60,  y: 280 },
  { id: 4, x: 180, y: 280 },
  { id: 5, x: 340, y: 280 },
  { id: 6, x: 500, y: 180 },
  { id: 7, x: 500, y: 80  },
];
const GRAPH_EDGES = [
  [0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[2,6],[6,7],[0,7]
];
const ADJ = Array.from({ length: 8 }, () => []);
GRAPH_EDGES.forEach(([a, b]) => { ADJ[a].push(b); ADJ[b].push(a); });

function computeBFSSteps(src) {
  const steps = [];
  const visited = new Array(8).fill(false);
  const queue = [];
  visited[src] = true;
  queue.push(src);
  steps.push({
    visited: [...visited], queue: [...queue], current: -1, codeLine: 3,
    explanation: `Initializing BFS from source node ${src}. Adding node ${src} to queue and marking visited.`,
    status: 'info',
    activeLine: 3,
  });
  while (queue.length) {
    const node = queue.shift();
    steps.push({
      visited: [...visited], queue: [...queue], current: node, codeLine: 6,
      explanation: `Dequeuing node ${node} from front of queue. Processing its unvisited neighbors.`,
      status: 'compare',
      activeLine: 5,
    });
    for (const nbr of ADJ[node]) {
      if (!visited[nbr]) {
        visited[nbr] = true;
        queue.push(nbr);
        steps.push({
          visited: [...visited], queue: [...queue], current: node, enqueueing: nbr, codeLine: 10,
          explanation: `Node ${nbr} is unvisited! Marking visited and adding to queue. Queue: [${[...queue].join(', ')}]`,
          status: 'compare',
          activeLine: 8,
        });
      }
    }
  }
  steps.push({
    visited: [...visited], queue: [], current: -1, done: true, codeLine: -1,
    explanation: 'BFS complete! All reachable nodes visited in breadth-first (level-by-level) order.',
    status: 'sorted',
    activeLine: -1,
  });
  return steps;
}

function nodeColor(id, step) {
  if (!step) return '#1a2a3a';
  if (step.current === id) return '#00f0ff';
  if (step.enqueueing === id) return '#ef9f27';
  if (step.visited?.[id]) return '#1d9e75';
  return '#1a2a3a';
}

export default function BFSVisualizer() {
  const [src, setSrc] = useState(0);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const start = () => {
    const s = computeBFSSteps(src);
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
        title="What is BFS (Breadth-First Search)?"
        description="Breadth-First Search explores a graph level by level using a queue. It visits all neighbors of the current node before moving deeper. BFS finds the shortest path in unweighted graphs and explores nodes in order of their distance from the source."
        timeComplexity="O(V + E)"
        spaceComplexity="O(V)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Source', value: src, color: '#00f0ff' },
          { label: 'Current', value: current?.current >= 0 ? current.current : '-', color: '#ef9f27' },
          { label: 'Visited', value: current?.visited?.filter(Boolean).length ?? 0, color: '#1d9e75' },
          { label: 'Queue Size', value: current?.queue?.length ?? 0, color: '#7b5cff' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Graph SVG */}
        <div style={{ flex: 1, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
            {GRAPH_EDGES.map(([a, b], i) => (
              <line key={i}
                x1={GRAPH_NODES[a].x} y1={GRAPH_NODES[a].y + 60}
                x2={GRAPH_NODES[b].x} y2={GRAPH_NODES[b].y + 60}
                stroke="rgba(0,240,255,0.2)" strokeWidth={1.5} />
            ))}
            {GRAPH_NODES.map(n => {
              const color = nodeColor(n.id, current);
              const isActive = current?.current === n.id;
              return (
                <g key={n.id}>
                  {isActive && <circle cx={n.x} cy={n.y + 60} r={28} fill="none" stroke="#00f0ff" strokeWidth={1} opacity={0.4} />}
                  <circle cx={n.x} cy={n.y + 60} r={22}
                    fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'}
                    stroke={color} strokeWidth={isActive ? 2.5 : 1.5}
                    style={{ transition: 'all 0.3s ease' }} />
                  <text x={n.x} y={n.y + 65} textAnchor="middle"
                    style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, fill: color, transition: 'fill 0.3s ease' }}>
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right panel: queue + adj list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          {/* Queue */}
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(123,92,255,0.2)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#7b5cff', letterSpacing: 1, marginBottom: 8 }}>QUEUE (front→rear)</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minHeight: 36 }}>
              {(current?.queue || []).map((v, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(123,92,255,0.15)', border: '1px solid rgba(123,92,255,0.3)', fontFamily: 'JetBrains Mono,monospace', fontSize: 14, fontWeight: 700, color: '#7b5cff' }}>{v}</span>
              ))}
              {(!current?.queue || current.queue.length === 0) && (
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#2a3a4a' }}>empty</span>
              )}
            </div>
          </div>
          {/* Adjacency list */}
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>ADJACENCY LIST</div>
            {ADJ.map((nbrs, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: nodeColor(i, current), minWidth: 18, fontWeight: 700 }}>{i}:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#5a7a9a' }}>[{nbrs.join(', ')}]</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to start the visualization.'}
        status={current?.status ?? 'default'}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a' }}>SRC</span>
        {GRAPH_NODES.map(n => (
          <button key={n.id} onClick={() => setSrc(n.id)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${src === n.id ? '#00f0ff' : 'rgba(0,240,255,0.15)'}`, background: src === n.id ? 'rgba(0,240,255,0.12)' : 'transparent', color: src === n.id ? '#00f0ff' : '#5a7a9a', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', cursor: 'pointer' }}>{n.id}</button>
        ))}
        <button onClick={start} style={btn('#00f0ff')}>▶ Start BFS</button>
        <button onClick={() => setIsPlaying(p => !p)} style={btn('#7b5cff')}>{isPlaying ? '⏸ Pause' : '▶ Resume'}</button>
        <button onClick={() => setStepIdx(p => Math.min(p + 1, steps.length - 1))} style={btn('#ef9f27')}>⏭ Step</button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid #00f0ff' : '1px solid rgba(0,240,255,0.15)', background: speed === s ? 'rgba(0,240,255,0.12)' : 'transparent', color: speed === s ? '#00f0ff' : '#5a7a9a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', cursor: 'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00f0ff','Current'],['#ef9f27','Being Enqueued'],['#1d9e75','Visited'],['#1a2a3a','Unvisited']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:c+'44', border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>{l}</span>
          </div>
        ))}
      </div>

      <CodePanel code={CODE} activeLine={current?.codeLine ?? -1} />
    </div>
  );
}

function btn(color) {
  return { padding: '8px 16px', borderRadius: 8, border: `1px solid ${color}30`, background: `${color}10`, color, fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };
}
