'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `for(int i = 0; i < n-1; i++) {
  int minIdx = i;
  for(int j = i+1; j < n; j++) {
    if(arr[j] < arr[minIdx])
      minIdx = j;
  }
  swap(arr[i], arr[minIdx]);
}`;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      const isNewMin = a[j] < a[minIdx];
      steps.push({
        array: [...a],
        current: i,
        minIdx,
        scanning: j,
        sortedUpto: i,
        codeLine: isNewMin ? 3 : 2,
        explanation: isNewMin
          ? `🔍 arr[${j}]=${a[j]} < arr[${minIdx}]=${a[minIdx]} — new minimum found! Updating minIdx from ${minIdx} to ${j}.`
          : `🔍 Scanning arr[${j}]=${a[j]}. Current minimum is arr[${minIdx}]=${a[minIdx]}. No update needed.`,
        status: isNewMin ? 'found' : 'compare',
        activeLine: isNewMin ? 3 : 2,
      });
      if (isNewMin) minIdx = j;
    }
    const prevMin = minIdx;
    let t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
    steps.push({
      array: [...a],
      current: -1,
      minIdx: -1,
      scanning: -1,
      sortedUpto: i + 1,
      swapped: [i, prevMin],
      codeLine: 6,
      explanation: `🔄 Minimum of unsorted portion was arr[${prevMin}]. Swapping it with arr[${i}] to place it at position ${i} — its correct sorted location.`,
      status: 'sorted',
      activeLine: 6,
    });
  }
  steps.push({
    array: [...a],
    current: -1,
    minIdx: -1,
    scanning: -1,
    sortedUpto: n,
    codeLine: -1,
    done: true,
    explanation: '✅ Array fully sorted! Selection Sort made exactly n-1 swaps to place each minimum.',
    status: 'sorted',
    activeLine: -1,
  });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) return '#1d9e75';
  if (idx < step.sortedUpto) return '#1d9e75';
  if (step.swapped?.includes(idx)) return '#1d9e75';
  if (idx === step.minIdx) return '#ef9f27';
  if (idx === step.current) return '#00d9a3';
  if (idx === step.scanning) return '#ff6b4a';
  return '#1a2a3a';
}

export default function SelectionSortVisualizer() {
  const [size, setSize] = useState(8);
  const [arr, setArr] = useState(() => generateArray(8));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  useEffect(() => { setSteps(computeSteps(arr)); setStepIdx(-1); setIsPlaying(false); }, [arr]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const displayArr = current ? current.array : arr;
  const maxVal = Math.max(...arr, 1);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is Selection Sort?"
        description="Selection Sort finds the minimum element from the unsorted portion and places it at the beginning. It makes exactly n-1 swaps regardless of input, making it useful when write operations are expensive. The array is divided into a sorted left portion and unsorted right portion."
        timeComplexity="O(n²)"
        spaceComplexity="O(1)"
        stable={false}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Current Pass', value: current ? Math.min(current.sortedUpto + 1, arr.length) : 1, color: '#00d9a3' },
          { label: 'Min Index', value: current?.minIdx ?? '-', color: '#ef9f27' },
          { label: 'Time', value: 'O(n²)', color: '#ff6b4a' },
          { label: 'Space', value: 'O(1)', color: '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,217,163,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, maxWidth:60 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:barColor(i, current) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', boxShadow: current?.minIdx === i ? `0 0 14px #ef9f2780` : 'none', minHeight:4 }} />
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to start the visualization.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#1d9e75','Sorted'],['#00d9a3','Current Position'],['#ef9f27','Minimum Found'],['#ff6b4a','Scanning']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'var(--font-body)' }}>{l}</span>
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
        onRandomize={() => setArr(generateArray(size))}
        arraySize={size} onArraySizeChange={n => { setSize(n); setArr(generateArray(n)); }}
      />
      <CodePanel code={CODE} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}
