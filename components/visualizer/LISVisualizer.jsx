'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1100, 2: 650, 3: 300, 4: 130 };

const CODE = `int lengthOfLIS(int a[], int n) {
  int dp[n];
  int best = 0;
  for (int i = 0; i < n; i++) {
    dp[i] = 1;                       // a[i] alone
    for (int j = 0; j < i; j++)
      if (a[j] < a[i])               // can extend
        dp[i] = max(dp[i], dp[j] + 1);
    best = max(best, dp[i]);
  }
  return best;
}`;

const SNIPPETS = {
  python: `def length_of_lis(a):
    n = len(a)
    dp = [1] * n                     # a[i] alone
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]:          # can extend
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp) if dp else 0`,
  java: `int lengthOfLIS(int[] a) {
  int n = a.length, best = 0;
  int[] dp = new int[n];
  for (int i = 0; i < n; i++) {
    dp[i] = 1;                       // a[i] alone
    for (int j = 0; j < i; j++)
      if (a[j] < a[i])               // can extend
        dp[i] = Math.max(dp[i], dp[j] + 1);
    best = Math.max(best, dp[i]);
  }
  return best;
}`,
  javascript: `function lengthOfLIS(a) {
  const n = a.length, dp = new Array(n).fill(1);
  let best = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++)
      if (a[j] < a[i])               // can extend
        dp[i] = Math.max(dp[i], dp[j] + 1);
    best = Math.max(best, dp[i]);
  }
  return best;
}`,
};

function generateArray(size) {
  const s = new Set();
  while (s.size < size) s.add(Math.floor(Math.random() * 40) + 1);
  return [...s];
}

function computeSteps(input) {
  const a = [...input];
  const n = a.length;
  const dp = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);
  const steps = [];
  let best = 1, bestEnd = 0;

  for (let i = 0; i < n; i++) {
    dp[i] = 1;
    steps.push({ dp: [...dp], prev: [...prev], i, j: -1, best, bestEnd, activeLine: 4, status: 'info',
      explanation: `Start dp[${i}] = 1 — the subsequence containing only a[${i}]=${a[i]}. Now look at every earlier element it could extend.` });
    for (let j = 0; j < i; j++) {
      const canExtend = a[j] < a[i];
      const improved = canExtend && dp[j] + 1 > dp[i];
      if (improved) { dp[i] = dp[j] + 1; prev[i] = j; }
      steps.push({ dp: [...dp], prev: [...prev], i, j, activeLine: canExtend ? 7 : 6, best, bestEnd,
        status: improved ? 'sorted' : canExtend ? 'compare' : 'mismatch',
        explanation: canExtend
          ? `a[${j}]=${a[j]} < a[${i}]=${a[i]}, so a[${i}] can follow it. dp[${j}]+1 = ${dp[j] + 1}` + (improved ? ` — longer than dp[${i}], update dp[${i}]=${dp[i]}.` : ` — not longer than dp[${i}]=${dp[i]}, keep it.`)
          : `a[${j}]=${a[j]} ≥ a[${i}]=${a[i]} — can't extend an increasing subsequence, skip.` });
    }
    if (dp[i] > best) { best = dp[i]; bestEnd = i; }
    steps.push({ dp: [...dp], prev: [...prev], i, j: -1, best, bestEnd, activeLine: 8, status: 'pivot',
      explanation: `dp[${i}] finalised = ${dp[i]}. Longest increasing subsequence so far = ${best}.` });
  }

  // Reconstruct the LIS indices for the final highlight.
  const chain = [];
  let k = bestEnd;
  while (k !== -1) { chain.unshift(k); k = prev[k]; }
  steps.push({ dp: [...dp], prev: [...prev], i: -1, j: -1, best, bestEnd, chain, done: true, activeLine: 10, status: 'sorted',
    explanation: `🎉 Longest Increasing Subsequence length = ${best}. One such subsequence: [${chain.map((idx) => a[idx]).join(', ')}]. This O(n²) DP compares every pair; a patience-sorting variant does it in O(n log n).` });
  return steps;
}

export default function LISVisualizer() {
  const [size, setSize] = useState(8);
  const [arr, setArr] = useState(() => generateArray(8));
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
  const dp = current?.dp ?? new Array(arr.length).fill(1);

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

  const cellColor = (idx) => {
    if (!current) return 'var(--gx-surface-2)';
    if (current.chain?.includes(idx)) return 'var(--gx-success)';
    if (idx === current.i) return 'var(--gx-accent)';
    if (idx === current.j) return 'var(--gx-warning)';
    return 'var(--gx-surface-2)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Longest Increasing Subsequence (LIS)?"
        description="LIS finds the length of the longest subsequence whose values strictly increase (elements need not be adjacent). The O(n²) DP defines dp[i] as the longest increasing subsequence ENDING at index i: for each i, check every earlier j with a[j] < a[i] and take the best dp[j] + 1. The answer is the maximum dp value."
        timeComplexity="O(n²)"
        spaceComplexity="O(n)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'LIS length', value: current?.best ?? 1, color: 'var(--gx-success)' },
          { label: 'i (building)', value: current?.i >= 0 ? current.i : '–', color: 'var(--gx-accent)' },
          { label: 'j (comparing)', value: current?.j >= 0 ? current.j : '–', color: 'var(--gx-warning)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {arr.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 40 }}>
              <div style={{ height: 44, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cellColor(i)}22`, border: `2px solid ${cellColor(i)}`, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: cellColor(i), transition: 'all 0.25s' }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-accent)', fontWeight: 700 }}>{dp[i]}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--gx-text-subtle)' }}>i={i}</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gx-text-muted)', marginTop: 6 }}>Top row = values · green number = dp[i] (LIS length ending at i)</div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to fill dp[] and reconstruct the subsequence.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['var(--gx-accent)', 'Current i'], ['var(--gx-warning)', 'Comparing j'], ['var(--gx-success)', 'Final LIS']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, ${c} 13%, transparent)`, border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l}</span>
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
