#!/usr/bin/env node
// Seeds aptitude shortcut tricks into knowledge_base.
// Same admin-client approach as scripts/seed-knowledge-base.js / app/api/rag/seed.
// Dedupes by the first 50 chars of content (per task spec).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✘ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const APTITUDE_ENTRIES = [
  { content: "Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.", company: null, difficulty: "easy" },
  { content: "Direct Proportion: If A increases, B increases proportionally. Formula: A1/A2 = B1/B2. Inverse Proportion: If A increases, B decreases. Formula: A1/A2 = B2/B1. Common in: speed-time, workers-days, pipes problems.", company: null, difficulty: "easy" },
  { content: "Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.", company: null, difficulty: "easy" },
  { content: "Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.", company: null, difficulty: "medium" },
  { content: "Profit Loss Shortcuts: Profit% = (SP-CP)/CP × 100. If two items sold at same SP, one at X% profit and other at X% loss, there is ALWAYS a net loss = X²/100 %. Successive discounts of A% and B% = (A+B-AB/100)%. Example: 20% + 10% = 28% not 30%.", company: null, difficulty: "medium" },
  { content: "Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.", company: null, difficulty: "easy" },
  { content: "Relative Speed: Same direction = |S1-S2|. Opposite direction = S1+S2. Meeting time = Total distance / (S1+S2). If two people start towards each other, they meet when combined distance = total distance.", company: null, difficulty: "medium" },
  { content: "Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.", company: null, difficulty: "medium" },
  { content: "Boats and Streams: Downstream = Boat+Stream. Upstream = Boat-Stream. Boat speed = (Downstream+Upstream)/2. Stream speed = (Downstream-Upstream)/2.", company: null, difficulty: "medium" },
  { content: "Time and Work LCM Method: Take LCM of individual days, assign work units. A:10 days, B:15 days → LCM=30. A=3units/day, B=2units/day. Together=5units/day. Time=30/5=6 days. Faster than fraction method.", company: null, difficulty: "medium" },
  { content: "Pipes and Cisterns: Same as Time and Work. Inlet = positive rate, Outlet = negative rate. If A fills in 6hrs and B empties in 8hrs: net = 1/6-1/8 = 1/24. Tank fills in 24 hrs.", company: null, difficulty: "medium" },
  { content: "Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.", company: null, difficulty: "medium" },
  { content: "Divisibility Rules: By 2: last digit even. By 3: digit sum divisible by 3. By 4: last 2 digits divisible by 4. By 5: ends in 0/5. By 6: both 2 and 3. By 8: last 3 digits. By 9: digit sum divisible by 9. By 11: alternating sum = 0 or divisible by 11.", company: null, difficulty: "easy" },
  { content: "Remainder Theorem: Remainder of (a×b)/n = (rem of a/n × rem of b/n) mod n. For powers: find cycle. Example: 2^100 mod 3: cycle is 2,1,2,1... length 2. 100 is even → remainder = 1.", company: null, difficulty: "hard" },
  { content: "HCF LCM Shortcuts: HCF × LCM = Product of two numbers. HCF of fractions = HCF(numerators)/LCM(denominators). LCM of fractions = LCM(numerators)/HCF(denominators).", company: null, difficulty: "easy" },
  { content: "Problems on Ages: Use variables. Present age = X, N years ago = X-N, N years later = X+N. Ratio trick: ages in ratio a:b → assume aK and bK. Father is 3× son, after 12 years 2× son: Let son=x → 3x+12=2(x+12) → x=12.", company: null, difficulty: "medium" },
  { content: "Calendar Odd Days: 1 ordinary year = 1 odd day. 1 leap year = 2 odd days. 100 years = 5 odd days. 200 = 3. 300 = 1. 400 = 0. Day codes: Sun=0, Mon=1, Tue=2... Count total odd days from reference to find day.", company: null, difficulty: "medium" },
  { content: "Clock Angle Formula: Angle = |30H - 5.5M| degrees. Hands overlap 11 times in 12 hours. Right angle (90°) = 22 times. Opposite (180°) = 11 times. Minute hand gains 5.5° per minute over hour hand. At 3:30 → |90-165| = 75°.", company: null, difficulty: "medium" },
  { content: "Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.", company: null, difficulty: "hard" },
  { content: "Probability: P(event) = favorable/total. P(not A) = 1-P(A). P(A or B) = P(A)+P(B)-P(A∩B). Independent events: P(A∩B) = P(A)×P(B). Dice: 6^n outcomes. Cards: 52 total. Coin: 2^n outcomes for n tosses.", company: null, difficulty: "medium" },
  { content: "Average Shortcuts: Avg = Sum/Count. New avg when adding X to N numbers with avg A: (NA+X)/(N+1). When removing: (NA-X)/(N-1). Weighted average = (w1×x1 + w2×x2)/(w1+w2).", company: null, difficulty: "easy" },
  { content: "Allegation Rule: Mix items at price P1 and P2 to get Pm: Ratio = (P2-Pm):(Pm-P1). Draw cross diagram. Works for prices, speeds, percentages, concentrations. Common in TCS and Infosys.", company: null, difficulty: "medium" },
  { content: "Partnership: Profit ratio = Investment₁×Time₁ : Investment₂×Time₂. Working partner gets salary first, remaining profit divided by investment ratio. A: ₹5000×12months, B: ₹8000×9months → 60000:72000 = 5:6.", company: null, difficulty: "medium" },
  { content: "AP: nth term = a+(n-1)d. Sum = n/2×(first+last). Sum of 1 to n = n(n+1)/2. Sum of squares = n(n+1)(2n+1)/6. GP: nth = ar^(n-1). Sum = a(r^n-1)/(r-1). Sum of 1 to 100 = 5050.", company: null, difficulty: "medium" },
  { content: "Heights and Distances: tan θ = height/distance. tan30=1/√3, tan45=1, tan60=√3. If angle of elevation increases, you are closer. Two angles from points: h = d×tanA×tanB/(tanB-tanA).", company: null, difficulty: "hard" },
];

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  // Pull existing content to dedupe by first 50 chars.
  const { data: existing, error: fetchError } = await supabase
    .from('knowledge_base')
    .select('content');
  if (fetchError) {
    console.error(`✘ knowledge_base table not ready: ${fetchError.message}`);
    process.exit(1);
  }

  const existingPrefixes = new Set(
    (existing || []).map(r => (r.content || '').slice(0, 50))
  );

  let inserted = 0;
  let skipped = 0;
  for (const entry of APTITUDE_ENTRIES) {
    const prefix = entry.content.slice(0, 50);
    if (existingPrefixes.has(prefix)) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from('knowledge_base').insert({
      content: entry.content,
      category: 'aptitude_trick',
      company: entry.company,
      domain: 'aptitude',
      difficulty: entry.difficulty,
      metadata: { keywords: 'aptitude shortcut trick TCS Infosys Wipro', hash: contentHash(entry.content) },
    });
    if (error) {
      console.error(`✘ Insert failed: ${error.message}`);
      console.error(`  (inserted ${inserted}, skipped ${skipped} before failure)`);
      process.exit(1);
    }
    existingPrefixes.add(prefix);
    inserted++;
  }

  console.log(`✓ Aptitude seed complete — inserted: ${inserted}, skipped: ${skipped}`);
}

main();
