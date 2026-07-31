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
    if (!current) return 'var(--gx-surface-2)';
    if (current.found && (idx === current.lo || idx === current.hi)) return 'var(--gx-success)';
    if (idx === current.lo) return 'var(--gx-accent)';
    if (idx === current.hi) return 'var(--gx-warning)';
    if (idx > current.lo && idx < current.hi) return 'var(--gx-surface-3)';
    return 'var(--gx-surface-2)';
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
          { label: 'Target', value: target, color: 'var(--gx-warning)' },
          { label: 'a[lo] + a[hi]', value: current?.sum ?? '-', color: 'var(--gx-accent)' },
          { label: 'lo → ← hi', value: current ? `${current.lo} , ${current.hi}` : '-', color: 'var(--gx-warning)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bars with pointer labels */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'center', minHeight: 190 }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, maxWidth: 60 }}>
            <div style={{ height: 18, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: i === current?.lo ? 'var(--gx-accent)' : i === current?.hi ? 'var(--gx-warning)' : 'transparent' }}>
              {i === current?.lo && i === current?.hi ? 'lo/hi' : i === current?.lo ? 'lo →' : i === current?.hi ? '← hi' : '·'}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: cellColor(i) }}>{v}</span>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(v / maxVal) * 120}px`, background: cellColor(i), transition: 'all 0.3s ease', minHeight: 4 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--gx-text-subtle)' }}>{i}</span>
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
        {[['var(--gx-accent)', 'Left pointer (lo)'], ['var(--gx-warning)', 'Right pointer (hi)'], ['var(--gx-surface-3)', 'Search space'], ['var(--gx-success)', 'Found pair']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c, border: `1px solid ${c}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setStepIdx((p) => Math.max(p - 1, 0))} style={ctrlBtn('var(--gx-text-muted)')}>⏮</button>
        <button onClick={() => setIsPlaying((p) => !p)} style={{ ...ctrlBtn('var(--gx-accent)'), background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', minWidth: 80, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))} style={ctrlBtn('var(--gx-text-muted)')}>⏭</button>
        <button onClick={() => { setStepIdx(-1); setIsPlaying(false); }} style={{ ...ctrlBtn('var(--gx-danger)'), background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', fontFamily: 'var(--font-body)' }}>↺ Reset</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>SPEED</span>
          {[1, 2, 3, 4].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)', background: speed === s ? 'var(--gx-accent-soft)' : 'transparent', color: speed === s ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <button onClick={() => setArr(generateSorted(size))} style={{ ...ctrlBtn('var(--gx-success)'), background: 'var(--gx-success-soft)', border: '1px solid var(--gx-success-border)', marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 12 }}>🎲 New array + target</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>SIZE</span>
          <input type="range" min={5} max={11} value={size} onChange={(e) => { const n = Number(e.target.value); setSize(n); setArr(generateSorted(n)); }} style={{ width: 80, accentColor: 'var(--gx-accent)', cursor: 'pointer' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-accent)' }}>{size}</span>
        </div>
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}

const ctrlBtn = (color) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, background: 'transparent', color, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' });
