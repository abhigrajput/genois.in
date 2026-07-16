'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1100, 2: 650, 3: 320, 4: 140 };

const CODE = `// Two Pointers on a SORTED array — find a pair summing to target
bool twoSum(int a[], int n, int target) {
  int lo = 0, hi = n - 1;
  while (lo < hi) {
    int sum = a[lo] + a[hi];
    if (sum == target) return true;   // found the pair
    else if (sum < target) lo++;      // need a bigger sum → move left up
    else hi--;                        // need a smaller sum → move right down
  }
  return false;
}`;

const SNIPPETS = {
  python: `def two_sum(a, target):        # a is sorted ascending
    lo, hi = 0, len(a) - 1
    while lo < hi:
        s = a[lo] + a[hi]
        if s == target: return (lo, hi)  # found
        elif s < target: lo += 1         # need bigger sum
        else: hi -= 1                     # need smaller sum
    return None`,
  java: `boolean twoSum(int[] a, int target) {
  int lo = 0, hi = a.length - 1;
  while (lo < hi) {
    int sum = a[lo] + a[hi];
    if (sum == target) return true;   // found
    else if (sum < target) lo++;      // need bigger sum
    else hi--;                        // need smaller sum
  }
  return false;
}`,
  javascript: `function twoSum(a, target) {       // a sorted ascending
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const sum = a[lo] + a[hi];
    if (sum === target) return [lo, hi]; // found
    else if (sum < target) lo++;         // need bigger sum
    else hi--;                           // need smaller sum
  }
  return null;
}`,
};

function generateSorted(size) {
  const s = new Set();
  while (s.size < size) s.add(Math.floor(Math.random() * 30) + 1);
  return [...s].sort((a, b) => a - b);
}

function computeSteps(a, target) {
  const steps = [];
  let lo = 0, hi = a.length - 1;
  steps.push({ lo, hi, sum: a[lo] + a[hi], target, activeLine: 3, status: 'info', found: false,
    explanation: `Array is SORTED. Put one pointer at each end: lo=${lo} (a=${a[lo]}), hi=${hi} (a=${a[hi]}). Target = ${target}.` });

  while (lo < hi) {
    const sum = a[lo] + a[hi];
    if (sum === target) {
      steps.push({ lo, hi, sum, target, activeLine: 6, status: 'sorted', found: true, done: true,
        explanation: `a[${lo}] + a[${hi}] = ${a[lo]} + ${a[hi]} = ${sum} = target. 🎯 Found the pair! One linear pass, no nested loop, no hash map.` });
      return steps;
    } else if (sum < target) {
      steps.push({ lo, hi, sum, target, activeLine: 7, status: 'compare',
        explanation: `Sum ${sum} < target ${target}. The largest element a[${hi}]=${a[hi]} is fixed for now; to grow the sum, move the LEFT pointer up (a[${lo}]=${a[lo]} → a[${lo + 1}]=${a[lo + 1]}).` });
      lo++;
    } else {
      steps.push({ lo, hi, sum, target, activeLine: 8, status: 'mismatch',
        explanation: `Sum ${sum} > target ${target}. To shrink the sum, move the RIGHT pointer down (a[${hi}]=${a[hi]} → a[${hi - 1}]=${a[hi - 1]}).` });
      hi--;
    }
  }
  steps.push({ lo, hi, sum: null, target, activeLine: 10, status: 'mismatch', found: false, done: true,
    explanation: `Pointers crossed (lo ≥ hi) without hitting the target — no pair sums to ${target}. O(n) time, O(1) space.` });
  return steps;
}

export default function TwoPointersVisualizer() {
  const [size, setSize] = useState(8);
  const [arr, setArr] = useState(() => generateSorted(8));
  const [target, setTarget] = useState(() => 0);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  // Pick a target that is usually achievable so the demo lands on a match.
  const pickTarget = useCallback((a) => {
    const i = Math.floor(Math.random() * a.length);
    let j = Math.floor(Math.random() * a.length);
    if (j === i) j = (j + 1) % a.length;
    return a[i] + a[j];
  }, []);

  const rebuild = useCallback((a, t) => {
    setSteps(computeSteps(a, t));
    setStepIdx(-1);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const t = pickTarget(arr);
    setTarget(t);
    rebuild(arr, t);
  }, [arr, pickTarget, rebuild]);

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

  const cellColor = (idx) => {
    if (!current) return '#1a2a3a';
    if (current.found && (idx === current.lo || idx === current.hi)) return '#1d9e75';
    if (idx === current.lo) return '#00d9a3';
    if (idx === current.hi) return '#ff6b4a';
    if (idx > current.lo && idx < current.hi) return '#2a3a4a';
    return '#1a2a3a';
  };
  const maxVal = Math.max(...arr, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is the Two Pointers technique?"
        description="On a SORTED array, two pointers starting at opposite ends converge toward each other. To find a pair summing to a target: if the current sum is too small, advance the left pointer (only larger values ahead); if too big, retreat the right pointer. Each element is visited once, replacing an O(n²) brute-force scan with a single O(n) pass and O(1) memory."
        timeComplexity="O(n)"
        spaceComplexity="O(1)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Target', value: target, color: '#ef9f27' },
          { label: 'a[lo] + a[hi]', value: current?.sum ?? '-', color: '#00d9a3' },
          { label: 'lo → ← hi', value: current ? `${current.lo} , ${current.hi}` : '-', color: '#ff6b4a' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bars with pointer labels */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'center', minHeight: 190 }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, maxWidth: 60 }}>
            <div style={{ height: 18, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: i === current?.lo ? '#00d9a3' : i === current?.hi ? '#ff6b4a' : 'transparent' }}>
              {i === current?.lo && i === current?.hi ? 'lo/hi' : i === current?.lo ? 'lo →' : i === current?.hi ? '← hi' : '·'}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: cellColor(i) }}>{v}</span>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(v / maxVal) * 120}px`, background: cellColor(i), transition: 'all 0.3s ease', minHeight: 4 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#2a3a4a' }}>{i}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to converge the pointers.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00d9a3', 'Left pointer (lo)'], ['#ff6b4a', 'Right pointer (hi)'], ['#2a3a4a', 'Search space'], ['#1d9e75', 'Found pair']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c, border: `1px solid ${c}` }} />
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(0,217,163,0.12)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setStepIdx((p) => Math.max(p - 1, 0))} style={ctrlBtn('#5a7a9a')}>⏮</button>
        <button onClick={() => setIsPlaying((p) => !p)} style={{ ...ctrlBtn('#00d9a3'), background: 'rgba(0,217,163,0.12)', border: '1px solid rgba(0,217,163,0.35)', minWidth: 80, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))} style={ctrlBtn('#5a7a9a')}>⏭</button>
        <button onClick={() => { setStepIdx(-1); setIsPlaying(false); }} style={{ ...ctrlBtn('#ff2d78'), background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.25)', fontFamily: 'var(--font-body)' }}>↺ Reset</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>SPEED</span>
          {[1, 2, 3, 4].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid #00d9a3' : '1px solid rgba(0,217,163,0.15)', background: speed === s ? 'rgba(0,217,163,0.12)' : 'transparent', color: speed === s ? '#00d9a3' : '#5a7a9a', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <button onClick={() => setArr(generateSorted(size))} style={{ ...ctrlBtn('#1D9E75'), background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)', marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 12 }}>🎲 New array + target</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>SIZE</span>
          <input type="range" min={5} max={11} value={size} onChange={(e) => { const n = Number(e.target.value); setSize(n); setArr(generateSorted(n)); }} style={{ width: 80, accentColor: '#00d9a3', cursor: 'pointer' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3' }}>{size}</span>
        </div>
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}

const ctrlBtn = (color) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${color}30`, background: 'transparent', color, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' });
