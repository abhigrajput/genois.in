'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `int partition(int arr[], int low, int high) {
  int pivot = arr[high];
  int i = low - 1;
  for(int j = low; j < high; j++) {
    if(arr[j] < pivot) {
      i++;
      swap(arr[i], arr[j]);
    }
  }
  swap(arr[i+1], arr[high]);
  return i+1;
}
void quickSort(int arr[],int l,int h){
  if(l<h){
    int pi = partition(arr,l,h);
    quickSort(arr,l,pi-1);
    quickSort(arr,pi+1,h);
  }
}`;

const SNIPPETS = {
  python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)`,
  java: `int partition(int[] arr, int low, int high) {
  int pivot = arr[high], i = low - 1;
  for (int j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      int t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
  }
  int t = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = t;
  return i + 1;
}
void quickSort(int[] arr, int l, int h) {
  if (l < h) {
    int pi = partition(arr, l, h);
    quickSort(arr, l, pi - 1);
    quickSort(arr, pi + 1, h);
  }
}`,
  javascript: `function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
function quickSort(arr, l, h) {
  if (l < h) {
    const pi = partition(arr, l, h);
    quickSort(arr, l, pi - 1);
    quickSort(arr, pi + 1, h);
  }
}`,
};

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];

  function partition(a, low, high) {
    const pivot = a[high];
    let i = low - 1;
    steps.push({
      array: [...a],
      pivot: high,
      low,
      high,
      i,
      scanning: low,
      codeLine: 1,
      explanation: `🎯 Pivot = arr[${high}]=${pivot}. Partitioning subarray [${low}..${high}]: elements < ${pivot} go left, elements > ${pivot} go right.`,
      status: 'pivot',
      activeLine: 1,
    });
    for (let j = low; j < high; j++) {
      steps.push({
        array: [...a],
        pivot: high,
        low,
        high,
        i,
        scanning: j,
        codeLine: 3,
        explanation: `🔍 Scanning arr[${j}]=${a[j]}. Pivot=${pivot}. ${a[j] < pivot ? `${a[j]} < ${pivot} — will swap to left partition.` : `${a[j]} >= ${pivot} — stays in right partition.`}`,
        status: a[j] < pivot ? 'compare' : 'mismatch',
        activeLine: 3,
      });
      if (a[j] < pivot) {
        i++;
        let t = a[i]; a[i] = a[j]; a[j] = t;
        steps.push({
          array: [...a],
          pivot: high,
          low,
          high,
          i,
          scanning: j,
          swapped: [i, j],
          codeLine: 6,
          explanation: `🔄 arr[${j}]=${a[i]} < pivot=${pivot}. Swapping arr[${i}] and arr[${j}] to grow the left partition (≤ pivot region).`,
          status: 'compare',
          activeLine: 6,
        });
      }
    }
    let t = a[i + 1]; a[i + 1] = a[high]; a[high] = t;
    steps.push({
      array: [...a],
      pivotPlaced: i + 1,
      low,
      high,
      codeLine: 9,
      explanation: `✅ Pivot ${pivot} placed at its correct position ${i + 1}. All elements left of ${i + 1} are < ${pivot}, all right are > ${pivot}.`,
      status: 'sorted',
      activeLine: 9,
    });
    return i + 1;
  }

  function quickSort(a, l, h) {
    if (l < h) {
      steps.push({
        array: [...a],
        subarray: [l, h],
        codeLine: 13,
        explanation: `📐 Processing subarray [${l}..${h}]. Will pick pivot from arr[${h}]=${a[h]} and partition.`,
        status: 'info',
        activeLine: 13,
      });
      const pi = partition(a, l, h);
      quickSort(a, l, pi - 1);
      quickSort(a, pi + 1, h);
    }
  }

  quickSort(a, 0, a.length - 1);
  steps.push({
    array: [...a],
    done: true,
    codeLine: -1,
    explanation: '✅ Array fully sorted! Quick Sort placed every pivot at its correct position via partitioning.',
    status: 'sorted',
    activeLine: -1,
  });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) return '#1d9e75';
  if (step.pivotPlaced === idx) return '#1d9e75';
  if (step.pivot === idx) return '#ef9f27';
  if (step.swapped?.includes(idx)) return '#00f0ff';
  if (step.scanning === idx) return '#378ADD';
  if (step.subarray && idx >= step.subarray[0] && idx <= step.subarray[1]) return '#1a2a4a';
  if (step.low != null && idx >= step.low && idx < step.pivot) {
    if (step.i != null && idx <= step.i) return '#ff6b4a';
    return '#1a2a3a';
  }
  return '#1a2a3a';
}

export default function QuickSortVisualizer() {
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
        title="What is Quick Sort?"
        description="Quick Sort picks a pivot element, partitions the array into elements smaller and larger than the pivot, then recursively sorts each partition. Average case is O(n log n) but worst case O(n²) on sorted arrays. Cache-friendly and in-place, making it fast in practice."
        timeComplexity="O(n log n) avg"
        spaceComplexity="O(log n)"
        stable={false}
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Pivot Value', value: current?.pivot != null && !current.done ? displayArr[current.pivot] : '-', color:'#ef9f27' },
          { label:'Phase', value: current?.pivotPlaced != null ? 'Placed' : current?.scanning != null ? 'Scanning' : current?.done ? 'Done' : 'Divide', color:'#00f0ff' },
          { label:'Avg Time', value:'O(n log n)', color:'#ff6b4a' },
          { label:'Space', value:'O(log n)', color:'#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, maxWidth:60 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:barColor(i, current) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', minHeight:4,
              boxShadow: current?.pivot === i ? `0 0 16px #ef9f2780` : 'none',
            }} />
            {current?.pivot === i && (
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'#ef9f27', marginTop:2 }}>PIVOT</span>
            )}
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
        {[['#ef9f27','Pivot'],['#ff6b4a','≤ Pivot'],['#378ADD','Scanning'],['#00f0ff','Swapping'],['#1d9e75','Placed']].map(([c,l]) => (
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
      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}
