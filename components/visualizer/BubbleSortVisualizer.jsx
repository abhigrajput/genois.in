'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `for(int i = 0; i < n-1; i++) {
  for(int j = 0; j < n-i-1; j++) {
    if(arr[j] > arr[j+1]) {
      swap(arr[j], arr[j+1]);
    }
  }
}`;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      const before = [...a];
      const swapped = a[j] > a[j + 1];
      if (swapped) { let t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapped: swapped ? [j, j + 1] : [],
        sortedFrom: n - i - 1,
        codeLine: swapped ? 3 : 2,
        comparisons: steps.length + 1,
        swaps: steps.filter(s => s.swapped?.length).length + (swapped ? 1 : 0),
        explanation: swapped
          ? `🔄 arr[${j}]=${before[j]} > arr[${j + 1}]=${before[j + 1]}, so we SWAP them. ${before[j]} moves right toward its sorted position.`
          : `🔍 Comparing arr[${j}]=${before[j]} with arr[${j + 1}]=${before[j + 1]}. Since ${before[j]} ≤ ${before[j + 1]}, no swap needed. Larger element is already on the right.`,
        status: swapped ? 'sorted' : 'compare',
        activeLine: swapped ? 3 : 2,
      });
    }
  }
  steps.push({
    array: [...a],
    comparing: [],
    swapped: [],
    sortedFrom: 0,
    codeLine: -1,
    done: true,
    comparisons: steps.length,
    swaps: steps.filter(s => s.swapped?.length).length,
    explanation: '✅ Array fully sorted! Each element bubbled to its correct position.',
    status: 'sorted',
    activeLine: -1,
  });
  return steps;
}

function barColor(idx, step) {
  if (step.done) return '#1d9e75';
  if (idx >= step.sortedFrom) return '#1d9e75';
  if (step.swapped?.includes(idx)) return '#1d9e75';
  if (step.comparing?.includes(idx)) return '#00f0ff';
  return '#1a2a3a';
}

export default function BubbleSortVisualizer() {
  const [size, setSize] = useState(8);
  const [arr, setArr] = useState(() => generateArray(8));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const buildSteps = useCallback((a) => {
    const s = computeSteps(a);
    setSteps(s);
    setStepIdx(-1);
    setIsPlaying(false);
  }, []);

  useEffect(() => { buildSteps(arr); }, [arr]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const displayArr = current ? current.array : arr;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx(prev => {
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
        title="What is Bubble Sort?"
        description="Bubble Sort repeatedly compares adjacent elements and swaps them if they're in the wrong order. After each pass, the largest unsorted element bubbles up to its correct position at the right side of the array. Simple but inefficient for large arrays."
        timeComplexity="O(n²)"
        spaceComplexity="O(1)"
        stable={true}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Comparisons', value: current?.comparisons ?? 0, color: '#00f0ff' },
          { label: 'Swaps', value: current?.swaps ?? 0, color: '#ef9f27' },
          { label: 'Time', value: 'O(n²)', color: '#7b5cff' },
          { label: 'Space', value: 'O(1)', color: '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`,
            borderRadius: 8, padding: '8px 16px', minWidth: 100,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{
        background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)',
        borderRadius: 12, padding: '24px 16px', minHeight: 200,
        display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'center',
      }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, maxWidth: 60 }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: barColor(i, current || {}) }}>{v}</span>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              height: `${(v / maxVal) * 160}px`,
              background: barColor(i, current || {}),
              transition: 'all 0.3s ease',
              boxShadow: current?.comparing?.includes(i) ? `0 0 12px ${barColor(i, current || {})}80` : 'none',
              minHeight: 4,
            }} />
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to start the visualization.'}
        status={current?.status ?? 'default'}
      />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#1a2a3a','Unsorted'],['#00f0ff','Comparing'],['#1d9e75','Sorted']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c, border:`1px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>{l}</span>
          </div>
        ))}
      </div>

      <VisualizerControls
        isPlaying={isPlaying} onPlayPause={() => setIsPlaying(p => !p)}
        onStepForward={() => setStepIdx(p => Math.min(p + 1, steps.length - 1))}
        onStepBackward={() => setStepIdx(p => Math.max(p - 1, 0))}
        onReset={() => { setStepIdx(-1); setIsPlaying(false); }}
        speed={speed} onSpeedChange={setSpeed}
        currentStep={Math.max(0, stepIdx + 1)} totalSteps={steps.length}
        onRandomize={() => { const a = generateArray(size); setArr(a); }}
        arraySize={size} onArraySizeChange={n => { setSize(n); setArr(generateArray(n)); }}
      />

      <CodePanel code={CODE} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}
