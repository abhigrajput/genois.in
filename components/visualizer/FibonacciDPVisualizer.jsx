'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `int fib(int n) {
  if (n <= 1) return n;
  vector<int> dp(n + 1);
  dp[0] = 0;
  dp[1] = 1;
  for (int i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
  }
  return dp[n];
}`;

const SPEEDS = { 1: 1200, 2: 700, 3: 350, 4: 150 };

// Helper to build recursive tree layout for fib(n)
function buildFibTree(n, x, y, dx, dy, id = 'r') {
  if (n <= 1) {
    return { val: n, label: `F(${n})`, x, y, children: [], id };
  }
  const leftX = x - dx;
  const rightX = x + dx;
  const nextY = y + dy;
  const left = buildFibTree(n - 1, leftX, nextY, dx * 0.5, dy, id + 'l');
  const right = buildFibTree(n - 2, rightX, nextY, dx * 0.5, dy, id + 'r');
  return {
    val: null, // to be calculated
    label: `F(${n})`,
    x, y,
    children: [left, right],
    id
  };
}

export default function FibonacciDPVisualizer() {
  const [n, setN] = useState(6);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  // Compute states for bottom-up and top-down
  const computeSteps = useCallback((targetN) => {
    const tempSteps = [];

    // Bottom-Up DP simulation
    const dp = Array(targetN + 1).fill(null);
    tempSteps.push({
      dp: [...dp],
      currentIdx: -1,
      dependencies: [],
      mode: 'init',
      codeLine: 1,
      description: 'Initialize DP table.',
      explanation: 'Initializing DP table with null values. We will fill it bottom-up from dp[0] to dp[n].',
      status: 'info',
      activeLine: 1,
    });

    dp[0] = 0;
    tempSteps.push({
      dp: [...dp],
      currentIdx: 0,
      dependencies: [],
      mode: 'base',
      codeLine: 3,
      description: 'Set base case dp[0] = 0.',
      explanation: 'Base case: dp[0] = 0. By definition, the 0th Fibonacci number is 0.',
      status: 'sorted',
      activeLine: 3,
    });

    if (targetN >= 1) {
      dp[1] = 1;
      tempSteps.push({
        dp: [...dp],
        currentIdx: 1,
        dependencies: [],
        mode: 'base',
        codeLine: 4,
        description: 'Set base case dp[1] = 1.',
        explanation: 'Base case: dp[1] = 1. By definition, the 1st Fibonacci number is 1.',
        status: 'sorted',
        activeLine: 4,
      });
    }

    for (let i = 2; i <= targetN; i++) {
      tempSteps.push({
        dp: [...dp],
        currentIdx: i,
        dependencies: [i - 1, i - 2],
        mode: 'comparing',
        codeLine: 6,
        description: `Computing dp[${i}] = dp[${i-1}] + dp[${i-2}]`,
        explanation: `Computing dp[${i}] = dp[${i-1}] + dp[${i-2}] = ${dp[i-1]} + ${dp[i-2]}. Reading from previously solved subproblems.`,
        status: 'compare',
        activeLine: 6,
      });

      dp[i] = dp[i - 1] + dp[i - 2];

      tempSteps.push({
        dp: [...dp],
        currentIdx: i,
        dependencies: [i - 1, i - 2],
        mode: 'computed',
        codeLine: 6,
        description: `Calculated dp[${i}] = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`,
        explanation: `dp[${i}] = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}. Stored in table for future use.`,
        status: 'sorted',
        activeLine: 6,
      });
    }

    tempSteps.push({
      dp: [...dp],
      currentIdx: targetN,
      dependencies: [],
      mode: 'done',
      codeLine: 8,
      description: `Completed! fib(${targetN}) = ${dp[targetN]}`,
      explanation: `Fibonacci(${targetN}) = ${dp[targetN]}. All subproblems solved bottom-up in ${targetN + 1} steps.`,
      status: 'sorted',
      activeLine: 8,
    });

    return tempSteps;
  }, []);

  const rebuild = useCallback((val) => {
    const s = computeSteps(val);
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, [computeSteps]);

  useEffect(() => {
    rebuild(n);
  }, [n, rebuild]);

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
    dp: Array(n + 1).fill(null),
    currentIdx: -1,
    dependencies: [],
    mode: 'init',
    codeLine: -1,
    description: 'Press Play or Step Forward to visualize bottom-up dynamic programming.',
    explanation: 'Press ▶ Play or ⏭ Step to start the visualization.',
    status: 'default',
  };

  // Generate recursive tree
  const treeRoot = buildFibTree(Math.min(n, 6), 250, 30, 110, 48); // limit tree scale for visual clarity

  // Color functions
  function getCellColor(idx) {
    if (current.mode === 'done') return '#1d9e75';
    if (idx === current.currentIdx) {
      return current.mode === 'computed' ? '#1d9e75' : '#00d9a3';
    }
    if (current.dependencies.includes(idx)) return '#ef9f27';
    if (current.dp[idx] !== null) return '#1d9e7540';
    return '#1a2a3a';
  }

  // Flatten the tree nodes to render edges and nodes easily
  const nodes = [];
  const links = [];
  function traverse(node, parent = null) {
    nodes.push(node);
    if (parent) links.push({ from: parent, to: node });
    node.children.forEach(c => traverse(c, node));
  }
  traverse(treeRoot);

  // Match recursive nodes with bottom-up calculation status
  function getTreeNodeColor(label) {
    const match = label.match(/\((\d+)\)/);
    if (!match) return '#1a2a3a';
    const val = parseInt(match[1]);
    if (current.dp[val] !== null) return '#1d9e75';
    if (val === current.currentIdx) return '#00d9a3';
    return '#2a3a4a';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Fibonacci DP?"
        description="Dynamic Programming solves Fibonacci by storing previously computed values. Without memoization, naive recursion recomputes the same subproblems exponentially. With DP, each fib(i) is computed exactly once by building on fib(i-1) and fib(i-2). Time drops from O(2ⁿ) to O(n)."
        timeComplexity="O(n) with DP"
        spaceComplexity="O(n)"
      />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Bottom-up Result', value: current.dp[n] ?? '—', color: '#00d9a3' },
          { label: 'DP States', value: n + 1, color: '#ff6b4a' },
          { label: 'Time Complexity', value: 'O(n)', color: '#1d9e75' },
          { label: 'Space Complexity', value: 'O(n)', color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Side: Bottom-Up DP Grid */}
        <div style={{ flex: 1.2, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '24px 16px', position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 16 }}>BOTTOM-UP DP TABLE (dp[])</div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', minHeight: 70, alignItems: 'center' }}>
              {current.dp.map((val, idx) => {
                const isCurrent = idx === current.currentIdx;
                const isDep = current.dependencies.includes(idx);
                const color = getCellColor(idx);
                
                return (
                  <div key={idx} style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: isCurrent ? 'rgba(0,217,163,0.05)' : isDep ? 'rgba(239,159,39,0.05)' : 'rgba(10,15,30,0.8)',
                    border: `2px solid ${color}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 12px rgba(0,217,163,0.2)' : 'none',
                  }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#5a7a9a', position: 'absolute', top: 4 }}>i={idx}</span>
                    <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: val === null ? '#2a3a4a' : color, marginTop: 10 }}>
                      {val === null ? '—' : val}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dependency arrows SVG overlay */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {current.dependencies.length > 0 && (
                <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef9f27' }}>
                  <span>dp[{current.currentIdx - 2}] ({current.dp[current.currentIdx - 2]})</span>
                  <span>+</span>
                  <span>dp[{current.currentIdx - 1}] ({current.dp[current.currentIdx - 1]})</span>
                  <span>=</span>
                  <span style={{ color: '#00d9a3', fontWeight: 'bold' }}>dp[{current.currentIdx}] ({current.dp[current.currentIdx]})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Recursive call tree representation */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>RECURSIVE CALL TREE (Top-Down Memoized)</div>
            <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              <svg width="500" height="260" style={{ display: 'block' }}>
                {links.map((link, i) => {
                  const fromCol = getTreeNodeColor(link.from.label);
                  const toCol = getTreeNodeColor(link.to.label);
                  const isActive = fromCol === '#1d9e75' && toCol === '#1d9e75';
                  return (
                    <line key={i}
                      x1={link.from.x} y1={link.from.y}
                      x2={link.to.x} y2={link.to.y}
                      stroke={isActive ? '#1d9e75' : 'rgba(0,217,163,0.12)'}
                      strokeWidth={isActive ? 2 : 1.5}
                      style={{ transition: 'all 0.3s' }}
                    />
                  );
                })}
                {nodes.map(node => {
                  const color = getTreeNodeColor(node.label);
                  const isHl = color === '#00d9a3';
                  return (
                    <g key={node.id}>
                      <circle cx={node.x} cy={node.y} r={16}
                        fill="#0d1424"
                        stroke={color}
                        strokeWidth={isHl ? 2.5 : 1.5}
                        style={{ transition: 'all 0.3s' }}
                      />
                      <text x={node.x} y={node.y + 4} textAnchor="middle"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: color, fontWeight: 600 }}>
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-body)', color: '#5a7a9a', marginTop: 4, textAlign: 'center' }}>
              Node shows required state. Green nodes = solved / retrieved from memo table.
            </div>
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to start the visualization.'}
        status={current?.status ?? 'default'}
      />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#1a2a3a', label: 'Uncomputed' },
          { color: '#00d9a3', label: 'Current computation' },
          { color: '#ef9f27', label: 'Dependencies (i-1, i-2)' },
          { color: '#1d9e75', label: 'Computed / Base Case' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color === '#1a2a3a' ? '#0d1a2a' : l.color + '44', border: `1.5px solid ${l.color}` }} />
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
        showArrayControls={true}
        arraySize={n}
        onArraySizeChange={setN}
        onRandomize={() => setN(Math.floor(Math.random() * 8) + 5)}
      />

      <CodePanel code={CODE} activeLine={current.codeLine} />
    </div>
  );
}
