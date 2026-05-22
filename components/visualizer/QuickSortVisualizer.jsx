'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';

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

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];

  function partition(a, low, high) {
    const pivot = a[high];
    let i = low - 1;
    steps.push({ array: [...a], pivot: high, low, high, i, scanning: low, codeLine: 1 });
    for (let j = low; j < high; j++) {
      steps.push({ array: [...a], pivot: high, low, high, i, scanning: j, codeLine: 3 });
      if (a[j] < pivot) {
        i++;
        let t = a[i]; a[i] = a[j]; a[j] = t;
        steps.push({ array: [...a], pivot: high, low, high, i, scanning: j, swapped: [i, j], codeLine: 6 });
      }
    }
    let t = a[i + 1]; a[i + 1] = a[high]; a[high] = t;
    steps.push({ array: [...a], pivotPlaced: i + 1, low, high, codeLine: 9 });
    return i + 1;
  }

  function quickSort(a, l, h) {
    if (l < h) {
      steps.push({ array: [...a], subarray: [l, h], codeLine: 13 });
      const pi = partition(a, l, h);
      quickSort(a, l, pi - 1);
      quickSort(a, pi + 1, h);
    }
  }

  quickSort(a, 0, a.length - 1);
  steps.push({ array: [...a], done: true, codeLine: -1 });
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
    if (step.i != null && idx <= step.i) return '#7b5cff';
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
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Pivot Value', value: current?.pivot != null && !current.done ? displayArr[current.pivot] : '-', color:'#ef9f27' },
          { label:'Phase', value: current?.pivotPlaced != null ? 'Placed' : current?.scanning != null ? 'Scanning' : current?.done ? 'Done' : 'Divide', color:'#00f0ff' },
          { label:'Avg Time', value:'O(n log n)', color:'#7b5cff' },
          { label:'Space', value:'O(log n)', color:'#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, maxWidth:60 }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:barColor(i, current) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', minHeight:4,
              boxShadow: current?.pivot === i ? `0 0 16px #ef9f2780` : 'none',
            }} />
            {current?.pivot === i && (
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#ef9f27', marginTop:2 }}>PIVOT</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#ef9f27','Pivot'],['#7b5cff','≤ Pivot'],['#378ADD','Scanning'],['#00f0ff','Swapping'],['#1d9e75','Placed']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c }}/>
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
        onRandomize={() => setArr(generateArray(size))}
        arraySize={size} onArraySizeChange={n => { setSize(n); setArr(generateArray(n)); }}
      />
      <CodePanel code={CODE} activeLine={current?.codeLine ?? -1} />
    </div>
  );
}
