'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1100, 2: 650, 3: 320, 4: 140 };

const CODE = `// Sliding Window Maximum — monotonic deque of indices
vector<int> maxSlidingWindow(vector<int>& a, int k) {
  deque<int> dq;                 // indices, values decreasing
  vector<int> res;
  for (int i = 0; i < a.size(); i++) {
    if (!dq.empty() && dq.front() <= i - k)
      dq.pop_front();            // drop index that left the window
    while (!dq.empty() && a[dq.back()] < a[i])
      dq.pop_back();             // drop smaller values — never max again
    dq.push_back(i);
    if (i >= k - 1)
      res.push_back(a[dq.front()]); // front is the window max
  }
  return res;
}`;

const SNIPPETS = {
  python: `from collections import deque
def max_sliding_window(a, k):
    dq, res = deque(), []          # dq holds indices, values decreasing
    for i, x in enumerate(a):
        if dq and dq[0] <= i - k:
            dq.popleft()           # index left the window
        while dq and a[dq[-1]] < x:
            dq.pop()               # smaller values can't be max
        dq.append(i)
        if i >= k - 1:
            res.append(a[dq[0]])   # front = window max
    return res`,
  java: `int[] maxSlidingWindow(int[] a, int k) {
  Deque<Integer> dq = new ArrayDeque<>();
  int[] res = new int[a.length - k + 1];
  for (int i = 0; i < a.length; i++) {
    if (!dq.isEmpty() && dq.peekFirst() <= i - k)
      dq.pollFirst();              // left the window
    while (!dq.isEmpty() && a[dq.peekLast()] < a[i])
      dq.pollLast();               // smaller values dropped
    dq.offerLast(i);
    if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
  }
  return res;
}`,
  javascript: `function maxSlidingWindow(a, k) {
  const dq = [], res = [];         // dq holds indices, values decreasing
  for (let i = 0; i < a.length; i++) {
    if (dq.length && dq[0] <= i - k) dq.shift();
    while (dq.length && a[dq[dq.length - 1]] < a[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) res.push(a[dq[0]]);
  }
  return res;
}`,
};

const K = 3;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 20) + 1);
}

function computeSteps(a, k) {
  const steps = [];
  const dq = []; // indices
  const res = [];

  const snap = (i, extra) => steps.push({ i, dq: [...dq], res: [...res], winStart: i - k + 1, ...extra });

  for (let i = 0; i < a.length; i++) {
    snap(i, { activeLine: 5, phase: 'enter', status: 'compare',
      explanation: `Consider a[${i}]=${a[i]}. Window covers indices [${Math.max(0, i - k + 1)}..${i}].` });

    if (dq.length && dq[0] <= i - k) {
      const gone = dq.shift();
      snap(i, { activeLine: 7, phase: 'popfront', status: 'mismatch',
        explanation: `Deque front (index ${gone}) has slid OUT of the window (≤ ${i} − ${k}). Pop it from the front.` });
    }
    while (dq.length && a[dq[dq.length - 1]] < a[i]) {
      const dropped = dq.pop();
      snap(i, { activeLine: 9, phase: 'popback', status: 'pivot',
        explanation: `a[${dropped}]=${a[dropped]} < a[${i}]=${a[i]}. A smaller value with a smaller index can never be the max while a[${i}] is in the window — pop it from the back.` });
    }
    dq.push(i);
    snap(i, { activeLine: 10, phase: 'push', status: 'compare',
      explanation: `Push index ${i}. The deque stays monotonically decreasing by value: [${dq.map((d) => a[d]).join(', ')}].` });

    if (i >= k - 1) {
      res.push(a[dq[0]]);
      snap(i, { activeLine: 12, phase: 'emit', status: 'sorted',
        explanation: `Window [${i - k + 1}..${i}] complete. Its maximum is a[${dq[0]}]=${a[dq[0]]} (always the deque FRONT). Record it.` });
    }
  }
  steps.push({ i: a.length - 1, dq: [...dq], res: [...res], winStart: -1, done: true, activeLine: -1, status: 'sorted',
    explanation: `🎉 Window maxima = [${res.join(', ')}]. Each index enters and leaves the deque once, so the whole sweep is O(n) — far better than O(n·k) recomputation.` });
  return steps;
}

export default function SlidingWindowVisualizer() {
  const [size, setSize] = useState(9);
  const [arr, setArr] = useState(() => generateArray(9));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const buildSteps = useCallback((a) => {
    setSteps(computeSteps(a, K));
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

  const inWindow = (idx) => current && !current.done && current.winStart >= 0 && idx >= current.winStart && idx <= current.i;
  const maxVal = Math.max(...arr, 1);

  const barColor = (idx) => {
    if (!current) return '#1a2a3a';
    if (current.dq?.[0] === idx && inWindow(idx)) return '#1d9e75'; // current max
    if (idx === current.i && !current.done) return '#00d9a3';
    if (current.dq?.includes(idx)) return '#ef9f27';
    if (inWindow(idx)) return '#2a3a4a';
    return '#1a2a3a';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Sliding Window Maximum?"
        description={`For every contiguous window of size k, report the maximum. The naive approach recomputes each window in O(k), giving O(n·k). A monotonic deque of indices — kept in decreasing order of value — lets us pop stale/smaller entries so the window's maximum is always at the front, achieving O(n). Here k = ${K}.`}
        timeComplexity="O(n)"
        spaceComplexity="O(k)"
      />

      {/* Bars */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '24px 16px 12px', minHeight: 180, display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'center' }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, maxWidth: 56 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: barColor(i) }}>{v}</span>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(v / maxVal) * 130}px`, background: barColor(i), transition: 'all 0.3s ease', minHeight: 4, opacity: inWindow(i) || current?.dq?.includes(i) || !current ? 1 : 0.35 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: current?.i === i ? '#00d9a3' : '#2a3a4a' }}>{i}</span>
          </div>
        ))}
      </div>

      {/* Deque + results */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(239,159,39,0.15)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ef9f27', letterSpacing: 1, marginBottom: 8 }}>DEQUE (indices, values ↓) — front = max</div>
          <div style={{ display: 'flex', gap: 6, minHeight: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            {current?.dq?.length ? current.dq.map((idx, pos) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ minWidth: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: pos === 0 ? 'rgba(29,158,117,0.2)' : 'rgba(239,159,39,0.12)', border: `2px solid ${pos === 0 ? '#1d9e75' : '#ef9f27'}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: pos === 0 ? '#1d9e75' : '#ef9f27' }}>{arr[idx]}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#5a7a9a' }}>i={idx}</span>
              </div>
            )) : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2a3a4a' }}>empty</span>}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1d9e75', letterSpacing: 1, marginBottom: 8 }}>WINDOW MAXIMA (result)</div>
          <div style={{ display: 'flex', gap: 6, minHeight: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            {current?.res?.length ? current.res.map((v, i) => (
              <div key={i} style={{ minWidth: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(29,158,117,0.15)', border: '2px solid rgba(29,158,117,0.5)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#1d9e75' }}>{v}</div>
            )) : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2a3a4a' }}>—</span>}
          </div>
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to slide the window and maintain the deque.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00d9a3', 'Current index'], ['#ef9f27', 'In deque'], ['#1d9e75', 'Window max'], ['#2a3a4a', 'In window']].map(([c, l]) => (
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
        <button onClick={() => setArr(generateArray(size))} style={{ ...ctrlBtn('#1D9E75'), background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)', marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 12 }}>🎲 Randomize</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1 }}>SIZE</span>
          <input type="range" min={5} max={12} value={size} onChange={(e) => { const n = Number(e.target.value); setSize(n); setArr(generateArray(n)); }} style={{ width: 80, accentColor: '#00d9a3', cursor: 'pointer' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3' }}>{size}</span>
        </div>
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}

const ctrlBtn = (color) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${color}30`, background: 'transparent', color, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' });
