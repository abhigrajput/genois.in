'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `// Min-Heap using priority_queue
priority_queue<int, vector<int>, greater<int>> pq;

// Insert (push + bubble up)
pq.push(val);

// Extract min (pop + heapify down)
int minVal = pq.top();
pq.pop();

// Manual heap operations:
// Bubble Up after insert
void bubbleUp(vector<int>& h, int i) {
  while(i > 0 && h[(i-1)/2] > h[i]) {
    swap(h[(i-1)/2], h[i]);
    i = (i-1)/2;
  }
}
// Heapify Down after extract
void heapifyDown(vector<int>& h, int i, int n) {
  int l=2*i+1, r=2*i+2, smallest=i;
  if(l<n && h[l]<h[smallest]) smallest=l;
  if(r<n && h[r]<h[smallest]) smallest=r;
  if(smallest!=i){ swap(h[i],h[smallest]); heapifyDown(h,smallest,n); }
}`;

const SPEEDS = { 1: 900, 2: 500, 3: 250, 4: 100 };

function computeInsertSteps(heap, val) {
  const steps = [];
  const h = [...heap, val];
  steps.push({ heap: [...h], highlight: [h.length - 1], phase: 'insert', label: `Inserted ${val} at index ${h.length - 1}`, explanation: `Inserted ${val} at the end of the heap (index ${h.length - 1}). Now we bubble up to restore the min-heap property.`, status: 'compare', activeLine: 8 });
  let i = h.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (h[parent] > h[i]) {
      steps.push({ heap: [...h], highlight: [i, parent], phase: 'swap', label: `Swapping ${h[i]} ↔ ${h[parent]} (bubble up)`, explanation: `h[${i}]=${h[i]} < h[${parent}]=${h[parent]} (parent). Swap! Child is smaller than parent — violates min-heap property.`, status: 'compare', activeLine: 17 });
      [h[i], h[parent]] = [h[parent], h[i]];
      steps.push({ heap: [...h], highlight: [parent], phase: 'bubbled', label: `Bubbled up to index ${parent}`, explanation: `Swapped. Element moved up to index ${parent}. Continuing to check parent...`, status: 'info', activeLine: 19 });
      i = parent;
    } else break;
  }
  steps.push({ heap: [...h], highlight: [], phase: 'done', label: 'Heap property restored', explanation: 'Min-heap property fully restored! Every parent is now smaller than or equal to its children.', status: 'sorted', activeLine: -1 });
  return { steps, finalHeap: h };
}

function computeExtractSteps(heap) {
  if (heap.length === 0) return { steps: [], finalHeap: [] };
  const steps = [];
  const h = [...heap];
  const minVal = h[0];
  steps.push({ heap: [...h], highlight: [0], phase: 'extract', label: `Extracting min: ${h[0]}`, explanation: `Extracting minimum value ${h[0]} from root. The root always holds the smallest element in a min-heap.`, status: 'found', activeLine: 11 });
  h[0] = h[h.length - 1];
  h.pop();
  steps.push({ heap: [...h], highlight: [0], phase: 'replace', label: `Moved last element to root`, explanation: `Moved last element to root position. The heap shape is restored, but heap property may be violated. Now heapify down.`, status: 'compare', activeLine: 12 });
  let i = 0;
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let smallest = i;
    if (l < h.length && h[l] < h[smallest]) smallest = l;
    if (r < h.length && h[r] < h[smallest]) smallest = r;
    if (smallest !== i) {
      steps.push({ heap: [...h], highlight: [i, smallest], phase: 'swap', label: `Heapify down: swap ${h[i]} ↔ ${h[smallest]}`, explanation: `h[${smallest}]=${h[smallest]} is the smaller child. Swapping with parent h[${i}]=${h[i]} to restore heap order.`, status: 'compare', activeLine: 27 });
      [h[i], h[smallest]] = [h[smallest], h[i]];
      steps.push({ heap: [...h], highlight: [smallest], phase: 'heapified', label: `Moved down to index ${smallest}`, explanation: `Swapped. Element moved down to index ${smallest}. Continuing heapify downward...`, status: 'info', activeLine: 28 });
      i = smallest;
    } else break;
  }
  steps.push({ heap: [...h], highlight: [], phase: 'done', label: 'Min-Heap property restored', explanation: 'Min-Heap property fully restored after extraction! The tree is balanced and ordered correctly.', status: 'sorted', activeLine: -1 });
  return { steps, finalHeap: h };
}

// SVG tree positions for heap array
function heapNodePos(i) {
  const level = Math.floor(Math.log2(i + 1));
  const posInLevel = i - (Math.pow(2, level) - 1);
  const totalInLevel = Math.pow(2, level);
  const x = (posInLevel + 0.5) * (560 / totalInLevel) + 20;
  const y = 40 + level * 70;
  return { x, y };
}

function nodeColor(i, step) {
  if (!step) return '#1a2a3a';
  if (step.highlight?.includes(i)) {
    if (step.phase === 'swap' || step.phase === 'replace') return '#ef9f27';
    if (step.phase === 'done' || step.phase === 'bubbled' || step.phase === 'heapified') return '#1d9e75';
    return '#00f0ff';
  }
  return '#1a2a3a';
}

export default function HeapVisualizer() {
  const [heap, setHeap] = useState([3, 8, 5, 15, 12, 9]);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [message, setMessage] = useState('A min-heap. Insert or Extract Min to see heapify animations.');
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const displayHeap = current ? current.heap : heap;

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

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const doInsert = () => {
    if (heap.length >= 15) { setMessage('Heap full!'); return; }
    const val = Math.floor(Math.random() * 90) + 5;
    const { steps: s, finalHeap } = computeInsertSteps(heap, val);
    clearTimeout(timeoutRef.current);
    setSteps(s); setStepIdx(0); setIsPlaying(true);
    setMessage(`Inserting ${val}...`);
    timeoutRef.current = setTimeout(() => setHeap(finalHeap), s.length * SPEEDS[speed] + 200);
  };

  const doExtract = () => {
    if (heap.length === 0) { setMessage('Heap is empty!'); return; }
    const { steps: s, finalHeap } = computeExtractSteps(heap);
    clearTimeout(timeoutRef.current);
    setSteps(s); setStepIdx(0); setIsPlaying(true);
    setMessage(`Extracting min: ${heap[0]}...`);
    timeoutRef.current = setTimeout(() => setHeap(finalHeap), s.length * SPEEDS[speed] + 200);
  };

  const reset = () => {
    setHeap([3, 8, 5, 15, 12, 9]); setSteps([]); setStepIdx(-1); setIsPlaying(false);
    setMessage('A min-heap. Insert or Extract Min to see heapify animations.');
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  const SVG_W = 600, SVG_H = 280;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is a Heap?"
        description="A Heap is a complete binary tree satisfying the heap property: in a min-heap, every parent is smaller than its children. Enables O(log n) insert and extract-min. The root always holds the minimum element. Foundation of Priority Queue, Heap Sort, and Dijkstra's algorithm."
        timeComplexity="O(log n) insert/extract"
        spaceComplexity="O(n)"
      />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Size', value: heap.length, color: '#00f0ff' },
          { label: 'Min (root)', value: heap[0] ?? '-', color: '#1d9e75' },
          { label: 'Phase', value: current?.phase ?? '—', color: '#ef9f27' },
          { label: 'Type', value: 'Min-Heap', color: '#ff6b4a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {current?.label && (
        <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00f0ff' }}>▶ {current.label}</div>
      )}

      {/* Array view */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>ARRAY REPRESENTATION</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {displayHeap.map((v, i) => {
            const color = nodeColor(i, current);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: color === '#1a2a3a' ? '#0d1a2a' : color + '22', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', boxShadow: current?.highlight?.includes(i) ? `0 0 12px ${color}80` : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>{v}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2a3a4a' }}>[{i}]</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tree SVG */}
      <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
          {displayHeap.map((_, i) => {
            if (i === 0) return null;
            const parent = Math.floor((i - 1) / 2);
            const pc = heapNodePos(parent);
            const cc = heapNodePos(i);
            return <line key={i} x1={pc.x} y1={pc.y} x2={cc.x} y2={cc.y} stroke="rgba(0,240,255,0.2)" strokeWidth={1.5} />;
          })}
          {displayHeap.map((v, i) => {
            const { x, y } = heapNodePos(i);
            const color = nodeColor(i, current);
            const isHl = current?.highlight?.includes(i);
            return (
              <g key={i}>
                {isHl && <circle cx={x} cy={y} r={24} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />}
                <circle cx={x} cy={y} r={20} fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'} stroke={color} strokeWidth={isHl ? 2.5 : 1.5} style={{ transition: 'all 0.3s ease' }} />
                <text x={x} y={y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, fill: color, transition: 'fill 0.3s ease' }}>{v}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press Insert Random or Extract Min to start the heap visualization.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={doInsert} style={btn('#00f0ff')}>Insert Random</button>
        <button onClick={doExtract} style={btn('#ef9f27')}>Extract Min</button>
        <button onClick={() => setIsPlaying(p => !p)} style={btn('#ff6b4a')}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding:'3px 10px', borderRadius:6, border: speed===s?'1px solid #00f0ff':'1px solid rgba(0,240,255,0.15)', background: speed===s?'rgba(0,240,255,0.12)':'transparent', color: speed===s?'#00f0ff':'#5a7a9a', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer' }}>{['0.5×','1×','2×','3×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {[['#00f0ff','Selected'],['#ef9f27','Swapping'],['#1d9e75','Placed']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:2, background:c+'44', border:`2px solid ${c}` }}/>
            <span style={{ fontSize:11, color:'#5a7a9a', fontFamily:'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} />
    </div>
  );
}
function btn(color) {
  return { padding:'8px 16px', borderRadius:8, border:`1px solid ${color}30`, background:`${color}10`, color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' };
}
