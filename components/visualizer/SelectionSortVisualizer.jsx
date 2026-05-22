'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';

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
      steps.push({
        array: [...a],
        current: i,
        minIdx,
        scanning: j,
        sortedUpto: i,
        codeLine: a[j] < a[minIdx] ? 3 : 2,
      });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    let t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
    steps.push({ array: [...a], current: -1, minIdx: -1, scanning: -1, sortedUpto: i + 1, swapped: [i, minIdx], codeLine: 6 });
  }
  steps.push({ array: [...a], current: -1, minIdx: -1, scanning: -1, sortedUpto: n, codeLine: -1, done: true });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) return '#1d9e75';
  if (idx < step.sortedUpto) return '#1d9e75';
  if (step.swapped?.includes(idx)) return '#1d9e75';
  if (idx === step.minIdx) return '#ef9f27';
  if (idx === step.current) return '#00f0ff';
  if (idx === step.scanning) return '#7b5cff';
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
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Current Pass', value: current ? Math.min(current.sortedUpto + 1, arr.length) : 1, color: '#00f0ff' },
          { label: 'Min Index', value: current?.minIdx ?? '-', color: '#ef9f27' },
          { label: 'Time', value: 'O(n²)', color: '#7b5cff' },
          { label: 'Space', value: 'O(1)', color: '#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {displayArr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, maxWidth:60 }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:barColor(i, current) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', boxShadow: current?.minIdx === i ? `0 0 14px #ef9f2780` : 'none', minHeight:4 }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#1d9e75','Sorted'],['#00f0ff','Current Position'],['#ef9f27','Minimum Found'],['#7b5cff','Scanning']].map(([c,l]) => (
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
