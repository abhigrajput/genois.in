-- Prune the fabricated knowledge_base rows that FIX 2 (commit 9def972) removed
-- from the seeders. Both seeders are insert-or-skip, so correcting the source
-- arrays left the original rows untouched in production and RAG kept serving
-- the old claims.
--
-- SCOPE: exactly the 26 rows listed below, matched two ways, both exact:
--   * metadata->>'hash' — the sha256 of the pre-fix content, written by the
--     seeder at insert time; and
--   * content — byte-for-byte equality with the pre-fix string.
-- A corrected row cannot match either condition, because its content (and so
-- its hash) differs. There is no LIKE, no wildcard and no category-wide delete
-- anywhere in this file.
--
-- Rows targeted:
--   1. [rag-seed] TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.
--   2. [rag-seed] TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.
--   3. [rag-seed] TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.
--   4. [rag-seed] TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.
--   5. [rag-seed] TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.
--   6. [rag-seed] TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.
--   7. [rag-seed] Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.
--   8. [rag-seed] Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.
--   9. [rag-seed] Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.
--  10. [rag-seed] Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.
--  11. [rag-seed] Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.
--  12. [rag-seed] Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.
--  13. [rag-seed] Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.
--  14. [rag-seed] Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.
--  15. [rag-seed] Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.
--  16. [rag-seed] SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.
--  17. [rag-seed] Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.
--  18. [rag-seed] CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.
--  19. [rag-seed] LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.
--  20. [aptitude] Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.
--  21. [aptitude] Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.
--  22. [aptitude] Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.
--  23. [aptitude] Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.
--  24. [aptitude] Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.
--  25. [aptitude] Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.
--  26. [aptitude] Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Run STEP 1 and confirm it returns exactly 26 rows and that every
--      one of them is a fabricated row you recognise from the list above.
--   2. Only then run STEP 2.
--   3. Run STEP 3 to confirm nothing is left behind.
--   4. Re-seed the corrected copies:  node scripts/seed-knowledge-base.js
--                                     node scripts/seed-aptitude.js

-- ============================ STEP 1 — PREVIEW ==============================
-- Read-only. Shows precisely what STEP 2 will delete.

SELECT id, category, company, domain, difficulty, created_at, content
FROM public.knowledge_base
WHERE metadata->>'hash' IN (
  '641e18341b172710984c516d6c3bf419bd769d2c8f8851eb4c8d2e8afd11fc0f',
  '277e149547cc0f0fbbce81ccfa1c7e4e4b0745cfb5638605db96512c4685b71d',
  '430baf7512b0ab69581365fe168c81c26f8b8e9f39e48e11a79f39c646949c42',
  '9637a40e2130bdda9016a48b908af1dc5262a49b5a05535cb46cdefb3c99ef09',
  '65a9e47bc26a55ba23ae2dff575348e822d27abab5fc79aa2ced4b170fcbf636',
  '8e1ef63c54acdb39699c91f7d5e225be8c70e43e62723b09f69c0042ff44cd16',
  '33fc4c92363936002ae0ffeb1b83fb61279a12b7cf76f8b859bfb8efb3690323',
  '9293b35c63dbfd054ff4371820d2af3a976dc9a63f92d32e0854c0adf2feb1a3',
  'c05eb876b6665ff8fd9795e980dd7f36863b13c2a117f893e01b74f1d9cbc633',
  '7a02385d63ee3631adc414a059dba3b06ba951be69cb918e1ca20886ff51ccdd',
  'd78d9db0a6c40af0caa9bbcbb0cff484e38aa1064921fee9864d35fdb7bfbb7c',
  '1a7bf7e24e2dc9979bbbb0f9421967e057a1bbacf30143a4d1cf96b7c142cf95',
  '5fa6e9e5b196adf511f7b6fe37bb7a022323c4f910317fc9b3fd4a10ec05e6fe',
  '1209fe530854be82371fef53a5fccf4b6bf8a4d3795340b8c0ecba87d9abfb55',
  '8fffb157da4d45c48ae139d205b646ebefbaafdc4b7dcbb75f7558692551eaff',
  '2d33632eb9d5ff03ef0db48ab255cb86f49b2ee237521ad8fef8383f92eb31ad',
  '4939e360824941f41981bf26e383c194ede59f3bfd12068823a17ea0616d1cc2',
  '81891a2d279450c0efb1fa09bde02983e03894d8e069a2b9d51768bc5bb09d9c',
  'f6845b653022d96d07e6fd09f9b25d85bfcc95e7ae24aa6f6a831ca3684ea1ce',
  '7d5f902054b953dd30465481a1bb7895b518faf823d00ff1903add5482298edf',
  '7d266de55313fb8fd0c3e2a9a089363d13d6b52c648f9b19f39b759f43958edc',
  'c72fc304dc97ea6fa860f9324ccd6eff2654540463fe1899362c1cea57c26356',
  'acf3dc56077f7d3b193179dc10816fbb282e5f9aebaf5636525c6fe57355d8af',
  '009279525245244b5cb815b7badd7aaacafb9f391366015c6e44d70e6c53ca1f',
  '2e7874952d912aaccafe17a925143a900a3073501ec1fe3feadec806b301980e',
  '7aa7fa0626290453fc6711922d14f5ac19276523a30b5a3ae73bd5543a6764fd'
)
   OR content IN (
  $fab$TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.$fab$,
  $fab$TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.$fab$,
  $fab$TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.$fab$,
  $fab$TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.$fab$,
  $fab$TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.$fab$,
  $fab$TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.$fab$,
  $fab$Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.$fab$,
  $fab$Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.$fab$,
  $fab$Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.$fab$,
  $fab$Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.$fab$,
  $fab$Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.$fab$,
  $fab$Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.$fab$,
  $fab$Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.$fab$,
  $fab$Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.$fab$,
  $fab$Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.$fab$,
  $fab$SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.$fab$,
  $fab$Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.$fab$,
  $fab$CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.$fab$,
  $fab$LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.$fab$,
  $fab$Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.$fab$,
  $fab$Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.$fab$,
  $fab$Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.$fab$,
  $fab$Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.$fab$,
  $fab$Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.$fab$,
  $fab$Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.$fab$,
  $fab$Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.$fab$
)
ORDER BY created_at;

-- Expected: 26 rows.

-- ============================ STEP 2 — DELETE ===============================
-- Destructive. Run only after STEP 1 returned the expected 26 rows.

BEGIN;

DELETE FROM public.knowledge_base
WHERE metadata->>'hash' IN (
  '641e18341b172710984c516d6c3bf419bd769d2c8f8851eb4c8d2e8afd11fc0f',
  '277e149547cc0f0fbbce81ccfa1c7e4e4b0745cfb5638605db96512c4685b71d',
  '430baf7512b0ab69581365fe168c81c26f8b8e9f39e48e11a79f39c646949c42',
  '9637a40e2130bdda9016a48b908af1dc5262a49b5a05535cb46cdefb3c99ef09',
  '65a9e47bc26a55ba23ae2dff575348e822d27abab5fc79aa2ced4b170fcbf636',
  '8e1ef63c54acdb39699c91f7d5e225be8c70e43e62723b09f69c0042ff44cd16',
  '33fc4c92363936002ae0ffeb1b83fb61279a12b7cf76f8b859bfb8efb3690323',
  '9293b35c63dbfd054ff4371820d2af3a976dc9a63f92d32e0854c0adf2feb1a3',
  'c05eb876b6665ff8fd9795e980dd7f36863b13c2a117f893e01b74f1d9cbc633',
  '7a02385d63ee3631adc414a059dba3b06ba951be69cb918e1ca20886ff51ccdd',
  'd78d9db0a6c40af0caa9bbcbb0cff484e38aa1064921fee9864d35fdb7bfbb7c',
  '1a7bf7e24e2dc9979bbbb0f9421967e057a1bbacf30143a4d1cf96b7c142cf95',
  '5fa6e9e5b196adf511f7b6fe37bb7a022323c4f910317fc9b3fd4a10ec05e6fe',
  '1209fe530854be82371fef53a5fccf4b6bf8a4d3795340b8c0ecba87d9abfb55',
  '8fffb157da4d45c48ae139d205b646ebefbaafdc4b7dcbb75f7558692551eaff',
  '2d33632eb9d5ff03ef0db48ab255cb86f49b2ee237521ad8fef8383f92eb31ad',
  '4939e360824941f41981bf26e383c194ede59f3bfd12068823a17ea0616d1cc2',
  '81891a2d279450c0efb1fa09bde02983e03894d8e069a2b9d51768bc5bb09d9c',
  'f6845b653022d96d07e6fd09f9b25d85bfcc95e7ae24aa6f6a831ca3684ea1ce',
  '7d5f902054b953dd30465481a1bb7895b518faf823d00ff1903add5482298edf',
  '7d266de55313fb8fd0c3e2a9a089363d13d6b52c648f9b19f39b759f43958edc',
  'c72fc304dc97ea6fa860f9324ccd6eff2654540463fe1899362c1cea57c26356',
  'acf3dc56077f7d3b193179dc10816fbb282e5f9aebaf5636525c6fe57355d8af',
  '009279525245244b5cb815b7badd7aaacafb9f391366015c6e44d70e6c53ca1f',
  '2e7874952d912aaccafe17a925143a900a3073501ec1fe3feadec806b301980e',
  '7aa7fa0626290453fc6711922d14f5ac19276523a30b5a3ae73bd5543a6764fd'
)
   OR content IN (
  $fab$TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.$fab$,
  $fab$TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.$fab$,
  $fab$TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.$fab$,
  $fab$TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.$fab$,
  $fab$TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.$fab$,
  $fab$TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.$fab$,
  $fab$Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.$fab$,
  $fab$Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.$fab$,
  $fab$Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.$fab$,
  $fab$Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.$fab$,
  $fab$Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.$fab$,
  $fab$Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.$fab$,
  $fab$Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.$fab$,
  $fab$Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.$fab$,
  $fab$Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.$fab$,
  $fab$SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.$fab$,
  $fab$Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.$fab$,
  $fab$CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.$fab$,
  $fab$LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.$fab$,
  $fab$Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.$fab$,
  $fab$Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.$fab$,
  $fab$Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.$fab$,
  $fab$Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.$fab$,
  $fab$Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.$fab$,
  $fab$Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.$fab$,
  $fab$Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.$fab$
);

-- Postgres reports the row count. If it is not 26, ROLLBACK and investigate
-- before committing.
COMMIT;

-- ============================ STEP 3 — VERIFY ===============================
-- Should return 0.

SELECT count(*) AS fabricated_rows_remaining
FROM public.knowledge_base
WHERE metadata->>'hash' IN (
  '641e18341b172710984c516d6c3bf419bd769d2c8f8851eb4c8d2e8afd11fc0f',
  '277e149547cc0f0fbbce81ccfa1c7e4e4b0745cfb5638605db96512c4685b71d',
  '430baf7512b0ab69581365fe168c81c26f8b8e9f39e48e11a79f39c646949c42',
  '9637a40e2130bdda9016a48b908af1dc5262a49b5a05535cb46cdefb3c99ef09',
  '65a9e47bc26a55ba23ae2dff575348e822d27abab5fc79aa2ced4b170fcbf636',
  '8e1ef63c54acdb39699c91f7d5e225be8c70e43e62723b09f69c0042ff44cd16',
  '33fc4c92363936002ae0ffeb1b83fb61279a12b7cf76f8b859bfb8efb3690323',
  '9293b35c63dbfd054ff4371820d2af3a976dc9a63f92d32e0854c0adf2feb1a3',
  'c05eb876b6665ff8fd9795e980dd7f36863b13c2a117f893e01b74f1d9cbc633',
  '7a02385d63ee3631adc414a059dba3b06ba951be69cb918e1ca20886ff51ccdd',
  'd78d9db0a6c40af0caa9bbcbb0cff484e38aa1064921fee9864d35fdb7bfbb7c',
  '1a7bf7e24e2dc9979bbbb0f9421967e057a1bbacf30143a4d1cf96b7c142cf95',
  '5fa6e9e5b196adf511f7b6fe37bb7a022323c4f910317fc9b3fd4a10ec05e6fe',
  '1209fe530854be82371fef53a5fccf4b6bf8a4d3795340b8c0ecba87d9abfb55',
  '8fffb157da4d45c48ae139d205b646ebefbaafdc4b7dcbb75f7558692551eaff',
  '2d33632eb9d5ff03ef0db48ab255cb86f49b2ee237521ad8fef8383f92eb31ad',
  '4939e360824941f41981bf26e383c194ede59f3bfd12068823a17ea0616d1cc2',
  '81891a2d279450c0efb1fa09bde02983e03894d8e069a2b9d51768bc5bb09d9c',
  'f6845b653022d96d07e6fd09f9b25d85bfcc95e7ae24aa6f6a831ca3684ea1ce',
  '7d5f902054b953dd30465481a1bb7895b518faf823d00ff1903add5482298edf',
  '7d266de55313fb8fd0c3e2a9a089363d13d6b52c648f9b19f39b759f43958edc',
  'c72fc304dc97ea6fa860f9324ccd6eff2654540463fe1899362c1cea57c26356',
  'acf3dc56077f7d3b193179dc10816fbb282e5f9aebaf5636525c6fe57355d8af',
  '009279525245244b5cb815b7badd7aaacafb9f391366015c6e44d70e6c53ca1f',
  '2e7874952d912aaccafe17a925143a900a3073501ec1fe3feadec806b301980e',
  '7aa7fa0626290453fc6711922d14f5ac19276523a30b5a3ae73bd5543a6764fd'
)
   OR content IN (
  $fab$TCS NQT Coding Section: Find the sum of all prime numbers up to N. Time limit: 30 minutes. Expected approach: Sieve of Eratosthenes, O(n log log n). TCS prefers clean code over clever code.$fab$,
  $fab$TCS NQT: Given array, find the maximum subarray sum. Kadane's algorithm expected. This appears in 70% of TCS NQT coding rounds. Pattern: dynamic programming on arrays.$fab$,
  $fab$TCS NQT Quantitative: Train problems, time-distance-speed. 25 questions in 40 minutes. Focus areas: trains, boats, profit-loss, percentages, ratios. Practice RS Aggarwal chapters 1-8.$fab$,
  $fab$TCS NQT Verbal: Reading comprehension 3 passages, fill in the blanks, sentence completion. Vocabulary focus: GRE level words. Common: aberrant, cacophony, ephemeral.$fab$,
  $fab$TCS NQT Programming Logic: 25 questions on flowcharts, pseudo code output prediction, recursion output. Key: trace through code manually. Common pattern: nested loops with output prediction.$fab$,
  $fab$TCS Ninja vs Digital: Ninja cutoff 60%+, Digital cutoff 80%+. Digital gets higher package (7-9 LPA vs 3.5-4 LPA). For Digital: solve 2 medium problems in 30 mins. For Ninja: solve 2 easy problems.$fab$,
  $fab$Infosys SP Round: 10 quantitative questions (25 min), 15 logical reasoning (25 min), 20 verbal (35 min). Cutoff: 65% aggregate. Negative marking: 0.25 per wrong answer. Do NOT guess.$fab$,
  $fab$Infosys Ninja Coding: 2 coding problems, 3 options — Python/Java/C++. Problem 1: usually array manipulation (easy). Problem 2: string processing or recursion (medium). Time: 3 hours total.$fab$,
  $fab$Infosys Hackwithinfy: For top performers. 3 hard coding problems. LeetCode hard equivalent. Only attempt if you have solved 100+ LeetCode medium problems.$fab$,
  $fab$Wipro NLTH Online Test: 3 sections — Aptitude (18Q, 20min), Written English (22Q, 20min), Online Programming Test (3 problems, 60min). Cutoff: 70% in aptitude, clear all 3 sections.$fab$,
  $fab$Wipro Coding: 3 problems — 1 easy (array/string), 1 medium (recursion/DP), 1 hard (graph/tree). Solving 2 out of 3 is sufficient for shortlisting. Language: C++/Java/Python.$fab$,
  $fab$Wipro Essay Writing: 200-300 words on given topic. Common topics: Work from home, AI impact on jobs, Climate change. Write balanced essays. Avoid extreme opinions.$fab$,
  $fab$Binary Trees in placement interviews: BST traversal (inorder=sorted), height calculation, LCA, diameter. TCS NQT: 1 tree problem in 30% of attempts. Infosys: tree traversal in technical interview. Must know: recursive + iterative inorder.$fab$,
  $fab$Dynamic Programming for placements: Longest Common Subsequence, 0/1 Knapsack, Coin Change, Longest Increasing Subsequence. These 4 cover 80% of DP questions in TCS/Infosys/Wipro. Master these before advanced DP.$fab$,
  $fab$Virtual functions in C++: Runtime polymorphism. Base class pointer → derived class object. Virtual keyword enables dynamic dispatch. Pure virtual = abstract class. Asked in 60% of Infosys technical interviews.$fab$,
  $fab$SQL for placements: SELECT with JOIN (INNER, LEFT, RIGHT), GROUP BY with HAVING, subqueries, aggregate functions (COUNT, SUM, AVG, MAX, MIN). TCS NQT has 3-4 SQL questions. Practice: employees table queries, find Nth highest salary.$fab$,
  $fab$Computer Networks for interviews: OSI model 7 layers, TCP vs UDP, HTTP vs HTTPS, DNS resolution, subnetting basics. TCS and Infosys ask 2-3 CN questions in technical interview. Focus: what happens when you type google.com in browser.$fab$,
  $fab$CGPA below 7 strategy: Many product companies have 7+ CGPA cutoff. Focus on: TCS (6.0+), Infosys (6.0+), Wipro (6.0+), Accenture (5.0+), HCL (5.0+). Compensate with strong coding skills. 200+ LeetCode problems can override CGPA barrier.$fab$,
  $fab$LinkedIn profile for placement: Headline 'Final Year CSE Student | C++ | DSA | Seeking Placement 2025'. Connect with 50+ recruiters in your city. Post 2-3 technical posts per month. Premium not needed. Apply to jobs directly.$fab$,
  $fab$Ratio and Proportion Shortcut: To divide N in ratio a:b, first part = N×a/(a+b), second part = N×b/(a+b). Example: 720 in 2:3 → 720×2/5=288, 720×3/5=432. For 3-part ratio a:b:c, total parts = a+b+c, each part = N×(part/total). TCS NQT asks 2-3 ratio questions every exam.$fab$,
  $fab$Percentage Shortcut: X% of Y = Y% of X. So 24% of 50 = 50% of 24 = 12. Saves time when one side is easier. Fraction shortcuts: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/8=12.5%, 1/10=10%. TCS NQT uses percentage in 4-5 questions.$fab$,
  $fab$Successive Percentage Change: a% then b% = (a+b+ab/100)% net. Example: 20% then 30% increase = 20+30+600/100 = 56% net increase. NOT 50%. This trick alone saves 2 minutes in TCS NQT.$fab$,
  $fab$Time Speed Distance: D = S × T. Convert km/hr to m/s: multiply by 5/18. Convert m/s to km/hr: multiply by 18/5. Average speed for same distance at speeds a,b = 2ab/(a+b). NOT (a+b)/2. Asked in every TCS NQT and Infosys SP exam.$fab$,
  $fab$Train Problems: Train crosses pole: Time = Length/Speed. Crosses platform: Time = (L_train + L_platform)/Speed. Two trains crossing: Time = (L1+L2)/Relative speed. Same direction: |S1-S2|. Opposite: S1+S2. TCS asks 1-2 train problems every NQT.$fab$,
  $fab$Simple Interest: SI = PNR/100. Compound Interest: CI = P(1+R/100)^N - P. Shortcut for 2 years: CI-SI = P×(R/100)². If SI for 2 years at 10% on ₹5000 = ₹1000, then CI-SI = 5000×0.01 = ₹50. TCS NQT always has 1-2 interest questions.$fab$,
  $fab$Permutation nPr = n!/(n-r)! (order matters). Combination nCr = n!/(r!(n-r)!) (order doesn't). nCr = nC(n-r). Circular permutation = (n-1)!. With identical objects: n!/(p!×q!). TCS NQT has 1-2 P&C questions.$fab$
);
