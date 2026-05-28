'use client';
import { useState } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Union-Find with Path Compression + Union by Rank
int parent[N], rank_[N];

void init(int n) {
  for(int i=0;i<n;i++) parent[i]=i, rank_[i]=0;
}

int find(int x) { // path compression
  if(parent[x] != x)
    parent[x] = find(parent[x]);
  return parent[x];
}

void unite(int x, int y) { // union by rank
  int px=find(x), py=find(y);
  if(px==py) return; // same set
  if(rank_[px] < rank_[py]) swap(px,py);
  parent[py] = px;
  if(rank_[px]==rank_[py]) rank_[px]++;
}`;

const N = 8;

function initUF() {
  return {
    parent: Array.from({length:N},(_,i)=>i),
    rank: new Array(N).fill(0),
  };
}

function find(parent, x) {
  const path = [x];
  let cur = x;
  while (parent[cur] !== cur) { cur = parent[cur]; path.push(cur); }
  return { root: cur, path };
}

function compress(parent, path, root) {
  const p = [...parent];
  path.forEach(n => { p[n] = root; });
  return p;
}

function union(parent, rank, x, y) {
  const { root: px, path: pathX } = find(parent, x);
  const { root: py, path: pathY } = find(parent, y);
  if (px === py) return { parent, rank, changed: false, msg: `${x} and ${y} already in same set!` };
  let p = [...parent], r = [...rank];
  // compress paths
  p = compress(p, pathX, px);
  p = compress(p, pathY, py);
  if (r[px] < r[py]) { p[px] = py; }
  else if (r[px] > r[py]) { p[py] = px; }
  else { p[py] = px; r[px]++; }
  return { parent: p, rank: r, changed: true, msg: `United ${x} and ${y}. Root: ${r[px]>=r[py]?px:py}` };
}

// Layout for tree: given parent array, compute node positions
function computeLayout(parent) {
  const roots = [...new Set(parent.filter((_,i)=>parent[i]===i))];
  const layout = {};
  let baseX = 60;
  roots.forEach(root => {
    // find all in this component
    const members = [];
    function collect(node) {
      members.push(node);
      for(let i=0;i<N;i++) if(parent[i]===node && i!==node) collect(i);
    }
    collect(root);
    // level-based layout
    function placeNode(node, x, y) {
      layout[node] = { x, y };
      const children = [];
      for(let i=0;i<N;i++) if(parent[i]===node && i!==node) children.push(i);
      const w = 44;
      const startX = x - ((children.length-1)*w)/2;
      children.forEach((c,ci) => placeNode(c, startX+ci*w, y+60));
    }
    placeNode(root, baseX + members.length*22, 60);
    baseX += members.length * 44 + 30;
  });
  return layout;
}

export default function UnionFindVisualizer() {
  const [uf, setUf] = useState(initUF());
  const [findPath, setFindPath] = useState([]);
  const [explanation, setExplanation] = useState('Enter two node IDs to Union, or one to Find.');
  const [status, setStatus] = useState('default');
  const [activeLine, setActiveLine] = useState(-1);
  const [inputX, setInputX] = useState('');
  const [inputY, setInputY] = useState('');
  const [highlightRoot, setHighlightRoot] = useState(null);

  const layout = computeLayout(uf.parent);

  const doUnion = () => {
    const x = parseInt(inputX), y = parseInt(inputY);
    if (isNaN(x)||isNaN(y)||x<0||x>=N||y<0||y>=N) {
      setExplanation('Enter valid node IDs (0–7)');
      setStatus('error');
      return;
    }
    const { root: px } = find(uf.parent, x);
    const { root: py } = find(uf.parent, y);
    const result = union(uf.parent, uf.rank, x, y);
    setUf({ parent: result.parent, rank: result.rank });
    setFindPath([]);
    setHighlightRoot(null);
    setInputX('');
    setInputY('');

    if (px === py) {
      setExplanation(`Union(${x}, ${y}). root(${x})=${px}, root(${y})=${py}. px == py, so they are already in the same set. No change.`);
      setStatus('mismatch');
      setActiveLine(20);
    } else {
      setExplanation(`Union(${x}, ${y}). root(${x})=${px}, root(${y})=${py}. roots are different, merging sets (connecting root ${py} under root ${px}).`);
      setStatus('found');
      setActiveLine(22);
    }
  };

  const doFind = () => {
    const x = parseInt(inputX);
    if (isNaN(x)||x<0||x>=N) {
      setExplanation('Enter valid node ID (0–7)');
      setStatus('error');
      return;
    }
    const { root, path } = find(uf.parent, x);
    // path compress
    const newParent = compress([...uf.parent], path, root);
    setUf(prev => ({ ...prev, parent: newParent }));
    setFindPath(path);
    setHighlightRoot(root);
    setExplanation(`Finding root of ${x}. Path traversed: [${path.join(' → ')}]. Root = ${root}. Applying path compression to point all nodes directly to root.`);
    setStatus('found');
    setActiveLine(14);
    setInputX('');
  };

  const reset = () => {
    setUf(initUF());
    setFindPath([]);
    setHighlightRoot(null);
    setExplanation('Reset. All nodes are separate disjoint sets.');
    setStatus('info');
    setActiveLine(-1);
    setInputX('');
    setInputY('');
  };

  const SVG_W = 700, SVG_H = 240;
  const COLORS = ['#00f0ff','#7b5cff','#1d9e75','#ef9f27','#ff2d78','#378ADD','#e86af3','#f8d748'];

  function rootOf(id) {
    let cur = id;
    while (uf.parent[cur] !== cur) cur = uf.parent[cur];
    return cur;
  }

  function nodeColor(id) {
    if (findPath.includes(id)) return '#ef9f27';
    if (highlightRoot === id) return '#1d9e75';
    return COLORS[rootOf(id)];
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Union-Find (Disjoint Set Union)?"
        description="Union-Find (DSU) tracks elements partitioned into disjoint sets. Union merges two sets, while Find identifies which set an element belongs to. Path compression flattens the tree during Find, and Union-by-Rank keeps trees shallow, achieving near O(1) amortized operations."
        timeComplexity="O(α(N)) ≈ O(1)"
        spaceComplexity="O(N)"
      />

      {/* Parent array */}
      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:10, padding:'12px 16px' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', letterSpacing:1, marginBottom:8 }}>PARENT ARRAY</div>
        <div style={{ display:'flex', gap:0 }}>
          {uf.parent.map((p, i) => {
            const isRoot = p === i;
            const color = COLORS[rootOf(i)];
            return (
              <div key={i} style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#2a3a4a', marginBottom:2 }}>idx[{i}]</div>
                <div style={{ height:44, display:'flex', alignItems:'center', justifyContent:'center', background:isRoot?color+'22':'rgba(10,15,30,0.8)', border:`2px solid ${color}${isRoot?'':'44'}`, borderRadius:6, margin:'0 2px', transition:'all 0.3s ease' }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15, fontWeight:700, color:isRoot?color:color+'aa' }}>{p}</span>
                </div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, color:'#2a3a4a', marginTop:2 }}>r={uf.rank[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tree SVG */}
      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', letterSpacing:1, padding:'10px 16px 0' }}>FOREST VIEW</div>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display:'block' }}>
          {uf.parent.map((p, i) => {
            if (p === i) return null;
            const from = layout[i], to = layout[p];
            if (!from || !to) return null;
            return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="rgba(0,240,255,0.2)" strokeWidth={1.5} />;
          })}
          {Array.from({length:N},(_,i)=>{
            const pos = layout[i];
            if (!pos) return null;
            const color = nodeColor(i);
            const isRoot = uf.parent[i] === i;
            const isInPath = findPath.includes(i);
            return (
              <g key={i}>
                {isRoot && <circle cx={pos.x} cy={pos.y} r={26} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />}
                <circle cx={pos.x} cy={pos.y} r={20}
                  fill={color+'22'} stroke={color} strokeWidth={isInPath?2.5:1.5}
                  style={{ transition:'all 0.4s ease' }} />
                <text x={pos.x} y={pos.y+5} textAnchor="middle" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700, fill:color, transition:'fill 0.4s ease' }}>{i}</text>
                {isRoot && <text x={pos.x} y={pos.y-28} textAnchor="middle" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, fill:color, opacity:0.7 }}>root</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <StepExplanation
        explanation={explanation}
        status={status}
      />

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <input type="number" value={inputX} onChange={e=>setInputX(e.target.value)} placeholder="X" style={inputStyle} />
        <input type="number" value={inputY} onChange={e=>setInputY(e.target.value)} placeholder="Y" style={inputStyle} />
        <button onClick={doUnion} style={btn('#7b5cff')}>Union(X,Y)</button>
        <button onClick={doFind} style={btn('#ef9f27')}>Find(X)</button>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#ef9f27','Find path (compression)'],['#1d9e75','Root after Find']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:c+'44', border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>{l}</span>
          </div>
        ))}
        <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>Each color = one connected component</span>
      </div>
      <CodePanel code={CODE} activeLine={activeLine} />
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid ${color}30`, background:`${color}10`, color, fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
const inputStyle = { background:'rgba(0,240,255,0.04)', border:'1px solid rgba(0,240,255,0.2)', borderRadius:8, padding:'7px 12px', color:'#e8f4ff', fontFamily:'JetBrains Mono,monospace', fontSize:13, outline:'none', width:70 };
