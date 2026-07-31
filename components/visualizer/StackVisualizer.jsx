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
          { label:'Size', value: stack.length, color:'var(--gx-accent)' },
          { label:'Top', value: stack.length > 0 ? stack[stack.length-1] : 'null', color:'var(--gx-warning)' },
          { label:'Capacity', value: MAX_SIZE, color:'var(--gx-warning)' },
          { label:'Empty', value: stack.length === 0 ? 'Yes' : 'No', color:'var(--gx-success)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--gx-surface)', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{ background:'var(--gx-accent-soft)', border:'1px solid var(--gx-border)', borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gx-accent)' }}>
          ▶ {message}
        </div>
      )}

      {/* Visual stack */}
      <div style={{ background:'var(--gx-surface)', border:'1px solid var(--gx-border)', borderRadius:12, padding:24, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:0 }}>
        {/* Empty slots */}
        {Array.from({ length: MAX_SIZE - stack.length }, (_, i) => (
          <div key={`empty-${i}`} style={{
            width: 180, height: 44, border:'1px dashed var(--gx-border)',
            borderRadius: 0, display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom: 0,
          }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-accent)' }}>—</span>
          </div>
        ))}

        {/* Stack items (bottom to top, rendered top-to-bottom for visual) */}
        {[...stack].reverse().map((val, i, arr) => {
          const isTop = i === 0;
          const isNew = isTop && lastAction?.type === 'push';
          return (
            <div key={`${val}-${i}`} style={{
              width: 180, height: 44,
              background: isTop ? 'var(--gx-accent-soft)' : 'var(--gx-surface-2)',
              border: isTop ? '1px solid var(--gx-accent-border)' : '1px solid var(--gx-border)',
              borderRadius: 0,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0 16px',
              transition: 'all 0.35s ease',
              animation: isNew ? 'stackPush 0.35s ease' : 'none',
              boxShadow: isTop ? 'var(--gx-shadow-sm)' : 'none',
            }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:600, color: isTop ? 'var(--gx-accent)' : 'var(--gx-text)' }}>{val}</span>
              {isTop && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-accent)' }}>← TOP</span>}
            </div>
          );
        })}

        {stack.length === 0 && (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gx-text-subtle)', textAlign:'center', marginBottom:8 }}>
            Stack is empty
          </div>
        )}

        {/* Bottom label */}
        <div style={{ width:180, height:4, background:'var(--gx-accent-soft)', borderRadius:2, marginTop:2 }}/>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gx-text-muted)', marginTop:4 }}>BOTTOM</span>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Push', action:push, color:'var(--gx-accent)', bg:'var(--gx-accent-soft)', border:'var(--gx-accent-border)' },
          { label:'Pop', action:pop, color:'var(--gx-danger)', bg:'var(--gx-danger-soft)', border:'var(--gx-danger-border)' },
          { label:'Peek', action:peek, color:'var(--gx-warning)', bg:'var(--gx-warning-soft)', border:'var(--gx-warning-border)' },
          { label:'Clear', action:clear, color:'var(--gx-text-muted)', bg:'transparent', border:'var(--gx-border)' },
        ].map(b => (
          <button key={b.label} onClick={b.action} style={{
            padding:'10px 24px', borderRadius:9, border:`1px solid ${b.border}`,
            background:b.bg, color:b.color, fontFamily:'var(--font-heading)',
            fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
          }}>{b.label}</button>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} />
      <style>{`@keyframes stackPush { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
