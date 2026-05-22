'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `void merge(int arr[], int l, int m, int r) {
  int n1 = m-l+1, n2 = r-m;
  int L[n1], R[n2];
  for(int i=0;i<n1;i++) L[i]=arr[l+i];
  for(int j=0;j<n2;j++) R[j]=arr[m+1+j];
  int i=0,j=0,k=l;
  while(i<n1 && j<n2)
    arr[k++] = (L[i]<=R[j]) ? L[i++] : R[j++];
  while(i<n1) arr[k++]=L[i++];
  while(j<n2) arr[k++]=R[j++];
}
void mergeSort(int arr[],int l,int r){
  if(l<r){
    int m=(l+r)/2;
    mergeSort(arr,l,m);
    mergeSort(arr,m+1,r);
    merge(arr,l,m,r);
  }
}`;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function computeSteps(arr) {
  const steps = [];
  const a = [...arr];

  function merge(a, l, m, r) {
    const L = a.slice(l, m + 1);
    const R = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < L.length && j < R.length) {
      steps.push({ array: [...a], left: [l, m], right: [m + 1, r], merging: k, codeLine: 7 });
      if (L[i] <= R[j]) { a[k++] = L[i++]; }
      else { a[k++] = R[j++]; }
      steps.push({ array: [...a], left: [l, m], right: [m + 1, r], placed: k - 1, codeLine: 8 });
    }
    while (i < L.length) { a[k++] = L[i++]; steps.push({ array: [...a], left: [l, m], right: [m + 1, r], placed: k - 1, codeLine: 9 }); }
    while (j < R.length) { a[k++] = R[j++]; steps.push({ array: [...a], left: [l, m], right: [m + 1, r], placed: k - 1, codeLine: 10 }); }
    steps.push({ array: [...a], merged: [l, r], codeLine: -1 });
  }

  function mergeSort(a, l, r) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      steps.push({ array: [...a], dividing: [l, m, r], codeLine: 14 });
      mergeSort(a, l, m);
      mergeSort(a, m + 1, r);
      merge(a, l, m, r);
    }
  }

  mergeSort(a, 0, a.length - 1);
  steps.push({ array: [...a], done: true, codeLine: -1 });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) return '#1d9e75';
  if (step.merged && idx >= step.merged[0] && idx <= step.merged[1]) return '#1d9e75';
  if (step.placed === idx) return '#1d9e75';
  if (step.merging === idx) return '#00f0ff';
  if (step.left && idx >= step.left[0] && idx <= step.left[1]) return '#378ADD';
  if (step.right && idx >= step.right[0] && idx <= step.right[1]) return '#7b5cff';
  if (step.dividing) {
    const [l, m, r] = step.dividing;
    if (idx >= l && idx <= m) return '#378ADD44';
    if (idx >= m + 1 && idx <= r) return '#7b5cff44';
  }
  return '#1a2a3a';
}

export default function MergeSortVisualizer() {
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
          { label:'Phase', value: current?.dividing ? 'Divide' : current?.merging != null ? 'Merge' : current?.done ? 'Done' : '—', color:'#00f0ff' },
          { label:'Time', value:'O(n log n)', color:'#7b5cff' },
          { label:'Space', value:'O(n)', color:'#ef9f27' },
          { label:'Stable', value:'Yes', color:'#1d9e75' },
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
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', minHeight:4 }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#378ADD','Left Half'],['#7b5cff','Right Half'],['#00f0ff','Merging'],['#1d9e75','Merged']].map(([c,l]) => (
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
