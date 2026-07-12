'use client';
import { useState, useEffect, useRef } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';
import ConceptBox from './ConceptBox';

const CODE = `struct Node {
  int key, height;
  Node *left, *right;
};

int getBalance(Node* N) {
  if (N == NULL) return 0;
  return height(N->left) - height(N->right);
}

Node* rightRotate(Node* y) {
  Node* x = y->left;
  Node* T2 = x->right;
  x->right = y;
  y->left = T2;
  y->height = max(height(y->left), height(y->right)) + 1;
  x->height = max(height(x->left), height(x->right)) + 1;
  return x;
}

Node* insert(Node* node, int key) {
  if (node == NULL) return new Node(key);
  if (key < node->key)
    node->left = insert(node->left, key);
  else if (key > node->key)
    node->right = insert(node->right, key);
  else return node;

  node->height = 1 + max(height(node->left), height(node->right));
  int balance = getBalance(node);

  // Left Left Case
  if (balance > 1 && key < node->left->key)
    return rightRotate(node);
  // Right Right Case
  if (balance < -1 && key > node->right->key)
    return leftRotate(node);
  // Left Right Case
  if (balance > 1 && key > node->left->key) {
    node->left = leftRotate(node->left);
    return rightRotate(node);
  }
  // Right Left Case
  if (balance < -1 && key < node->right->key) {
    node->right = rightRotate(node->right);
    return leftRotate(node);
  }
  return node;
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

// Deep-copy of binary tree node structure
function cloneTree(node) {
  if (!node) return null;
  return {
    val: node.val,
    height: node.height,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
    id: node.id,
  };
}

// Height helper
function getHeight(n) {
  return n ? n.height : 0;
}

// Balance helper
function getBF(n) {
  if (!n) return 0;
  return getHeight(n.left) - getHeight(n.right);
}

// Recalculate heights for Javascript tree nodes
function updateHeight(n) {
  if (n) {
    n.height = Math.max(getHeight(n.left), getHeight(n.right)) + 1;
  }
}

// Calculate SVG positions recursively
function layoutAVL(root) {
  const positions = {};
  if (!root) return { positions, totalW: 0 };

  function measure(node) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return measure(node.left) + measure(node.right);
  }

  function place(node, x, y, width) {
    if (!node) return;
    positions[node.id] = { x, y, node };
    const leftW = measure(node.left) * 44;
    const rightW = measure(node.right) * 44;

    const leftX = x - Math.max(leftW, 25);
    const rightX = x + Math.max(rightW, 25);

    place(node.left, leftX, y + 54, width / 2);
    place(node.right, rightX, y + 54, width / 2);
  }

  const totalW = Math.max(measure(root) * 55, 500);
  place(root, totalW / 2, 40, totalW);
  return { positions, totalW };
}

// Collect parent-child links for SVG lines
function collectLinks(positions) {
  const links = [];
  Object.values(positions).forEach(({ x, y, node }) => {
    if (node.left && positions[node.left.id]) {
      links.push({ from: { x, y }, to: positions[node.left.id], id: `${node.id}-${node.left.id}` });
    }
    if (node.right && positions[node.right.id]) {
      links.push({ from: { x, y }, to: positions[node.right.id], id: `${node.id}-${node.right.id}` });
    }
  });
  return links;
}

export default function AVLTreeVisualizer() {
  const [tree, setTree] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);
  const nodeCounterRef = useRef(0);

  // Initialize with some default nodes
  useEffect(() => {
    let t = null;
    const initialKeys = [20, 10, 30, 5, 15, 25, 40];
    
    // Simple direct build for initial state
    function insertNode(node, key) {
      if (!node) {
        nodeCounterRef.current++;
        return { val: key, height: 1, left: null, right: null, id: `n${nodeCounterRef.current}` };
      }
      if (key < node.val) node.left = insertNode(node.left, key);
      else if (key > node.val) node.right = insertNode(node.right, key);
      updateHeight(node);
      return node;
    }
    
    initialKeys.forEach(k => {
      t = insertNode(t, k);
    });
    setTree(t);
  }, []);

  const runAVLInsertSimulation = (key) => {
    setIsPlaying(false);
    const tempSteps = [];
    let root = cloneTree(tree);

    let rotationOccurred = false;

    tempSteps.push({
      tree: cloneTree(root),
      comparing: [],
      unbalanced: [],
      codeLine: 21,
      description: `Starting insertion of value ${key}...`,
      status: 'info',
    });

    // AVL insert with steps capture
    function insert(node, k) {
      if (!node) {
        nodeCounterRef.current++;
        const newNode = { val: k, height: 1, left: null, right: null, id: `n${nodeCounterRef.current}` };
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [newNode.id],
          unbalanced: [],
          codeLine: 22,
          description: `Created new leaf node with key ${k}.`,
          status: 'found',
        });
        return newNode;
      }

      tempSteps.push({
        tree: cloneTree(root),
        comparing: [node.id],
        unbalanced: [],
        codeLine: 23,
        description: `Comparing insert key ${k} with node ${node.val}.`,
        status: 'compare',
      });

      if (k < node.val) {
        node.left = insert(node.left, k);
      } else if (k > node.val) {
        node.right = insert(node.right, k);
      } else {
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [node.id],
          unbalanced: [],
          codeLine: 27,
          description: `Key ${k} already exists. Terminating insertion.`,
          status: 'mismatch',
        });
        return node;
      }

      updateHeight(node);
      const balance = getBF(node);

      tempSteps.push({
        tree: cloneTree(root),
        comparing: [node.id],
        unbalanced: [],
        codeLine: 30,
        description: `Backtracking up path. Node ${node.val} updated height to ${node.height}, Balance Factor = ${balance}.`,
        status: 'info',
      });

      // Left Left Case
      if (balance > 1 && k < node.left.val) {
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.left.id],
          codeLine: 34,
          description: `Unbalance at node ${node.val} (BF: ${balance})! Left-Left heavy. Performing Right Rotation on ${node.val}.`,
          status: 'mismatch',
        });
        rotationOccurred = true;
        return rightRotate(node);
      }

      // Right Right Case
      if (balance < -1 && k > node.right.val) {
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.right.id],
          codeLine: 37,
          description: `Unbalance at node ${node.val} (BF: ${balance})! Right-Right heavy. Performing Left Rotation on ${node.val}.`,
          status: 'mismatch',
        });
        rotationOccurred = true;
        return leftRotate(node);
      }

      // Left Right Case
      if (balance > 1 && k > node.left.val) {
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.left.id],
          codeLine: 40,
          description: `Unbalance at node ${node.val} (BF: ${balance})! Left-Right heavy. Performing double Left-Right Rotation. First, Left Rotate on child ${node.left.val}...`,
          status: 'mismatch',
        });
        node.left = leftRotate(node.left);
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.left.id],
          codeLine: 41,
          description: `Now, Right Rotate on node ${node.val}...`,
          status: 'compare',
        });
        rotationOccurred = true;
        return rightRotate(node);
      }

      // Right Left Case
      if (balance < -1 && k < node.right.val) {
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.right.id],
          codeLine: 45,
          description: `Unbalance at node ${node.val} (BF: ${balance})! Right-Left heavy. Performing double Right-Left Rotation. First, Right Rotate on child ${node.right.val}...`,
          status: 'mismatch',
        });
        node.right = rightRotate(node.right);
        tempSteps.push({
          tree: cloneTree(root),
          comparing: [],
          unbalanced: [node.id, node.right.id],
          codeLine: 46,
          description: `Now, Left Rotate on node ${node.val}...`,
          status: 'compare',
        });
        rotationOccurred = true;
        return leftRotate(node);
      }

      return node;
    }

    // AVL rotation operators
    function rightRotate(y) {
      const x = y.left;
      const T2 = x.right;
      x.right = y;
      y.left = T2;
      updateHeight(y);
      updateHeight(x);
      return x;
    }

    function leftRotate(x) {
      const y = x.right;
      const T2 = y.left;
      y.left = x;
      x.right = T2;
      updateHeight(x);
      updateHeight(y);
      return y;
    }

    const finalTree = insert(root, key);
    
    tempSteps.push({
      tree: cloneTree(finalTree),
      comparing: [],
      unbalanced: [],
      codeLine: -1,
      description: `Completed AVL insert of value ${key}! Tree is completely balanced.`,
      status: 'sorted',
    });

    setSteps(tempSteps);
    setStepIdx(0);
    setTree(finalTree);
  };

  const handleInsert = () => {
    const key = parseInt(inputVal);
    if (isNaN(key)) return;
    runAVLInsertSimulation(key);
    setInputVal('');
  };

  const handleRandomInsert = () => {
    const key = Math.floor(Math.random() * 90) + 5;
    runAVLInsertSimulation(key);
  };

  const reset = () => {
    nodeCounterRef.current = 0;
    setTree(null);
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
    
    // Seed standard base node
    nodeCounterRef.current++;
    setTree({ val: 20, height: 1, left: null, right: null, id: `n${nodeCounterRef.current}` });
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
    tree: tree,
    comparing: [],
    unbalanced: [],
    codeLine: -1,
    description: 'Insert values using the controls below to visualize dynamic AVL balancing.',
  };

  // Layout calculations
  const { positions, totalW } = layoutAVL(current.tree);
  const links = collectLinks(positions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is an AVL Tree?"
        description="An AVL Tree is a self-balancing BST where the balance factor (height difference between left and right subtrees) of every node is at most 1. After every insert, it checks and fixes imbalances using rotations. Guarantees O(log n) operations always."
        timeComplexity="O(log n)"
        spaceComplexity="O(n)"
      />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Root Value', value: current.tree ? current.tree.val : '—', color: '#00d9a3' },
          { label: 'Tree Height', value: current.tree ? current.tree.height : '—', color: '#ff6b4a' },
          { label: 'Total Nodes', value: Object.keys(positions).length, color: '#1d9e75' },
          { label: 'Balance State', value: current.unbalanced?.length ? 'Rebalancing' : 'Balanced', color: current.unbalanced?.length ? '#ff2d78' : '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center', minHeight: 280 }}>
        {current.tree ? (
          <svg width={Math.max(totalW, 460)} height={280} style={{ display: 'block' }}>
            {/* Links */}
            {links.map(link => {
              const isHl = current.comparing?.includes(link.to.node.id) || current.unbalanced?.includes(link.to.node.id);
              return (
                <line key={link.id}
                  x1={link.from.x} y1={link.from.y}
                  x2={link.to.x} y2={link.to.y}
                  stroke={isHl ? '#00d9a3' : 'rgba(0,217,163,0.15)'}
                  strokeWidth={isHl ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s' }}
                />
              );
            })}

            {/* Nodes */}
            {Object.values(positions).map(({ x, y, node }) => {
              const isComp = current.comparing?.includes(node.id);
              const isUnb = current.unbalanced?.includes(node.id);
              const bf = getBF(node);

              let stroke = 'rgba(0,217,163,0.3)';
              let bg = 'rgba(13,20,36,0.9)';
              let glow = 'none';

              if (isComp) {
                stroke = '#00d9a3';
                bg = 'rgba(0,217,163,0.08)';
                glow = '0 0 10px #00d9a3';
              } else if (isUnb) {
                stroke = '#ff2d78';
                bg = 'rgba(255,45,120,0.1)';
                glow = '0 0 12px #ff2d78';
              } else if (Math.abs(bf) > 1) {
                stroke = '#ff2d7880';
              }

              return (
                <g key={node.id}>
                  {glow !== 'none' && <circle cx={x} cy={y} r={22} fill="none" stroke={stroke} strokeWidth={1} opacity={0.3} />}
                  <circle cx={x} cy={y} r={17} fill={bg} stroke={stroke} strokeWidth={2} style={{ transition: 'all 0.35s' }} />
                  <text x={x} y={y + 4} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: isUnb ? '#ff2d78' : isComp ? '#00d9a3' : '#e8e8ed', fontWeight: 'bold' }}>
                    {node.val}
                  </text>
                  
                  {/* Balance Factor Label */}
                  <text x={x + 22} y={y - 2} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: Math.abs(bf) > 1 ? '#ff2d78' : '#5a7a9a', fontWeight: Math.abs(bf) > 1 ? 'bold' : 'normal' }}>
                    BF:{bf > 0 ? `+${bf}` : bf}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7a9a', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            Tree is empty. Insert a value to start.
          </div>
        )}
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current.description}
        status={current.status}
      />

      {/* Interface Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: 12 }}>
        <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInsert()} placeholder="Insert key..." style={inpStyle} />
        <button onClick={handleInsert} style={btnStyle('#00d9a3')}>Insert Node</button>
        <button onClick={handleRandomInsert} style={btnStyle('#ef9f27')}>🎲 Insert Random</button>
        <button onClick={reset} style={btnStyle('#ff2d78')}>↺ Reset Tree</button>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>SPEED</span>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 9px', borderRadius: 6, border: speed === s ? '1px solid #00d9a3' : '1px solid rgba(0,217,163,0.15)', background: speed === s ? 'rgba(0,217,163,0.12)' : 'transparent', color: speed === s ? '#00d9a3' : '#5a7a9a', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#00d9a3', label: 'Comparing node / searching path' },
          { color: '#ff2d78', label: 'Unbalanced node (requires rotation!)' },
          { color: 'rgba(0,217,163,0.3)', label: 'Balanced node' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Playback Controls */}
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

const inpStyle = {
  background: 'rgba(0,217,163,0.04)',
  border: '1px solid rgba(0,217,163,0.2)',
  borderRadius: 8,
  padding: '6px 12px',
  color: '#e8e8ed',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  outline: 'none',
  width: 100,
};

const btnStyle = (c) => ({
  padding: '7px 14px',
  borderRadius: 8,
  border: `1px solid ${c}30`,
  background: `${c}10`,
  color: c,
  fontFamily: 'var(--font-heading)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
});
