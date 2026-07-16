'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Bellman-Ford: shortest paths, negative edges allowed
void bellmanFord(vector<Edge>& edges, int V, int src) {
  vector<int> dist(V, INF);
  dist[src] = 0;
  for (int i = 1; i <= V - 1; i++)      // V-1 rounds
    for (auto& e : edges)               // relax every edge
      if (dist[e.u] != INF &&
          dist[e.u] + e.w < dist[e.v])
        dist[e.v] = dist[e.u] + e.w;
  for (auto& e : edges)                 // 1 extra round
    if (dist[e.u] + e.w < dist[e.v])
      return; // negative cycle detected
}`;

const SNIPPETS = {
  python: `def bellman_ford(edges, V, src):
    dist = [float('inf')] * V
    dist[src] = 0
    for _ in range(V - 1):                # V-1 rounds
        for u, v, w in edges:             # relax every edge
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    for u, v, w in edges:                 # extra round
        if dist[u] + w < dist[v]:
            return None  # negative cycle
    return dist`,
  java: `void bellmanFord(int[][] edges, int V, int src) {
  int[] dist = new int[V];
  Arrays.fill(dist, INF);
  dist[src] = 0;
  for (int i = 1; i <= V - 1; i++)        // V-1 rounds
    for (int[] e : edges)                 // relax every edge
      if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]])
        dist[e[1]] = dist[e[0]] + e[2];
  for (int[] e : edges)                   // extra round
    if (dist[e[0]] + e[2] < dist[e[1]])
      return; // negative cycle
}`,
  javascript: `function bellmanFord(edges, V, src) {
  const dist = new Array(V).fill(Infinity);
  dist[src] = 0;
  for (let i = 1; i <= V - 1; i++)        // V-1 rounds
    for (const [u, v, w] of edges)        // relax every edge
      if (dist[u] !== Infinity && dist[u] + w < dist[v])
        dist[v] = dist[u] + w;
  for (const [u, v, w] of edges)          // extra round
    if (dist[u] + w < dist[v]) return null; // negative cycle
  return dist;
}`,
};

const SPEEDS = { 1: 1100, 2: 650, 3: 300, 4: 130 };
const INF = 1e9;

const NODES = [
  { id: 0, x: 90, y: 150 }, { id: 1, x: 250, y: 60 }, { id: 2, x: 250, y: 240 },
  { id: 3, x: 420, y: 90 }, { id: 4, x: 420, y: 220 },
];
// Directed edges — negative weights included (that's what Dijkstra can't handle).
const EDGES = [
  { u: 0, v: 1, w: 6 }, { u: 0, v: 2, w: 7 }, { u: 1, v: 2, w: 8 },
  { u: 1, v: 3, w: 5 }, { u: 1, v: 4, w: -4 }, { u: 2, v: 3, w: -3 },
  { u: 2, v: 4, w: 9 }, { u: 3, v: 1, w: -2 }, { u: 4, v: 3, w: 7 },
];
const V = NODES.length;

function computeSteps(src) {
  const dist = new Array(V).fill(INF);
  dist[src] = 0;
  const steps = [];
  steps.push({ dist: [...dist], edge: null, round: 0, updated: null, codeLine: 4, status: 'info',
    explanation: `Initialise dist[${src}] = 0, everything else ∞. Bellman-Ford relaxes EVERY edge, V−1 = ${V - 1} times.` });

  for (let round = 1; round <= V - 1; round++) {
    let anyUpdate = false;
    for (const e of EDGES) {
      const canReach = dist[e.u] !== INF;
      const cand = canReach ? dist[e.u] + e.w : INF;
      const improved = canReach && cand < dist[e.v];
      if (improved) { dist[e.v] = cand; anyUpdate = true; }
      steps.push({ dist: [...dist], edge: e, round, updated: improved ? e.v : null, codeLine: improved ? 8 : 6,
        status: improved ? 'found' : canReach ? 'compare' : 'info',
        explanation: !canReach
          ? `Round ${round}: edge ${e.u}→${e.v} (w=${e.w}) — source ${e.u} still ∞, can't relax yet.`
          : improved
            ? `Round ${round}: relax ${e.u}→${e.v}. dist[${e.u}]+(${e.w}) = ${cand} < dist[${e.v}] — update dist[${e.v}] = ${cand}.`
            : `Round ${round}: edge ${e.u}→${e.v} (w=${e.w}). dist[${e.u}]+(${e.w}) = ${cand} ≥ dist[${e.v}]=${dist[e.v] === INF ? '∞' : dist[e.v]} — no change.` });
    }
    steps.push({ dist: [...dist], edge: null, round, updated: null, codeLine: 5, status: anyUpdate ? 'pivot' : 'sorted',
      explanation: anyUpdate
        ? `End of round ${round}. Distances still changing — more rounds may refine them.`
        : `End of round ${round}: no edge relaxed. Distances have converged early (safe to stop).` });
    if (!anyUpdate) break;
  }

  // Negative-cycle check round.
  let negCycle = false;
  for (const e of EDGES) {
    if (dist[e.u] !== INF && dist[e.u] + e.w < dist[e.v]) { negCycle = true; break; }
  }
  steps.push({ dist: [...dist], edge: null, round: 'check', updated: null, done: true, codeLine: negCycle ? 11 : -1,
    status: negCycle ? 'mismatch' : 'sorted',
    explanation: negCycle
      ? '⚠️ A distance still improved on the extra round → a NEGATIVE CYCLE is reachable, so shortest paths are undefined.'
      : `🎉 Done. One extra relaxation round changed nothing, so there's no negative cycle and every dist[] is a true shortest path. O(V·E) — slower than Dijkstra but it handles negative edges.` });
  return steps;
}

function nodeColor(id, step, src) {
  if (!step) return src === id ? '#00d9a3' : '#1a2a3a';
  if (step.updated === id) return '#1d9e75';
  if (step.edge && step.edge.u === id) return '#00d9a3';
  if (step.edge && step.edge.v === id) return '#ef9f27';
  if (id === src) return '#00d9a3';
  return step.dist?.[id] !== INF ? '#1d5a45' : '#1a2a3a';
}

export default function BellmanFordVisualizer() {
  const [src, setSrc] = useState(0);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  const start = () => { const s = computeSteps(src); setSteps(s); setStepIdx(0); setIsPlaying(true); };
  const reset = () => { setSteps([]); setStepIdx(-1); setIsPlaying(false); clearInterval(intervalRef.current); };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev + 1 >= steps.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps.length]);

  const SVG_W = 520, SVG_H = 300;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is the Bellman-Ford Algorithm?"
        description="Bellman-Ford computes shortest paths from a source in a weighted DIRECTED graph — and unlike Dijkstra, it allows negative edge weights. It simply relaxes every edge V−1 times (the longest any shortest path can be). One extra relaxation round that still improves a distance proves a reachable negative cycle exists, so shortest paths would be undefined."
        timeComplexity="O(V · E)"
        spaceComplexity="O(V)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Source', value: src, color: '#00d9a3' },
          { label: 'Round', value: current?.round ?? '-', color: '#ef9f27' },
          { label: 'Reached', value: current?.dist?.filter((d) => d !== INF).length ?? (current ? 1 : 0), color: '#1d9e75' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 300 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
            <defs>
              <marker id="bf-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="#3d5a6a" />
              </marker>
              <marker id="bf-arrow-hot" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="#ef9f27" />
              </marker>
            </defs>
            {EDGES.map((e, i) => {
              const nu = NODES[e.u], nv = NODES[e.v];
              const active = current?.edge && current.edge.u === e.u && current.edge.v === e.v;
              // Shorten the line so the arrowhead sits at the node edge, not center.
              const dx = nv.x - nu.x, dy = nv.y - nu.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len, uy = dy / len;
              const x1 = nu.x + ux * 22, y1 = nu.y + uy * 22;
              const x2 = nv.x - ux * 24, y2 = nv.y - uy * 24;
              const mx = (nu.x + nv.x) / 2, my = (nu.y + nv.y) / 2;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? '#ef9f27' : e.w < 0 ? 'rgba(255,45,120,0.4)' : 'rgba(0,217,163,0.2)'} strokeWidth={active ? 2.5 : 1.5} markerEnd={active ? 'url(#bf-arrow-hot)' : 'url(#bf-arrow)'} style={{ transition: 'all 0.3s' }} />
                  <rect x={mx - 13} y={my - 10} width={26} height={18} rx={4} fill={active ? 'rgba(239,159,39,0.2)' : 'rgba(6,15,30,0.9)'} stroke={active ? '#ef9f27' : e.w < 0 ? 'rgba(255,45,120,0.4)' : 'rgba(0,217,163,0.15)'} strokeWidth={1} />
                  <text x={mx} y={my + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: active ? '#ef9f27' : e.w < 0 ? '#ff2d78' : '#5a7a9a' }}>{e.w}</text>
                </g>
              );
            })}
            {NODES.map((n) => {
              const color = nodeColor(n.id, current, src);
              const d = current?.dist?.[n.id];
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={22} fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'} stroke={color} strokeWidth={1.8} style={{ transition: 'all 0.3s ease' }} />
                  <text x={n.x} y={n.y + 1} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: color }}>{n.id}</text>
                  <text x={n.x} y={n.y + 13} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: '#8aa2b9' }}>{d === undefined || d === INF ? '∞' : d}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 10 }}>DIST[] FROM SOURCE</div>
            {NODES.map((n) => {
              const d = current?.dist?.[n.id] ?? INF;
              const hot = current?.updated === n.id;
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, padding: '4px 8px', borderRadius: 6, background: hot ? 'rgba(29,158,117,0.1)' : 'transparent', border: `1px solid ${hot ? 'rgba(29,158,117,0.25)' : 'transparent'}`, transition: 'all 0.3s' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: nodeColor(n.id, current, src), fontWeight: 700, minWidth: 16 }}>{n.id}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: d === INF ? '#2a3a4a' : hot ? '#1d9e75' : '#e8e8ed', marginLeft: 'auto' }}>{d === INF ? '∞' : d}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current?.explanation ?? 'Pick a source and press ▶ Run. Red edges are negative weights.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>SRC</span>
        {NODES.map((n) => (
          <button key={n.id} onClick={() => { setSrc(n.id); reset(); }} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${src === n.id ? '#00d9a3' : 'rgba(0,217,163,0.15)'}`, background: src === n.id ? 'rgba(0,217,163,0.12)' : 'transparent', color: src === n.id ? '#00d9a3' : '#5a7a9a', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{n.id}</button>
        ))}
        <button onClick={start} style={btn('#00d9a3')}>▶ Run</button>
        <button onClick={() => setIsPlaying((p) => !p)} style={btn('#ff6b4a')}>{isPlaying ? '⏸ Pause' : '▶ Resume'}</button>
        <button onClick={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))} style={btn('#ef9f27')}>⏭ Step</button>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid #00d9a3' : '1px solid rgba(0,217,163,0.15)', background: speed === s ? 'rgba(0,217,163,0.12)' : 'transparent', color: speed === s ? '#00d9a3' : '#5a7a9a', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00d9a3', 'Edge source'], ['#ef9f27', 'Edge target'], ['#1d9e75', 'Relaxed (updated)'], ['#ff2d78', 'Negative weight']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c + '44', border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.codeLine ?? -1} />
    </div>
  );
}

function btn(color) {
  return { padding: '8px 16px', borderRadius: 8, border: `1px solid ${color}30`, background: `${color}10`, color, fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };
}
