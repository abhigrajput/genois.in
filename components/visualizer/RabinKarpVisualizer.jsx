'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1100, 2: 650, 3: 320, 4: 140 };
const BASE = 26;   // lowercase alphabet
const MOD = 101;   // small prime — keeps the numbers readable

const CODE = `// Rabin-Karp with a rolling hash
int rabinKarp(string t, string p) {
  int n=t.size(), m=p.size(), B=26, MOD=101;
  int pow=1; for(int i=0;i<m-1;i++) pow=(pow*B)%MOD;
  int ph=0, wh=0;
  for(int i=0;i<m;i++){                 // hash pattern + first window
    ph=(ph*B + p[i])%MOD;
    wh=(wh*B + t[i])%MOD;
  }
  for(int i=0;i<=n-m;i++){
    if(ph==wh){                         // hashes match → verify chars
      if(t.substr(i,m)==p) return i;    // real match
    }
    if(i<n-m)                           // roll the hash forward
      wh=((wh - t[i]*pow)*B + t[i+m])%MOD;
  }
  return -1;
}`;

const SNIPPETS = {
  python: `def rabin_karp(t, p, B=26, MOD=101):
    n, m = len(t), len(p)
    high = pow(B, m - 1, MOD)
    ph = wh = 0
    for i in range(m):                    # hash pattern + first window
        ph = (ph * B + ord(p[i])) % MOD
        wh = (wh * B + ord(t[i])) % MOD
    for i in range(n - m + 1):
        if ph == wh and t[i:i+m] == p:    # verify on hash hit
            return i
        if i < n - m:                     # roll the hash
            wh = ((wh - ord(t[i]) * high) * B + ord(t[i+m])) % MOD
    return -1`,
  java: `int rabinKarp(String t, String p) {
  int n=t.length(), m=p.length(), B=26, MOD=101, high=1;
  for(int i=0;i<m-1;i++) high=(high*B)%MOD;
  int ph=0, wh=0;
  for(int i=0;i<m;i++){                    // hash pattern + first window
    ph=(ph*B + t.charAt(i))%MOD;   // (use p for ph)
    wh=(wh*B + t.charAt(i))%MOD;
  }
  for(int i=0;i<=n-m;i++){
    if(ph==wh && t.substring(i,i+m).equals(p)) return i;
    if(i<n-m) wh=((wh - t.charAt(i)*high)*B + t.charAt(i+m))%MOD;
  }
  return -1;
}`,
  javascript: `function rabinKarp(t, p, B = 26, MOD = 101) {
  const n = t.length, m = p.length;
  let high = 1; for (let i = 0; i < m-1; i++) high = (high*B) % MOD;
  let ph = 0, wh = 0;
  for (let i = 0; i < m; i++) {            // hash pattern + first window
    ph = (ph*B + p.charCodeAt(i)) % MOD;
    wh = (wh*B + t.charCodeAt(i)) % MOD;
  }
  for (let i = 0; i <= n-m; i++) {
    if (ph === wh && t.substr(i, m) === p) return i; // verify
    if (i < n-m) wh = (((wh - t.charCodeAt(i)*high)*B + t.charCodeAt(i+m)) % MOD + MOD) % MOD;
  }
  return -1;
}`,
};

const PRESETS = [
  { text: 'abracadabra', pattern: 'cad' },
  { text: 'aabaacaadaab', pattern: 'aab' },
  { text: 'thequickbrown', pattern: 'own' },
];

const code = (ch) => ch.charCodeAt(0) - 97; // 'a' -> 0

function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * BASE + code(str[i])) % MOD;
  return h;
}

function computeSteps(text, pattern) {
  const n = text.length, m = pattern.length;
  const steps = [];
  const ph = hashOf(pattern);
  let high = 1;
  for (let i = 0; i < m - 1; i++) high = (high * BASE) % MOD;
  let wh = hashOf(text.slice(0, m));

  steps.push({ i: -1, ph, wh, compareIdx: -1, matched: null, activeLine: 6, status: 'info',
    explanation: `Precompute hashes: pattern "${pattern}" hashes to ${ph}. First window "${text.slice(0, m)}" hashes to ${wh}. We'll slide and compare hashes in O(1) each.` });

  for (let i = 0; i <= n - m; i++) {
    const window = text.slice(i, i + m);
    if (ph === wh) {
      // hashes match — verify character by character
      let ok = true, mis = -1;
      for (let k = 0; k < m; k++) {
        if (text[i + k] !== pattern[k]) { ok = false; mis = k; break; }
      }
      steps.push({ i, ph, wh, window, compareIdx: i, matched: ok ? true : 'spurious', mismatchAt: mis, activeLine: 11, status: ok ? 'sorted' : 'mismatch',
        explanation: ok
          ? `Hashes match (${wh}=${ph}) AND "${window}" == "${pattern}" — real MATCH at index ${i}! 🎯`
          : `Hashes match (${wh}=${ph}) but "${window}" ≠ "${pattern}" — a spurious hit (hash collision). Verify chars, reject, keep sliding.` });
      if (ok) {
        steps.push({ i, ph, wh, window, compareIdx: i, matched: true, done: true, activeLine: 11, status: 'sorted',
          explanation: `✅ Found "${pattern}" at index ${i}. Rabin-Karp averages O(n + m); the rolling hash makes each shift O(1) instead of re-hashing the whole window.` });
        return steps;
      }
    } else {
      steps.push({ i, ph, wh, window, compareIdx: i, matched: false, activeLine: 10, status: 'compare',
        explanation: `Window ${i}: "${window}" hashes to ${wh} ≠ pattern hash ${ph}. Different hash ⇒ definitely not a match. Skip the O(m) char check entirely.` });
    }
    if (i < n - m) {
      const removed = code(text[i]);
      wh = (((wh - removed * high) * BASE + code(text[i + m])) % MOD + MOD) % MOD;
      steps.push({ i: i + 1, ph, wh, window: text.slice(i + 1, i + 1 + m), compareIdx: -1, rolled: true, activeLine: 13, status: 'pivot',
        explanation: `Roll the hash: drop '${text[i]}' from the front, add '${text[i + m]}' at the back → new window hash = ${wh}. No full re-hash needed.` });
    }
  }
  steps.push({ i: n - m, ph, wh, compareIdx: -1, matched: false, done: true, activeLine: 15, status: 'mismatch',
    explanation: `Slid past the end without a match — pattern "${pattern}" is not in the text. Return -1.` });
  return steps;
}

export default function RabinKarpVisualizer() {
  const [preset, setPreset] = useState(0);
  const { text, pattern } = PRESETS[preset];
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const buildSteps = useCallback(() => {
    setSteps(computeSteps(text, pattern));
    setStepIdx(-1);
    setIsPlaying(false);
  }, [text, pattern]);

  useEffect(() => { buildSteps(); }, [buildSteps]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const windowStart = current?.i ?? -1;
  const m = pattern.length;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev + 1 >= steps.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, SPEEDS[speed]);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps.length]);

  const charColor = (idx) => {
    if (windowStart < 0 || idx < windowStart || idx >= windowStart + m) return { bg: 'var(--gx-surface)', bd: 'var(--gx-border)', fg: 'var(--gx-text)' };
    const k = idx - windowStart;
    if (current?.matched === true) return { bg: 'var(--gx-success-soft)', bd: 'var(--gx-success)', fg: 'var(--gx-success)' };
    if (current?.matched === 'spurious') {
      if (k === current.mismatchAt) return { bg: 'var(--gx-danger-soft)', bd: 'var(--gx-danger)', fg: 'var(--gx-danger)' };
      return { bg: 'var(--gx-warning-soft)', bd: 'var(--gx-warning)', fg: 'var(--gx-warning)' };
    }
    return { bg: 'var(--gx-accent-soft)', bd: 'var(--gx-accent)', fg: 'var(--gx-accent)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is the Rabin-Karp Algorithm?"
        description="Rabin-Karp finds a pattern in text by comparing HASHES instead of characters. It hashes the pattern once, then slides a window across the text keeping a rolling hash — each shift drops the leaving character and adds the entering one in O(1). Only when a window's hash equals the pattern's hash does it verify character-by-character, catching rare spurious hits (hash collisions)."
        timeComplexity="O(n + m) avg"
        spaceComplexity="O(1)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Pattern hash', value: current?.ph ?? hashOf(pattern), color: 'var(--gx-warning)' },
          { label: 'Window hash', value: current?.wh ?? '-', color: 'var(--gx-accent)' },
          { label: 'base / mod', value: `${BASE}/${MOD}`, color: 'var(--gx-warning)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pattern */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-warning)', letterSpacing: 1, minWidth: 60 }}>PATTERN</span>
        {pattern.split('').map((ch, i) => (
          <div key={i} style={{ width: 30, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gx-warning-soft)', border: '1px solid var(--gx-warning-border)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--gx-warning)' }}>{ch}</div>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-muted)' }}>→ hash {current?.ph ?? hashOf(pattern)}</span>
      </div>

      {/* Text with sliding window */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '16px', overflowX: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 10 }}>TEXT</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {text.split('').map((ch, i) => {
            const c = charColor(i);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 30, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, border: `2px solid ${c.bd}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: c.fg, transition: 'all 0.2s' }}>{ch}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--gx-text-subtle)' }}>{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to hash, slide, and roll.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['var(--gx-accent)', 'Window (hash ≠)'], ['var(--gx-warning)', 'Hash hit → verifying'], ['var(--gx-danger)', 'Char mismatch'], ['var(--gx-success)', 'Match']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, ${c} 13%, transparent)`, border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setStepIdx((p) => Math.max(p - 1, 0))} style={ctrlBtn('var(--gx-text-muted)')}>⏮</button>
        <button onClick={() => setIsPlaying((p) => !p)} style={{ ...ctrlBtn('var(--gx-accent)'), background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', minWidth: 80, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))} style={ctrlBtn('var(--gx-text-muted)')}>⏭</button>
        <button onClick={() => { setStepIdx(-1); setIsPlaying(false); }} style={{ ...ctrlBtn('var(--gx-danger)'), background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', fontFamily: 'var(--font-body)' }}>↺ Reset</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>SPEED</span>
          {[1, 2, 3, 4].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 10px', borderRadius: 6, border: speed === s ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)', background: speed === s ? 'var(--gx-accent-soft)' : 'transparent', color: speed === s ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{['0.5×', '1×', '2×', '3×'][s - 1]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => setPreset(i)} style={{ padding: '4px 10px', borderRadius: 6, border: preset === i ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)', background: preset === i ? 'var(--gx-accent-soft)' : 'transparent', color: preset === i ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>&ldquo;{p.pattern}&rdquo;</button>
          ))}
        </div>
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}

const ctrlBtn = (color) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, background: 'transparent', color, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' });
