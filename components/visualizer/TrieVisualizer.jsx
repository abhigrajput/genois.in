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
  const [highlightColor, setHighlightColor] = useState('var(--gx-accent)');
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
    setHighlightColor('var(--gx-accent)');
    const newRoot2 = buildTrieTree([...words, w]);
    const { path } = getPathIds(w, newRoot2);
    animatePath(path, 'var(--gx-accent)');
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
    animatePath(path, found ? 'var(--gx-success)' : 'var(--gx-danger)');
    setHighlightColor(found ? 'var(--gx-success)' : 'var(--gx-danger)');
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
    return 'var(--gx-surface-2)';
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
          { label: 'Words', value: words.length, color: 'var(--gx-accent)' },
          { label: 'Nodes', value: Object.keys(positions).length, color: 'var(--gx-warning)' },
          { label: 'Search', value: searchResult === null ? '—' : searchResult ? 'Found ✓' : 'Not Found ✗', color: searchResult ? 'var(--gx-success)' : searchResult === false ? 'var(--gx-danger)' : 'var(--gx-text-muted)' },
          { label: 'Speed', value: ['—','Slow','Med','Fast','Max'][speed], color: 'var(--gx-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* SVG Trie */}
        <div style={{ flex: 1, background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, overflow: 'auto', minWidth: 280, minHeight: 200 }}>
          <svg width={Math.max(totalW, 400)} height={SVG_H + 20} style={{ display: 'block' }}>
            {edges.map((e, i) => {
              const isHl = highlightPath.includes(e.id);
              const mid = { x: (e.from.x + e.to.x) / 2, y: (e.from.y + e.to.y) / 2 };
              return (
                <g key={i}>
                  <line x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={isHl ? highlightColor : 'var(--gx-border)'} strokeWidth={isHl ? 2 : 1} style={{ transition: 'all 0.3s' }} />
                  <text x={mid.x + 6} y={mid.y} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: isHl ? highlightColor : 'var(--gx-text-subtle)', fontWeight: 700 }}>{e.char}</text>
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
                  <circle cx={x} cy={y} r={18} fill={color === 'var(--gx-surface-2)' ? 'var(--gx-surface)' : `color-mix(in srgb, ${color} 13%, transparent)`} stroke={isRoot ? 'var(--gx-accent-border)' : color} strokeWidth={isHl ? 2.5 : 1.5} style={{ transition: 'all 0.35s' }} />
                  <text x={x} y={y + 5} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: isRoot ? 9 : 13, fontWeight: 700, fill: isRoot ? 'var(--gx-text-subtle)' : color, transition: 'fill 0.3s' }}>
                    {isRoot ? 'ROOT' : node.char.toUpperCase()}
                  </text>
                  {node.isEnd && <circle cx={x + 12} cy={y - 12} r={5} fill="var(--gx-success)" stroke="none" />}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Words list */}
        <div style={{ minWidth: 160 }}>
          <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 8 }}>WORDS IN TRIE</div>
            {words.map((w, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gx-accent)', padding: '3px 0', borderBottom: '1px solid var(--gx-border)' }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gx-text-subtle)', padding: '4px 8px' }}>
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
        <button onClick={doInsert} style={btn('var(--gx-accent)')}>Insert</button>
        <input value={searchWord} onChange={e => setSearchWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Search word..." style={inp} />
        <button onClick={doSearch} style={btn('var(--gx-warning)')}>Search</button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)' }}>SPD</span>
          {[1,2,3,4].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 9px', borderRadius: 6, border: speed === s ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)', background: speed === s ? 'var(--gx-accent-soft)' : 'transparent', color: speed === s ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×','1×','2×','4×'][s-1]}</button>
          ))}
        </div>
        <button onClick={reset} style={btn('var(--gx-danger)')}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['var(--gx-accent)','Insert path'],['var(--gx-success)','Found'],['var(--gx-danger)','Not found'],['var(--gx-success)','● End of word']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: `color-mix(in srgb, ${c} 27%, transparent)`, border: `2px solid ${c}` }}/>
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>
      <CodePanel code={CODE} />
    </div>
  );
}
const btn = c => ({ padding: '8px 16px', borderRadius: 8, border: `1px solid color-mix(in srgb, ${c} 19%, transparent)`, background: `color-mix(in srgb, ${c} 6%, transparent)`, color: c, fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' });
const inp = { background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', borderRadius: 8, padding: '7px 12px', color: 'var(--gx-text)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none', width: 130 };
