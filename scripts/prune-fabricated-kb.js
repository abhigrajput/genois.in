#!/usr/bin/env node
// Prunes the fabricated knowledge_base rows that FIX 2 (commit 9def972) removed
// from the seeders. Both seeders are insert-or-skip, so correcting the source
// arrays did not touch the rows already in production — RAG kept serving the old
// claims ("appears in 70% of TCS NQT coding rounds", "Cutoff: 65% aggregate",
// "Ninja cutoff 60%+ ... 7-9 LPA", per-company CGPA cutoffs, and the per-exam
// frequency claims in the aptitude set).
//
// Matching is exact, never fuzzy: every target below is the verbatim pre-fix
// content string, and a row is a target only if its content matches byte for
// byte OR its metadata.hash equals sha256 of that string (both seeders wrote
// that hash at insert time). A corrected row can therefore never be matched —
// its content, and so its hash, differs.
//
//   node scripts/prune-fabricated-kb.js          # dry run, prints what it would delete
//   node scripts/prune-fabricated-kb.js --apply  # performs the delete, by row id
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

// Each entry: the exact string that was in the seeder before 9def972, and the
// corrected string that replaced it. Extracted mechanically by diffing
// 9def972^ against 9def972 — not retyped.
const TARGETS = [
  { source: "rag-seed", fabricated: "TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.", corrected: "TCS NQT Coding Section: Find the sum of all prime numbers up to N. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code." },
  { source: "rag-seed", fabricated: "TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.", corrected: "TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. Pattern: dynamic programming on arrays — a recurring TCS NQT coding topic." },
  { source: "rag-seed", fabricated: "TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.", corrected: "TCS NQT Quantitative: Train problems, time-distance-speed. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8. Check the official TCS NQT pattern for the current question count and timing." },
  { source: "rag-seed", fabricated: "TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.", corrected: "TCS NQT Verbal: Reading comprehension, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral." },
  { source: "rag-seed", fabricated: "TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.", corrected: "TCS NQT Programming Logic: flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction." },
  { source: "rag-seed", fabricated: "TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.", corrected: "TCS Ninja vs Digital: Digital is the higher band — a higher cutoff and a harder coding round than Ninja, for a higher package. Cutoffs and compensation change every hiring cycle, so confirm the current numbers on the official TCS NQT page rather than relying on figures shared by seniors." },
  { source: "rag-seed", fabricated: "Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.", corrected: "Infosys SP Round: sections are quantitative aptitude, logical reasoning and verbal. Confirm the current question counts, timing, cutoff and whether negative marking applies on the official pattern before the exam — if it does, do NOT guess blindly." },
  { source: "rag-seed", fabricated: "Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.", corrected: "Infosys Ninja Coding: coding round with a choice of Python/Java/C++. Typical mix is array manipulation at the easier end and string processing or recursion at the harder end." },
  { source: "rag-seed", fabricated: "Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.", corrected: "Infosys HackWithInfy: the advanced track for top performers, at LeetCode-Hard difficulty. Attempt it only once you are clearing LeetCode Medium consistently." },
  { source: "rag-seed", fabricated: "Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.", corrected: "Wipro NLTH Online Test: the sections are Aptitude, Written English and an Online Programming Test, and you need to clear every section. Check the official pattern for the current question counts, timing and cutoff." },
  { source: "rag-seed", fabricated: "Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.", corrected: "Wipro Coding: problems range from easy (array/string) through medium (recursion/DP) to hard (graph/tree). Languages: C++/Java/Python." },
  { source: "rag-seed", fabricated: "Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.", corrected: "Wipro Essay Writing: a short essay on an assigned topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions." },
  { source: "rag-seed", fabricated: "Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.", corrected: "Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. Tree problems turn up in TCS NQT coding and in Infosys technical interviews. Must know: recursive + iterative inorder." },
  { source: "rag-seed", fabricated: "Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.", corrected: "Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These four are the highest-yield DP patterns for TCS/Infosys/Wipro rounds. Master them before advanced DP." },
  { source: "rag-seed", fabricated: "Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.", corrected: "Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. A recurring Infosys technical-interview topic." },
  { source: "rag-seed", fabricated: "SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.", corrected: "SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). SQL questions appear in TCS NQT. Practice: employees table queries, find Nth highest salary." },
  { source: "rag-seed", fabricated: "Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.", corrected: "Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask computer-networks questions in the technical interview. Focus: what happens when you type google.com in browser." },
  { source: "rag-seed", fabricated: "CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.", corrected: "Low CGPA strategy: CGPA cutoffs differ per company and per hiring cycle, so check each company's current published criteria instead of assuming a number. As a rule the mass recruiters (TCS, Infosys, Wipro, Accenture, HCL) are more flexible on CGPA than product companies. Demonstrable coding skill is the lever you actually control — build it and make it visible." },
  { source: "rag-seed", fabricated: "LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.", corrected: "LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement <your grad year>'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly." },
  { source: "aptitude", fabricated: "Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.", corrected: "Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). Ratios are a standard TCS NQT aptitude topic." },
  { source: "aptitude", fabricated: "Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.", corrected: "Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. Percentages are a standard TCS NQT aptitude topic." },
  { source: "aptitude", fabricated: "Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.", corrected: "Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. Applying the formula is far faster than working the two steps out longhand." },
  { source: "aptitude", fabricated: "Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.", corrected: "Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. A standard topic in TCS NQT and Infosys SP aptitude." },
  { source: "aptitude", fabricated: "Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.", corrected: "Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. Train problems are a standard TCS NQT aptitude topic." },
  { source: "aptitude", fabricated: "Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.", corrected: "Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. Simple and compound interest are standard TCS NQT aptitude topics." },
  { source: "aptitude", fabricated: "Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.", corrected: "Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). Permutations and combinations are a standard TCS NQT aptitude topic." },
];

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const APPLY = process.argv.includes('--apply');

async function main() {
  const { data: all, error } = await supabase
    .from('knowledge_base')
    .select('id, content, category, company, domain, difficulty, metadata, created_at');
  if (error) {
    console.error(`✘ Could not read knowledge_base: ${error.message}`);
    process.exit(1);
  }

  const byFabricated = new Map();
  const hashToTarget = new Map();
  for (const t of TARGETS) {
    byFabricated.set(t.fabricated, t);
    hashToTarget.set(contentHash(t.fabricated), t);
  }
  const correctedSet = new Set(TARGETS.map(t => t.corrected));

  const doomed = [];
  let correctedPresent = 0;
  for (const row of all || []) {
    const content = row.content || '';
    const hash = row.metadata?.hash;
    const target = byFabricated.get(content) || (hash ? hashToTarget.get(hash) : null);
    if (target) {
      // Guard: never delete a row whose content is one of the corrected strings.
      if (correctedSet.has(content)) continue;
      doomed.push({ row, target });
    } else if (correctedSet.has(content)) {
      correctedPresent++;
    }
  }

  console.log(`knowledge_base rows total:        ${(all || []).length}`);
  console.log(`fabricated strings searched for:  ${TARGETS.length}`);
  console.log(`fabricated rows found:            ${doomed.length}`);
  console.log(`corrected replacements present:   ${correctedPresent} / ${TARGETS.length}`);
  console.log('');

  if (doomed.length === 0) {
    console.log('✓ Nothing to prune — no fabricated rows are present.');
    return;
  }

  console.log('─'.repeat(78));
  doomed.forEach(({ row, target }, i) => {
    console.log(`${String(i + 1).padStart(2)}. id=${row.id}`);
    console.log(`    category=${row.category} company=${row.company ?? 'null'} domain=${row.domain ?? 'null'} difficulty=${row.difficulty ?? 'null'}`);
    console.log(`    seeder=${target.source}  created_at=${row.created_at ?? 'null'}`);
    console.log(`    DELETE: ${row.content}`);
    console.log('');
  });
  console.log('─'.repeat(78));

  const missing = TARGETS.filter(t => !(all || []).some(r => r.content === t.corrected));
  if (missing.length) {
    console.log('');
    console.log(`⚠ ${missing.length} corrected replacement(s) are NOT yet in the table.`);
    console.log('  After this prune, re-seed so the corrected copy is served:');
    console.log('    node scripts/seed-knowledge-base.js   # POSTs /api/rag/seed');
    console.log('    node scripts/seed-aptitude.js');
  }

  if (!APPLY) {
    console.log('');
    console.log(`DRY RUN — nothing deleted. Re-run with --apply to delete these ${doomed.length} rows.`);
    return;
  }

  const ids = doomed.map(d => d.row.id);
  const { error: delError } = await supabase.from('knowledge_base').delete().in('id', ids);
  if (delError) {
    console.error(`✘ Delete failed: ${delError.message}`);
    process.exit(1);
  }

  const { data: after, error: afterError } = await supabase
    .from('knowledge_base')
    .select('id')
    .in('id', ids);
  if (afterError) {
    console.error(`✘ Deleted, but verification read failed: ${afterError.message}`);
    process.exit(1);
  }
  if ((after || []).length > 0) {
    console.error(`✘ ${after.length} row(s) survived the delete — check RLS on knowledge_base.`);
    process.exit(1);
  }

  console.log('');
  console.log(`✓ Deleted ${ids.length} fabricated rows.`);
}

main();
