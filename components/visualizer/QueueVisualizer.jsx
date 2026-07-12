'use client';
import { useState, useEffect, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';

const CODE = `#include <queue>
queue<int> q;

// Enqueue (push to rear)
q.push(x);

// Dequeue (remove from front)
if(!q.empty()) q.pop();

// Front element
int front = q.front();

// Rear element
int rear = q.back();

// Check empty
bool empty = q.empty();`;

const SNIPPETS = {
  python: `from collections import deque
q = deque()

# Enqueue (push to rear)
q.append(x)

# Dequeue (remove from front)
if q:
    q.popleft()

# Front element
front = q[0]

# Rear element
rear = q[-1]

# Check empty
empty = len(q) == 0`,
  java: `Queue<Integer> q = new LinkedList<>();

// Enqueue (push to rear)
q.offer(x);

// Dequeue (remove from front)
if (!q.isEmpty()) q.poll();

// Front element
int front = q.peek();

// Check empty
boolean empty = q.isEmpty();`,
  javascript: `const q = [];

// Enqueue (push to rear)
q.push(x);

// Dequeue (remove from front)
if (q.length) q.shift();

// Front element
const front = q[0];

// Rear element
const rear = q[q.length - 1];

// Check empty
const empty = q.length === 0;`,
};

const MAX_SIZE = 7;

export default function QueueVisualizer() {
  const [queue, setQueue] = useState([33, 67, 21, 85]);
  const [lastAction, setLastAction] = useState(null);
  const [message, setMessage] = useState('');
  const [animOut, setAnimOut] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const timersRef = useRef([]);

  // Clear any pending animation timers if the component unmounts (e.g. on algorithm switch)
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const enqueue = () => {
    if (queue.length >= MAX_SIZE) { setMessage('Queue is full! Max size reached.'); return; }
    const val = Math.floor(Math.random() * 90) + 10;
    setAnimIn(true);
    timersRef.current.push(setTimeout(() => setAnimIn(false), 350));
    setQueue(prev => [...prev, val]);
    setLastAction({ type: 'enqueue', val });
    setMessage(`Enqueued ${val} at the rear`);
  };

  const dequeue = () => {
    if (queue.length === 0) { setMessage('Queue is empty!'); return; }
    const val = queue[0];
    setAnimOut(true);
    timersRef.current.push(setTimeout(() => { setAnimOut(false); setQueue(prev => prev.slice(1)); }, 300));
    setLastAction({ type: 'dequeue', val });
    setMessage(`Dequeued ${val} from the front`);
  };

  const clear = () => { setQueue([]); setLastAction(null); setMessage('Queue cleared'); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is a Queue?"
        description="A Queue is a First-In-First-Out (FIFO) data structure. Elements are enqueued at the rear and dequeued from the front. Like a waiting line — first person in is first person served. Used in BFS, task scheduling, and print spoolers."
        timeComplexity="O(1) enqueue/dequeue"
        spaceComplexity="O(n)"
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Size', value:queue.length, color:'#00d9a3' },
          { label:'Front', value:queue.length > 0 ? queue[0] : 'null', color:'#1d9e75' },
          { label:'Rear', value:queue.length > 0 ? queue[queue.length-1] : 'null', color:'#ff6b4a' },
          { label:'Capacity', value:MAX_SIZE, color:'#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ background:'rgba(0,217,163,0.05)', border:'1px solid rgba(0,217,163,0.15)', borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'#00d9a3' }}>
          ▶ {message}
        </div>
      )}

      {/* Queue visualization */}
      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,217,163,0.1)', borderRadius:12, padding:'24px', minHeight:180 }}>
        {/* Direction labels */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'#1d9e75', letterSpacing:1 }}>← DEQUEUE (FRONT)</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'#ff6b4a', letterSpacing:1 }}>ENQUEUE (REAR) →</span>
        </div>

        {/* Queue row */}
        <div style={{ display:'flex', alignItems:'stretch', gap:0, minHeight:80, overflowX:'auto' }}>
          {/* Empty slots left */}
          {Array.from({ length: MAX_SIZE - queue.length }, (_, i) => (
            <div key={`el-${i}`} style={{ minWidth:70, height:70, border:'1px dashed rgba(0,217,163,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'rgba(0,217,163,0.1)' }}>—</span>
            </div>
          ))}

          {queue.map((val, i) => {
            const isFront = i === 0;
            const isRear = i === queue.length - 1;
            return (
              <div key={`${val}-${i}`} style={{
                minWidth: 70, height: 70,
                background: isFront ? 'rgba(29,158,117,0.12)' : isRear ? 'rgba(255,107,74,0.12)' : 'rgba(26,42,58,0.8)',
                border: isFront ? '1px solid rgba(29,158,117,0.5)' : isRear ? '1px solid rgba(255,107,74,0.5)' : '1px solid rgba(0,217,163,0.15)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                transition:'all 0.3s ease', flexShrink:0,
                animation: isFront && animOut ? 'queueOut 0.3s ease forwards' : isRear && animIn ? 'queueIn 0.3s ease' : 'none',
                boxShadow: isFront ? '0 0 12px rgba(29,158,117,0.2)' : isRear ? '0 0 12px rgba(255,107,74,0.2)' : 'none',
              }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:600, color: isFront ? '#1d9e75' : isRear ? '#ff6b4a' : '#e8e8ed' }}>{val}</span>
                {isFront && <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'#1d9e75', marginTop:2 }}>FRONT</span>}
                {isRear && <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'#ff6b4a', marginTop:2 }}>REAR</span>}
              </div>
            );
          })}

          {queue.length === 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', fontFamily:'var(--font-mono)', fontSize:12, color:'#2a3a4a' }}>
              Queue is empty
            </div>
          )}
        </div>

        {/* Bottom border */}
        <div style={{ height:3, background:'linear-gradient(90deg,rgba(29,158,117,0.4),rgba(255,107,74,0.4))', borderRadius:2, marginTop:4 }}/>
      </div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Enqueue', action:enqueue, color:'#ff6b4a', bg:'rgba(255,107,74,0.08)', border:'rgba(255,107,74,0.25)' },
          { label:'Dequeue', action:dequeue, color:'#1d9e75', bg:'rgba(29,158,117,0.08)', border:'rgba(29,158,117,0.25)' },
          { label:'Clear', action:clear, color:'#5a7a9a', bg:'transparent', border:'rgba(90,122,154,0.25)' },
        ].map(b => (
          <button key={b.label} onClick={b.action} style={{ padding:'10px 24px', borderRadius:9, border:`1px solid ${b.border}`, background:b.bg, color:b.color, fontFamily:'var(--font-heading)', fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>{b.label}</button>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} />
      <style>{`
        @keyframes queueIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes queueOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-30px); } }
      `}</style>
    </div>
  );
}
