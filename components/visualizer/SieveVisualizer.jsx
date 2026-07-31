'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 900, 2: 500, 3: 240, 4: 100 };
const N = 50;

const CODE = `// Sieve of Eratosthenes — all primes up to n
vector<bool> sieve(int n) {
  vector<bool> isPrime(n+1, true);
  isPrime[0] = isPrime[1] = false;
  for (int p = 2; p * p <= n; p++) {
    if (isPrime[p])                    // p is prime
      for (int m = p * p; m <= n; m += p)
        isPrime[m] = false;            // mark multiples of p
  }
  return isPrime;
}`;

const SNIPPETS = {
  python: `def sieve(n):
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    p = 2
    while p * p <= n:
        if is_prime[p]:                # p is prime
            for m in range(p * p, n + 1, p):
                is_prime[m] = False    # mark multiples of p
        p += 1
    return [i for i, ok in enumerate(is_prime) if ok]`,
  java: `boolean[] sieve(int n) {
  boolean[] isPrime = new boolean[n + 1];
  Arrays.fill(isPrime, true);
  isPrime[0] = isPrime[1] = false;
  for (int p = 2; (long)p * p <= n; p++)
    if (isPrime[p])                    // p is prime
      for (int m = p * p; m <= n; m += p)
        isPrime[m] = false;            // mark multiples of p
  return isPrime;
}`,
  javascript: `function sieve(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let p = 2; p * p <= n; p++)
    if (isPrime[p])                    // p is prime
      for (let m = p * p; m <= n; m += p)
        isPrime[m] = false;           // mark multiples of p
  return isPrime;
}`,
};

function computeSteps(n) {
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  const steps = [];

  steps.push({ isPrime: [...isPrime], p: null, marking: null, activeLine: 3, status: 'info',
    explanation: `Assume every number 2…${n} is prime. 0 and 1 are not primes by definition. We'll eliminate composites by crossing out multiples.` });

  for (let p = 2; p * p <= n; p++) {
    if (isPrime[p]) {
      steps.push({ isPrime: [...isPrime], p, marking: null, activeLine: 5, status: 'found',
        explanation: `${p} is still marked prime → it IS prime. Now cross out its multiples. We can start at ${p}² = ${p * p}, because every smaller multiple of ${p} was already crossed out by a smaller prime.` });
      for (let m = p * p; m <= n; m += p) {
        if (isPrime[m]) {
          isPrime[m] = false;
          steps.push({ isPrime: [...isPrime], p, marking: m, activeLine: 8, status: 'mismatch',
            explanation: `Cross out ${m} = ${p} × ${m / p} — it's a multiple of ${p}, so not prime.` });
        }
      }
    } else {
      steps.push({ isPrime: [...isPrime], p, marking: null, activeLine: 5, status: 'compare',
        explanation: `${p} was already crossed out (composite), so all its multiples were handled by its prime factors. Skip it.` });
    }
  }

  const primes = [];
  for (let i = 2; i <= n; i++) if (isPrime[i]) primes.push(i);
  steps.push({ isPrime: [...isPrime], p: null, marking: null, done: true, activeLine: -1, status: 'sorted',
    explanation: `🎉 Primes up to ${n}: ${primes.join(', ')}. The outer loop stops at √n and marking starts at p², giving the famous O(n log log n) — near-linear.` });
  return steps;
}

export default function SieveVisualizer() {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const build = useCallback(() => {
    setSteps(computeSteps(N));
    setStepIdx(-1);
    setIsPlaying(false);
  }, []);

  useEffect(() => { build(); }, [build]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const isPrime = current?.isPrime ?? (() => { const a = new Array(N + 1).fill(true); a[0] = a[1] = false; return a; })();

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

  const cellStyle = (num) => {
    const prime = isPrime[num];
    const isP = current?.p === num;
    const isMark = current?.marking === num;
    let bg = 'var(--gx-surface)', bd = 'var(--gx-border)', fg = 'var(--gx-text-muted)';
    if (num < 2) { bg = 'var(--gx-surface)'; bd = 'var(--gx-border)'; fg = 'var(--gx-surface-3)'; }
    else if (prime) { bg = 'var(--gx-success-soft)'; bd = 'var(--gx-success-border)'; fg = 'var(--gx-success)'; }
    else { bg = 'var(--gx-danger-soft)'; bd = 'var(--gx-danger-border)'; fg = 'var(--gx-text-subtle)'; }
    if (isMark) { bg = 'var(--gx-danger-soft)'; bd = 'var(--gx-danger)'; fg = 'var(--gx-danger)'; }
    if (isP) { bg = 'var(--gx-accent-soft)'; bd = 'var(--gx-accent)'; fg = 'var(--gx-accent)'; }
    return { bg, bd, fg, prime, isP, isMark };
  };

  const primeCount = isPrime.filter((v, i) => v && i >= 2).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is the Sieve of Eratosthenes?"
        description={`An ancient, elegant way to find every prime up to n (here n = ${N}). Start assuming all numbers are prime; take the smallest untouched number, declare it prime, and cross out all of its multiples. Repeat. Two optimisations make it fast: only sieve up to √n, and start crossing out at p² (smaller multiples already got crossed out by smaller primes).`}
        timeComplexity="O(n log log n)"
        spaceComplexity="O(n)"
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Current prime p', value: current?.p ?? '-', color: 'var(--gx-accent)' },
          { label: 'Primes found', value: primeCount, color: 'var(--gx-success)' },
          { label: 'Sieve up to', value: `√${N} ≈ ${Math.floor(Math.sqrt(N))}`, color: 'var(--gx-warning)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--gx-surface)', border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`, borderRadius: 8, padding: '8px 16px', minWidth: 110 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gx-text-muted)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Number grid */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
          {Array.from({ length: N + 1 }, (_, num) => {
            const s = cellStyle(num);
            return (
              <div key={num} style={{ position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, border: `2px solid ${s.bd}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: s.fg, transition: 'all 0.2s' }}>
                {num}
                {!s.prime && num >= 2 && <span style={{ position: 'absolute', fontSize: 18, color: 'var(--gx-danger)', pointerEvents: 'none' }}>╱</span>}
              </div>
            );
          })}
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to sieve out the composites.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['var(--gx-accent)', 'Current prime'], ['var(--gx-danger)', 'Crossing out'], ['var(--gx-success)', 'Prime'], ['var(--gx-text-subtle)', 'Composite']].map(([c, l]) => (
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
        {steps.length > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-muted)', marginLeft: 'auto' }}>Step <span style={{ color: 'var(--gx-accent)' }}>{Math.max(0, stepIdx + 1)}</span> / {steps.length}</span>}
      </div>

      <CodePanel code={CODE} snippets={SNIPPETS} activeLine={current?.activeLine ?? -1} />
    </div>
  );
}

const ctrlBtn = (color) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, background: 'transparent', color, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' });
