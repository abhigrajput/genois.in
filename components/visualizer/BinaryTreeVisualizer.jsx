'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `struct TreeNode {
  int val;
  TreeNode *left, *right;
  TreeNode(int x): val(x),left(nullptr),right(nullptr){}
};

// Insert (level-order / complete binary tree)
void insert(TreeNode*& root, int val) {
  TreeNode* node = new TreeNode(val);
  if(!root){ root=node; return; }
  queue<TreeNode*> q;
  q.push(root);
  while(!q.empty()){
    TreeNode* cur = q.front(); q.pop();
    if(!cur->left){ cur->left=node; return; }
    else q.push(cur->left);
    if(!cur->right){ cur->right=node; return; }
    else q.push(cur->right);
  }
}`;

const SNIPPETS = {
  python: `from collections import deque

class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

# Insert (level-order / complete binary tree)
def insert(root, val):
    node = TreeNode(val)
    if not root:
        return node
    q = deque([root])
    while q:
        cur = q.popleft()
        if not cur.left:
            cur.left = node
            return root
        q.append(cur.left)
        if not cur.right:
            cur.right = node
            return root
        q.append(cur.right)`,
  java: `class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int x) { val = x; }
}

// Insert (level-order / complete binary tree)
TreeNode insert(TreeNode root, int val) {
  TreeNode node = new TreeNode(val);
  if (root == null) return node;
  Queue<TreeNode> q = new LinkedList<>();
  q.offer(root);
  while (!q.isEmpty()) {
    TreeNode cur = q.poll();
    if (cur.left == null) { cur.left = node; return root; }
    q.offer(cur.left);
    if (cur.right == null) { cur.right = node; return root; }
    q.offer(cur.right);
  }
  return root;
}`,
  javascript: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Insert (level-order / complete binary tree)
function insert(root, val) {
  const node = new TreeNode(val);
  if (!root) return node;
  const q = [root];
  while (q.length) {
    const cur = q.shift();
    if (!cur.left) { cur.left = node; return root; }
    q.push(cur.left);
    if (!cur.right) { cur.right = node; return root; }
    q.push(cur.right);
  }
  return root;
}`,
};

const SPEEDS = { 1: 1000, 2: 600, 3: 250, 4: 100 };

// --- Tree node helpers ---
function insertNode(nodes, edges, val) {
  if (nodes.length === 0) {
    return { nodes: [{ id: 0, val, x: 400, y: 60 }], edges: [] };
  }
  const newNodes = [...nodes];
  const newEdges = [...edges];
  // BFS insert (complete binary tree)
  const queue = [0];
  while (queue.length) {
    const idx = queue.shift();
    const leftChild = newEdges.find(e => e.parent === idx && e.side === 'left');
    const rightChild = newEdges.find(e => e.parent === idx && e.side === 'right');
    if (!leftChild) {
      const parent = newNodes[idx];
      const newId = newNodes.length;
      const depth = getDepth(idx, newEdges);
      const x = parent.x - 120 / (depth + 1);
      const y = parent.y + 70;
      newNodes.push({ id: newId, val, x, y });
      newEdges.push({ parent: idx, child: newId, side: 'left' });
      return { nodes: newNodes, edges: newEdges };
    } else {
      queue.push(leftChild.child);
    }
    if (!rightChild) {
      const parent = newNodes[idx];
      const newId = newNodes.length;
      const depth = getDepth(idx, newEdges);
      const x = parent.x + 120 / (depth + 1);
      const y = parent.y + 70;
      newNodes.push({ id: newId, val, x, y });
      newEdges.push({ parent: idx, child: newId, side: 'right' });
      return { nodes: newNodes, edges: newEdges };
    } else {
      queue.push(rightChild.child);
    }
  }
  return { nodes: newNodes, edges: newEdges };
}

function getDepth(idx, edges) {
  let depth = 0, cur = idx;
  while (true) {
    const parent = edges.find(e => e.child === cur);
    if (!parent) break;
    cur = parent.parent;
    depth++;
  }
  return depth;
}

// Layout: recompute x positions after each insert for clean tree
function layoutTree(nodes, edges) {
  if (!nodes.length) return nodes;
  const laid = nodes.map(n => ({ ...n }));
  function setPos(idx, x, y, spread) {
    laid[idx].x = x;
    laid[idx].y = y;
    const lc = edges.find(e => e.parent === idx && e.side === 'left');
    const rc = edges.find(e => e.parent === idx && e.side === 'right');
    if (lc) setPos(lc.child, x - spread, y + 70, spread / 2);
    if (rc) setPos(rc.child, x + spread, y + 70, spread / 2);
  }
  setPos(0, 400, 60, 160);
  return laid;
}

function traverseInorder(nodes, edges, idx = 0, result = []) {
  const lc = edges.find(e => e.parent === idx && e.side === 'left');
  const rc = edges.find(e => e.parent === idx && e.side === 'right');
  if (lc) traverseInorder(nodes, edges, lc.child, result);
  result.push(idx);
  if (rc) traverseInorder(nodes, edges, rc.child, result);
  return result;
}
function traversePreorder(nodes, edges, idx = 0, result = []) {
  result.push(idx);
  const lc = edges.find(e => e.parent === idx && e.side === 'left');
  const rc = edges.find(e => e.parent === idx && e.side === 'right');
  if (lc) traversePreorder(nodes, edges, lc.child, result);
  if (rc) traversePreorder(nodes, edges, rc.child, result);
  return result;
}
function traversePostorder(nodes, edges, idx = 0, result = []) {
  const lc = edges.find(e => e.parent === idx && e.side === 'left');
  const rc = edges.find(e => e.parent === idx && e.side === 'right');
  if (lc) traversePostorder(nodes, edges, lc.child, result);
  if (rc) traversePostorder(nodes, edges, rc.child, result);
  result.push(idx);
  return result;
}

function nodeColor(id, traversalOrder, currentStep, visited) {
  if (traversalOrder.length === 0) return '#1a2a3a';
  if (visited.has(id)) return '#1d9e75';
  if (traversalOrder[currentStep] === id) return '#00f0ff';
  return '#1a2a3a';
}

export default function BinaryTreeVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [traversalOrder, setTraversalOrder] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [traversalType, setTraversalType] = useState('');
  const [visited, setVisited] = useState(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [message, setMessage] = useState('Insert nodes to build a tree, then run a traversal.');
  const [newNodeVal, setNewNodeVal] = useState('');
  const intervalRef = useRef(null);

  const laidOut = layoutTree(nodes, edges);

  // Derive step explanation from traversal state
  const totalSteps = traversalOrder.length;
  const stepNumber = currentStep >= 0 ? currentStep + 1 : 0;
  let stepExplanation = 'Insert nodes to build the tree, then run Inorder, Preorder, or Postorder traversal.';
  let stepStatus = 'default';

  if (traversalOrder.length > 0) {
    if (currentStep >= 0 && currentStep < traversalOrder.length) {
      const currentNodeVal = nodes[traversalOrder[currentStep]]?.val;
      if (traversalType === 'inorder') {
        stepExplanation = `Inorder (Left → Root → Right): Visiting node ${currentNodeVal}. Inorder traversal of a BST yields sorted order.`;
        stepStatus = visited.has(traversalOrder[currentStep]) ? 'sorted' : 'compare';
      } else if (traversalType === 'preorder') {
        stepExplanation = `Preorder (Root → Left → Right): Visiting node ${currentNodeVal}. Used to copy or serialize a tree.`;
        stepStatus = visited.has(traversalOrder[currentStep]) ? 'sorted' : 'compare';
      } else if (traversalType === 'postorder') {
        stepExplanation = `Postorder (Left → Right → Root): Visiting node ${currentNodeVal}. Useful for deleting a tree or evaluating expressions.`;
        stepStatus = visited.has(traversalOrder[currentStep]) ? 'sorted' : 'compare';
      }
    }
    if (!isPlaying && currentStep >= traversalOrder.length - 1 && visited.size === traversalOrder.length) {
      stepExplanation = `Traversal complete! Visited all ${traversalOrder.length} nodes in ${traversalType} order: [${traversalOrder.map(i => nodes[i]?.val).join(' → ')}].`;
      stepStatus = 'sorted';
    }
  }

  const doInsert = (val) => {
    const v = parseInt(val);
    if (isNaN(v)) return;
    const { nodes: n, edges: e } = insertNode(nodes, edges, v);
    setNodes(n); setEdges(e);
    setTraversalOrder([]); setCurrentStep(-1); setVisited(new Set());
    setTraversalType('');
    setMessage(`Inserted ${v}`);
    setNewNodeVal('');
  };

  const startTraversal = (type) => {
    if (nodes.length === 0) { setMessage('Insert nodes first!'); return; }
    clearInterval(intervalRef.current);
    let order;
    if (type === 'inorder') order = traverseInorder(nodes, edges);
    else if (type === 'preorder') order = traversePreorder(nodes, edges);
    else order = traversePostorder(nodes, edges);
    setTraversalOrder(order);
    setCurrentStep(0);
    setVisited(new Set());
    setIsPlaying(true);
    setTraversalType(type);
    setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} traversal: [${order.map(i => nodes[i]?.val).join(' → ')}]`);
  };

  useEffect(() => {
    if (isPlaying && traversalOrder.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= traversalOrder.length) {
            setIsPlaying(false);
            setVisited(new Set(traversalOrder));
            return prev;
          }
          setVisited(v => new Set([...v, traversalOrder[prev]]));
          return next;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, traversalOrder]);

  const reset = () => {
    setNodes([]); setEdges([]); setTraversalOrder([]);
    setCurrentStep(-1); setVisited(new Set()); setIsPlaying(false);
    setTraversalType('');
    setMessage('Insert nodes to build a tree, then run a traversal.');
    clearInterval(intervalRef.current);
  };

  const SVG_W = 800, SVG_H = 320;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is a Binary Tree?"
        description="A Binary Tree is a hierarchical data structure where each node has at most two children (left and right). It is used as the foundation for BSTs, heaps, and expression trees. Tree traversals (Inorder, Preorder, Postorder) visit nodes in different orders for different purposes."
        timeComplexity="O(n) traversal"
        spaceComplexity="O(h) stack"
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Nodes', value: nodes.length, color: '#00f0ff' },
          { label: 'Edges', value: edges.length, color: '#7b5cff' },
          { label: 'Current', value: traversalOrder[currentStep] !== undefined ? nodes[traversalOrder[currentStep]]?.val ?? '-' : '-', color: '#ef9f27' },
          { label: 'Visited', value: visited.size, color: '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 90 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff' }}>
          ▶ {message}
        </div>
      )}

      {/* SVG Tree */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
          {/* Edges */}
          {edges.map((e, i) => {
            const p = laidOut[e.parent], c = laidOut[e.child];
            return (
              <line key={i} x1={p?.x} y1={p?.y} x2={c?.x} y2={c?.y}
                stroke="rgba(0,240,255,0.2)" strokeWidth={1.5} />
            );
          })}
          {/* Nodes */}
          {laidOut.map((n) => {
            const color = nodeColor(n.id, traversalOrder, currentStep, visited);
            const isActive = traversalOrder[currentStep] === n.id;
            return (
              <g key={n.id}>
                {isActive && (
                  <circle cx={n.x} cy={n.y} r={26} fill="none" stroke="#00f0ff" strokeWidth={1} opacity={0.4} />
                )}
                <circle cx={n.x} cy={n.y} r={20}
                  fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text x={n.x} y={n.y + 5} textAnchor="middle"
                  style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 700, fill: color, transition: 'fill 0.3s ease' }}>
                  {n.val}
                </text>
              </g>
            );
          })}
          {nodes.length === 0 && (
            <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" style={{ fontFamily: 'Outfit,sans-serif', fontSize: 14, fill: '#2a3a4a' }}>
              Insert nodes to build the tree
            </text>
          )}
        </svg>
      </div>

      {/* Step Explanation */}
      <StepExplanation
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        explanation={stepExplanation}
        status={stepStatus}
      />

      {/* Traversal result */}
      {traversalOrder.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>ORDER:</span>
          {traversalOrder.map((idx, i) => (
            <span key={i} style={{
              fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 600,
              padding: '2px 10px', borderRadius: 6,
              background: visited.has(idx) ? 'rgba(29,158,117,0.15)' : traversalOrder[currentStep] === idx ? 'rgba(0,240,255,0.15)' : 'rgba(26,42,58,0.6)',
              color: visited.has(idx) ? '#1d9e75' : traversalOrder[currentStep] === idx ? '#00f0ff' : '#5a7a9a',
              border: `1px solid ${visited.has(idx) ? 'rgba(29,158,117,0.3)' : traversalOrder[currentStep] === idx ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)'}`,
              transition: 'all 0.3s ease',
            }}>{nodes[idx]?.val}</span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="number" value={newNodeVal} onChange={e => setNewNodeVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doInsert(newNodeVal)}
          placeholder="Value..." style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, padding: '7px 12px', color: '#e8f4ff', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, outline: 'none', width: 100 }} />
        <button onClick={() => doInsert(newNodeVal || String(Math.floor(Math.random() * 90) + 10))} style={btn('#00f0ff')}>Insert</button>
        <button onClick={() => startTraversal('inorder')} style={btn('#7b5cff')}>Inorder</button>
        <button onClick={() => startTraversal('preorder')} style={btn('#ef9f27')}>Preorder</button>
        <button onClick={() => startTraversal('postorder')} style={btn('#1d9e75')}>Postorder</button>
        <button onClick={() => { setIsPlaying(p => !p); }} style={btn('#00f0ff')}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a' }}>SPEED</span>
          {[1, 2, 3, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid #00f0ff' : '1px solid rgba(0,240,255,0.15)', background: speed === s ? 'rgba(0,240,255,0.12)' : 'transparent', color: speed === s ? '#00f0ff' : '#5a7a9a', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#1a2a3a', 'Unvisited'], ['#00f0ff', 'Current'], ['#1d9e75', 'Visited']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c + '44', border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'Outfit,sans-serif' }}>{l}</span>
          </div>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} />
    </div>
  );
}

function btn(color) {
  return { padding: '8px 16px', borderRadius: 8, border: `1px solid ${color}30`, background: `${color}10`, color, fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };
}
