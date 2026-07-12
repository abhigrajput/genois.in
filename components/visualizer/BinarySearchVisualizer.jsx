'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `int binarySearch(int arr[], int n, int target) {
  int left = 0, right = n - 1;
  while(left <= right) {
    int mid = left + (right - left) / 2;
    if(arr[mid] == target)
      return mid;
    else if(arr[mid] < target)
      left = mid + 1;
    else
      right = mid - 1;
  }
  return -1;
}`;

const SNIPPETS = {
  python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
  java: `int binarySearch(int[] arr, int target) {
  int left = 0, right = arr.length - 1;
  while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target)
      return mid;
    else if (arr[mid] < target)
      left = mid + 1;
    else
      right = mid - 1;
  }
  return -1;
}`,
  javascript: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
};

function generateSortedArray(size) {
  const set = new Set();
  while (set.size < size) set.add(Math.floor(Math.random() * 95) + 5);
  return [...set].sort((a, b) => a - b);
}

function computeSteps(arr, target) {
  const steps = [];
  let left = 0, right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    steps.push({
      left, right, mid,
      eliminated: [],
      codeLine: 3,
      activeLine: 3,
      status: 'compare',
      explanation: `📐 Calculating mid = (${left} + ${right}) / 2 = ${mid}. arr[${mid}] = ${arr[mid]}. Comparing with target(${target})...`,
    });
    if (arr[mid] === target) {
      steps.push({
        left, right, mid,
        found: true,
        codeLine: 4,
        activeLine: 4,
        status: 'found',
        explanation: `🎉 arr[${mid}] = ${arr[mid]} equals target ${target}! Found at index ${mid} after ${steps.length} step(s).`,
      });
      return steps;
    } else if (arr[mid] < target) {
      steps.push({
        left, right, mid,
        goRight: true,
        codeLine: 7,
        activeLine: 7,
        status: 'info',
        eliminated: Array.from({length: mid - 0 + 1}, (_,i) => i),
        explanation: `➡️ arr[${mid}]=${arr[mid]} < target(${target}). Target is in the right half. Eliminating indices 0–${mid}, new left = ${mid + 1}.`,
      });
      left = mid + 1;
    } else {
      steps.push({
        left, right, mid,
        goLeft: true,
        codeLine: 9,
        activeLine: 9,
        status: 'info',
        eliminated: Array.from({length: arr.length - mid}, (_,i) => mid + i),
        explanation: `⬅️ arr[${mid}]=${arr[mid]} > target(${target}). Target is in the left half. Eliminating indices ${mid}–${arr.length - 1}, new right = ${mid - 1}.`,
      });
      right = mid - 1;
    }
  }
  steps.push({
    left, right, mid: -1,
    notFound: true,
    codeLine: 11,
    activeLine: 11,
    status: 'mismatch',
    explanation: `❌ Search space is empty (left=${left} > right=${right}). Target ${target} not found in the array.`,
  });
  return steps;
}

function barColor(idx, step, eliminatedSet) {
  if (!step) return '#1a2a3a';
  if (step.found && step.mid === idx) return '#1d9e75';
  if (eliminatedSet?.has(idx)) return '#2a2a2a';
  if (step.mid === idx) return '#00d9a3';
  if (step.left === idx) return '#ef9f2770';
  if (step.right === idx) return '#ef9f2770';
  return '#1a2a3a';
}

export default function BinarySearchVisualizer() {
  const [size, setSize] = useState(9);
  const [arr, setArr] = useState(() => generateSortedArray(9));
  const [target, setTarget] = useState('');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [eliminated, setEliminated] = useState(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    const num = parseInt(target);
    if (!isNaN(num)) {
      setSteps(computeSteps(arr, num));
      setStepIdx(-1);
      setIsPlaying(false);
      setEliminated(new Set());
    } else {
      setSteps([]);
      setStepIdx(-1);
    }
  }, [arr, target]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const maxVal = Math.max(...arr, 1);

  // accumulate eliminated
  useEffect(() => {
    if (current?.eliminated) {
      setEliminated(prev => {
        const next = new Set(prev);
        current.eliminated.forEach(i => next.add(i));
        return next;
      });
    }
    if (stepIdx <= 0) setEliminated(new Set());
  }, [stepIdx]);

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

  const result = current?.found ? `Found at index ${current.mid}` : current?.notFound ? 'Not Found' : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Binary Search?"
        description="Binary Search works on sorted arrays by repeatedly halving the search space. Compare the middle element with target — if equal it's found, if target is larger search the right half, if smaller search the left half. Each step eliminates half the remaining elements."
        timeComplexity="O(log n)"
        spaceComplexity="O(1)"
      />

      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#5a7a9a', letterSpacing:1 }}>TARGET</span>
        <input type="number" value={target} onChange={e => setTarget(e.target.value)}
          placeholder="Enter target..." style={{ background:'rgba(0,217,163,0.04)', border:'1px solid rgba(0,217,163,0.2)', borderRadius:8, padding:'6px 12px', color:'#e8e8ed', fontFamily:'var(--font-mono)', fontSize:13, outline:'none', width:160 }}
        />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a' }}>Array is sorted ✓</span>
        {result && (
          <span style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, color: result.includes('Found') ? '#1d9e75' : '#ff2d78', background: result.includes('Found') ? 'rgba(29,158,117,0.1)' : 'rgba(255,45,120,0.1)', border:`1px solid ${result.includes('Found') ? 'rgba(29,158,117,0.25)' : 'rgba(255,45,120,0.25)'}`, borderRadius:8, padding:'4px 12px' }}>{result}</span>
        )}
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Left', value: current?.left ?? 0, color:'#ef9f27' },
          { label:'Mid', value: current?.mid ?? '-', color:'#00d9a3' },
          { label:'Right', value: current?.right ?? arr.length - 1, color:'#ef9f27' },
          { label:'Time', value:'O(log n)', color:'#ff6b4a' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:90 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,217,163,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1, maxWidth:60 }}>
            {current?.left === i && <span style={{ fontSize:9, color:'#ef9f27', fontFamily:'var(--font-mono)' }}>L</span>}
            {current?.mid === i && !current?.left && <span style={{ fontSize:9, color:'transparent' }}>.</span>}
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:barColor(i, current, eliminated) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current, eliminated), transition:'all 0.3s ease', minHeight:4,
              boxShadow: current?.mid === i ? `0 0 14px #00d9a380` : 'none',
            }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'#2a3a4a' }}>[{i}]</span>
            {current?.mid === i && <span style={{ fontSize:8, color:'#00d9a3', fontFamily:'var(--font-mono)' }}>MID</span>}
            {current?.right === i && current.right !== current.mid && <span style={{ fontSize:8, color:'#ef9f27', fontFamily:'var(--font-mono)' }}>R</span>}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#00d9a3','Mid'],['#ef9f2770','L / R Pointers'],['#2a2a2a','Eliminated'],['#1d9e75','Found']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c, border:`1px solid ${c}60` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to start the visualization.'}
        status={current?.status ?? 'default'}
      />

      <VisualizerControls
        isPlaying={isPlaying} onPlayPause={() => setIsPlaying(p => !p)}
        onStepForward={() => setStepIdx(p => Math.min(p + 1, steps.length - 1))}
        onStepBackward={() => setStepIdx(p => Math.max(p - 1, 0))}
        onReset={() => { setStepIdx(-1); setIsPlaying(false); setEliminated(new Set()); }}
        speed={speed} onSpeedChange={setSpeed}
        currentStep={Math.max(0, stepIdx + 1)} totalSteps={steps.length}
        onRandomize={() => setArr(generateSortedArray(size))}
        arraySize={size} onArraySizeChange={n => { setSize(n); setArr(generateSortedArray(n)); }}
      />
      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}
