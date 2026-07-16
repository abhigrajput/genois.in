'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `void heapify(int a[], int n, int i) {
  int largest = i, l = 2*i+1, r = 2*i+2;
  if (l < n && a[l] > a[largest]) largest = l;
  if (r < n && a[r] > a[largest]) largest = r;
  if (largest != i) {
    swap(a[i], a[largest]);
    heapify(a, n, largest);
  }
}
void heapSort(int a[], int n) {
  for (int i = n/2-1; i >= 0; i--) heapify(a, n, i);
  for (int i = n-1; i > 0; i--) {
    swap(a[0], a[i]);
    heapify(a, i, 0);
  }
}`;

const SNIPPETS = {
  python: `def heapify(a, n, i):
    largest, l, r = i, 2*i+1, 2*i+2
    if l < n and a[l] > a[largest]: largest = l
    if r < n and a[r] > a[largest]: largest = r
    if largest != i:
        a[i], a[largest] = a[largest], a[i]
        heapify(a, n, largest)

def heap_sort(a):
    n = len(a)
    for i in range(n//2 - 1, -1, -1): heapify(a, n, i)
    for i in range(n-1, 0, -1):
        a[0], a[i] = a[i], a[0]
        heapify(a, i, 0)`,
  java: `void heapify(int[] a, int n, int i) {
  int largest = i, l = 2*i+1, r = 2*i+2;
  if (l < n && a[l] > a[largest]) largest = l;
  if (r < n && a[r] > a[largest]) largest = r;
  if (largest != i) {
    int t = a[i]; a[i] = a[largest]; a[largest] = t;
    heapify(a, n, largest);
  }
}
void heapSort(int[] a) {
  int n = a.length;
  for (int i = n/2-1; i >= 0; i--) heapify(a, n, i);
  for (int i = n-1; i > 0; i--) {
    int t = a[0]; a[0] = a[i]; a[i] = t;
    heapify(a, i, 0);
  }
}`,
  javascript: `function heapify(a, n, i) {
  let largest = i, l = 2*i+1, r = 2*i+2;
  if (l < n && a[l] > a[largest]) largest = l;
  if (r < n && a[r] > a[largest]) largest = r;
  if (largest !== i) {
    [a[i], a[largest]] = [a[largest], a[i]];
    heapify(a, n, largest);
  }
}
function heapSort(a) {
  const n = a.length;
  for (let i = ((n>>1)-1); i >= 0; i--) heapify(a, n, i);
  for (let i = n-1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    heapify(a, i, 0);
  }
}`,
};

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(input) {
  const a = [...input];
  const n = a.length;
  const steps = [];
  let comparisons = 0, swaps = 0;

  const push = (extra) => steps.push({
    array: [...a], comparing: [], swapping: [], sortedFrom: n, heapRange: n,
    comparisons, swaps, ...extra,
  });

  function heapify(size, i, phase) {
    let largest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < size) {
      comparisons++;
      push({ comparing: [l, largest], sortedFrom: phase === 'sort' ? size : n, heapRange: size, activeLine: 2,
        explanation: `Heapify at index ${i}: compare left child a[${l}]=${a[l]} with current largest a[${largest}]=${a[largest]}.`, status: 'compare' });
      if (a[l] > a[largest]) largest = l;
    }
    if (r < size) {
      comparisons++;
      push({ comparing: [r, largest], sortedFrom: phase === 'sort' ? size : n, heapRange: size, activeLine: 3,
        explanation: `Compare right child a[${r}]=${a[r]} with current largest a[${largest}]=${a[largest]}.`, status: 'compare' });
      if (a[r] > a[largest]) largest = r;
    }
    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      swaps++;
      push({ swapping: [i, largest], sortedFrom: phase === 'sort' ? size : n, heapRange: size, activeLine: 5,
        explanation: `Largest child (a[${largest}]) beats parent a[${i}] — swap so the bigger value floats up, then sift down.`, status: 'sorted' });
      heapify(size, largest, phase);
    }
  }

  push({ activeLine: 10, explanation: '🏗️ Phase 1 — build a MAX-heap: heapify every internal node bottom-up so the largest element ends at the root (index 0).', status: 'info' });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i, 'build');

  push({ activeLine: 11, sortedFrom: n, heapRange: n, explanation: '✅ Max-heap built. Phase 2 — repeatedly move the root (max) to the end and shrink the heap.', status: 'pivot' });
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    swaps++;
    push({ swapping: [0, i], sortedFrom: i, heapRange: i, activeLine: 12,
      explanation: `Swap root a[0] (current max = ${a[i]}) with a[${i}]. Position ${i} is now locked in its final sorted place.`, status: 'sorted' });
    heapify(i, 0, 'sort');
  }
  push({ sortedFrom: 0, heapRange: 0, activeLine: -1, done: true, explanation: '🎉 Sorted! Heap Sort runs in O(n log n) worst-case with O(1) extra space — but it is NOT stable.', status: 'sorted' });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done || idx >= step.sortedFrom) return '#1d9e75';
  if (step.swapping?.includes(idx)) return '#ff2d78';
  if (step.comparing?.includes(idx)) return '#00d9a3';
  if (idx < step.heapRange) return '#2a3a4a';
  return '#1a2a3a';
}

export default function HeapSortVisualizer() {
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
  const displayArr = current ? current.array : arr;

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

  const maxVal = Math.max(...arr, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Heap Sort?"
        description="Heap Sort turns the array into a binary max-heap (parent ≥ children), then repeatedly swaps the root (the maximum) to the end and sifts the new root down over a shrinking heap. It combines the O(n log n) guarantee of merge sort with the O(1) in-place memory of an in-place sort — the trade-off is that it is not stable and has poor cache locality."
        timeComplexity="O(n log n)"
        spaceComplexity="O(1)"
        stable={false}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Comparisons', value: current?.comparisons ?? 0, color: '#00d9a3' },
          { label: 'Swaps', value: current?.swaps ?? 0, color: '#ff2d78' },
          { label: 'Time', value: 'O(n log n)', color: '#ff6b4a' },
          { label: 'Space', value: 'O(1)', color: '#1d9e75' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: '24px 16px', minHeight: 200, display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'center' }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, maxWidth: 60 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: barColor(i, current) }}>{v}</span>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(v / maxVal) * 160}px`, background: barColor(i, current), transition: 'all 0.3s ease', minHeight: 4, boxShadow: current?.swapping?.includes(i) ? '0 0 12px #ff2d7880' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#2a3a4a' }}>{i}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to build the heap and sort.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#2a3a4a', 'In heap'], ['#00d9a3', 'Comparing'], ['#ff2d78', 'Swapping'], ['#1d9e75', 'Sorted (locked)']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: c, border: `1px solid ${c}` }} />
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
