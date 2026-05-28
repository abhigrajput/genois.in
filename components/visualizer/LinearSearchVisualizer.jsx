'use client';
import { useState, useEffect, useRef } from 'react';
import VisualizerControls from './VisualizerControls';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1200, 2: 700, 3: 300, 4: 120 };

const CODE = `int linearSearch(int arr[], int n, int target) {
  for(int i = 0; i < n; i++) {
    if(arr[i] == target) {
      return i;  // Found at index i
    }
  }
  return -1;    // Not found
}`;

function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function computeSteps(arr, target) {
  const steps = [];
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    if (arr[i] === target) {
      steps.push({
        current: i,
        found: true,
        codeLine: 2,
        activeLine: 2,
        status: 'found',
        explanation: `🎉 Found target ${target} at index ${i} after ${i + 1} comparisons! Linear search complete.`,
      });
      break;
    }
    steps.push({
      current: i,
      found: false,
      notFound: false,
      codeLine: 2,
      activeLine: 2,
      status: 'compare',
      explanation: `🔍 Checking arr[${i}]=${arr[i]}. Is ${arr[i]} === target(${target})? No, continue to next element.`,
    });
  }
  const found = arr.includes(target);
  steps.push({
    current: -1,
    found: false,
    done: true,
    notFound: !found,
    result: found ? arr.indexOf(target) : -1,
    codeLine: found ? 3 : 6,
    activeLine: found ? 3 : 6,
    status: found ? 'found' : 'mismatch',
    explanation: found
      ? `🎉 Target ${target} confirmed at index ${arr.indexOf(target)}. Search complete!`
      : `❌ Target ${target} not found after checking all ${n} elements. Linear search exhausted.`,
  });
  return steps;
}

function barColor(idx, step) {
  if (!step) return '#1a2a3a';
  if (step.done) {
    if (step.result === idx) return '#1d9e75';
    return '#2a2a2a';
  }
  if (step.found && step.current === idx) return '#1d9e75';
  if (step.current === idx) return '#00f0ff';
  if (idx < step.current) return '#2a2a2a';
  return '#1a2a3a';
}

export default function LinearSearchVisualizer() {
  const [size, setSize] = useState(8);
  const [arr, setArr] = useState(() => generateArray(8));
  const [target, setTarget] = useState('');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const doSearch = (a, t) => {
    const num = parseInt(t);
    if (!isNaN(num)) {
      setSteps(computeSteps(a, num));
      setStepIdx(-1);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (target) doSearch(arr, target);
    else { setSteps([]); setStepIdx(-1); }
  }, [arr, target]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
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

  const result = current?.done ? (current.result >= 0 ? `Found at index ${current.result}` : 'Not Found') : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is Linear Search?"
        description="Linear Search checks every element one by one from left to right until the target is found or the array ends. Works on unsorted arrays — no preprocessing needed. Simple to implement but O(n) time makes it slow for large arrays."
        timeComplexity="O(n)"
        spaceComplexity="O(1)"
      />

      {/* Target input */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#5a7a9a', letterSpacing:1 }}>TARGET</span>
        <input
          type="number"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target value..."
          style={{
            background:'rgba(0,240,255,0.04)', border:'1px solid rgba(0,240,255,0.2)',
            borderRadius:8, padding:'6px 12px', color:'#e8f4ff',
            fontFamily:'JetBrains Mono,monospace', fontSize:13, outline:'none', width:160,
          }}
        />
        {result && (
          <span style={{
            fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:600,
            color: result.includes('Found at') ? '#1d9e75' : '#ff2d78',
            background: result.includes('Found at') ? 'rgba(29,158,117,0.1)' : 'rgba(255,45,120,0.1)',
            border: `1px solid ${result.includes('Found at') ? 'rgba(29,158,117,0.25)' : 'rgba(255,45,120,0.25)'}`,
            borderRadius: 8, padding:'4px 12px',
          }}>{result}</span>
        )}
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Comparisons', value: stepIdx >= 0 ? stepIdx + 1 : 0, color:'#00f0ff' },
          { label:'Current', value: current?.current ?? '-', color:'#ef9f27' },
          { label:'Time', value:'O(n)', color:'#7b5cff' },
          { label:'Space', value:'O(1)', color:'#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:'24px 16px', minHeight:200, display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center' }}>
        {arr.map((v, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, maxWidth:60 }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:barColor(i, current) }}>{v}</span>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', height:`${(v / maxVal) * 160}px`, background:barColor(i, current), transition:'all 0.3s ease', minHeight:4,
              boxShadow: current?.current === i ? `0 0 14px #00f0ff80` : 'none',
            }} />
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#2a3a4a' }}>[{i}]</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#00f0ff','Current'],['#2a2a2a','Eliminated'],['#1d9e75','Found'],['#ff2d78','Not Found']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c, border:`1px solid ${c}50` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'Outfit,sans-serif' }}>{l}</span>
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
