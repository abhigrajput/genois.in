'use client';
import { useState, useRef, useEffect } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const CODE = `struct TrieNode {
  TrieNode* children[26];
  bool isEnd;
  TrieNode(): isEnd(false) {
    fill(children,children+26,nullptr);
  }
};

void insert(TrieNode* root, string word) {
  TrieNode* cur = root;
  for(char c : word) {
    int idx = c - 'a';
    if(!cur->children[idx])
      cur->children[idx] = new TrieNode();
    cur = cur->children[idx];
  }
  cur->isEnd = true;
}

bool search(TrieNode* root, string word) {
  TrieNode* cur = root;
  for(char c : word) {
    int idx = c - 'a';
    if(!cur->children[idx]) return false;
    cur = cur->children[idx];
  }
  return cur->isEnd;
}`;

const SPEEDS = { 1: 800, 2: 400, 3: 180, 4: 80 };

// Trie data structure (stored as tree of objects for rendering)
function buildTrieTree(words) {
  const root = { char: '', children: {}, isEnd: false, id: 'root' };
  let idCounter = 0;
  for (const word of words) {
    let cur = root;
    for (const ch of word.toLowerCase()) {
      if (!cur.children[ch]) {
        cur.children[ch] = { char: ch, children: {}, isEnd: false, id: `n${++idCounter}` };
      }
      cur = cur.children[ch];
    }
    cur.isEnd = true;
  }
  return root;
}

function layoutTrie(root) {
  const positions = {};
  function measure(node) {
    const kids = Object.values(node.children);
    if (!kids.length) return 1;
    return kids.reduce((s, k) => s + measure(k), 0);
  }
  function place(node, x, y, width) {
    positions[node.id] = { x, y, node };
    const kids = Object.values(node.children);
    let cx = x - (width / 2);
    for (const kid of kids) {
      const w = measure(kid) * 52;
      place(kid, cx + w / 2, y + 72, w);
      cx += w;
    }
  }
  const totalW = Math.max(measure(root) * 52, 600);
  place(root, totalW / 2, 40, totalW);
  return { positions, totalW };
}

function collectEdges(root, positions) {
  const edges = [];
  function walk(node) {
    for (const child of Object.values(node.children)) {
      const p = positions[node.id], c = positions[child.id];
      if (p && c) edges.push({ from: p, to: c, char: child.char, id: child.id });
      walk(child);
    }
  }
  walk(root);
  return edges;
}

export default function TrieVisualizer() {
  const [words, setWords] = useState(['cat', 'car', 'card', 'care', 'bat']);
  const [inputWord, setInputWord] = useState('');
  const [searchWord, setSearchWord] = useState('');
  const [highlightPath, setHighlightPath] = useState([]);
  const [highlightColor, setHighlightColor] = useState('#00f0ff');
  const [newNodes, setNewNodes] = useState(new Set());
  const [message, setMessage] = useState('Insert or search words in the Trie.');
  const [speed, setSpeed] = useState(2);
  const [searchResult, setSearchResult] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const root = buildTrieTree(words);
  const { positions, totalW } = layoutTrie(root);
  const edges = collectEdges(root, positions);
  const SVG_H = Math.max(...Object.values(positions).map(p => p.y)) + 60;

  const getPathIds = (word, trieRoot) => {
    const path = [trieRoot.id];
    let cur = trieRoot;
    for (const ch of word.toLowerCase()) {
      if (!cur.children[ch]) return { path, found: false };
      cur = cur.children[ch];
      path.push(cur.id);
    }
    return { path, found: cur.isEnd };
  };

  const doInsert = () => {
    const w = inputWord.trim().toLowerCase();
    if (!w || !/^[a-z]+$/.test(w)) { setMessage('Enter a valid word (a–z only)'); return; }
    if (words.includes(w)) { setMessage(`"${w}" already in trie`); return; }

    // Animate insertion char by char
    const tempWords = [...words];
    const tempRoot = buildTrieTree(tempWords);
    const newSet = new Set();
    let cur = tempRoot;
    const pathIds = [cur.id];
    for (const ch of w) {
      if (!cur.children[ch]) newSet.add(`new-${ch}-${pathIds.length}`);
      cur = cur.children[ch] ?? { id: `new-${ch}-${pathIds.length}`, children: {}, isEnd: false, char: ch };
      pathIds.push(cur.id);
    }

    setWords([...words, w]);
    setNewNodes(newSet);
    setHighlightColor('#00f0ff');
    const newRoot2 = buildTrieTree([...words, w]);
    const { path } = getPathIds(w, newRoot2);
    animatePath(path, '#00f0ff');
    setMessage(`Inserted "${w}"`);
    setInputWord('');
    setTimeout(() => setNewNodes(new Set()), 2000);
  };

  const animatePath = (path, color) => {
    clearInterval(intervalRef.current);
    setHighlightPath([]);
    let i = 0;
    intervalRef.current = setInterval(() => {
      setHighlightPath(path.slice(0, i + 1));
      i++;
      if (i >= path.length) clearInterval(intervalRef.current);
    }, SPEEDS[speed]);
  };

  const doSearch = () => {
    const w = searchWord.trim().toLowerCase();
    if (!w) { setMessage('Enter a word to search'); return; }
    const { path, found } = getPathIds(w, root);
    setSearchResult(found);
    animatePath(path, found ? '#1d9e75' : '#ff2d78');
    setHighlightColor(found ? '#1d9e75' : '#ff2d78');
    setMessage(found ? `✓ "${w}" found in Trie!` : `✗ "${w}" not found`);
    setSearchWord('');
  };

  const reset = () => {
    setWords(['cat', 'car', 'card', 'care', 'bat']);
    setHighlightPath([]); setNewNodes(new Set());
    setMessage('Reset to default words.'); setSearchResult(null);
    clearInterval(intervalRef.current);
  };

  function nodeColor(id) {
    if (highlightPath.includes(id)) return highlightColor;
    return '#1a2a3a';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is a Trie (Prefix Tree)?"
        description="A Trie stores strings character by character. Each path from root to a marked end node represents one complete word. Insert and search are O(m) where m = word length — much faster than hash maps for prefix queries. Perfect for autocomplete, spell checkers, and IP routing."
        timeComplexity="O(m) insert/search"
        spaceComplexity="O(ALPHABET × n)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Words', value: words.length, color: '#00f0ff' },
          { label: 'Nodes', value: Object.keys(positions).length, color: '#ff6b4a' },
          { label: 'Search', value: searchResult === null ? '—' : searchResult ? 'Found ✓' : 'Not Found ✗', color: searchResult ? '#1d9e75' : searchResult === false ? '#ff2d78' : '#5a7a9a' },
          { label: 'Speed', value: ['—','Slow','Med','Fast','Max'][speed], color: '#ef9f27' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,15,30,0.8)', border: `1px solid ${s.color}20`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* SVG Trie */}
        <div style={{ flex: 1, background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 12, overflow: 'auto', minWidth: 280, minHeight: 200 }}>
          <svg width={Math.max(totalW, 400)} height={SVG_H + 20} style={{ display: 'block' }}>
            {edges.map((e, i) => {
              const isHl = highlightPath.includes(e.id);
              const mid = { x: (e.from.x + e.to.x) / 2, y: (e.from.y + e.to.y) / 2 };
              return (
                <g key={i}>
                  <line x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={isHl ? highlightColor : 'rgba(0,240,255,0.15)'} strokeWidth={isHl ? 2 : 1} style={{ transition: 'all 0.3s' }} />
                  <text x={mid.x + 6} y={mid.y} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: isHl ? highlightColor : '#2a3a4a', fontWeight: 700 }}>{e.char}</text>
                </g>
              );
            })}
            {Object.values(positions).map(({ x, y, node }) => {
              const color = nodeColor(node.id);
              const isHl = highlightPath.includes(node.id);
              const isRoot = node.id === 'root';
              return (
                <g key={node.id}>
                  {isHl && <circle cx={x} cy={y} r={22} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />}
                  <circle cx={x} cy={y} r={18} fill={color === '#1a2a3a' ? '#0d1a2a' : color + '22'} stroke={isRoot ? 'rgba(0,240,255,0.3)' : color} strokeWidth={isHl ? 2.5 : 1.5} style={{ transition: 'all 0.35s' }} />
                  <text x={x} y={y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: isRoot ? 9 : 13, fontWeight: 700, fill: isRoot ? '#2a3a4a' : color, transition: 'fill 0.3s' }}>
                    {isRoot ? 'ROOT' : node.char.toUpperCase()}
                  </text>
                  {node.isEnd && <circle cx={x + 12} cy={y - 12} r={5} fill="#1d9e75" stroke="none" />}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Words list */}
        <div style={{ minWidth: 160 }}>
          <div style={{ background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(0,240,255,0.1)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a', letterSpacing: 1, marginBottom: 8 }}>WORDS IN TRIE</div>
            {words.map((w, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00f0ff', padding: '3px 0', borderBottom: '1px solid rgba(0,240,255,0.05)' }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2a3a4a', padding: '4px 8px' }}>
            ● = word end node
          </div>
        </div>
      </div>

      <StepExplanation
        explanation={message}
        status={searchResult === false ? 'mismatch' : searchResult ? 'found' : 'info'}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={inputWord} onChange={e => setInputWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && doInsert()} placeholder="Insert word..." style={inp} />
        <button onClick={doInsert} style={btn('#00f0ff')}>Insert</button>
        <input value={searchWord} onChange={e => setSearchWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Search word..." style={inp} />
        <button onClick={doSearch} style={btn('#ff6b4a')}>Search</button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a7a9a' }}>SPD</span>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 9px', borderRadius: 6, border: speed === s ? '1px solid #00f0ff' : '1px solid rgba(0,240,255,0.15)', background: speed === s ? 'rgba(0,240,255,0.12)' : 'transparent', color: speed === s ? '#00f0ff' : '#5a7a9a', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×','1×','2×','4×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('#ff2d78')}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['#00f0ff','Insert path'],['#1d9e75','Found'],['#ff2d78','Not found'],['#1d9e75','● End of word']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c+'44', border: `2px solid ${c}` }}/>
            <span style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} />
    </div>
  );
}
const btn = c => ({ padding: '8px 16px', borderRadius: 8, border: `1px solid ${c}30`, background: `${c}10`, color: c, fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' });
const inp = { background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, padding: '7px 12px', color: '#e8e8ed', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', width: 130 };
