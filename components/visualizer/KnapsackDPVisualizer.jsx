'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';
import VisualizerControls from './VisualizerControls';

const CODE = `int knapsack(int W, vector<int>& wt, vector<int>& val, int n) {
  vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
  for (int i = 1; i <= n; i++) {
    for (int w = 1; w <= W; w++) {
      if (wt[i - 1] <= w) {
        dp[i][w] = max(dp[i - 1][w], val[i - 1] + dp[i - 1][w - wt[i - 1]]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

export default function KnapsackDPVisualizer() {
  const [items, setItems] = useState([
    { id: 1, wt: 2, val: 3 },
    { id: 2, wt: 3, val: 4 },
    { id: 3, wt: 4, val: 5 },
    { id: 4, wt: 5, val: 8 },
  ]);
  const [W, setW] = useState(7);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  // Generate Steps for the DP simulation
  const computeSteps = useCallback((currItems, capacity) => {
    const tempSteps = [];
    const n = currItems.length;
    const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

    // Initial state
    tempSteps.push({
      dp: dp.map(r => [...r]),
      currCell: null,
      candidates: [],
      traceback: [],
      codeLine: 1,
      explanation: 'Initializing DP table of size (n+1) × (W+1) with all zeros. Rows correspond to items, columns to weight capacity.',
      status: 'info',
    });

    for (let i = 1; i <= n; i++) {
      const item = currItems[i - 1];
      for (let w = 1; w <= capacity; w++) {
        const exclude = dp[i - 1][w];
        let include = -1;
        const candidates = [{ r: i - 1, c: w, type: 'exclude', val: exclude }];

        let explanation = '';
        let status = 'compare';

        if (item.wt <= w) {
          include = item.val + dp[i - 1][w - item.wt];
          candidates.push({ r: i - 1, c: w - item.wt, type: 'include', val: include });
          dp[i][w] = Math.max(exclude, include);
          explanation = `Item ${i} (wt=${item.wt}, val=${item.val}): dp[${i}][${w}] = max(exclude=${exclude}, include=${include}) = ${dp[i][w]}. ${include > exclude ? 'Including is better!' : 'Excluding is better.'}`;
          status = 'compare';
        } else {
          dp[i][w] = exclude;
          explanation = `Item ${i} (weight=${item.wt}) is heavier than current capacity w=${w}. Excluded! dp[${i}][${w}] = dp[${i - 1}][${w}] = ${exclude}.`;
          status = 'mismatch';
        }

        tempSteps.push({
          dp: dp.map(r => [...r]),
          currCell: { r: i, c: w },
          candidates,
          traceback: [],
          codeLine: item.wt <= w ? 5 : 7,
          explanation,
          status,
        });
      }
    }

    // Traceback calculation to find selected items
    const tracebackPath = [];
    let r = n, c = capacity;
    const selectedIds = [];
    while (r > 0 && c > 0) {
      const item = currItems[r - 1];
      tracebackPath.push({ r, c });
      if (dp[r][c] !== dp[r - 1][c]) {
        selectedIds.push(item.id);
        c -= item.wt;
      }
      r--;
    }
    if (r === 0 || c === 0) {
      tracebackPath.push({ r, c });
    }

    // Done Step
    tempSteps.push({
      dp: dp.map(r => [...r]),
      currCell: { r: n, c: capacity },
      candidates: [],
      traceback: tracebackPath,
      selectedIds,
      codeLine: 11,
      explanation: `Knapsack DP completed! Maximum value within capacity ${W} is ${dp[n][capacity]}. Traceback reveals selected items: ${selectedIds.length ? selectedIds.map(id => `Item ${id}`).join(', ') : 'None'}.`,
      status: 'sorted',
    });

    return tempSteps;
  }, []);

  const rebuild = useCallback(() => {
    const s = computeSteps(items, W);
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, [items, W, computeSteps]);

  useEffect(() => {
    rebuild();
  }, [items, W, rebuild]);

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
    dp: Array.from({ length: items.length + 1 }, () => Array(W + 1).fill(0)),
    currCell: null,
    candidates: [],
    traceback: [],
    selectedIds: [],
    codeLine: -1,
    description: 'Press Play or Step Forward to run bottom-up Knapsack DP.',
  };

  const handleItemChange = (index, field, val) => {
    const num = Math.max(1, parseInt(val) || 0);
    const next = [...items];
    next[index][field] = num;
    setItems(next);
  };

  const addItem = () => {
    if (items.length >= 5) return;
    setItems([...items, { id: items.length + 1, wt: Math.floor(Math.random() * 3) + 2, val: Math.floor(Math.random() * 6) + 3 }]);
  };

  const removeItem = (id) => {
    if (items.length <= 2) return;
    setItems(items.filter(it => it.id !== id).map((it, idx) => ({ ...it, id: idx + 1 })));
  };

  // Determine grid cell styling
  const getCellStyles = (r, c) => {
    const isCurrent = current.currCell && current.currCell.r === r && current.currCell.c === c;
    const cand = current.candidates.find(cand => cand.r === r && cand.c === c);
    const isTrace = current.traceback.some(pt => pt.r === r && pt.c === c);
    
    let border = '1px solid rgba(0, 240, 255, 0.08)';
    let color = '#4a607a';
    let background = 'transparent';
    let shadow = 'none';

    if (isCurrent) {
      border = '2px solid #00f0ff';
      color = '#00f0ff';
      background = 'rgba(0, 240, 255, 0.08)';
      shadow = '0 0 10px rgba(0, 240, 255, 0.2)';
    } else if (cand) {
      border = '1.5px dashed #ef9f27';
      color = '#ef9f27';
      background = 'rgba(239, 159, 39, 0.06)';
    } else if (isTrace) {
      border = '2px solid #1d9e75';
      color = '#1d9e75';
      background = 'rgba(29, 158, 187, 0.15)';
    } else if (current.dp[r][c] > 0 || (r === 0 || c === 0)) {
      color = '#1d9e7580';
    }

    return { border, color, background, boxShadow: shadow };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is 0/1 Knapsack DP?"
        description="0/1 Knapsack: given items with weights and values, choose items to maximize total value without exceeding weight capacity. Each item is either included (1) or excluded (0). A 2D DP table where dp[i][w] = max value using first i items with capacity w."
        timeComplexity="O(n × W)"
        spaceComplexity="O(n × W)"
      />

      {/* Top statistics panel */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Max Knapsack Value', value: current.traceback.length ? current.dp[items.length][W] : '—', color: '#1d9e75' },
          { label: 'Capacity (W)', value: W, color: '#00f0ff' },
          { label: 'Total Items', value: items.length, color: '#ff6b4a' },
          { label: 'Grid Calculations', value: items.length * W, color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Side: Items editor panel */}
        <div style={{ minWidth: 240, flex: 0.8 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 1 }}>ITEMS LIST (Max 5)</span>
              <button onClick={addItem} disabled={items.length >= 5} style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 6, color: '#00f0ff', padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>+ Add</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it, idx) => {
                const isSelected = current.selectedIds?.includes(it.id);
                return (
                  <div key={it.id} style={{ display: 'flex', gap: 8, alignItems: 'center', background: isSelected ? 'rgba(29,158,117,0.1)' : 'rgba(0,240,255,0.02)', padding: '6px 10px', borderRadius: 8, border: isSelected ? '1px solid #1d9e75' : '1px solid rgba(0,240,255,0.08)', transition: 'all 0.3s' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isSelected ? '#1d9e75' : '#5a7a9a', fontWeight: 'bold' }}>#{it.id}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 9, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>VAL</span>
                      <input type="number" value={it.val} onChange={e => handleItemChange(idx, 'val', e.target.value)} style={{ width: 44, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 4, color: '#fff', fontSize: 11, padding: '2px 4px', textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 9, color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>WT</span>
                      <input type="number" value={it.wt} onChange={e => handleItemChange(idx, 'wt', e.target.value)} style={{ width: 44, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 4, color: '#fff', fontSize: 11, padding: '2px 4px', textAlign: 'center' }} />
                    </div>
                    <button onClick={() => removeItem(it.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ff2d78', cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,240,255,0.05)', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>CAPACITY (W):</span>
                <input type="range" min={4} max={10} value={W} onChange={e => setW(Number(e.target.value))} style={{ flex: 1, accentColor: '#00f0ff', cursor: 'pointer' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00f0ff', fontWeight: 'bold' }}>{W}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: DP Table Visualizer */}
        <div style={{ flex: 1.5, minWidth: 320, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 16, overflowX: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 12 }}>2D DYNAMIC PROGRAMMING GRID [i][w]</div>
          
          <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ padding: 6, color: '#5a7a9a', borderBottom: '2px solid rgba(0,240,255,0.12)' }}>Item \ W</th>
                {Array.from({ length: W + 1 }).map((_, w) => (
                  <th key={w} style={{ padding: '6px 10px', color: '#5a7a9a', borderBottom: '2px solid rgba(0,240,255,0.12)' }}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.dp.map((row, r) => (
                <tr key={r}>
                  {/* Left Label */}
                  <td style={{ padding: '8px 12px', borderRight: '2px solid rgba(0,240,255,0.12)', color: '#5a7a9a', fontWeight: 'bold' }}>
                    {r === 0 ? 'Base (0)' : `i=${r} (w:${items[r-1].wt}, v:${items[r-1].val})`}
                  </td>
                  {row.map((val, c) => {
                    const cellStyle = getCellStyles(r, c);
                    return (
                      <td key={c} style={{
                        padding: 0,
                        border: '1px solid rgba(0, 240, 255, 0.04)',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.25s',
                          fontWeight: 700,
                          borderRadius: 4,
                          margin: 2,
                          ...cellStyle,
                        }}>
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#00f0ff', label: 'Current cell being computed' },
          { color: '#ef9f27', label: 'Dependencies (exclusion / inclusion subproblems)' },
          { color: '#1d9e75', label: 'Traceback path (selected items)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : null}
        totalSteps={steps.length > 0 ? steps.length : null}
        explanation={current.explanation}
        status={current.status}
      />

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
