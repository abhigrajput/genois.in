'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `struct TreeNode {
  int val;
  TreeNode *left, *right;
  TreeNode(int x):val(x),left(nullptr),right(nullptr){}
};

// BST Insert
TreeNode* insert(TreeNode* root, int val) {
  if(!root) return new TreeNode(val);
  if(val < root->val)
    root->left = insert(root->left, val);
  else if(val > root->val)
    root->right = insert(root->right, val);
  return root;
}

// BST Search
bool search(TreeNode* root, int val) {
  if(!root) return false;
  if(root->val == val) return true;
  if(val < root->val) return search(root->left, val);
  return search(root->right, val);
}`;

const SPEEDS = { 1: 1000, 2: 600, 3: 250, 4: 100 };

// BST node structure: flat array with {id, val, parentId, side}
function bstInsert(nodes, val) {
  if (nodes.length === 0) return { nodes: [{ id: 0, val, parentId: -1, side: null }], path: [0] };
  const n = nodes.map(x => ({ ...x }));
  const path = [];
  let cur = 0;
  while (true) {
    path.push(cur);
    if (val < n[cur].val) {
      const lc = n.find(x => x.parentId === cur && x.side === 'left');
      if (!lc) {
        n.push({ id: n.length, val, parentId: cur, side: 'left' });
        path.push(n.length - 1);
        break;
      }
      cur = lc.id;
    } else if (val > n[cur].val) {
      const rc = n.find(x => x.parentId === cur && x.side === 'right');
      if (!rc) {
        n.push({ id: n.length, val, parentId: cur, side: 'right' });
        path.push(n.length - 1);
        break;
      }
      cur = rc.id;
    } else break; // duplicate
  }
  return { nodes: n, path };
}

function bstSearch(nodes, val) {
  if (nodes.length === 0) return { path: [], found: false };
  const path = [];
  let cur = 0;
  while (cur !== undefined && cur !== null) {
    const node = nodes.find(n => n.id === cur);
    if (!node) break;
    path.push(cur);
    if (node.val === val) return { path, found: true };
    if (val < node.val) {
      const lc = nodes.find(n => n.parentId === cur && n.side === 'left');
      cur = lc?.id;
    } else {
      const rc = nodes.find(n => n.parentId === cur && n.side === 'right');
      cur = rc?.id;
    }
  }
  return { path, found: false };
}

function layoutBST(nodes) {
  if (!nodes.length) return [];
  const laid = nodes.map(n => ({ ...n, x: 0, y: 0 }));
  function setPos(id, x, y, spread) {
    const idx = laid.findIndex(n => n.id === id);
    if (idx < 0) return;
    laid[idx].x = x; laid[idx].y = y;
    const lc = nodes.find(n => n.parentId === id && n.side === 'left');
    const rc = nodes.find(n => n.parentId === id && n.side === 'right');
    if (lc) setPos(lc.id, x - spread, y + 70, spread / 2);
    if (rc) setPos(rc.id, x + spread, y + 70, spread / 2);
  }
  setPos(0, 400, 60, 160);
  return laid;
}

export default function BSTVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [insertPath, setInsertPath] = useState([]);
  const [searchPath, setSearchPath] = useState([]);
  const [searchFound, setSearchFound] = useState(null);
  const [highlightStep, setHighlightStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [message, setMessage] = useState('Insert values to build a BST.');
  const [inputVal, setInputVal] = useState('');
  const [mode, setMode] = useState('insert'); // 'insert' | 'search'
  const [actionVal, setActionVal] = useState(null);
  const intervalRef = useRef(null);

  const laidOut = layoutBST(nodes);
  const edges = nodes.filter(n => n.parentId >= 0);

  const activePath = mode === 'search' ? searchPath : insertPath;

  useEffect(() => {
    if (isPlaying && activePath.length > 0) {
      intervalRef.current = setInterval(() => {
        setHighlightStep(prev => {
          const next = prev + 1;
          if (next >= activePath.length) { setIsPlaying(false); return prev; }
          return next;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, activePath]);

  const doInsert = () => {
    const v = parseInt(inputVal) || Math.floor(Math.random() * 90) + 10;
    const { nodes: n, path } = bstInsert(nodes, v);
    setNodes(n); setInsertPath(path); setSearchPath([]); setSearchFound(null);
    setHighlightStep(0); setIsPlaying(true); setMode('insert'); setActionVal(v);
    setMessage(`Inserting ${v}: comparing ${path.map(i => n[i]?.val).join(' → ')}`);
    setInputVal('');
  };

  const doSearch = () => {
    const v = parseInt(inputVal);
    if (isNaN(v)) { setMessage('Enter a value to search!'); return; }
    const { path, found } = bstSearch(nodes, v);
    setSearchPath(path); setInsertPath([]); setSearchFound(found);
    setHighlightStep(0); setIsPlaying(true); setMode('search'); setActionVal(v);
    setMessage(`Searching ${v}: ${found ? 'Found!' : 'Not found'}`);
    setInputVal('');
  };

  const reset = () => {
    setNodes([]); setInsertPath([]); setSearchPath([]); setSearchFound(null);
    setHighlightStep(-1); setIsPlaying(false); setActionVal(null);
    setMessage('Insert values to build a BST.'); clearInterval(intervalRef.current);
  };

  let currentExplanation = 'Insert values to build a BST, then try searching.';
  let currentStatus = 'default';
  let activeLine = -1;

  if (highlightStep >= 0 && highlightStep < activePath.length) {
    const currNodeId = activePath[highlightStep];
    const currNode = nodes.find(n => n.id === currNodeId);
    const isLastStep = highlightStep === activePath.length - 1;

    if (mode === 'insert') {
      if (isLastStep) {
        currentExplanation = `Reached empty child! Creating new TreeNode(${actionVal}) and attaching it.`;
        currentStatus = 'found';
        activeLine = 8;
      } else {
        if (actionVal < currNode.val) {
          currentExplanation = `val (${actionVal}) < root->val (${currNode.val}). Recursing LEFT into left subtree.`;
          currentStatus = 'compare';
          activeLine = 9;
        } else {
          currentExplanation = `val (${actionVal}) > root->val (${currNode.val}). Recursing RIGHT into right subtree.`;
          currentStatus = 'compare';
          activeLine = 11;
        }
      }
    } else if (mode === 'search') {
      if (isLastStep) {
        if (searchFound) {
          currentExplanation = `Found it! root->val (${currNode.val}) matches search target ${actionVal}.`;
          currentStatus = 'found';
          activeLine = 24;
        } else {
          currentExplanation = `Checking node ${currNode.val}. Target ${actionVal} is not equal, and child is nullptr. Search failed!`;
          currentStatus = 'mismatch';
          activeLine = 23;
        }
      } else {
        if (actionVal < currNode.val) {
          currentExplanation = `Target ${actionVal} < root->val (${currNode.val}). Recursing LEFT.`;
          currentStatus = 'compare';
          activeLine = 25;
        } else {
          currentExplanation = `Target ${actionVal} > root->val (${currNode.val}). Recursing RIGHT.`;
          currentStatus = 'compare';
          activeLine = 26;
        }
      }
    }
  }

  function nodeColor(id) {
    const stepNode = activePath[highlightStep];
    const isLastStep = highlightStep === activePath.length - 1;
    if (mode === 'search') {
      if (isLastStep && id === stepNode) return searchFound ? '#1d9e75' : '#ff2d78';
      if (activePath.indexOf(id) <= highlightStep && activePath.indexOf(id) >= 0) return '#ef9f27';
      return '#1a2a3a';
    }
    if (activePath.indexOf(id) < highlightStep && activePath.indexOf(id) >= 0) return '#ef9f27';
    if (isLastStep && id === stepNode) return '#1d9e75';
    if (id === stepNode) return '#ef9f27';
    return '#1a2a3a';
  }

  const SVG_W = 800, SVG_H = 320;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is a Binary Search Tree?"
        description="A BST is a binary tree where each node's left subtree contains only smaller values, and right subtree contains only larger values. This property allows O(log n) search, insert, and delete on balanced trees. Inorder traversal of a BST gives sorted output."
        timeComplexity="O(log n) avg, O(n) worst"
        spaceComplexity="O(h) stack"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Nodes', value: nodes.length, color: '#00f0ff' },
          { label: 'Mode', value: mode.toUpperCase(), color: '#ef9f27' },
          { label: 'Comparisons', value: Math.max(0, highlightStep), color: '#ff6b4a' },
          { label: 'Result', value: searchFound === null ? '—' : searchFound ? 'Found' : 'Not Found', color: searchFound ? '#1d9e75' : searchFound === false ? '#ff2d78' : '#5a7a9a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
          {edges.map((e, i) => {
            const p = laidOut.find(n => n.id === e.parentId);
            const c = laidOut.find(n => n.id === e.id);
            return p && c ? (
              <line key={i} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="rgba(0,240,255,0.2)" strokeWidth={1.5} />
            ) : null;
          })}
          {laidOut.map(n => {
            const color = nodeColor(n.id);
            const isActive = activePath[highlightStep] === n.id;
            return (
              <g key={n.id}>
                {isActive && <circle cx={n.x} cy={n.y} r={26} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />}
                <circle cx={n.x} cy={n.y} r={20} fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'} stroke={color} strokeWidth={isActive ? 2.5 : 1.5} style={{ transition: 'all 0.3s ease' }} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: color, transition: 'fill 0.3s ease' }}>{n.val}</text>
              </g>
            );
          })}
          {nodes.length === 0 && (
            <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fill: '#2a3a4a' }}>Insert values to build a BST</text>
          )}
        </svg>
      </div>

      <StepExplanation
        stepNumber={highlightStep >= 0 ? highlightStep + 1 : null}
        totalSteps={activePath.length > 0 ? activePath.length : null}
        explanation={currentExplanation}
        status={currentStatus}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && doInsert()}
          placeholder="Value..." style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, padding: '7px 12px', color: '#e8e8ed', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', width: 100 }} />
        <button onClick={doInsert} style={btn('#00f0ff')}>Insert</button>
        <button onClick={doSearch} style={btn('#ff6b4a')}>Search</button>
        <button onClick={() => setIsPlaying(p => !p)} style={btn('#ef9f27')}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>SPEED</span>
          {[1, 2, 3, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid #00f0ff' : '1px solid rgba(0,240,255,0.15)', background: speed === s ? 'rgba(0,240,255,0.12)' : 'transparent', color: speed === s ? '#00f0ff' : '#5a7a9a', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#1a2a3a', 'Default'], ['#ef9f27', 'Comparing'], ['#1d9e75', 'Inserted/Found'], ['#ff2d78', 'Not Found']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c + '44', border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} activeLine={activeLine} />
    </div>
  );
}

function btn(color) {
  return { padding: '8px 16px', borderRadius: 8, border: `1px solid ${color}30`, background: `${color}10`, color, fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };
}
