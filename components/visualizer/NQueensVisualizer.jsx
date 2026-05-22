'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';

const CODE = `bool isSafe(vector<int>& board, int row, int col) {
  for (int i = 0; i < row; i++) {
    if (board[i] == col || 
        abs(board[i] - col) == abs(i - row))
      return false;
  }
  return true;
}

void solveNQueens(vector<int>& board, int row, int n, vector<vector<int>>& solutions) {
  if (row == n) {
    solutions.push_back(board);
    return;
  }
  for (int col = 0; col < n; col++) {
    if (isSafe(board, row, col)) {
      board[row] = col;
      solveNQueens(board, row + 1, n, solutions);
      board[row] = -1; // Backtrack
    }
  }
}`;

const SPEEDS = { 1: 1500, 2: 900, 3: 400, 4: 150 };

export default function NQueensVisualizer() {
  const [N, setN] = useState(4);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolutionIdx, setSelectedSolutionIdx] = useState(-1);
  const intervalRef = useRef(null);

  // Backtracking simulation
  const computeSteps = useCallback((size) => {
    const tempSteps = [];
    const board = Array(size).fill(-1);
    const completedSolutions = [];

    tempSteps.push({
      board: [...board],
      curr: null,
      threats: [],
      status: 'init',
      codeLine: 10,
      description: `Starting backtracking search on ${size}x${size} chessboard...`,
    });

    function isSafe(row, col) {
      const threats = [];
      for (let i = 0; i < row; i++) {
        if (board[i] === col) {
          threats.push({ r: i, c: board[i], type: 'column' });
        }
        if (Math.abs(board[i] - col) === Math.abs(i - row)) {
          threats.push({ r: i, c: board[i], type: 'diagonal' });
        }
      }
      return threats;
    }

    function solve(row) {
      if (row === size) {
        completedSolutions.push([...board]);
        tempSteps.push({
          board: [...board],
          curr: null,
          threats: [],
          status: 'success',
          codeLine: 12,
          description: `✓ Solution Found! Saved to solution library. Total solutions: ${completedSolutions.length}.`,
        });
        return;
      }

      for (let col = 0; col < size; col++) {
        // Step: Try placing
        tempSteps.push({
          board: [...board],
          curr: { r: row, c: col },
          threats: [],
          status: 'checking',
          codeLine: 15,
          description: `Testing placement at row ${row}, col ${col}.`,
        });

        const threats = isSafe(row, col);

        if (threats.length === 0) {
          board[row] = col;
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: [],
            status: 'placed',
            codeLine: 17,
            description: `Safe! Placed Queen at row ${row}, col ${col}. Advancing to next row.`,
          });

          solve(row + 1);

          // Backtrack step
          board[row] = -1;
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: [],
            status: 'backtrack',
            codeLine: 19,
            description: `Backtracking: Removing Queen at row ${row}, col ${col} to search other options.`,
          });
        } else {
          // Conflict step
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: threats,
            status: 'conflict',
            codeLine: 4,
            description: `Conflict! Cannot place Queen at row ${row}, col ${col}. Threatened by Queen at row ${threats[0].r}, col ${threats[0].c} (${threats[0].type}).`,
          });
        }
      }
    }

    solve(0);

    tempSteps.push({
      board: Array(size).fill(-1),
      curr: null,
      threats: [],
      status: 'done',
      codeLine: -1,
      description: `Backtracking search completed! Found ${completedSolutions.length} solutions total.`,
    });

    return { tempSteps, completedSolutions };
  }, []);

  const rebuild = useCallback(() => {
    const { tempSteps, completedSolutions } = computeSteps(N);
    setSteps(tempSteps);
    setSolutions(completedSolutions);
    setStepIdx(-1);
    setIsPlaying(false);
    setSelectedSolutionIdx(-1);
  }, [N, computeSteps]);

  useEffect(() => {
    rebuild();
  }, [N, rebuild]);

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

  const selectSolution = (idx) => {
    setIsPlaying(false);
    setSelectedSolutionIdx(idx);
    setStepIdx(-1); // show static solution board
  };

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : {
    board: selectedSolutionIdx >= 0 ? solutions[selectedSolutionIdx] : Array(N).fill(-1),
    curr: null,
    threats: [],
    status: selectedSolutionIdx >= 0 ? 'success' : 'init',
    codeLine: -1,
    description: selectedSolutionIdx >= 0
      ? `Viewing Solution #${selectedSolutionIdx + 1} from library.`
      : 'Press Play or Step Forward to run backtracking N-Queens visualizer.',
  };

  const getSquareStyles = (r, c) => {
    const isDark = (r + c) % 2 === 1;
    const hasQueen = current.board[r] === c;
    const isCurrentTry = current.curr && current.curr.r === r && current.curr.c === c;
    const isThreat = current.threats.some(t => t.r === r && t.c === c);

    let background = isDark ? '#09101d' : 'rgba(0, 240, 255, 0.03)';
    let border = '1px solid rgba(0, 240, 255, 0.05)';
    let color = '#5a7a9a';
    let shadow = 'none';

    if (isCurrentTry) {
      if (current.status === 'conflict') {
        background = 'rgba(255, 45, 120, 0.15)';
        border = '2px solid #ff2d78';
        shadow = '0 0 10px rgba(255, 45, 120, 0.3)';
      } else {
        background = 'rgba(0, 240, 255, 0.15)';
        border = '2px solid #00f0ff';
        shadow = '0 0 10px rgba(0, 240, 255, 0.3)';
      }
    } else if (hasQueen) {
      if (isThreat) {
        background = 'rgba(255, 45, 120, 0.12)';
        border = '1.5px solid #ff2d78';
      } else {
        background = 'rgba(29, 158, 117, 0.12)';
        border = '1.5px solid #1d9e75';
      }
    }

    return { background, border, color, boxShadow: shadow };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top statistics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Board Size (N)', value: `${N}x${N}`, color: '#00f0ff' },
          { label: 'Solutions Found', value: solutions.length, color: '#1d9e75' },
          { label: 'Step Phase', value: current.status.toUpperCase(), color: '#7b5cff' },
          { label: 'Library View', value: selectedSolutionIdx >= 0 ? `#${selectedSolutionIdx + 1}` : 'Live Search', color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description board */}
      <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#00f0ff' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Chessboard Canvas */}
        <div style={{ flex: 1.5, minWidth: 280, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, 40px)`,
            gridTemplateRows: `repeat(${N}, 40px)`,
            gap: 2,
            border: '3px solid rgba(0, 240, 255, 0.15)',
            borderRadius: 8,
            padding: 4,
            background: 'rgba(5, 10, 20, 0.8)',
            position: 'relative',
          }}>
            {Array.from({ length: N }).map((_, r) =>
              Array.from({ length: N }).map((_, c) => {
                const sqStyle = getSquareStyles(r, c);
                const hasQueen = current.board[r] === c;
                const isCurrentTry = current.curr && current.curr.r === r && current.curr.c === c;
                
                return (
                  <div key={`${r}-${c}`} style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, borderRadius: 4, transition: 'all 0.25s',
                    ...sqStyle,
                  }}>
                    {hasQueen && (
                      <span style={{
                        color: current.threats.some(t => t.r === r) ? '#ff2d78' : '#1d9e75',
                        filter: 'drop-shadow(0 0 4px currentColor)',
                      }}>👑</span>
                    )}
                    {isCurrentTry && !hasQueen && (
                      <span style={{
                        color: current.status === 'conflict' ? '#ff2d78' : '#00f0ff',
                        filter: 'drop-shadow(0 0 4px currentColor)',
                        opacity: 0.6,
                      }}>👑</span>
                    )}
                  </div>
                );
              })
            )}

            {/* SVG Conflict overlays overlaying the chessboard */}
            {current.status === 'conflict' && current.curr && (
              <svg style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 10,
              }}>
                {current.threats.map((t, idx) => {
                  // Coordinate math: 4px padding + square center (42px spacing)
                  const startX = 4 + t.c * 42 + 20;
                  const startY = 4 + t.r * 42 + 20;
                  const endX = 4 + current.curr.c * 42 + 20;
                  const endY = 4 + current.curr.r * 42 + 20;

                  return (
                    <line key={idx}
                      x1={startX} y1={startY}
                      x2={endX} y2={endY}
                      stroke="#ff2d78"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      style={{ animation: 'dash 0.6s linear infinite' }}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right Side: Solutions repository library */}
        <div style={{ flex: 0.8, minWidth: 200 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>COMPLETED SOLUTIONS LIBRARY</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {solutions.length === 0 ? (
                <div style={{ fontSize: 11, color: '#2a3a4a', fontFamily: 'Outfit,sans-serif', padding: 8 }}>
                  Search has not completed yet. Run matching solver.
                </div>
              ) : (
                solutions.map((sol, index) => {
                  const active = selectedSolutionIdx === index;
                  return (
                    <button key={index} onClick={() => selectSolution(index)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: active ? 'rgba(29, 158, 117, 0.12)' : 'rgba(0,240,255,0.02)',
                      border: active ? '1px solid #1d9e75' : '1px solid rgba(0,240,255,0.08)',
                      borderRadius: 6, padding: '6px 10px', width: '100%',
                      fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: active ? '#1d9e75' : '#5a7a9a',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span>Solution #{index + 1}</span>
                      <span style={{ fontSize: 10 }}>[ {sol.join(', ')} ]</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Board configuration panel */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, padding: 12 }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a' }}>BOARD SIZE (N):</span>
        <input type="range" min={4} max={8} value={N} onChange={e => setN(Number(e.target.value))} style={{ width: 100, accentColor: '#00f0ff', cursor: 'pointer' }} />
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#00f0ff', fontWeight: 'bold', minWidth: 20 }}>{N}</span>

        <button onClick={rebuild} style={{ ...btnStyle('#ff2d78'), marginLeft: 'auto' }}>↺ Reset Search</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#00f0ff', label: 'Checking cell / safe placement' },
          { color: '#ff2d78', label: 'Conflict cell (threatened / illegal placement)' },
          { color: '#1d9e75', label: 'Safe placed Queen' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color + '22', border: `1.5px solid ${l.color}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'Outfit,sans-serif' }}>{l.label}</span>
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
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}

const btnStyle = (c) => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: `1px solid ${c}30`,
  background: `${c}10`,
  color: c,
  fontFamily: 'Syne,sans-serif',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
});
