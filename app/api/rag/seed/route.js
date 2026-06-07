import crypto from 'node:crypto';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

const KNOWLEDGE_BASE = [
  // TCS NQT Questions
  { content: "TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.", category: "oa_question", company: "TCS", domain: "dsa", difficulty: "easy", keywords: "prime numbers sieve TCS NQT coding" },
  { content: "TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.", category: "oa_question", company: "TCS", domain: "dsa", difficulty: "medium", keywords: "maximum subarray kadane TCS array" },
  { content: "TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.", category: "oa_question", company: "TCS", domain: "aptitude", difficulty: "medium", keywords: "TCS quantitative aptitude train speed distance" },
  { content: "TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.", category: "oa_question", company: "TCS", domain: "verbal", difficulty: "medium", keywords: "TCS verbal english comprehension vocabulary" },
  { content: "TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.", category: "oa_question", company: "TCS", domain: "programming", difficulty: "medium", keywords: "TCS programming logic flowchart pseudocode" },
  { content: "TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.", category: "company_info", company: "TCS", domain: "general", difficulty: null, keywords: "TCS ninja digital package cutoff salary" },

  // Infosys Questions
  { content: "Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.", category: "oa_question", company: "Infosys", domain: "aptitude", difficulty: "medium", keywords: "Infosys SP aptitude logical verbal cutoff" },
  { content: "Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.", category: "oa_question", company: "Infosys", domain: "dsa", difficulty: "medium", keywords: "Infosys ninja coding array string recursion" },
  { content: "Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.", category: "oa_question", company: "Infosys", domain: "dsa", difficulty: "hard", keywords: "Infosys hackwithinfy hard coding leetcode" },
  { content: "Infosys Interview: HR asks 'Why Infosys?' Answer: mention service-based experience, learning culture, global exposure. Technical: expect OOPS questions — inheritance, polymorphism with code examples in C++/Java.", category: "interview_tip", company: "Infosys", domain: "interview", difficulty: null, keywords: "Infosys interview HR technical OOPS" },

  // Wipro Questions
  { content: "Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.", category: "oa_question", company: "Wipro", domain: "aptitude", difficulty: "medium", keywords: "Wipro NLTH online test aptitude programming" },
  { content: "Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.", category: "oa_question", company: "Wipro", domain: "dsa", difficulty: "medium", keywords: "Wipro coding problems array recursion DP graph" },
  { content: "Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.", category: "oa_question", company: "Wipro", domain: "verbal", difficulty: "easy", keywords: "Wipro essay writing work home AI climate" },

  // DSA Concepts
  { content: "Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "binary tree BST inorder traversal height LCA diameter" },
  { content: "Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.", category: "concept", company: null, domain: "dsa", difficulty: "hard", keywords: "dynamic programming LCS knapsack coin change LIS" },
  { content: "Arrays for TCS NQT: Two pointer technique, sliding window, prefix sum. Most asked: two sum, maximum subarray, rotate array, merge sorted arrays. Practice 20 array problems before TCS exam.", category: "concept", company: null, domain: "dsa", difficulty: "easy", keywords: "arrays two pointer sliding window prefix sum TCS" },
  { content: "Graphs for placement: BFS, DFS, shortest path (Dijkstra), cycle detection. Wipro and Amazon ask graph problems. BFS level-order, DFS for connected components. Practice: number of islands, course schedule.", category: "concept", company: null, domain: "dsa", difficulty: "hard", keywords: "graphs BFS DFS Dijkstra shortest path cycle detection" },
  { content: "Recursion and Backtracking: N-Queens, Sudoku solver, permutations, combinations. Infosys loves recursion questions. Key pattern: base case + recursive case + backtrack (undo choice). Practice 10 problems minimum.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "recursion backtracking N-queens permutations combinations" },
  { content: "Strings for placements: Palindrome check, anagram detection, KMP algorithm for pattern matching. TCS frequently asks string problems. Reverse words, count distinct characters, longest palindromic substring.", category: "concept", company: null, domain: "dsa", difficulty: "easy", keywords: "strings palindrome anagram KMP pattern matching" },

  // OOPS for interviews
  { content: "OOPS Interview Questions asked in Infosys/Wipro/TCS: 4 pillars — Encapsulation (data hiding with getters/setters), Inheritance (IS-A relationship), Polymorphism (compile-time: overloading, runtime: overriding), Abstraction (hiding implementation). Write C++ code examples for each.", category: "concept", company: null, domain: "fullstack", difficulty: "medium", keywords: "OOPS encapsulation inheritance polymorphism abstraction C++" },
  { content: "Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.", category: "concept", company: null, domain: "fullstack", difficulty: "medium", keywords: "virtual functions C++ polymorphism abstract class runtime" },

  // Database
  { content: "SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "SQL JOIN GROUP BY HAVING subquery aggregate salary" },
  { content: "DBMS Interview Questions: ACID properties (Atomicity, Consistency, Isolation, Durability), normalization (1NF, 2NF, 3NF, BCNF), indexing (B-tree, hash), transaction management. Infosys/Wipro ask DBMS theory in technical round.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "DBMS ACID normalization indexing transaction" },

  // OS and Networks
  { content: "Operating Systems for placements: Process vs Thread, CPU scheduling (FCFS, SJF, Round Robin, Priority), deadlock (Banker's algorithm), memory management (paging, segmentation, virtual memory). These are standard Infosys/Wipro technical interview topics.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "OS process thread CPU scheduling deadlock memory paging" },
  { content: "Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.", category: "concept", company: null, domain: "dsa", difficulty: "medium", keywords: "computer networks OSI TCP UDP HTTP DNS subnetting" },

  // Aptitude patterns
  { content: "Time and Work problems for TCS/Infosys aptitude: Formula — Work = Rate × Time. If A does work in X days, rate = 1/X. Combined rate = 1/X + 1/Y. Pipes and cisterns same concept. Practice 20 problems.", category: "aptitude", company: null, domain: "aptitude", difficulty: "medium", keywords: "time work rate pipes cisterns aptitude formula" },
  { content: "Probability for placement aptitude: Basic probability = favorable/total outcomes. Conditional probability P(A|B) = P(A∩B)/P(B). Permutation vs Combination. Dice, cards, coins problems most common.", category: "aptitude", company: null, domain: "aptitude", difficulty: "medium", keywords: "probability permutation combination dice cards aptitude" },

  // Placement strategy
  { content: "Tier-3 college placement strategy: Apply to 15+ companies (not just 3). Mass recruiters always: TCS, Infosys, Wipro, Accenture, Cognizant, HCL. Off-campus applications via LinkedIn + company portals equally important. Start 8 months before placement.", category: "strategy", company: null, domain: "general", difficulty: null, keywords: "tier3 college placement strategy mass recruiter off-campus" },
  { content: "CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.", category: "strategy", company: null, domain: "general", difficulty: null, keywords: "CGPA cutoff 6 7 strategy low CGPA placement" },
  { content: "Resume for fresher placement: 1 page maximum. Sections: Education, Skills (C++/DSA prominently), Projects (2-3 good projects > 10 mediocre ones), Internships (if any), Achievements. No photo needed. Use clean template, no colors.", category: "strategy", company: null, domain: "general", difficulty: null, keywords: "resume fresher 1 page skills projects internship" },
  { content: "LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.", category: "strategy", company: null, domain: "general", difficulty: null, keywords: "LinkedIn profile recruiter headline connection job apply" },
];

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function POST(request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return errorResponse('Forbidden', 403);
  }

  const supabase = getAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from('knowledge_base')
    .select('metadata');
  if (fetchError) {
    return errorResponse(`knowledge_base table not ready: ${fetchError.message}`, 400);
  }

  const existingHashes = new Set((existing || []).map(r => r.metadata?.hash).filter(Boolean));

  let inserted = 0;
  let skipped = 0;
  for (const entry of KNOWLEDGE_BASE) {
    const hash = contentHash(entry.content);
    if (existingHashes.has(hash)) {
      skipped++;
      continue;
    }
    const { error } = await supabase.from('knowledge_base').insert({
      content: entry.content,
      category: entry.category,
      company: entry.company,
      domain: entry.domain,
      difficulty: entry.difficulty,
      metadata: { keywords: entry.keywords, hash },
    });
    if (error) {
      return errorResponse(`Insert failed: ${error.message}`, 400, { inserted, skipped });
    }
    existingHashes.add(hash);
    inserted++;
  }

  return successResponse({ inserted, skipped });
}
