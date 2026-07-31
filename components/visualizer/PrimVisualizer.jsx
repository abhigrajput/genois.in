'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `void primMST(vector<vector<pair<int, int>>>& adj, int V) {
  priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
  int src = 0;
  vector<int> key(V, INF);
  vector<int> parent(V, -1);
  vector<bool> inMST(V, false);

  pq.push({0, src});
  key[src] = 0;

  while (!pq.empty()) {
    int u = pq.top().second;
    pq.pop();
    if(inMST[u] == true) continue;
    inMST[u] = true;

    for (auto x : adj[u]) {
      int v = x.first;
      int weight = x.second;
      if (inMST[v] == false && key[v] > weight) {
        key[v] = weight;
        pq.push({key[v], v});
        parent[v] = u;
      }
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

const INITIAL_EDGES = [
  { id: 'e1', u: 0, v: 1, w: 4 },
  { id: 'e2', u: 0, v: 5, w: 2 },
  { id: 'e3', u: 1, v: 2, w: 3 },
  { id: 'e4', u: 1, v: 3, w: 5 },
  { id: 'e5', u: 2, v: 3, w: 1 },
  { id: 'e6', u: 3, v: 4, w: 2 },
  { id: 'e7', u: 4, v: 5, w: 3 },
  { id: 'e8', u: 1, v: 5, w: 1 },
  { id: 'e9', u: 2, v: 4, w: 6 },
];

export default function PrimVisualizer() {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const computeSteps = useCallback(() => {
    const tempSteps = [];
    const V = 6;
    const inMST = Array(V).fill(false);
    const mstEdges = [];
    const pq = []; // list of { u, v, w, status: 'pending'|'mst'|'discarded' }
    
    // Step 0: Init
    tempSteps.push({
      inMST: [...inMST],
      mstEdges: [],
      pq: [],
      currU: -1,
      currEdge: null,
      codeLine: 7,
      description: 'Initialize Prim\'s MST from Source Node A (index 0).',
      explanation: 'Starting Prim\'s algorithm from source node A. Initializing distances to infinity and marking all vertices as unvisited.',
      status: 'info',
    });

    // Push source to PQ (represented here simply by active candidates)
    pq.push({ u: 0, v: 0, w: 0, status: 'active' });
    inMST[0] = true;

    // Simulate Prim's
    let currentVertex = 0;
    
    // Add adjacent edges of A to PQ
    INITIAL_EDGES.filter(e => e.u === 0 || e.v === 0).forEach(e => {
      const neighbor = e.u === 0 ? e.v : e.u;
      pq.push({ u: 0, v: neighbor, w: e.w, edgeId: e.id, status: 'active' });
    });

    tempSteps.push({
      inMST: [...inMST],
      mstEdges: [],
      pq: pq.map(x => ({ ...x })),
      currU: 0,
      currEdge: null,
      codeLine: 16,
      description: 'Marked Node A as visited. Adding all its outgoing edges to the Priority Queue (yellow).',
      explanation: 'Starting from node A. Adding all its outgoing edges to priority queue: A→B (wt: 4) and A→F (wt: 2).',
      status: 'info',
    });

    while (mstEdges.length < V - 1) {
      // Find min weight edge in PQ connecting to an unvisited node
      const activeCandidates = pq.filter(item => item.status === 'active' && !inMST[item.v]);
      if (activeCandidates.length === 0) break;

      // Sort to find minimum
      activeCandidates.sort((a, b) => a.w - b.w);
      const minEdge = activeCandidates[0];

      // Mark it popped
      const poppedIdx = pq.findIndex(item => item.edgeId === minEdge.edgeId && item.status === 'active');
      if (poppedIdx !== -1) {
        pq[poppedIdx].status = 'mst';
      }

      const nextU = minEdge.v;
      mstEdges.push(minEdge.edgeId);
      inMST[nextU] = true;

      tempSteps.push({
        inMST: [...inMST],
        mstEdges: [...mstEdges],
        pq: pq.map(x => ({ ...x })),
        currU: nextU,
        currEdge: minEdge.edgeId,
        codeLine: 11,
        description: `Popped minimum edge ${VERTICES[minEdge.u].label}-${VERTICES[minEdge.v].label} (Weight: ${minEdge.w}) from PQ. Add edge to MST and visit ${VERTICES[nextU].label}.`,
        explanation: `Picking minimum edge (${VERTICES[minEdge.u].label},${VERTICES[minEdge.v].label}) with weight ${minEdge.w} from priority queue. Adding node ${VERTICES[nextU].label} to MST. MST weight so far: ${mstEdges.reduce((acc, id) => acc + INITIAL_EDGES.find(e => e.id === id).w, 0)}.`,
        status: 'found',
      });

      // Add outgoing edges of nextU to PQ
      const newEdges = INITIAL_EDGES.filter(e => (e.u === nextU || e.v === nextU) && !mstEdges.includes(e.id));
      newEdges.forEach(e => {
        const neighbor = e.u === nextU ? e.v : e.u;
        if (!inMST[neighbor]) {
          // Check if already in PQ and update/insert
          const existingIdx = pq.findIndex(item => item.v === neighbor && item.status === 'active');
          if (existingIdx !== -1) {
            if (pq[existingIdx].w > e.w) {
              pq[existingIdx].status = 'discarded';
              pq.push({ u: nextU, v: neighbor, w: e.w, edgeId: e.id, status: 'active' });
            }
          } else {
            pq.push({ u: nextU, v: neighbor, w: e.w, edgeId: e.id, status: 'active' });
          }
        }
      });

      tempSteps.push({
        inMST: [...inMST],
        mstEdges: [...mstEdges],
        pq: pq.map(x => ({ ...x })),
        currU: nextU,
        currEdge: null,
        codeLine: 19,
        description: `Adding outgoing edges from Node ${VERTICES[nextU].label} to Priority Queue. Discarding duplicate heavier connections.`,
        explanation: `Checking outgoing edges of newly visited node ${VERTICES[nextU].label}. Adding new connections to PQ and updating weights to minimize cost.`,
        status: 'compare',
      });
    }

    tempSteps.push({
      inMST: [...inMST],
      mstEdges: [...mstEdges],
      pq: pq.map(x => ({ ...x })),
      currU: -1,
      currEdge: null,
      codeLine: -1,
      description: 'Prim\'s Algorithm complete! Minimum Spanning Tree successfully formed.',
      explanation: `Prim's MST complete! Successfully connected all 6 nodes using 5 edges. Total MST weight: ${mstEdges.reduce((acc, id) => acc + INITIAL_EDGES.find(e => e.id === id).w, 0)}.`,
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
    inMST: Array(6).fill(false),
    mstEdges: [],
    pq: [],
    currU: -1,
    currEdge: null,
    codeLine: -1,
    description: 'Press Play or Step Forward to run Prim\'s MST calculation.',
  };

  const getVertexStyles = (vId) => {
    const isCurrent = current.currU === vId;
    const isVisited = current.inMST[vId];

    let border = '2px solid var(--gx-accent-border)';
    let background = 'var(--gx-surface)';
    let color = 'var(--gx-text-muted)';
    let shadow = 'none';

    if (isCurrent) {
      border = '2.5px solid var(--gx-accent)';
      background = 'var(--gx-accent-soft)';
      color = 'var(--gx-accent)';
      shadow = 'none';
    } else if (isVisited) {
      border = '2px solid var(--gx-success)';
      background = 'var(--gx-success-soft)';
      color = 'var(--gx-success)';
    }

    return { border, background, color, boxShadow: shadow };
  };

  const getEdgeStyles = (edge) => {
    const isMst = current.mstEdges.includes(edge.id);
    const isCurrent = current.currEdge === edge.id;
    const isCand = current.pq.some(item => item.edgeId === edge.id && item.status === 'active');

    let stroke = 'var(--gx-accent)';
    let width = 1.5;

    if (isCurrent) {
      stroke = 'var(--gx-accent)';
      width = 3;
    } else if (isMst) {
      stroke = 'var(--gx-success)';
      width = 3.5;
    } else if (isCand) {
      stroke = 'var(--gx-warning)';
      width = 2;
    }

    return { stroke, strokeWidth: width };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Prim's MST?"
        description="Prim's algorithm builds a Minimum Spanning Tree by always adding the cheapest edge connecting the current MST to a new vertex. Uses a priority queue. Starting from any node, it greedily expands the MST one edge at a time."
        timeComplexity="O(E log V)"
        spaceComplexity="O(V + E)"
      />

      {/* Statistics board */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'MST Cost', value: current.mstEdges.reduce((acc, id) => acc + INITIAL_EDGES.find(e => e.id === id).w, 0), color: 'var(--gx-success)' },
          { label: 'MST Edges Added', value: `${current.mstEdges.length} / 5`, color: 'var(--gx-accent)' },
          { label: 'Visited Vertices', value: `${current.inMST.filter(Boolean).length} / 6`, color: 'var(--gx-warning)' },
          { label: 'Active Candidates', value: current.pq.filter(x => x.status === 'active' && !current.inMST[x.v]).length, color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Action narration */}
      <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-accent)' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Graph representation canvas */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'center' }}>
          <svg width="420" height="280" style={{ display: 'block', overflow: 'visible' }}>
            {/* Draw Edges */}
            {INITIAL_EDGES.map(e => {
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
                  {/* Edge Weight Pill */}
                  <rect x={mid.x - 8} y={mid.y - 8} width="16" height="16" rx="4" fill="var(--gx-text-inverse)" stroke="var(--gx-accent)" strokeWidth="0.5" />
                  <text x={mid.x} y={mid.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: edgeStyles.stroke !== 'var(--gx-accent)' ? edgeStyles.stroke : 'var(--gx-text-muted)', fontWeight: 'bold' }}>
                    {e.w}
                  </text>
                </g>
              );
            })}

            {/* Draw Vertices */}
            {Object.entries(VERTICES).map(([id, layout]) => {
              const vStyle = getVertexStyles(parseInt(id));
              return (
                <g key={id} style={{ transition: 'all 0.3s' }}>
                  <circle cx={layout.x} cy={layout.y} r={18} fill={vStyle.background} stroke={vStyle.border.split(' ')[2]} strokeWidth="2" style={{ transition: 'all 0.3s', boxShadow: vStyle.boxShadow }} />
                  <text x={layout.x} y={layout.y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, fill: vStyle.color }}>
                    {layout.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Priority Queue state lists */}
        <div style={{ flex: 0.8, minWidth: 200 }}>
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 8 }}>PRIORITY QUEUE (Sorted)</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {current.pq.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-body)', padding: 8 }}>Queue is empty.</div>
              ) : (
                current.pq
                  .filter(item => !current.inMST[item.v] || item.status === 'mst')
                  .sort((a, b) => {
                    if (a.status === 'active' && b.status === 'active') return a.w - b.w;
                    if (a.status === 'mst') return -1;
                    if (b.status === 'mst') return 1;
                    return 0;
                  })
                  .map((item, index) => {
                    const isMst = item.status === 'mst';
                    const col = isMst ? 'var(--gx-success)' : 'var(--gx-warning)';
                    const bg = isMst ? 'var(--gx-success-soft)' : 'var(--gx-warning-soft)';

                    return (
                      <div key={index} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: bg, border: `1px solid color-mix(in srgb, ${col} 15%, transparent)`, borderRadius: 6, padding: '5px 8px',
                        fontFamily: 'var(--font-mono)', fontSize: 11, color: col,
                      }}>
                        <span>{VERTICES[item.u].label} ➔ {VERTICES[item.v].label}</span>
                        <span style={{ fontWeight: 'bold' }}>{isMst ? 'MST ✓' : `wt: ${item.w}`}</span>
                      </div>
                    );
                  })
              )}
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
          { color: 'var(--gx-accent)', label: 'Currently visited node / popped edge' },
          { color: 'var(--gx-success)', label: 'MST (Minimum Spanning Tree) nodes & edges' },
          { color: 'var(--gx-warning)', label: 'Active PQ candidate connections' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, ${l.color} 13%, transparent)`, border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l.label}</span>
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
