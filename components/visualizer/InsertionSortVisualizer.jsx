'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `for(int i = 1; i < n; i++) {
  int key = arr[i];
  int j = i - 1;
  while(j >= 0 && arr[j] > key) {
    arr[j+1] = arr[j];
    j--;
  }
  arr[j+1] = key;
}`;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, shifts = 0;

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({
      array: [...a],
      key: i,
      keyVal: key,
      comparing: [],
      shifting: [],
      sortedUpto: i,
      codeLine: 1,
      comparisons,
      shifts,
      explanation: `🎯 Picking key = arr[${i}] = ${key}. Will insert it into the correct position in the sorted left portion [0..${i - 1}].`,
      status: 'info',
      activeLine: 1,
    });

    while (j >= 0 && a[j] > key) {
      comparisons++;
      steps.push({
        array: [...a],
        key: i,
        keyVal: key,
        comparing: [j],
        shifting: [j],
        sortedUpto: i,
        codeLine: 3,
        comparisons,
        shifts,
        explanation: `🔍 Comparing arr[${j}]=${a[j]} > key=${key}. Shifting arr[${j}] one position right to make room.`,
        status: 'compare',
        activeLine: 3,
      });
      a[j + 1] = a[j];
      shifts++;
      steps.push({
        array: [...a],
        key: i,
        keyVal: key,
        comparing: [j],
        shifting: [j + 1],
        sortedUpto: i,
        codeLine: 4,
        comparisons,
        shifts,
        explanation: `➡️ Shifted arr[${j}]=${a[j + 1]} to position ${j + 1}. Key ${key} still looking for its place.`,
        status: 'compare',
        activeLine: 4,
      });
      j--;
    }
    a[j + 1] = key;
    steps.push({
      array: [...a],
      key: -1,
      keyVal: -1,
      comparing: [],
      shifting: [],
      sortedUpto: i + 1,
      placed: j + 1,
      codeLine: 7,
      comparisons,
      shifts,
      explanation: `✅ Inserted key=${key} at position ${j + 1}. The left portion [0..${i}] is now sorted.`,
      status: 'sorted',
      activeLine: 7,
    });
  }

  steps.push({
    array: [...a],
    key: -1,
    keyVal: -1,
    comparing: [],
    shifting: [],
    sortedUpto: n,
    codeLine: -1,
    done: true,
    comparisons,
    shifts,
    explanation: '✅ Array fully sorted! Every element was inserted into its correct position one by one.',
    status: 'sorted',
    activeLine: -1,
  });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) return '#1d9e75';
  if (idx < step.sortedUpto && !step.comparing?.includes(idx) && !step.shifting?.includes(idx)) return '#1d9e75';
  if (idx === step.placed) return '#1d9e75';
  if (step.shifting?.includes(idx)) return '#378ADD';
  if (step.comparing?.includes(idx)) return '#ff6b4a';
  if (idx === step.key) return '#ef9f27';
  return '#1a2a3a';
}

export default function InsertionSortVisualizer() {
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
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Insertion Sort?"
        description="Insertion Sort builds the sorted array one element at a time by inserting each new element into its correct position. Like sorting playing cards in your hand — efficient for small or nearly-sorted arrays. Each iteration picks one element and slides it left until it finds its correct position."
        timeComplexity="O(n²) worst, O(n) best"
        spaceComplexity="O(1)"
        stable={true}
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Key Value', value: current?.keyVal > 0 ? current.keyVal : '-', color:'#ef9f27' },
          { label:'Comparisons', value: current?.comparisons ?? 0, color:'#00d9a3' },
          { label:'Shifts', value: current?.shifts ?? 0, color:'#378ADD' },
          { label:'Time', value:'O(n²)', color:'#ff6b4a' },
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
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', minHeight:4,
              boxShadow: i === current?.key ? `0 0 14px #ef9f2780` : 'none',
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

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#1d9e75','Sorted'],['#ef9f27','Key Element'],['#378ADD','Shifting'],['#ff6b4a','Comparing']].map(([c,l]) => (
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
