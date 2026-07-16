'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `int maxSubArray(int a[], int n) {
  int best = a[0], cur = a[0];
  for (int i = 1; i < n; i++) {
    cur = max(a[i], cur + a[i]); // extend or restart
    best = max(best, cur);       // record the best so far
  }
  return best;
}`;

const SNIPPETS = {
  python: `def max_sub_array(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)   # extend or restart
        best = max(best, cur)   # record the best so far
    return best`,
  java: `int maxSubArray(int[] a) {
  int best = a[0], cur = a[0];
  for (int i = 1; i < a.length; i++) {
    cur = Math.max(a[i], cur + a[i]); // extend or restart
    best = Math.max(best, cur);       // record best so far
  }
  return best;
}`,
  javascript: `function maxSubArray(a) {
  let best = a[0], cur = a[0];
  for (let i = 1; i < a.length; i++) {
    cur = Math.max(a[i], cur + a[i]); // extend or restart
    best = Math.max(best, cur);       // record best so far
  }
  return best;
}`,
};

function generateArray(size) {
  // Mix of negatives and positives so restarts actually happen.
  return Array.from({ length: size }, () => Math.floor(Math.random() * 19) - 9);
}

function computeSteps(input) {
  const a = [...input];
  const n = a.length;
  const steps = [];
  let cur = a[0], best = a[0];
  let curStart = 0, bestStart = 0, bestEnd = 0;

  steps.push({
    i: 0, cur, best, curStart, curEnd: 0, bestStart, bestEnd, restarted: false,
    activeLine: 1, status: 'info',
    explanation: `Initialise cur = best = a[0] = ${a[0]}. "cur" is the best subarray sum ENDING at the current index; "best" is the answer so far.`,
  });

  for (let i = 1; i < n; i++) {
    const extend = cur + a[i];
    const restarted = a[i] > extend;
    if (restarted) { cur = a[i]; curStart = i; } else { cur = extend; }
    const bestBefore = best;
    if (cur > best) { best = cur; bestStart = curStart; bestEnd = i; }
    steps.push({
      i, cur, best, curStart, curEnd: i, bestStart, bestEnd, restarted,
      activeLine: cur > bestBefore ? 4 : 3, status: restarted ? 'mismatch' : 'compare',
      explanation: restarted
        ? `a[${i}]=${a[i]}: extending gives ${cur === a[i] ? extend : extend}, but a[${i}] alone (${a[i]}) is bigger — RESTART the window at index ${i}. cur=${cur}.`
        : `a[${i}]=${a[i]}: extend the window — cur = cur + a[${i}] = ${cur}.` + (cur > bestBefore ? ` New best = ${best}!` : ` best stays ${best}.`),
    });
  }
  steps.push({
    i: n - 1, cur, best, curStart, curEnd: n - 1, bestStart, bestEnd, done: true,
    activeLine: 6, status: 'sorted',
    explanation: `🎉 Maximum subarray sum = ${best}, from index ${bestStart} to ${bestEnd}. One pass, O(n) time, O(1) space — the classic dynamic-programming-on-a-single-variable trick.`,
  });
  return steps;
}

export default function KadaneVisualizer() {
  const [size, setSize] = useState(9);
  const [arr, setArr] = useState(() => generateArray(9));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const buildSteps = useCallback((a) => {
    setSteps(computeSteps(a));
    setStepIdx(-1);
    setIsPlaying(false);
  }, []);

  useEffect(() => { buildSteps(arr); }, [arr, buildSteps]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev + 1 >= steps.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps.length]);

  const inBest = (i) => current && i >= current.bestStart && i <= current.bestEnd;
  const inCur = (i) => current && i >= current.curStart && i <= current.curEnd;

  const cellColor = (i) => {
    if (!current) return '#1a2a3a';
    if (i === current.i && !current.done) return current.restarted ? '#ff2d78' : '#00d9a3';
    if (inBest(i)) return '#1d9e75';
    if (inCur(i)) return '#ef9f27';
    return '#1a2a3a';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Kadane's Algorithm?"
        description="Kadane's finds the contiguous subarray with the largest sum in a single pass. The key insight: the best subarray ending at index i is either just a[i] on its own, or a[i] appended to the best subarray ending at i-1 — whichever is larger. Track that running value and the global best; that's dynamic programming compressed into two variables."
        timeComplexity="O(n)"
        spaceComplexity="O(1)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'cur (ending here)', value: current?.cur ?? arr[0], color: '#ef9f27' },
          { label: 'best (answer)', value: current?.best ?? arr[0], color: '#1d9e75' },
          { label: 'Time', value: 'O(n)', color: '#ff6b4a' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 120 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '20px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              minWidth: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${cellColor(i)}22`, border: `2px solid ${cellColor(i)}`, borderRadius: 8,
              fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: cellColor(i), transition: 'all 0.25s',
            }}>{v}</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: current?.i === i ? '#00d9a3' : '#2a3a4a' }}>{i}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to sweep the array.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00d9a3', 'Current index'], ['#ff2d78', 'Restart here'], ['#ef9f27', 'Current window'], ['#1d9e75', 'Best window']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `${c}22`, border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <VisualizerControls
        isPlaying={isPlaying} onPlayPause={() => setIsPlaying((p) => !p)}
        onStepForward={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))}
        onStepBackward={() => setStepIdx((p) => Math.max(p - 1, 0))}
        onReset={() => { setStepIdx(-1); setIsPlaying(false); }}
        speed={speed} onSpeedChange={setSpeed}
        currentStep={Math.max(0, stepIdx + 1)} totalSteps={steps.length}
        onRandomize={() => setArr(generateArray(size))}
        arraySize={size} onArraySizeChange={(n) => { setSize(n); setArr(generateArray(n)); }}
      />

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}
