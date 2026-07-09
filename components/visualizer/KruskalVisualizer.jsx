'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `struct Edge {
  int src, dest, weight;
};

struct DSU {
  vector<int> parent;
  DSU(int n) {
    parent.resize(n);
    iota(parent.begin(), parent.end(), 0);
  }
  int find(int i) {
    if (parent[i] == i) return i;
    return parent[i] = find(parent[i]);
  }
  bool unite(int i, int j) {
    int root_i = find(i);
    int root_j = find(j);
    if (root_i != root_j) {
      parent[root_i] = root_j;
      return true;
    }
    return false;
  }
};

void kruskalMST(vector<Edge>& edges, int V) {
  sort(edges.begin(), edges.end(), [](Edge a, Edge b) {
    return a.weight < b.weight;
  });
  DSU dsu(V);
  vector<Edge> mst;
  for (auto edge : edges) {
    if (dsu.unite(edge.src, edge.dest)) {
      mst.push_back(edge);
    }
  }
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

const VERTICES = {
  0: { label: 'A', x: 120, y: 50 },
  1: { label: 'B', x: 280, y: 50 },
  2: { label: 'C', x: 380, y: 140 },
  3: { label: 'D', x: 280, y: 230 },
  4: { label: 'E', x: 120, y: 230 },
  5: { label: 'F', x: 40,  y: 140 },
};

const SORTED_EDGES = [
  { id: 'e5', u: 2, v: 3, w: 1 }, // C-D
  { id: 'e8', u: 1, v: 5, w: 1 }, // B-F
  { id: 'e2', u: 0, v: 5, w: 2 }, // A-F
  { id: 'e6', u: 3, v: 4, w: 2 }, // D-E
  { id: 'e3', u: 1, v: 2, w: 3 }, // B-C
  { id: 'e7', u: 4, v: 5, w: 3 }, // E-F
  { id: 'e1', u: 0, v: 1, w: 4 }, // A-B
  { id: 'e4', u: 1, v: 3, w: 5 }, // B-D
  { id: 'e9', u: 2, v: 4, w: 6 }, // C-E
];

export default function KruskalVisualizer() {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const computeSteps = useCallback(() => {
    const tempSteps = [];
    const V = 6;
    const parent = [0, 1, 2, 3, 4, 5];
    const mstEdges = [];
    const edgeStates = {}; // edgeId -> 'mst' | 'cycle' | 'active' | 'pending'
    
    // Init state
    SORTED_EDGES.forEach(e => { edgeStates[e.id] = 'pending'; });

    function getDisjointSetsCount(parentArr) {
      const roots = new Set();
      for (let i = 0; i < 6; i++) {
        let root = i;
        while (parentArr[root] !== root) {
          root = parentArr[root];
        }
        roots.add(root);
      }
      return roots.size;
    }

    tempSteps.push({
      parent: [...parent],
      mstEdges: [],
      edgeStates: { ...edgeStates },
      currEdgeId: null,
      codeLine: 31,
      description: 'Edges are sorted by weight (displayed in order on the side). Initialize disjoint sets.',
      explanation: 'Sorted 9 edges by weight. Processing cheapest edges first. Initializing 6 disjoint sets (A to F).',
      status: 'info',
    });

    // Helper find
    function find(i) {
      let curr = i;
      while (parent[curr] !== curr) {
        curr = parent[curr];
      }
      return curr;
    }

    // Helper union
    function unite(i, j) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
      }
      return false;
    }

    for (let i = 0; i < SORTED_EDGES.length; i++) {
      const edge = SORTED_EDGES[i];
      const nextStates = { ...edgeStates };
      nextStates[edge.id] = 'active';

      const uRoot = find(edge.u);
      const vRoot = find(edge.v);
      const differentSets = uRoot !== vRoot;

      tempSteps.push({
        parent: [...parent],
        mstEdges: [...mstEdges],
        edgeStates: { ...nextStates },
        currEdgeId: edge.id,
        codeLine: 37,
        description: `Checking edge ${VERTICES[edge.u].label}-${VERTICES[edge.v].label} (Weight: ${edge.w}). DSU check: find(${VERTICES[edge.u].label}) = ${VERTICES[find(edge.u)].label}, find(${VERTICES[edge.v].label}) = ${VERTICES[find(edge.v)].label}.`,
        explanation: `Edge (${VERTICES[edge.u].label}, ${VERTICES[edge.v].label}) weight=${edge.w}. find(${VERTICES[edge.u].label})=${VERTICES[find(edge.u)].label}, find(${VERTICES[edge.v].label})=${VERTICES[find(edge.v)].label}. ${differentSets ? 'Different components, safe to add.' : 'Same component, would create cycle, skipping.'}`,
        status: 'compare',
      });

      if (differentSets) {
        const prevCount = getDisjointSetsCount(parent);
        unite(edge.u, edge.v);
        mstEdges.push(edge.id);
        edgeStates[edge.id] = 'mst';

        tempSteps.push({
          parent: [...parent],
          mstEdges: [...mstEdges],
          edgeStates: { ...edgeStates },
          currEdgeId: edge.id,
          codeLine: 39,
          description: `Roots differ! Connecting ${VERTICES[edge.u].label} and ${VERTICES[edge.v].label}. Union successful, edge added to MST.`,
          explanation: `Added edge (${VERTICES[edge.u].label}, ${VERTICES[edge.v].label}). MST weight: ${mstEdges.reduce((acc, id) => acc + SORTED_EDGES.find(e => e.id === id).w, 0)}. Components reduced from ${prevCount} to ${prevCount - 1}.`,
          status: 'found',
        });
      } else {
        edgeStates[edge.id] = 'cycle';
        tempSteps.push({
          parent: [...parent],
          mstEdges: [...mstEdges],
          edgeStates: { ...edgeStates },
          currEdgeId: edge.id,
          codeLine: 38,
          description: `Same root! Connection would form a cycle. Edge ${VERTICES[edge.u].label}-${VERTICES[edge.v].label} is discarded.`,
          explanation: `Edge (${VERTICES[edge.u].label}, ${VERTICES[edge.v].label}) weight=${edge.w} forms a cycle (both vertices already in set with root ${VERTICES[uRoot].label}). Skipping this edge to avoid cycles.`,
          status: 'mismatch',
        });
      }
    }

    tempSteps.push({
      parent: [...parent],
      mstEdges: [...mstEdges],
      edgeStates: { ...edgeStates },
      currEdgeId: null,
      codeLine: -1,
      description: 'Kruskal\'s Algorithm complete! Sorted edges fully evaluated and MST formed.',
      explanation: `Kruskal's MST complete! Added ${mstEdges.length} edges. Final MST weight: ${mstEdges.reduce((acc, id) => acc + SORTED_EDGES.find(e => e.id === id).w, 0)}. All vertices connected in a single component.`,
      status: 'sorted',
    });

    return tempSteps;
  }, []);

  const rebuild = useCallback(() => {
    const s = computeSteps();
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, [computeSteps]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

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
    parent: [0, 1, 2, 3, 4, 5],
    mstEdges: [],
    edgeStates: SORTED_EDGES.reduce((acc, e) => ({ ...acc, [e.id]: 'pending' }), {}),
    currEdgeId: null,
    codeLine: -1,
    description: 'Press Play or Step Forward to run Kruskal\'s MST visualizer.',
  };

  const getVertexStyles = (vId) => {
    const isMst = current.mstEdges.some(id => {
      const e = SORTED_EDGES.find(x => x.id === id);
      return e.u === vId || e.v === vId;
    });

    let border = '2px solid rgba(0, 240, 255, 0.2)';
    let background = 'rgba(10,15,30,0.8)';
    let color = '#5a7a9a';

    if (isMst) {
      border = '2px solid #1d9e75';
      background = 'rgba(29, 158, 117, 0.08)';
      color = '#1d9e75';
    }

    return { border, background, color };
  };

  const getEdgeStyles = (edge) => {
    const state = current.edgeStates[edge.id];
    let stroke = 'rgba(0, 240, 255, 0.12)';
    let width = 1.5;

    if (state === 'active') {
      stroke = '#00f0ff';
      width = 3.5;
    } else if (state === 'mst') {
      stroke = '#1d9e75';
      width = 3.5;
    } else if (state === 'cycle') {
      stroke = '#ff2d78';
      width = 2.5;
    }

    return { stroke, strokeWidth: width };
  };

  // Group disjoint sets for readability
  const getDisjointSets = () => {
    const parentArr = current.parent;
    const sets = {};
    for (let i = 0; i < 6; i++) {
      let root = i;
      while (parentArr[root] !== root) {
        root = parentArr[root];
      }
      if (!sets[root]) sets[root] = [];
      sets[root].push(VERTICES[i].label);
    }
    return Object.values(sets);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Kruskal's MST?"
        description="Kruskal's algorithm builds the MST by sorting all edges by weight and adding them one by one, skipping any edge that would create a cycle (detected via Union-Find). It processes globally cheapest edges first, regardless of which vertex they connect."
        timeComplexity="O(E log E)"
        spaceComplexity="O(V)"
      />

      {/* Top statistics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'MST Cost', value: current.mstEdges.reduce((acc, id) => acc + SORTED_EDGES.find(e => e.id === id).w, 0), color: '#1d9e75' },
          { label: 'MST Edges Added', value: `${current.mstEdges.length} / 5`, color: '#00f0ff' },
          { label: 'DSU Clusters', value: getDisjointSets().length, color: '#ff6b4a' },
          { label: 'Checked Edges', value: `${Object.values(current.edgeStates).filter(s => s !== 'pending').length} / 9`, color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description board */}
      <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00f0ff' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Graph rendering area */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'center' }}>
          <svg width="420" height="280" style={{ display: 'block', overflow: 'visible' }}>
            {/* Draw Links */}
            {SORTED_EDGES.map(e => {
              const uPos = VERTICES[e.u];
              const vPos = VERTICES[e.v];
              const edgeStyles = getEdgeStyles(e);
              const mid = { x: (uPos.x + vPos.x) / 2, y: (uPos.y + vPos.y) / 2 };

              return (
                <g key={e.id}>
                  <line
                    x1={uPos.x} y1={uPos.y}
                    x2={vPos.x} y2={vPos.y}
                    stroke={edgeStyles.stroke}
                    strokeWidth={edgeStyles.strokeWidth}
                    style={{ transition: 'all 0.3s' }}
                  />
                  {/* Weight block */}
                  <rect x={mid.x - 8} y={mid.y - 8} width="16" height="16" rx="4" fill="#0d1424" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="0.5" />
                  <text x={mid.x} y={mid.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: edgeStyles.stroke !== 'rgba(0, 240, 255, 0.12)' ? edgeStyles.stroke : '#5a7a9a', fontWeight: 'bold' }}>
                    {e.w}
                  </text>
                </g>
              );
            })}

            {/* Draw Vertices */}
            {Object.entries(VERTICES).map(([id, layout]) => {
              const vStyle = getVertexStyles(parseInt(id));
              return (
                <g key={id}>
                  <circle cx={layout.x} cy={layout.y} r={18} fill={vStyle.background} stroke={vStyle.border.split(' ')[2]} strokeWidth="2" style={{ transition: 'all 0.3s' }} />
                  <text x={layout.x} y={layout.y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, fill: vStyle.color }}>
                    {layout.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Panel: Sorted list + DSU set display */}
        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Sorted Edges List */}
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>SORTED EDGES WALKTHROUGH</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SORTED_EDGES.map(e => {
                const state = current.edgeStates[e.id];
                const active = current.currEdgeId === e.id;
                
                let col = '#5a7a9a';
                let bg = 'rgba(0,240,255,0.02)';
                let border = '1px dashed rgba(0,240,255,0.08)';

                if (active) {
                  col = '#00f0ff';
                  bg = 'rgba(0, 240, 255, 0.08)';
                  border = '1px solid #00f0ff';
                } else if (state === 'mst') {
                  col = '#1d9e75';
                  bg = 'rgba(29, 158, 117, 0.06)';
                  border = '1px solid rgba(29, 158, 117, 0.2)';
                } else if (state === 'cycle') {
                  col = '#ff2d78';
                  bg = 'rgba(255, 45, 120, 0.04)';
                  border = '1px solid rgba(255, 45, 120, 0.15)';
                }

                return (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: bg, border: border, borderRadius: 6, padding: '4px 8px',
                    fontFamily: 'var(--font-mono)', fontSize: 11, color: col,
                    transition: 'all 0.2s',
                  }}>
                    <span>{VERTICES[e.u].label} ➔ {VERTICES[e.v].label}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {state === 'mst' ? 'MST ✓' : state === 'cycle' ? 'CYCLE ✗' : `wt: ${e.w}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DSU Sets */}
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>DISJOINT UNION CLUSTERS</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {getDisjointSets().map((set, i) => (
                <div key={i} style={{
                  background: 'rgba(123, 92, 255, 0.06)', border: '1px solid rgba(123, 92, 255, 0.2)',
                  borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b4a',
                }}>
                  Set {i + 1}: {`{ ${set.join(', ')} }`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : undefined}
        totalSteps={steps.length}
        explanation={current.explanation}
        status={current.status}
      />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#00f0ff', label: 'Edge currently under DSU validation' },
          { color: '#1d9e75', label: 'MST Edge (Union Success / No Cycle)' },
          { color: '#ff2d78', label: 'Cycle Edge (Union Failure / Discarded)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l.label}</span>
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
