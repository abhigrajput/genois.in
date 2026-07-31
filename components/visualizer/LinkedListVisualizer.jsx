'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';

const CODE = `struct Node {
  int val;
  Node* next;
  Node(int x) : val(x), next(nullptr) {}
};

// Insert at head
void insertHead(Node*& head, int val) {
  Node* node = new Node(val);
  node->next = head;
  head = node;
}

// Insert at tail
void insertTail(Node*& head, int val) {
  Node* node = new Node(val);
  if(!head) { head=node; return; }
  Node* cur = head;
  while(cur->next) cur=cur->next;
  cur->next = node;
}

// Delete head
void deleteHead(Node*& head) {
  if(!head) return;
  Node* tmp = head;
  head = head->next;
  delete tmp;
}`;

const SNIPPETS = {
  python: `class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# Insert at head
def insert_head(head, val):
    node = Node(val)
    node.next = head
    return node  # new head

# Insert at tail
def insert_tail(head, val):
    node = Node(val)
    if not head:
        return node
    cur = head
    while cur.next:
        cur = cur.next
    cur.next = node
    return head

# Delete head
def delete_head(head):
    return head.next if head else None`,
  java: `class Node {
  int val;
  Node next;
  Node(int x) { val = x; next = null; }
}

// Insert at head
Node insertHead(Node head, int val) {
  Node node = new Node(val);
  node.next = head;
  return node;
}

// Insert at tail
Node insertTail(Node head, int val) {
  Node node = new Node(val);
  if (head == null) return node;
  Node cur = head;
  while (cur.next != null) cur = cur.next;
  cur.next = node;
  return head;
}

// Delete head
Node deleteHead(Node head) {
  return head == null ? null : head.next;
}`,
  javascript: `class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

// Insert at head
function insertHead(head, val) {
  const node = new Node(val);
  node.next = head;
  return node;
}

// Insert at tail
function insertTail(head, val) {
  const node = new Node(val);
  if (!head) return node;
  let cur = head;
  while (cur.next) cur = cur.next;
  cur.next = node;
  return head;
}

// Delete head
function deleteHead(head) {
  return head ? head.next : null;
}`,
};

let nodeIdCounter = 100;

export default function LinkedListVisualizer() {
  const [nodes, setNodes] = useState([
    { id: 1, val: 42 },
    { id: 2, val: 17 },
    { id: 3, val: 88 },
  ]);
  const [message, setMessage] = useState('');
  const [traverseIdx, setTraverseIdx] = useState(-1);
  const [animatingId, setAnimatingId] = useState(null);
  const traverseRef = useRef(null);

  useEffect(() => {
    return () => {
      if (traverseRef.current) clearInterval(traverseRef.current);
    };
  }, []);

  const insertHead = () => {
    const val = Math.floor(Math.random() * 90) + 10;
    const id = ++nodeIdCounter;
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 500);
    setNodes(prev => [{ id, val }, ...prev]);
    setMessage(`Inserted ${val} at head`);
  };

  const insertTail = () => {
    const val = Math.floor(Math.random() * 90) + 10;
    const id = ++nodeIdCounter;
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 500);
    setNodes(prev => [...prev, { id, val }]);
    setMessage(`Inserted ${val} at tail`);
  };

  const deleteHead = () => {
    if (nodes.length === 0) { setMessage('List is empty!'); return; }
    const val = nodes[0].val;
    setNodes(prev => prev.slice(1));
    setMessage(`Deleted head node (${val})`);
  };

  const deleteTail = () => {
    if (nodes.length === 0) { setMessage('List is empty!'); return; }
    const val = nodes[nodes.length - 1].val;
    setNodes(prev => prev.slice(0, -1));
    setMessage(`Deleted tail node (${val})`);
  };

  const traverse = () => {
    if (nodes.length === 0) { setMessage('List is empty!'); return; }
    let i = 0;
    setTraverseIdx(0);
    clearInterval(traverseRef.current);
    traverseRef.current = setInterval(() => {
      i++;
      if (i >= nodes.length) {
        setTraverseIdx(-1);
        setMessage('Traversal complete!');
        clearInterval(traverseRef.current);
      } else {
        setTraverseIdx(i);
        setMessage(`Visiting node: ${nodes[i].val}`);
      }
    }, 600);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ConceptBox
        title="What is a Linked List?"
        description="A Linked List is a chain of nodes where each node holds data and a pointer to the next node. Unlike arrays, nodes are not stored contiguously in memory. Insertions at head/tail are O(1) but searching requires O(n) traversal. Building block for stacks, queues, and graphs."
        timeComplexity="O(n) search, O(1) insert head"
        spaceComplexity="O(n)"
      />

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {[
          { label:'Size', value:nodes.length, color:'var(--gx-accent)' },
          { label:'Head', value:nodes.length > 0 ? nodes[0].val : 'null', color:'var(--gx-success)' },
          { label:'Tail', value:nodes.length > 0 ? nodes[nodes.length-1].val : 'null', color:'var(--gx-warning)' },
          { label:'Time (search)', value:'O(n)', color:'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--gx-surface)', border:`1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius:8, padding:'8px 16px', minWidth:100 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--gx-text-muted)', marginBottom:2 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {message && (
        <div style={{ background:'var(--gx-accent-soft)', border:'1px solid var(--gx-border)', borderRadius:8, padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gx-accent)' }}>
          ▶ {message}
        </div>
      )}

      {/* Visual linked list */}
      <div style={{ background:'var(--gx-surface)', border:'1px solid var(--gx-border)', borderRadius:12, padding:'32px 20px', minHeight:160, overflowX:'auto' }}>
        {nodes.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:80, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gx-text-subtle)' }}>
            head → null
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:0, width:'max-content' }}>
            {/* Head label */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:12 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--gx-success)' }}>head</span>
              <span style={{ color:'var(--gx-success)', fontSize:16 }}>↓</span>
            </div>

            {nodes.map((node, i) => {
              const isActive = i === traverseIdx;
              const isHead = i === 0;
              const isTail = i === nodes.length - 1;
              const isNew = node.id === animatingId;

              return (
                <div key={node.id} style={{ display:'flex', alignItems:'center', animation: isNew ? 'nodeAppear 0.4s ease' : 'none' }}>
                  {/* Node box */}
                  <div style={{
                    display:'flex', flexDirection:'column',
                    border: isActive ? '2px solid var(--gx-accent)' : isHead ? '2px solid var(--gx-success)' : isTail ? '2px solid var(--gx-warning)' : '1px solid var(--gx-accent-border)',
                    borderRadius: 10, overflow:'hidden',
                    boxShadow: isActive ? 'var(--gx-shadow-sm)' : 'none',
                    transition:'all 0.3s ease',
                    minWidth: 72,
                  }}>
                    {/* Labels */}
                    <div style={{ display:'flex', fontSize:7, fontFamily:'var(--font-mono)', borderBottom:'1px solid var(--gx-border)', background:'var(--gx-accent-soft)' }}>
                      <span style={{ flex:1, textAlign:'center', padding:'2px 0', color:'var(--gx-text-muted)', borderRight:'1px solid var(--gx-border)' }}>data</span>
                      <span style={{ flex:1, textAlign:'center', padding:'2px 0', color:'var(--gx-text-muted)' }}>next</span>
                    </div>
                    {/* Values */}
                    <div style={{ display:'flex', background:'var(--gx-surface)' }}>
                      <div style={{ flex:1, padding:'10px 8px', textAlign:'center', borderRight:'1px solid var(--gx-border)' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700, color: isActive ? 'var(--gx-accent)' : isHead ? 'var(--gx-success)' : 'var(--gx-text)' }}>{node.val}</span>
                      </div>
                      <div style={{ flex:1, padding:'10px 4px', textAlign:'center' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color: isTail ? 'var(--gx-danger)' : 'var(--gx-text-muted)' }}>
                          {isTail ? 'null' : '→'}
                        </span>
                      </div>
                    </div>
                    {/* Index label */}
                    {(isHead || isTail) && (
                      <div style={{ padding:'2px 0', textAlign:'center', background:'var(--gx-surface-2)' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:7, color: isHead ? 'var(--gx-success)' : 'var(--gx-warning)' }}>
                          {isHead && isTail ? 'head/tail' : isHead ? 'head' : 'tail'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {i < nodes.length - 1 && (
                    <div style={{ display:'flex', alignItems:'center', padding:'0 4px' }}>
                      <div style={{ width:24, height:2, background:'var(--gx-accent-soft)', position:'relative' }}>
                        <div style={{ position:'absolute', right:-5, top:-4, color:'var(--gx-accent)', fontSize:12 }}>▶</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* null terminator */}
            <div style={{ display:'flex', alignItems:'center', marginLeft:8 }}>
              <div style={{ width:20, height:2, background:'var(--gx-danger-soft)' }}/>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--gx-danger)', marginLeft:4 }}>null</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[
          { label:'Insert Head', action:insertHead, color:'var(--gx-success)', bg:'var(--gx-success-soft)', border:'var(--gx-success-border)' },
          { label:'Insert Tail', action:insertTail, color:'var(--gx-warning)', bg:'var(--gx-warning-soft)', border:'var(--gx-warning-border)' },
          { label:'Delete Head', action:deleteHead, color:'var(--gx-danger)', bg:'var(--gx-danger-soft)', border:'var(--gx-danger-border)' },
          { label:'Delete Tail', action:deleteTail, color:'var(--gx-warning)', bg:'var(--gx-warning-soft)', border:'var(--gx-warning-border)' },
          { label:'Traverse', action:traverse, color:'var(--gx-accent)', bg:'var(--gx-accent-soft)', border:'var(--gx-accent-border)' },
        ].map(b => (
          <button key={b.label} onClick={b.action} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${b.border}`, background:b.bg, color:b.color, fontFamily:'var(--font-heading)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>{b.label}</button>
        ))}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} />
      <style>{`@keyframes nodeAppear { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}
