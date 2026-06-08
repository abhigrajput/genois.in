'use client';
import { useState } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';

const CODE = `#include <stack>
stack<int> st;

// Push
st.push(x);

// Pop
if(!st.empty()) st.pop();

// Peek top
int top = st.top();

// Check empty
bool empty = st.empty();`;

const SNIPPETS = {
  python: `stack = []

# Push
stack.append(x)

# Pop
if stack:
    stack.pop()

# Peek top
top = stack[-1]

# Check empty
empty = len(stack) == 0`,
  java: `Deque<Integer> st = new ArrayDeque<>();

// Push
st.push(x);

// Pop
if (!st.isEmpty()) st.pop();

// Peek top
int top = st.peek();

// Check empty
boolean empty = st.isEmpty();`,
  javascript: `const st = [];

// Push
st.push(x);

// Pop
if (st.length) st.pop();

// Peek top
const top = st[st.length - 1];

// Check empty
const empty = st.length === 0;`,
};

const MAX_SIZE = 8;

export default function StackVisualizer() {
  const [stack, setStack] = useState([42, 17, 88]);
  const [lastAction, setLastAction] = useState(null);
  const [message, setMessage] = useState('');

  const push = () => {
    if (stack.length >= MAX_SIZE) { setMessage('Stack overflow! Max size reached.'); return; }
    const val = Math.floor(Math.random() * 90) + 10;
    setStack(prev => [...prev, val]);
    setLastAction({ type: 'push', val });
    setMessage(`Pushed ${val} onto the stack`);
  };

  const pop = () => {
    if (stack.length === 0) { setMessage('Stack underflow! Stack is empty.'); return; }
    const val = stack[stack.length - 1];
    setStack(prev => prev.slice(0, -1));
    setLastAction({ type: 'pop', val });
    setMessage(`Popped ${val} from the stack`);
  };

  const peek = () => {
    if (stack.length === 0) { setMessage('Stack is empty!'); return; }
    setLastAction({ type: 'peek' });
    setMessage(`Top element: ${stack[stack.length - 1]}`);
  };

  const clear = () => { setStack([]); setLastAction(null); setMessage('Stack cleared'); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is a Stack?"
        description="A Stack is a Last-In-First-Out (LIFO) data structure. Elements are pushed onto the top and popped from the top. Think of a stack of plates — you add and remove from the top only. Used in function call management, expression parsing, and undo/redo features."
        timeComplexity="O(1) push/pop"
        spaceComplexity="O(n)"
      />

      {/* Stats */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Size', value: stack.length, color:'#00f0ff' },
          { label:'Top', value: stack.length > 0 ? stack[stack.length-1] : 'null', color:'#ef9f27' },
          { label:'Capacity', value: MAX_SIZE, color:'#7b5cff' },
          { label:'Empty', value: stack.length === 0 ? 'Yes' : 'No', color:'#1d9e75' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(10,15,30,0.8)', border:`1px solid ${s.color}20`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#5a7a9a', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{ background:'rgba(0,240,255,0.05)', border:'1px solid rgba(0,240,255,0.15)', borderRadius:8, padding:'8px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#00f0ff' }}>
          ▶ {message}
        </div>
      )}

      {/* Visual stack */}
      <div style={{ background:'rgba(10,15,30,0.6)', border:'1px solid rgba(0,240,255,0.1)', borderRadius:12, padding:24, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:0 }}>
        {/* Empty slots */}
        {Array.from({ length: MAX_SIZE - stack.length }, (_, i) => (
          <div key={`empty-${i}`} style={{
            width: 180, height: 44, border:'1px dashed rgba(0,240,255,0.1)',
            borderRadius: 0, display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom: 0,
          }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(0,240,255,0.15)' }}>—</span>
          </div>
        ))}

        {/* Stack items (bottom to top, rendered top-to-bottom for visual) */}
        {[...stack].reverse().map((val, i, arr) => {
          const isTop = i === 0;
          const isNew = isTop && lastAction?.type === 'push';
          return (
            <div key={`${val}-${i}`} style={{
              width: 180, height: 44,
              background: isTop ? 'rgba(0,240,255,0.12)' : 'rgba(26,42,58,0.8)',
              border: isTop ? '1px solid rgba(0,240,255,0.5)' : '1px solid rgba(0,240,255,0.15)',
              borderRadius: 0,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0 16px',
              transition: 'all 0.35s ease',
              animation: isNew ? 'stackPush 0.35s ease' : 'none',
              boxShadow: isTop ? '0 0 16px rgba(0,240,255,0.15)' : 'none',
            }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:600, color: isTop ? '#00f0ff' : '#e8f4ff' }}>{val}</span>
              {isTop && <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#00f0ff' }}>← TOP</span>}
            </div>
          );
        })}

        {stack.length === 0 && (
          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#2a3a4a', textAlign:'center', marginBottom:8 }}>
            Stack is empty
          </div>
        )}

        {/* Bottom label */}
        <div style={{ width:180, height:4, background:'rgba(0,240,255,0.3)', borderRadius:2, marginTop:2 }}/>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#5a7a9a', marginTop:4 }}>BOTTOM</span>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Push', action:push, color:'#00f0ff', bg:'rgba(0,240,255,0.08)', border:'rgba(0,240,255,0.25)' },
          { label:'Pop', action:pop, color:'#ff2d78', bg:'rgba(255,45,120,0.08)', border:'rgba(255,45,120,0.25)' },
          { label:'Peek', action:peek, color:'#ef9f27', bg:'rgba(239,159,39,0.08)', border:'rgba(239,159,39,0.25)' },
          { label:'Clear', action:clear, color:'#5a7a9a', bg:'transparent', border:'rgba(90,122,154,0.25)' },
        ].map(b => (
          <button key={b.label} onClick={b.action} style={{
            padding:'10px 24px', borderRadius:9, border:`1px solid ${b.border}`,
            background:b.bg, color:b.color, fontFamily:'Syne,sans-serif',
            fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
          }}>{b.label}</button>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} />
      <style>{`@keyframes stackPush { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
