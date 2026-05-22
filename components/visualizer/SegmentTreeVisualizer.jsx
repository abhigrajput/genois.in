'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';

const CODE = `void build(int node, int start, int end) {
  if (start == end) {
    tree[node] = arr[start];
    return;
  }
  int mid = (start + end) / 2;
  build(2 * node, start, mid);
  build(2 * node + 1, mid + 1, end);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}

int query(int node, int start, int end, int l, int r) {
  if (r < start || end < l) return 0; // Out of range
  if (l <= start && end <= r) return tree[node]; // Completely inside
  int mid = (start + end) / 2;
  return query(2 * node, start, mid, l, r) + 
         query(2 * node + 1, mid + 1, end, l, r);
}

void update(int node, int start, int end, int idx, int val) {
  if (start == end) {
    tree[node] = val;
    return;
  }
  int mid = (start + end) / 2;
  if (start <= idx && idx <= mid)
    update(2 * node, start, mid, idx, val);
  else
    update(2 * node + 1, mid + 1, end, idx, val);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
}`;

const SPEEDS = { 1: 1400, 2: 800, 3: 350, 4: 120 };

// Fixed layout coordinates for a full segment tree of array size 8 (15 nodes total)
const NODE_LAYOUT = {
  1:  { x: 320, y: 35,  l: 0, r: 7 }, // Root
  2:  { x: 160, y: 90,  l: 0, r: 3 },
  3:  { x: 480, y: 90,  l: 4, r: 7 },
  4:  { x: 80,  y: 145, l: 0, r: 1 },
  5:  { x: 240, y: 145, l: 2, r: 3 },
  6:  { x: 400, y: 145, l: 4, r: 5 },
  7:  { x: 560, y: 145, l: 6, r: 7 },
  8:  { x: 40,  y: 200, l: 0, r: 0 },
  9:  { x: 120, y: 200, l: 1, r: 1 },
  10: { x: 200, y: 200, l: 2, r: 2 },
  11: { x: 280, y: 200, l: 3, r: 3 },
  12: { x: 360, y: 200, l: 4, r: 4 },
  13: { x: 440, y: 200, l: 5, r: 5 },
  14: { x: 520, y: 200, l: 6, r: 6 },
  15: { x: 600, y: 200, l: 7, r: 7 },
};

const EDGES = [
  { from: 1, to: 2 }, { from: 1, to: 3 },
  { from: 2, to: 4 }, { from: 2, to: 5 },
  { from: 3, to: 6 }, { from: 3, to: 7 },
  { from: 4, to: 8 }, { from: 4, to: 9 },
  { from: 5, to: 10 }, { from: 5, to: 11 },
  { from: 6, to: 12 }, { from: 6, to: 13 },
  { from: 7, to: 14 }, { from: 7, to: 15 },
];

export default function SegmentTreeVisualizer() {
  const [arr, setArr] = useState([4, 2, 9, 3, 5, 8, 1, 7]);
  const [treeVals, setTreeVals] = useState({});
  const [queryL, setQueryL] = useState(1);
  const [queryR, setQueryR] = useState(5);
  const [updateIdx, setUpdateIdx] = useState(3);
  const [updateVal, setUpdateVal] = useState(12);

  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  // Rebuild the segment tree values locally
  const buildTreeVals = useCallback((currentArr) => {
    const vals = {};
    function build(node, start, end) {
      if (start === end) {
        vals[node] = currentArr[start];
        return currentArr[start];
      }
      const mid = Math.floor((start + end) / 2);
      const lSum = build(2 * node, start, mid);
      const rSum = build(2 * node + 1, mid + 1, end);
      vals[node] = lSum + rSum;
      return vals[node];
    }
    build(1, 0, 7);
    setTreeVals(vals);
  }, []);

  useEffect(() => {
    buildTreeVals(arr);
  }, [arr, buildTreeVals]);

  // Compute animation steps for Query Range
  const startQuerySimulation = () => {
    setIsPlaying(false);
    const tempSteps = [];
    const visited = {}; // node -> status (inside/partial/outside)
    let totalSum = 0;

    tempSteps.push({
      visited: {},
      sum: 0,
      currNode: null,
      codeLine: 10,
      description: `Starting range query for [${queryL}, ${queryR}]...`,
    });

    function runQuery(node, start, end) {
      // Out of bounds
      if (queryR < start || end < queryL) {
        visited[node] = 'outside';
        tempSteps.push({
          visited: { ...visited },
          sum: totalSum,
          currNode: node,
          codeLine: 11,
          description: `Node [${start}-${end}] is completely outside query range [${queryL}, ${queryR}]. Skip.`,
        });
        return;
      }

      // Completely inside
      if (queryL <= start && end <= queryR) {
        visited[node] = 'inside';
        totalSum += treeVals[node];
        tempSteps.push({
          visited: { ...visited },
          sum: totalSum,
          currNode: node,
          codeLine: 12,
          description: `Node [${start}-${end}] is completely inside query range. Adding node value ${treeVals[node]}. Current Sum = ${totalSum}.`,
        });
        return;
      }

      // Partially inside
      visited[node] = 'partial';
      tempSteps.push({
        visited: { ...visited },
        currNode: node,
        sum: totalSum,
        codeLine: 14,
        description: `Node [${start}-${end}] partially overlaps. Split query into left and right children.`,
      });

      const mid = Math.floor((start + end) / 2);
      runQuery(2 * node, start, mid);
      runQuery(2 * node + 1, mid + 1, end);
    }

    runQuery(1, 0, 7);

    tempSteps.push({
      visited: { ...visited },
      sum: totalSum,
      currNode: null,
      codeLine: 15,
      description: `Range Query complete! Total sum in range [${queryL}, ${queryR}] is ${totalSum}.`,
    });

    setSteps(tempSteps);
    setStepIdx(0);
  };

  // Compute animation steps for Point Update
  const startUpdateSimulation = () => {
    setIsPlaying(false);
    const tempSteps = [];
    const currentTree = { ...treeVals };
    const activePath = [];

    tempSteps.push({
      treeVals: { ...currentTree },
      activePath: [],
      currNode: null,
      codeLine: 18,
      description: `Starting point update: arr[${updateIdx}] = ${updateVal}`,
    });

    // We trace down to find the leaf first, then propagate up
    const pathNodes = [];
    function findPath(node, start, end) {
      pathNodes.push(node);
      if (start === end) return;
      const mid = Math.floor((start + end) / 2);
      if (updateIdx <= mid) findPath(2 * node, start, mid);
      else findPath(2 * node + 1, mid + 1, end);
    }
    findPath(1, 0, 7);

    // Phase 1: Descend down path
    for (let i = 0; i < pathNodes.length; i++) {
      const node = pathNodes[i];
      const isLeaf = i === pathNodes.length - 1;
      
      tempSteps.push({
        treeVals: { ...currentTree },
        activePath: pathNodes.slice(0, i + 1),
        currNode: node,
        codeLine: isLeaf ? 20 : 25,
        description: isLeaf
          ? `Reached leaf node [${updateIdx}-${updateIdx}]. Updating value from ${currentTree[node]} to ${updateVal}.`
          : `Traversing down tree to locate index ${updateIdx}. Currently visiting node [${NODE_LAYOUT[node].l}-${NODE_LAYOUT[node].r}].`,
      });

      if (isLeaf) {
        currentTree[node] = updateVal;
      }
    }

    // Phase 2: Ascend and recalculate sum going back up
    for (let i = pathNodes.length - 2; i >= 0; i--) {
      const node = pathNodes[i];
      const leftChild = 2 * node;
      const rightChild = 2 * node + 1;
      const prevVal = currentTree[node];
      currentTree[node] = currentTree[leftChild] + currentTree[rightChild];

      tempSteps.push({
        treeVals: { ...currentTree },
        activePath: pathNodes.slice(0, i + 1),
        currNode: node,
        codeLine: 28,
        description: `Recalculating node [${NODE_LAYOUT[node].l}-${NODE_LAYOUT[node].r}]: left (${currentTree[leftChild]}) + right (${currentTree[rightChild]}) = ${currentTree[node]}. (Was ${prevVal})`,
      });
    }

    // Done Step
    tempSteps.push({
      treeVals: { ...currentTree },
      activePath: [],
      currNode: null,
      codeLine: -1,
      description: `Update complete! Tree root updated to ${currentTree[1]}.`,
    });

    setSteps(tempSteps);
    setStepIdx(0);
    
    // Apply changes to state so they persist in next queries
    const nextArr = [...arr];
    nextArr[updateIdx] = updateVal;
    setArr(nextArr);
  };

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
    visited: {},
    activePath: [],
    currNode: null,
    sum: 0,
    treeVals: treeVals,
    codeLine: -1,
    description: 'Use the Query or Update controls below to start segment tree visualization.',
  };

  const getRenderedTreeVal = (node) => {
    if (current.treeVals) return current.treeVals[node] ?? 0;
    return treeVals[node] ?? 0;
  };

  const getNodeColor = (node) => {
    const isCurrent = current.currNode === node;
    const isPath = current.activePath?.includes(node);

    if (isCurrent) return '#00f0ff'; // glowing cyan
    if (isPath) return '#00f0ff88';

    if (current.visited) {
      const status = current.visited[node];
      if (status === 'inside') return '#1d9e75';
      if (status === 'partial') return '#ef9f27';
      if (status === 'outside') return '#ff2d7840';
    }

    return '#2a3a4a';
  };

  const getEdgeColor = (from, to) => {
    const isFromHl = getNodeColor(from) === '#00f0ff' || current.activePath?.includes(from);
    const isToHl = getNodeColor(to) === '#00f0ff' || current.activePath?.includes(to);

    if (isFromHl && isToHl) {
      return current.activePath ? '#00f0ff' : '#ef9f27';
    }

    if (current.visited && current.visited[from] && current.visited[to]) {
      const parentStat = current.visited[from];
      const childStat = current.visited[to];
      if (parentStat === 'inside' || childStat === 'inside') return '#1d9e75';
      if (parentStat === 'partial' && childStat === 'partial') return '#ef9f27';
    }

    return 'rgba(0, 240, 255, 0.12)';
  };

  const randomize = () => {
    const next = Array.from({ length: 8 }, () => Math.floor(Math.random() * 20) + 1);
    setArr(next);
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top statistic panel */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Range Sum', value: treeVals[1] ?? '—', color: '#1d9e75' },
          { label: 'Leaf Nodes', value: 8, color: '#00f0ff' },
          { label: 'Total Segment Nodes', value: 15, color: '#7b5cff' },
          { label: 'Query Result', value: current.sum ?? '—', color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description output */}
      <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Leaf Array Box Representation */}
        <div style={{ width: '100%', background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 12 }}>UNDERLYING LEAF ARRAY (arr[])</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {arr.map((val, idx) => {
              const isActive = current.activePath?.includes(idx + 8); // Nodes 8 to 15 are index 0 to 7
              const isQuery = current.visited && current.visited[idx + 8] === 'inside';
              const color = isActive ? '#00f0ff' : isQuery ? '#1d9e75' : 'rgba(0,240,255,0.15)';
              return (
                <div key={idx} style={{
                  flex: 1, maxWidth: 60, height: 48, borderRadius: 6,
                  border: `2px solid ${color}`,
                  background: isActive ? 'rgba(0,240,255,0.06)' : isQuery ? 'rgba(29,158,117,0.06)' : 'rgba(10,15,30,0.6)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: '#5a7a9a' }}>idx={idx}</span>
                  <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono,monospace', color: isActive ? '#00f0ff' : '#e8f4ff', fontWeight: 'bold' }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SVG Segment Tree */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <svg width="640" height="240" style={{ display: 'block' }}>
            {/* Draw Links */}
            {EDGES.map((edge, i) => {
              const fromLayout = NODE_LAYOUT[edge.from];
              const toLayout = NODE_LAYOUT[edge.to];
              const stroke = getEdgeColor(edge.from, edge.to);
              return (
                <line key={i}
                  x1={fromLayout.x} y1={fromLayout.y}
                  x2={toLayout.x} y2={toLayout.y}
                  stroke={stroke}
                  strokeWidth={stroke !== 'rgba(0, 240, 255, 0.12)' ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s' }}
                />
              );
            })}

            {/* Draw Nodes */}
            {Object.entries(NODE_LAYOUT).map(([idStr, layout]) => {
              const id = parseInt(idStr);
              const val = getRenderedTreeVal(id);
              const nodeColor = getNodeColor(id);
              const isHl = nodeColor === '#00f0ff';
              const textCol = isHl ? '#0d1424' : '#e8f4ff';
              const fillVal = isHl ? '#00f0ff' : 'rgba(13,20,36,0.9)';

              return (
                <g key={id}>
                  {isHl && <circle cx={layout.x} cy={layout.y} r={22} fill="none" stroke="#00f0ff" strokeWidth={1.5} opacity={0.4} />}
                  <circle cx={layout.x} cy={layout.y} r={18} fill={fillVal} stroke={nodeColor} strokeWidth={2} style={{ transition: 'all 0.3s' }} />
                  <text x={layout.x} y={layout.y + 4} textAnchor="middle" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fill: textCol, fontWeight: 'bold', transition: 'all 0.3s' }}>
                    {val}
                  </text>
                  {/* Range Tag above node */}
                  <text x={layout.x} y={layout.y - 22} textAnchor="middle" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, fill: '#5a7a9a' }}>
                    [{layout.l}-{layout.r}]
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16 }}>
        {/* Query Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderRight: '1px solid rgba(0,240,255,0.1)', paddingRight: 16, flexWrap: 'wrap' }}>
          <span style={labelStyle}>Query Range:</span>
          <input type="number" min={0} max={7} value={queryL} onChange={e => setQueryL(Math.min(7, Math.max(0, parseInt(e.target.value) || 0)))} style={numStyle} />
          <span style={{ color: '#5a7a9a' }}>to</span>
          <input type="number" min={0} max={7} value={queryR} onChange={e => setQueryR(Math.min(7, Math.max(queryL, parseInt(e.target.value) || 0)))} style={numStyle} />
          <button onClick={startQuerySimulation} style={btnStyle('#1d9e75')}>🔍 Query Sum</button>
        </div>

        {/* Update Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={labelStyle}>Update Point:</span>
          <span style={{ color: '#5a7a9a' }}>Index</span>
          <input type="number" min={0} max={7} value={updateIdx} onChange={e => setUpdateIdx(Math.min(7, Math.max(0, parseInt(e.target.value) || 0)))} style={numStyle} />
          <span style={{ color: '#5a7a9a' }}>Value</span>
          <input type="number" min={0} max={100} value={updateVal} onChange={e => setUpdateVal(parseInt(e.target.value) || 0)} style={numStyle} />
          <button onClick={startUpdateSimulation} style={btnStyle('#00f0ff')}>✏️ Update</button>
        </div>

        <button onClick={randomize} style={{ ...btnStyle('#ef9f27'), marginLeft: 'auto' }}>🎲 Randomize</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#00f0ff', label: 'Currently visited node / Path of update' },
          { color: '#1d9e75', label: 'Completely inside query range (matched segment)' },
          { color: '#ef9f27', label: 'Partially overlaps query range (sub-divided segment)' },
          { color: '#ff2d7840', label: 'Completely outside query range (ignored node)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color === '#ff2d7840' ? 'rgba(255,45,120,0.06)' : l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'Outfit,sans-serif' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Playback step bar */}
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

const numStyle = {
  width: 44,
  background: 'rgba(0,240,255,0.04)',
  border: '1px solid rgba(0,240,255,0.2)',
  borderRadius: 6,
  padding: '5px',
  color: '#e8f4ff',
  textAlign: 'center',
  fontFamily: 'JetBrains Mono,monospace',
  fontSize: 12,
  outline: 'none',
};

const labelStyle = {
  fontFamily: 'JetBrains Mono,monospace',
  fontSize: 10,
  color: '#5a7a9a',
  letterSpacing: 1,
  textTransform: 'uppercase',
};

const btnStyle = (c) => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: `1px solid ${c}30`,
  background: `${c}12`,
  color: c,
  fontFamily: 'Syne,sans-serif',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
});
