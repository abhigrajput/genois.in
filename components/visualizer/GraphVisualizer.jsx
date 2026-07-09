'use client';
import { useState } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';

const CODE = `// Weighted Graph Representations
int n = 6; // vertices

// Adjacency Matrix
int mat[6][6] = { ... };

// Adjacency List (weighted)
vector<vector<pair<int,int>>> adj(n);
// adj[u].push_back({v, weight});

// Add directed edge u→v with weight w:
void addEdge(int u, int v, int w, bool directed=false) {
  adj[u].push_back({v, w});
  if(!directed) adj[v].push_back({u, w});
}`;

const INIT_NODES = [
  { id: 0, x: 120, y: 80  },
  { id: 1, x: 300, y: 50  },
  { id: 2, x: 480, y: 80  },
  { id: 3, x: 100, y: 230 },
  { id: 4, x: 300, y: 250 },
  { id: 5, x: 480, y: 230 },
];
const INIT_EDGES = [
  { u: 0, v: 1, w: 4, id: 0 },
  { u: 0, v: 3, w: 2, id: 1 },
  { u: 1, v: 2, w: 3, id: 2 },
  { u: 1, v: 4, w: 6, id: 3 },
  { u: 2, v: 5, w: 1, id: 4 },
  { u: 3, v: 4, w: 5, id: 5 },
  { u: 4, v: 5, w: 7, id: 6 },
];

export default function GraphVisualizer() {
  const [nodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  const [directed, setDirected] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [addU, setAddU] = useState('');
  const [addV, setAddV] = useState('');
  const [addW, setAddW] = useState('');
  const [message, setMessage] = useState('Click an edge to highlight it. Toggle directed/undirected.');

  const adjList = nodes.map(n => {
    const out = edges.filter(e => e.u === n.id).map(e => ({ to: e.v, w: e.w }));
    const inc = directed ? [] : edges.filter(e => e.v === n.id).map(e => ({ to: e.u, w: e.w }));
    return [...out, ...inc];
  });

  const adjMatrix = nodes.map((_, i) =>
    nodes.map((_, j) => {
      const e = edges.find(e => (e.u === i && e.v === j) || (!directed && e.u === j && e.v === i));
      return e ? e.w : (i === j ? 0 : '∞');
    })
  );

  const addEdge = () => {
    const u = parseInt(addU), v = parseInt(addV), w = parseInt(addW) || 1;
    if (isNaN(u) || isNaN(v) || u < 0 || u >= 6 || v < 0 || v >= 6) {
      setMessage('Enter valid node IDs (0–5)'); return;
    }
    const id = edges.length;
    setEdges(prev => [...prev, { u, v, w, id }]);
    setMessage(`Added edge ${u} → ${v} (weight ${w})`);
    setAddU(''); setAddV(''); setAddW('');
  };

  const removeEdge = (id) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    setSelectedEdge(null);
    setMessage('Edge removed.');
  };

  const reset = () => { setEdges(INIT_EDGES); setSelectedEdge(null); setMessage('Reset to default graph.'); };

  const SVG_W = 600, SVG_H = 320;
  const COLORS = ['#00f0ff','#ff6b4a','#1d9e75','#ef9f27','#ff2d78','#378ADD'];

  function midPoint(u, v) {
    const nu = nodes[u], nv = nodes[v];
    return { x: (nu.x + nv.x) / 2, y: (nu.y + nv.y) / 2 };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is a Graph?"
        description="A Graph is a hierarchical or networked structure containing nodes (vertices) connected by edges. Graphs model computer networks, flight paths, social interactions, and dependency diagrams. Graphs can be directed, undirected, weighted, or unweighted, and form the basis of BFS, DFS, and pathfinding algorithms."
        timeComplexity="O(V + E)"
        spaceComplexity="O(V + E)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Vertices', value: nodes.length, color: '#00f0ff' },
          { label: 'Edges', value: edges.length, color: '#ff6b4a' },
          { label: 'Type', value: directed ? 'Directed' : 'Undirected', color: '#ef9f27' },
          { label: 'Selected Edge', value: selectedEdge !== null ? `${edges.find(e=>e.id===selectedEdge)?.u}→${edges.find(e=>e.id===selectedEdge)?.v}` : '—', color: '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00f0ff' }}>▶ {message}</div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Graph SVG */}
        <div style={{ flex: 2, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 280 }}>
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,240,255,0.5)" />
              </marker>
              <marker id="arrow-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#00f0ff" />
              </marker>
            </defs>
            {edges.map(e => {
              const nu = nodes[e.u], nv = nodes[e.v];
              const isSel = selectedEdge === e.id;
              const mid = midPoint(e.u, e.v);
              // offset end point for arrow
              const dx = nv.x - nu.x, dy = nv.y - nu.y;
              const len = Math.sqrt(dx*dx+dy*dy);
              const ex = nv.x - (dx/len)*24, ey = nv.y - (dy/len)*24;
              return (
                <g key={e.id} onClick={() => { setSelectedEdge(isSel ? null : e.id); setMessage(isSel ? 'Deselected.' : `Edge ${e.u}→${e.v}, weight=${e.w}`); }} style={{ cursor: 'pointer' }}>
                  <line x1={nu.x} y1={nu.y} x2={directed ? ex : nv.x} y2={directed ? ey : nv.y}
                    stroke={isSel ? '#00f0ff' : 'rgba(0,240,255,0.25)'} strokeWidth={isSel ? 2.5 : 1.5}
                    markerEnd={directed ? (isSel ? 'url(#arrow-sel)' : 'url(#arrow)') : undefined} />
                  <rect x={mid.x - 12} y={mid.y - 10} width={24} height={18} rx={4}
                    fill={isSel ? 'rgba(0,240,255,0.2)' : 'rgba(6,15,30,0.85)'} stroke={isSel ? '#00f0ff' : 'rgba(0,240,255,0.15)'} strokeWidth={1} />
                  <text x={mid.x} y={mid.y + 4} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, fill: isSel ? '#00f0ff' : '#5a7a9a' }}>{e.w}</text>
                </g>
              );
            })}
            {nodes.map(n => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={22} fill="#0d1a2a" stroke={COLORS[n.id]} strokeWidth={2} />
                <text x={n.x} y={n.y + 5} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, fill: COLORS[n.id] }}>{n.id}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right: adj list + matrix */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>ADJ LIST</div>
            {adjList.map((nbrs, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: COLORS[i], minWidth: 16, fontWeight: 700 }}>{i}:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>{nbrs.map(n=>`${n.to}(${n.w})`).join(', ') || '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>ADJ MATRIX</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  {adjMatrix.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td key={j} style={{ width: 28, height: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: v !== '∞' && v !== 0 ? '#00f0ff' : i === j ? '#ef9f27' : '#2a3a4a', border: '1px solid rgba(0,240,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setDirected(d => !d)} style={btn(directed ? '#ef9f27' : '#ff6b4a')}>{directed ? 'Directed ✓' : 'Undirected'}</button>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <input type="number" value={addU} onChange={e=>setAddU(e.target.value)} placeholder="U" style={inputStyle} />
          <span style={{ color:'#5a7a9a', fontFamily:'var(--font-mono)' }}>→</span>
          <input type="number" value={addV} onChange={e=>setAddV(e.target.value)} placeholder="V" style={inputStyle} />
          <input type="number" value={addW} onChange={e=>setAddW(e.target.value)} placeholder="W" style={inputStyle} />
          <button onClick={addEdge} style={btn('#1d9e75')}>Add Edge</button>
        </div>
        {selectedEdge !== null && <button onClick={() => removeEdge(selectedEdge)} style={btn('#ff2d78')}>Remove Selected</button>}
        <button onClick={reset} style={btn('#5a7a9a')}>↺ Reset</button>
      </div>

      <CodePanel code={CODE} />
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid ${color}30`, background:`${color}10`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
const inputStyle = { background:'rgba(0,240,255,0.04)', border:'1px solid rgba(0,240,255,0.2)', borderRadius:8, padding:'6px 10px', color:'#e8e8ed', fontFamily:'var(--font-mono)', fontSize:12, outline:'none', width:56 };
