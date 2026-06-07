'use client';
import { useState, Suspense, Component } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Catches any crash inside a visualizer so one broken algorithm never takes
// down the whole page. Keyed by algorithm id on the page so it resets on switch.
class VisualizerErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 16, color: '#fff', marginBottom: 8 }}>Visualizer loading...</div>
        <div style={{ fontSize: 13 }}>Try selecting a different algorithm</div>
      </div>
    );
    return this.props.children;
  }
}

// Sorting
const BubbleSortVisualizer    = dynamic(() => import('@/components/visualizer/BubbleSortVisualizer'),    { ssr: false });
const SelectionSortVisualizer = dynamic(() => import('@/components/visualizer/SelectionSortVisualizer'), { ssr: false });
const InsertionSortVisualizer = dynamic(() => import('@/components/visualizer/InsertionSortVisualizer'), { ssr: false });
const MergeSortVisualizer     = dynamic(() => import('@/components/visualizer/MergeSortVisualizer'),     { ssr: false });
const QuickSortVisualizer     = dynamic(() => import('@/components/visualizer/QuickSortVisualizer'),     { ssr: false });
// Searching
const LinearSearchVisualizer  = dynamic(() => import('@/components/visualizer/LinearSearchVisualizer'),  { ssr: false });
const BinarySearchVisualizer  = dynamic(() => import('@/components/visualizer/BinarySearchVisualizer'),  { ssr: false });
// Data Structures
const StackVisualizer         = dynamic(() => import('@/components/visualizer/StackVisualizer'),         { ssr: false });
const QueueVisualizer         = dynamic(() => import('@/components/visualizer/QueueVisualizer'),         { ssr: false });
const LinkedListVisualizer    = dynamic(() => import('@/components/visualizer/LinkedListVisualizer'),    { ssr: false });
const HeapVisualizer          = dynamic(() => import('@/components/visualizer/HeapVisualizer'),          { ssr: false });
const UnionFindVisualizer     = dynamic(() => import('@/components/visualizer/UnionFindVisualizer'),     { ssr: false });
const TrieVisualizer          = dynamic(() => import('@/components/visualizer/TrieVisualizer'),          { ssr: false });
// Trees
const BinaryTreeVisualizer    = dynamic(() => import('@/components/visualizer/BinaryTreeVisualizer'),    { ssr: false });
const BSTVisualizer           = dynamic(() => import('@/components/visualizer/BSTVisualizer'),           { ssr: false });
const AVLTreeVisualizer       = dynamic(() => import('@/components/visualizer/AVLTreeVisualizer'),       { ssr: false });
const SegmentTreeVisualizer   = dynamic(() => import('@/components/visualizer/SegmentTreeVisualizer'),   { ssr: false });
// Graphs
const BFSVisualizer           = dynamic(() => import('@/components/visualizer/BFSVisualizer'),           { ssr: false });
const DFSVisualizer           = dynamic(() => import('@/components/visualizer/DFSVisualizer'),           { ssr: false });
const GraphVisualizer         = dynamic(() => import('@/components/visualizer/GraphVisualizer'),         { ssr: false });
const DijkstraVisualizer      = dynamic(() => import('@/components/visualizer/DijkstraVisualizer'),      { ssr: false });
const FloydWarshallVisualizer = dynamic(() => import('@/components/visualizer/FloydWarshallVisualizer'), { ssr: false });
const TopologicalSortVisualizer = dynamic(() => import('@/components/visualizer/TopologicalSortVisualizer'), { ssr: false });
const PrimVisualizer          = dynamic(() => import('@/components/visualizer/PrimVisualizer'),          { ssr: false });
const KruskalVisualizer       = dynamic(() => import('@/components/visualizer/KruskalVisualizer'),       { ssr: false });
// Dynamic Programming
const FibonacciDPVisualizer   = dynamic(() => import('@/components/visualizer/FibonacciDPVisualizer'),   { ssr: false });
const KnapsackDPVisualizer    = dynamic(() => import('@/components/visualizer/KnapsackDPVisualizer'),    { ssr: false });
const LCSVisualizer           = dynamic(() => import('@/components/visualizer/LCSVisualizer'),           { ssr: false });
// String Algorithms
const KMPVisualizer           = dynamic(() => import('@/components/visualizer/KMPVisualizer'),           { ssr: false });
// Backtracking
const NQueensVisualizer       = dynamic(() => import('@/components/visualizer/NQueensVisualizer'),       { ssr: false });

const ALGORITHMS = [
  // Sorting
  { id: 'bubble-sort',       name: 'Bubble Sort',       category: 'Sorting',         component: BubbleSortVisualizer,      complexity: 'O(n²)',      icon: '🫧' },
  { id: 'selection-sort',    name: 'Selection Sort',    category: 'Sorting',         component: SelectionSortVisualizer,   complexity: 'O(n²)',      icon: '🔍' },
  { id: 'insertion-sort',    name: 'Insertion Sort',    category: 'Sorting',         component: InsertionSortVisualizer,   complexity: 'O(n²)',      icon: '🃏' },
  { id: 'merge-sort',        name: 'Merge Sort',        category: 'Sorting',         component: MergeSortVisualizer,       complexity: 'O(n log n)', icon: '⚡' },
  { id: 'quick-sort',        name: 'Quick Sort',        category: 'Sorting',         component: QuickSortVisualizer,       complexity: 'O(n log n)', icon: '🚀' },
  // Searching
  { id: 'linear-search',     name: 'Linear Search',     category: 'Searching',       component: LinearSearchVisualizer,    complexity: 'O(n)',       icon: '🔎' },
  { id: 'binary-search',     name: 'Binary Search',     category: 'Searching',       component: BinarySearchVisualizer,    complexity: 'O(log n)',   icon: '⚖️' },
  // Data Structures
  { id: 'stack',             name: 'Stack',             category: 'Data Structures', component: StackVisualizer,           complexity: 'O(1)',       icon: '📚' },
  { id: 'queue',             name: 'Queue',             category: 'Data Structures', component: QueueVisualizer,           complexity: 'O(1)',       icon: '🚌' },
  { id: 'linked-list',       name: 'Linked List',       category: 'Data Structures', component: LinkedListVisualizer,      complexity: 'O(n)',       icon: '🔗' },
  { id: 'heap',              name: 'Heap',              category: 'Data Structures', component: HeapVisualizer,            complexity: 'O(log n)',   icon: '⛰️' },
  { id: 'union-find',        name: 'Union Find',        category: 'Data Structures', component: UnionFindVisualizer,       complexity: 'O(α(n))',    icon: '🔀' },
  { id: 'trie',              name: 'Trie',              category: 'Data Structures', component: TrieVisualizer,            complexity: 'O(L)',       icon: '🗂️' },
  // Trees
  { id: 'binary-tree',       name: 'Binary Tree',       category: 'Trees',           component: BinaryTreeVisualizer,      complexity: 'O(n)',       icon: '🌳' },
  { id: 'bst',               name: 'BST',               category: 'Trees',           component: BSTVisualizer,             complexity: 'O(log n)',   icon: '🌲' },
  { id: 'avl-tree',          name: 'AVL Tree',          category: 'Trees',           component: AVLTreeVisualizer,         complexity: 'O(log n)',   icon: '⚖️' },
  { id: 'segment-tree',      name: 'Segment Tree',      category: 'Trees',           component: SegmentTreeVisualizer,     complexity: 'O(log n)',   icon: '📊' },
  // Graphs
  { id: 'graph',             name: 'Graph',             category: 'Graphs',          component: GraphVisualizer,           complexity: 'O(V+E)',     icon: '🕸️' },
  { id: 'bfs',               name: 'BFS',               category: 'Graphs',          component: BFSVisualizer,             complexity: 'O(V+E)',     icon: '🔵' },
  { id: 'dfs',               name: 'DFS',               category: 'Graphs',          component: DFSVisualizer,             complexity: 'O(V+E)',     icon: '🟣' },
  { id: 'dijkstra',          name: 'Dijkstra',          category: 'Graphs',          component: DijkstraVisualizer,        complexity: 'O(E log V)', icon: '🗺️' },
  { id: 'floyd-warshall',    name: 'Floyd-Warshall',    category: 'Graphs',          component: FloydWarshallVisualizer,   complexity: 'O(V³)',      icon: '📊' },
  { id: 'topological-sort',  name: 'Topological Sort',  category: 'Graphs',          component: TopologicalSortVisualizer, complexity: 'O(V+E)',     icon: '📋' },
  { id: 'prim',              name: "Prim's MST",        category: 'Graphs',          component: PrimVisualizer,            complexity: 'O(E log V)', icon: '🌲' },
  { id: 'kruskal',           name: "Kruskal's MST",     category: 'Graphs',          component: KruskalVisualizer,         complexity: 'O(E log E)', icon: '🗺️' },
  // Dynamic Programming
  { id: 'fibonacci-dp',      name: 'Fibonacci DP',      category: 'Dynamic Programming', component: FibonacciDPVisualizer, complexity: 'O(n)',       icon: '🌀' },
  { id: 'knapsack-dp',       name: '0/1 Knapsack DP',   category: 'Dynamic Programming', component: KnapsackDPVisualizer,  complexity: 'O(nW)',      icon: '🎒' },
  { id: 'lcs-dp',            name: 'LCS DP',            category: 'Dynamic Programming', component: LCSVisualizer,         complexity: 'O(mn)',      icon: '🧵' },
  // String Algorithms
  { id: 'kmp-search',        name: 'KMP Search',        category: 'String Algorithms', component: KMPVisualizer,           complexity: 'O(n+m)',     icon: '🧵' },
  // Backtracking
  { id: 'n-queens',          name: 'N-Queens',          category: 'Backtracking',    component: NQueensVisualizer,         complexity: 'O(N!)',      icon: '👑' },
];

const CATEGORY_COLORS = {
  'Sorting':             '#00f0ff',
  'Searching':           '#7b5cff',
  'Data Structures':     '#1d9e75',
  'Trees':               '#ef9f27',
  'Graphs':              '#ff2d78',
  'Dynamic Programming': '#ef2dff',
  'String Algorithms':   '#00ff88',
  'Backtracking':        '#ff5e00',
};

const CATEGORY_ICONS = {
  'Sorting':             '↕',
  'Searching':           '◎',
  'Data Structures':     '◈',
  'Trees':               '❐',
  'Graphs':              '⬡',
  'Dynamic Programming': '⬘',
  'String Algorithms':   '⎔',
  'Backtracking':        '⤾',
};

function AlgoSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulse 1.5s ease infinite' }}>
      {[200, 120, 80].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.06)' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

function DSAVisualizerInner() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams?.get('algo') || 'bubble-sort');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selected = ALGORITHMS.find(a => a.id === selectedId) || ALGORITHMS[0];
  const VisualizerComponent = selected.component;

  const filtered = ALGORITHMS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(ALGORITHMS.map(a => a.category))];

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 96px)', overflow: 'hidden', position: 'relative' }}>
      {/* Left sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        borderRight: sidebarOpen ? '1px solid rgba(0,240,255,0.1)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(6,15,30,0.7)',
        backdropFilter: 'blur(12px)',
        height: '100%',
      }}>
        <div style={{ padding: '14px 12px 8px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#5a7a9a', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search algorithms..."
              style={{ width: '100%', background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, padding: '7px 10px 7px 32px', color: '#e8f4ff', fontSize: 12, fontFamily: 'Outfit,sans-serif', outline: 'none' }}
            />
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {categories.map(cat => {
            const items = filtered.filter(a => a.category === cat);
            if (!items.length) return null;
            const color = CATEGORY_COLORS[cat];
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: 2, color: color + '80', fontWeight: 600, textTransform: 'uppercase' }}>
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </div>
                {items.map(algo => {
                  const active = selectedId === algo.id;
                  return (
                    <button key={algo.id} onClick={() => setSelectedId(algo.id)} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, marginBottom: 1, border: 'none',
                      background: active ? `${color}12` : 'transparent',
                      borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                      color: active ? color : '#5a7a9a',
                      fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 14 }}>{algo.icon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{algo.name}</span>
                        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: active ? color + '80' : '#2a3a4a', marginTop: 1 }}>{algo.complexity}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Algorithm count */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(0,240,255,0.06)', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#2a3a4a', flexShrink: 0 }}>
          {ALGORITHMS.length} ALGORITHMS TOTAL
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minWidth: 0 }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            style={{ background: 'transparent', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 8, color: '#5a7a9a', fontSize: 14, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            title="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24 }}>{selected.icon}</span>
            <div>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#e8f4ff', margin: 0, lineHeight: 1.2 }}>
                {selected.name}
              </h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 10, letterSpacing: 1,
                  color: CATEGORY_COLORS[selected.category], background: `${CATEGORY_COLORS[selected.category]}12`,
                  border: `1px solid ${CATEGORY_COLORS[selected.category]}25`, borderRadius: 20, padding: '2px 10px',
                }}>{selected.category}</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#5a7a9a', background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 20, padding: '2px 10px' }}>
                  {selected.complexity}
                </span>
              </div>
            </div>
          </div>

          {/* Quick nav — emoji pills */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
            {ALGORITHMS.map(a => (
              <button key={a.id} onClick={() => setSelectedId(a.id)} title={a.name}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  border: `1px solid ${selectedId === a.id ? CATEGORY_COLORS[a.category] : 'rgba(0,240,255,0.1)'}`,
                  background: selectedId === a.id ? `${CATEGORY_COLORS[a.category]}15` : 'transparent',
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {a.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Visualizer card */}
        <div style={{
          background: 'rgba(8,14,28,0.8)', border: '1px solid rgba(0,240,255,0.1)',
          borderRadius: 16, padding: '24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${CATEGORY_COLORS[selected.category]}60,transparent)` }} />

          <VisualizerErrorBoundary key={selectedId}>
            <Suspense fallback={<AlgoSkeleton />}>
              <VisualizerComponent />
            </Suspense>
          </VisualizerErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function DSAVisualizerPage() {
  return (
    <div style={{ margin: -24 }}>
      <Suspense fallback={<AlgoSkeleton />}>
        <DSAVisualizerInner />
      </Suspense>
    </div>
  );
}
