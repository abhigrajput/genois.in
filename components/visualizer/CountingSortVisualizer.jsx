'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `void countingSort(int a[], int n, int k) {
  int count[k+1] = {0};
  for (int i = 0; i < n; i++) count[a[i]]++;      // tally
  for (int v = 1; v <= k; v++) count[v] += count[v-1]; // prefix sums
  int out[n];
  for (int i = n-1; i >= 0; i--)                   // stable placement
    out[--count[a[i]]] = a[i];
  for (int i = 0; i < n; i++) a[i] = out[i];
}`;

const SNIPPETS = {
  python: `def counting_sort(a, k):
    count = [0] * (k + 1)
    for x in a: count[x] += 1          # tally
    for v in range(1, k + 1):
        count[v] += count[v - 1]       # prefix sums
    out = [0] * len(a)
    for x in reversed(a):              # stable placement
        count[x] -= 1
        out[count[x]] = x
    return out`,
  java: `void countingSort(int[] a, int k) {
  int n = a.length;
  int[] count = new int[k + 1];
  for (int x : a) count[x]++;            // tally
  for (int v = 1; v <= k; v++)
    count[v] += count[v - 1];            // prefix sums
  int[] out = new int[n];
  for (int i = n - 1; i >= 0; i--)       // stable placement
    out[--count[a[i]]] = a[i];
  System.arraycopy(out, 0, a, 0, n);
}`,
  javascript: `function countingSort(a, k) {
  const count = new Array(k + 1).fill(0);
  for (const x of a) count[x]++;         // tally
  for (let v = 1; v <= k; v++)
    count[v] += count[v - 1];            // prefix sums
  const out = new Array(a.length);
  for (let i = a.length - 1; i >= 0; i--) // stable placement
    out[--count[a[i]]] = a[i];
  return out;
}`,
};

const K = 9; // values 0..9 keeps the count array readable

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (K + 1)));
}

function computeSteps(input) {
  const a = [...input];
  const n = a.length;
  const steps = [];
  const count = new Array(K + 1).fill(0);
  const out = new Array(n).fill(null);

  const snap = (extra) => steps.push({
    array: [...a], count: [...count], out: [...out],
    scanIdx: -1, countIdx: -1, placeIdx: -1, phase: 'tally', ...extra,
  });

  snap({ activeLine: 2, explanation: '🔢 Phase 1 — TALLY: walk the array and count how many times each value appears. No comparisons at all — that is why it beats O(n log n).', status: 'info' });
  for (let i = 0; i < n; i++) {
    count[a[i]]++;
    snap({ scanIdx: i, countIdx: a[i], activeLine: 2, phase: 'tally',
      explanation: `See a[${i}]=${a[i]} → count[${a[i]}] becomes ${count[a[i]]}.`, status: 'compare' });
  }

  snap({ activeLine: 3, phase: 'prefix', explanation: '➕ Phase 2 — PREFIX SUMS: turn counts into positions. count[v] becomes "how many values ≤ v", i.e. the end index for value v.', status: 'pivot' });
  for (let v = 1; v <= K; v++) {
    count[v] += count[v - 1];
    snap({ countIdx: v, activeLine: 3, phase: 'prefix',
      explanation: `count[${v}] += count[${v - 1}] → ${count[v]}. Values ≤ ${v} occupy the first ${count[v]} output slots.`, status: 'pivot' });
  }

  snap({ activeLine: 5, phase: 'place', explanation: '📥 Phase 3 — PLACE: scan the input RIGHT-to-LEFT so equal keys keep their original order (this is what makes counting sort STABLE).', status: 'info' });
  for (let i = n - 1; i >= 0; i--) {
    const v = a[i];
    count[v]--;
    const pos = count[v];
    out[pos] = v;
    snap({ scanIdx: i, countIdx: v, placeIdx: pos, activeLine: 5, phase: 'place',
      explanation: `a[${i}]=${v}: decrement count[${v}] to ${pos}, then place ${v} at out[${pos}].`, status: 'sorted' });
  }

  for (let i = 0; i < n; i++) a[i] = out[i];
  snap({ array: [...a], out: [...out], activeLine: 7, phase: 'done', done: true,
    explanation: '🎉 Sorted in O(n + k) time. Counting sort is only worth it when the value range k is not much larger than n.', status: 'sorted' });
  return steps;
}

export default function CountingSortVisualizer() {
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
  const view = current || { array: arr, count: new Array(K + 1).fill(0), out: new Array(arr.length).fill(null), scanIdx: -1, countIdx: -1, placeIdx: -1 };

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

  const cell = (val, active, activeColor) => ({
    minWidth: 30, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? `${activeColor}22` : 'rgba(10,15,30,0.8)',
    border: `1px solid ${active ? activeColor : 'rgba(0,217,163,0.12)'}`,
    borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
    color: val === null ? '#2a3a4a' : active ? activeColor : '#c8d8e8', transition: 'all 0.25s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Counting Sort?"
        description="Counting Sort is a non-comparison sort for integers in a bounded range [0, k]. It tallies each value, converts the tallies to prefix sums (final positions), then places each element directly into its slot. Because it never compares elements, it breaks the O(n log n) comparison lower bound and runs in linear O(n + k) — but only when k stays comparable to n."
        timeComplexity="O(n + k)"
        spaceComplexity="O(n + k)"
        stable={true}
      />

      {/* Input array */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>INPUT ARRAY</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {view.array.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={cell(v, i === view.scanIdx, '#00d9a3')}>{v}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#2a3a4a' }}>{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Count array */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(239,159,39,0.15)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ef9f27', letterSpacing: 1, marginBottom: 8 }}>
          COUNT ARRAY {current?.phase === 'prefix' ? '(→ prefix sums / positions)' : current?.phase === 'place' ? '(consumed right-to-left)' : '(tallies)'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {view.count.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={cell(v, i === view.countIdx, '#ef9f27')}>{v}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#5a7a9a' }}>[{i}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Output array */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1d9e75', letterSpacing: 1, marginBottom: 8 }}>OUTPUT ARRAY</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {view.out.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={cell(v, i === view.placeIdx, '#1d9e75')}>{v === null ? '·' : v}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#2a3a4a' }}>{i}</span>
            </div>
          ))}
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to tally, build prefix sums, and place elements.'}
        status={current?.status ?? 'default'}
      />

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
