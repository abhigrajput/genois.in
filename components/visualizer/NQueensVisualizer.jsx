'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CodePanel from './CodePanel';
import VisualizerControls from './VisualizerControls';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

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
      codeLine: 14,
      description: `Starting N-Queens backtracking on a ${size}×${size} board. Trying to place ${size} non-attacking queens.`,
      explanation: `Starting N-Queens backtracking on a ${size}×${size} board. Trying to place ${size} non-attacking queens.`,
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
          codeLine: 11,
          description: `✓ Solution Found! Saved to solution library. Total solutions: ${completedSolutions.length}.`,
          explanation: `🎉 Solution found! Queens placed at columns: [${board.join(', ')}]. Total solutions found: ${completedSolutions.length}.`,
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
          explanation: `Trying queen at row ${row}, col ${col}. Checking for column, row, and diagonal conflicts.`,
        });

        const threats = isSafe(row, col);

        if (threats.length === 0) {
          board[row] = col;
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: [],
            status: 'placed',
            codeLine: 16,
            description: `Safe! Placed Queen at row ${row}, col ${col}. Advancing to next row.`,
            explanation: `Placing queen at row ${row}, col ${col}. Checking: no conflict in column, diagonal, or anti-diagonal.`,
          });

          solve(row + 1);

          // Backtrack step
          board[row] = -1;
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: [],
            status: 'backtrack',
            codeLine: 18,
            description: `Backtracking: Removing Queen at row ${row}, col ${col} to search other options.`,
            explanation: `No valid column in row ${row}. Removing queen from row ${row}, trying next column in row ${row - 1}.`,
          });
        } else {
          // Conflict step
          tempSteps.push({
            board: [...board],
            curr: { r: row, c: col },
            threats: threats,
            status: 'conflict',
            codeLine: 3,
            description: `Conflict! Cannot place Queen at row ${row}, col ${col}. Threatened by Queen at row ${threats[0].r}, col ${threats[0].c} (${threats[0].type}).`,
            explanation: `Conflict at (${row}, ${col})! Queen at (${threats[0].r}, ${threats[0].c}) attacks this cell via ${threats[0].type}. Backtracking.`,
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
      explanation: `Search complete! Found ${completedSolutions.length} valid solutions for ${size}-Queens problem.`,
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

    let background = isDark ? 'var(--gx-surface-2)' : 'var(--gx-bg)';
    let border = '1px solid var(--gx-border)';
    let color = 'var(--gx-text-muted)';
    let shadow = 'none';

    if (isCurrentTry) {
      if (current.status === 'conflict') {
        background = 'var(--gx-danger-soft)';
        border = '2px solid var(--gx-danger)';
        shadow = 'none';
      } else {
        background = 'var(--gx-accent-soft)';
        border = '2px solid var(--gx-accent)';
        shadow = 'none';
      }
    } else if (hasQueen) {
      if (isThreat) {
        background = 'var(--gx-danger-soft)';
        border = '1.5px solid var(--gx-danger)';
      } else {
        background = 'var(--gx-success-soft)';
        border = '1.5px solid var(--gx-success)';
      }
    }

    return { background, border, color, boxShadow: shadow };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is N-Queens Backtracking?"
        description="N-Queens places N queens on an N×N chessboard so no two queens attack each other (no shared row, column, or diagonal). Backtracking tries placing a queen in each column of the current row — if a conflict is detected, it backtracks and tries the next option. Finds ALL valid arrangements."
        timeComplexity="O(N!)"
        spaceComplexity="O(N)"
      />

      {/* Top statistics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Board Size (N)', value: `${N}x${N}`, color: 'var(--gx-accent)' },
          { label: 'Solutions Found', value: solutions.length, color: 'var(--gx-success)' },
          { label: 'Step Phase', value: current.status.toUpperCase(), color: 'var(--gx-warning)' },
          { label: 'Library View', value: selectedSolutionIdx >= 0 ? `#${selectedSolutionIdx + 1}` : 'Live Search', color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description board */}
      <div style={{ background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-border)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-accent)' }}>
        ▶ {current.description}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Left Chessboard Canvas */}
        <div style={{ flex: 1.5, minWidth: 280, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, 40px)`,
            gridTemplateRows: `repeat(${N}, 40px)`,
            gap: 2,
            border: '3px solid var(--gx-border)',
            borderRadius: 8,
            padding: 4,
            background: 'var(--gx-surface)',
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
                        color: current.threats.some(t => t.r === r) ? 'var(--gx-danger)' : 'var(--gx-success)',
                        filter: 'drop-shadow(0 0 4px currentColor)',
                      }}>👑</span>
                    )}
                    {isCurrentTry && !hasQueen && (
                      <span style={{
                        color: current.status === 'conflict' ? 'var(--gx-danger)' : 'var(--gx-accent)',
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
                      stroke="var(--gx-danger)"
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
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 8 }}>COMPLETED SOLUTIONS LIBRARY</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {solutions.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--gx-text-subtle)', fontFamily: 'var(--font-body)', padding: 8 }}>
                  Search has not completed yet. Run matching solver.
                </div>
              ) : (
                solutions.map((sol, index) => {
                  const active = selectedSolutionIdx === index;
                  return (
                    <button key={index} onClick={() => selectSolution(index)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: active ? 'var(--gx-success-soft)' : 'var(--gx-accent-soft)',
                      border: active ? '1px solid var(--gx-success)' : '1px solid var(--gx-border)',
                      borderRadius: 6, padding: '6px 10px', width: '100%',
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: active ? 'var(--gx-success)' : 'var(--gx-text-muted)',
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

      <StepExplanation
        stepNumber={stepIdx >= 0 ? stepIdx + 1 : undefined}
        totalSteps={steps.length}
        explanation={current.explanation}
        status={
          current.status === 'init' ? 'info' :
          current.status === 'checking' ? 'compare' :
          current.status === 'placed' ? 'found' :
          current.status === 'backtrack' ? 'mismatch' :
          current.status === 'conflict' ? 'mismatch' :
          current.status === 'success' ? 'sorted' :
          current.status === 'done' ? 'sorted' : 'default'
        }
      />

      {/* Board configuration panel */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)' }}>BOARD SIZE (N):</span>
        <input type="range" min={4} max={8} value={N} onChange={e => setN(Number(e.target.value))} style={{ width: 100, accentColor: 'var(--gx-accent)', cursor: 'pointer' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gx-accent)', fontWeight: 'bold', minWidth: 20 }}>{N}</span>

        <button onClick={rebuild} style={{ ...btnStyle('var(--gx-danger)'), marginLeft: 'auto' }}>↺ Reset Search</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'var(--gx-accent)', label: 'Checking cell / safe placement' },
          { color: 'var(--gx-danger)', label: 'Conflict cell (threatened / illegal placement)' },
          { color: 'var(--gx-success)', label: 'Safe placed Queen' },
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
  border: `1px solid color-mix(in srgb, ${c} 19%, transparent)`,
  background: `color-mix(in srgb, ${c} 6%, transparent)`,
  color: c,
  fontFamily: 'var(--font-heading)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
});
