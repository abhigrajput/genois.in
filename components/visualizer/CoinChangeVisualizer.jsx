'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import CodePanel from './CodePanel';
import ConceptBox from './ConceptBox';
import StepExplanation from './StepExplanation';

const SPEEDS = { 1: 1100, 2: 650, 3: 300, 4: 120 };
const INF = Infinity;

const CODE = `int coinChange(vector<int>& coins, int amount) {
  vector<int> dp(amount+1, INF);
  dp[0] = 0;                         // 0 coins make amount 0
  for (int a = 1; a <= amount; a++)
    for (int c : coins)
      if (c <= a && dp[a-c] != INF)
        dp[a] = min(dp[a], dp[a-c] + 1);
  return dp[amount] == INF ? -1 : dp[amount];
}`;

const SNIPPETS = {
  python: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0                        # 0 coins make amount 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] != float('inf'):
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
  java: `int coinChange(int[] coins, int amount) {
  int[] dp = new int[amount + 1];
  Arrays.fill(dp, Integer.MAX_VALUE);
  dp[0] = 0;                         // 0 coins make amount 0
  for (int a = 1; a <= amount; a++)
    for (int c : coins)
      if (c <= a && dp[a - c] != Integer.MAX_VALUE)
        dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}`,
  javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;                         // 0 coins make amount 0
  for (let a = 1; a <= amount; a++)
    for (const c of coins)
      if (c <= a && dp[a - c] !== Infinity)
        dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
};

const PRESETS = [
  { coins: [1, 3, 4], amount: 6 },
  { coins: [1, 2, 5], amount: 11 },
  { coins: [2, 5], amount: 9 },
];

function computeSteps(coins, amount) {
  const dp = new Array(amount + 1).fill(INF);
  dp[0] = 0;
  const steps = [];
  steps.push({ dp: [...dp], a: 0, coin: null, from: null, activeLine: 2, status: 'info',
    explanation: `Base case: dp[0] = 0. Zero coins are needed to make amount 0. Every other dp[a] starts at ∞ (unreachable until proven otherwise).` });

  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] !== INF) {
        const candidate = dp[a - c] + 1;
        const improved = candidate < dp[a];
        if (improved) dp[a] = candidate;
        steps.push({ dp: [...dp], a, coin: c, from: a - c, activeLine: 6, status: improved ? 'sorted' : 'compare',
          explanation: improved
            ? `Amount ${a}, coin ${c}: dp[${a}] = dp[${a - c}] + 1 = ${candidate}. Better than before — take it.`
            : `Amount ${a}, coin ${c}: dp[${a - c}] + 1 = ${candidate}, not better than current dp[${a}]=${dp[a]}. Keep the smaller.` });
      } else if (c <= a) {
        steps.push({ dp: [...dp], a, coin: c, from: a - c, activeLine: 5, status: 'mismatch',
          explanation: `Amount ${a}, coin ${c}: dp[${a - c}] is still ∞ (unreachable), so this coin can't help build ${a} yet.` });
      }
    }
  }
  const ans = dp[amount] === INF ? -1 : dp[amount];
  steps.push({ dp: [...dp], a: amount, coin: null, from: null, done: true, activeLine: 8, status: 'sorted',
    explanation: ans === -1
      ? `dp[${amount}] is still ∞ — this amount is impossible with the given coins, so the answer is -1.`
      : `🎉 Fewest coins to make ${amount} = dp[${amount}] = ${ans}. Bottom-up DP fills every sub-amount once: O(amount × coins).` });
  return steps;
}

export default function CoinChangeVisualizer() {
  const [preset, setPreset] = useState(0);
  const { coins, amount } = PRESETS[preset];
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const intervalRef = useRef(null);

  const buildSteps = useCallback(() => {
    setSteps(computeSteps(coins, amount));
    setStepIdx(-1);
    setIsPlaying(false);
  }, [coins, amount]);

  useEffect(() => { buildSteps(); }, [buildSteps]);

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const dp = current?.dp ?? (() => { const d = new Array(amount + 1).fill(INF); d[0] = 0; return d; })();

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

  const cellColor = (i) => {
    if (!current) return 'var(--gx-surface-2)';
    if (i === current.a && !current.done) return 'var(--gx-accent)';
    if (i === current.from) return 'var(--gx-warning)';
    return dp[i] === INF ? 'var(--gx-surface-3)' : 'var(--gx-success)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ConceptBox
        title="What is the Coin Change (Min Coins) problem?"
        description="Given coin denominations and a target amount, find the fewest coins that sum to it. Bottom-up DP builds the answer for every amount from 1 up: dp[a] = 1 + min over coins c of dp[a − c]. Each sub-amount is solved once and reused, turning an exponential search into a simple table fill."
        timeComplexity="O(amount × coins)"
        spaceComplexity="O(amount)"
      />

      {/* Preset selector + coins */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1 }}>COINS</span>
        {coins.map((c) => (
          <div key={c} style={{ width: 34, height: 34, borderRadius: '50%', background: current?.coin === c ? 'var(--gx-warning-soft)' : 'var(--gx-warning-soft)', border: `2px solid ${current?.coin === c ? 'var(--gx-warning)' : 'var(--gx-warning-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--gx-warning)', transition: 'all 0.2s' }}>{c}</div>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gx-text-muted)', marginLeft: 8 }}>target = {amount}</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => setPreset(i)} style={{ padding: '4px 10px', borderRadius: 6, border: preset === i ? '1px solid var(--gx-accent)' : '1px solid var(--gx-border)', background: preset === i ? 'var(--gx-accent-soft)' : 'transparent', color: preset === i ? 'var(--gx-accent)' : 'var(--gx-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>[{p.coins.join(',')}]→{p.amount}</button>
          ))}
        </div>
      </div>

      {/* DP table */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '16px', overflowX: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--gx-text-muted)', letterSpacing: 1, marginBottom: 10 }}>DP TABLE — dp[a] = fewest coins to make amount a</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {dp.map((v, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ minWidth: 34, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cellColor(i)}22`, border: `2px solid ${cellColor(i)}`, borderRadius: 7, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: cellColor(i), transition: 'all 0.25s' }}>{v === INF ? '∞' : v}</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gx-text-muted)' }}>{i}</span>
            </div>
          ))}
        </div>
      </div>

      <StepExplanation
        stepNumber={Math.max(0, stepIdx + 1)}
        totalSteps={steps.length}
        explanation={current?.explanation ?? 'Press ▶ Play or ⏭ Step to fill the DP table amount by amount.'}
        status={current?.status ?? 'default'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[['var(--gx-accent)', 'Amount being solved'], ['var(--gx-warning)', 'dp[a − coin] source'], ['var(--gx-success)', 'Solved'], ['var(--gx-surface-3)', '∞ (unreachable)']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in srgb, ${c} 13%, transparent)`, border: `2px solid ${c}` }} />
            <span style={{ fontSize: 11, color: 'var(--gx-text-muted)', fontFamily: 'var(--font-body)' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Controls (playback only — presets replace array randomize) */}
      <div style={{ background: 'var(--gx-surface)', border: '1px solid var(--gx-border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setStepIdx((p) => Math.max(p - 1, 0))} style={ctrlBtn('var(--gx-text-muted)')}>⏮</button>
        <button onClick={() => setIsPlaying((p) => !p)} style={{ ...ctrlBtn('var(--gx-accent)'), background: 'var(--gx-accent-soft)', border: '1px solid var(--gx-accent-border)', minWidth: 80, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={() => setStepIdx((p) => Math.min(p + 1, steps.length - 1))} style={ctrlBtn('var(--gx-text-muted)')}>⏭</button>
        <button onClick={() => { setStepIdx(-1); setIsPlaying(false); }} style={{ ...ctrlBtn('var(--gx-danger)'), background: 'var(--gx-danger-soft)', border: '1px solid var(--gx-danger-border)', fontFamily: 'var(--font-body)' }}>↺ Reset</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
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
