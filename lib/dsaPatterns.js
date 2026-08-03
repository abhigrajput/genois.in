/**
 * DSA pattern taxonomy — the ORDER a student actually learns DSA in.
 *
 * HAND-AUTHORED ON PURPOSE, exactly like lib/skillTaxonomy.js. Nothing here is
 * AI-generated and nothing here is generated at runtime. A pattern list that
 * shifts between requests is not a curriculum, it's a slot machine.
 *
 * WHY THIS EXISTS
 * ---------------
 * The roadmap was organised by DAY: day 1 Big-O, day 2 something else, day 3
 * sliding window. Nobody learns DSA that way. A student masters ONE pattern —
 * sees the shape, drills it across easy → medium → hard, can recognise it cold
 * in an interview — and only then moves on. A day counter can't express that,
 * because "advance" has to be earned, not waited out.
 *
 * So the unit of progression is a PATTERN, and days become the pace at which a
 * student moves through the current one.
 *
 * RELATIONSHIP TO THE SKILL TAXONOMY
 * ----------------------------------
 * This file adds NO new vocabulary. Every pattern is defined as a set of
 * existing `dsa.*` skill ids from lib/skillTaxonomy.js — the same tags the
 * evidence bus writes and readiness reads. That is what makes mastery
 * measurable without a second, parallel opinion about what a student knows:
 * "mastered Two Pointers" is literally "enough correct answers tagged
 * dsa.two-pointers".
 *
 * INVARIANT: every `dsa.*` skill belongs to EXACTLY ONE pattern. Overlap would
 * double-count evidence and let a student "master" two patterns off one drill.
 * `assertCoverage()` at the bottom checks this and is called by the debug
 * endpoint; it is not run at import time.
 *
 * PROBLEM LINKS
 * -------------
 * Every problem below is a real, long-lived LeetCode problem referenced by its
 * stable slug. No premium-only problems (a locked page is a dead end for a
 * student on a free account), no invented URLs, no counts or "expected time"
 * figures we have no source for.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty
// ─────────────────────────────────────────────────────────────────────────────

/** Ordered so a pattern's problem list can be sorted / sliced by difficulty. */
export const PROBLEM_DIFFICULTY_RANK = Object.freeze({ easy: 0, medium: 1, hard: 2 });

const lc = (slug) => `https://leetcode.com/problems/${slug}/`;

/** Shorthand for a problem entry: [title, difficulty, leetcode-slug]. */
const P = (title, difficulty, slug) => ({
  id: slug,
  title,
  difficulty,
  url: lc(slug),
});

// ─────────────────────────────────────────────────────────────────────────────
// The patterns, in teaching order
//
// `order` is the canonical sequence. Progression may REPRIORITISE within it
// (an evidence gap pulls a pattern forward) but never invents an order of its
// own — see lib/dsaPatternProgress.js.
//
// `prerequisites` are the patterns whose machinery a student genuinely needs
// first. They are advisory: the plan surfaces them as "builds on", and only
// hard-locks a pattern when its prerequisite is both unmastered AND unstarted.
// ─────────────────────────────────────────────────────────────────────────────

export const DSA_PATTERNS = [
  {
    id: 'foundations',
    name: 'Foundations',
    order: 0,
    // The one pattern skip-basics is allowed to skip. Everything else is load-bearing.
    skippable: true,
    intro:
      'Before any pattern: how to read a solution’s cost. Big-O for time and space, what a loop inside a loop actually costs, how recursion consumes stack, and the bit/number tricks that show up inside every other pattern. You are not learning problems here — you are learning how to judge them.',
    tell: 'You can state the time and space complexity of your own solution without guessing.',
    skills: ['dsa.complexity', 'dsa.recursion', 'dsa.bit-manipulation', 'dsa.math', 'dsa.problem-solving'],
    prerequisites: [],
    problems: [
      P('Running Sum of 1d Array', 'easy', 'running-sum-of-1d-array'),
      P('Fizz Buzz', 'easy', 'fizz-buzz'),
      P('Number of 1 Bits', 'easy', 'number-of-1-bits'),
      P('Counting Bits', 'easy', 'counting-bits'),
      P('Reverse Integer', 'medium', 'reverse-integer'),
      P('Pow(x, n)', 'medium', 'powx-n'),
    ],
  },
  {
    id: 'arrays-hashing',
    name: 'Arrays & Hashing',
    order: 1,
    intro:
      'The trade you will make more than any other: spend memory to buy time. A hash map turns an O(n²) scan into an O(n) pass. Learn to spot the moment a nested loop is really asking "have I seen this before?" — that question is always a map or a set.',
    tell: 'You reach for a map the instant a problem says "duplicate", "count", "seen", or "pair".',
    skills: ['dsa.arrays', 'dsa.strings', 'dsa.hashing', 'dsa.frequency-counting', 'dsa.prefix-sum', 'dsa.matrix'],
    prerequisites: ['foundations'],
    problems: [
      P('Contains Duplicate', 'easy', 'contains-duplicate'),
      P('Valid Anagram', 'easy', 'valid-anagram'),
      P('Two Sum', 'easy', 'two-sum'),
      P('Group Anagrams', 'medium', 'group-anagrams'),
      P('Top K Frequent Elements', 'medium', 'top-k-frequent-elements'),
      P('Product of Array Except Self', 'medium', 'product-of-array-except-self'),
      P('Subarray Sum Equals K', 'medium', 'subarray-sum-equals-k'),
      P('Maximum Subarray', 'medium', 'maximum-subarray'),
      P('Spiral Matrix', 'medium', 'spiral-matrix'),
      P('Rotate Image', 'medium', 'rotate-image'),
      P('Longest Consecutive Sequence', 'medium', 'longest-consecutive-sequence'),
      P('First Missing Positive', 'hard', 'first-missing-positive'),
    ],
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    order: 2,
    intro:
      'When the input is sorted (or can be), two indices walking toward each other replace a nested loop. The whole skill is knowing which pointer to move and being able to say WHY moving the other one can never help — that argument is the proof your solution is correct.',
    tell: 'On a sorted array you can justify, out loud, which pointer moves and why the discarded side is safe to discard.',
    skills: ['dsa.two-pointers'],
    prerequisites: ['arrays-hashing'],
    problems: [
      P('Valid Palindrome', 'easy', 'valid-palindrome'),
      P('Two Sum II — Input Array Is Sorted', 'medium', 'two-sum-ii-input-array-is-sorted'),
      P('Sort Colors', 'medium', 'sort-colors'),
      P('3Sum', 'medium', '3sum'),
      P('Container With Most Water', 'medium', 'container-with-most-water'),
      P('Trapping Rain Water', 'hard', 'trapping-rain-water'),
    ],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    order: 3,
    intro:
      'A two-pointer window over a contiguous run, where you maintain some state (a count, a sum, a frequency map) as the window grows and shrinks. Fixed-size windows are mechanical; variable-size windows are where the thinking is — the whole problem is the shrink condition.',
    tell: 'You can name the window’s invariant and the exact condition that forces it to shrink.',
    skills: ['dsa.sliding-window'],
    prerequisites: ['two-pointers'],
    problems: [
      P('Best Time to Buy and Sell Stock', 'easy', 'best-time-to-buy-and-sell-stock'),
      P('Longest Substring Without Repeating Characters', 'medium', 'longest-substring-without-repeating-characters'),
      P('Longest Repeating Character Replacement', 'medium', 'longest-repeating-character-replacement'),
      P('Permutation in String', 'medium', 'permutation-in-string'),
      P('Minimum Window Substring', 'hard', 'minimum-window-substring'),
      P('Sliding Window Maximum', 'hard', 'sliding-window-maximum'),
    ],
  },
  {
    id: 'stack',
    name: 'Stack & Monotonic Stack',
    order: 4,
    intro:
      'Last-in-first-out, for anything with nesting or "the most recent unresolved thing" — brackets, expressions, undo. Then the sharp version: a monotonic stack, which answers "next greater / previous smaller" for every element in one pass instead of n scans.',
    tell: 'You recognise "for each element, find the next bigger one" as a monotonic stack, not a nested loop.',
    skills: ['dsa.stack', 'dsa.queue', 'dsa.monotonic-stack'],
    prerequisites: ['arrays-hashing'],
    problems: [
      P('Valid Parentheses', 'easy', 'valid-parentheses'),
      P('Implement Queue using Stacks', 'easy', 'implement-queue-using-stacks'),
      P('Next Greater Element I', 'easy', 'next-greater-element-i'),
      P('Min Stack', 'medium', 'min-stack'),
      P('Evaluate Reverse Polish Notation', 'medium', 'evaluate-reverse-polish-notation'),
      P('Daily Temperatures', 'medium', 'daily-temperatures'),
      P('Car Fleet', 'medium', 'car-fleet'),
      P('Largest Rectangle in Histogram', 'hard', 'largest-rectangle-in-histogram'),
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    order: 5,
    intro:
      'Halve the search space every step. The easy half is searching a sorted array; the half that actually gets asked is BINARY SEARCH ON THE ANSWER — when the answer itself is monotonic ("is speed k fast enough?"), you binary-search the answer range, not the input. Also where sorting and divide-and-conquer belong.',
    tell: 'You can write the loop without an off-by-one, and you spot "minimum k such that…" as a search on the answer.',
    skills: ['dsa.binary-search', 'dsa.sorting', 'dsa.divide-conquer'],
    prerequisites: ['arrays-hashing'],
    problems: [
      P('Binary Search', 'easy', 'binary-search'),
      P('Search a 2D Matrix', 'medium', 'search-a-2d-matrix'),
      P('Sort an Array', 'medium', 'sort-an-array'),
      P('Koko Eating Bananas', 'medium', 'koko-eating-bananas'),
      P('Find Minimum in Rotated Sorted Array', 'medium', 'find-minimum-in-rotated-sorted-array'),
      P('Search in Rotated Sorted Array', 'medium', 'search-in-rotated-sorted-array'),
      P('Median of Two Sorted Arrays', 'hard', 'median-of-two-sorted-arrays'),
    ],
  },
  {
    id: 'linked-list',
    name: 'Linked Lists',
    order: 6,
    intro:
      'Pointer surgery. Almost every linked-list question is one of four moves: reverse a section, use fast/slow pointers to find a midpoint or a cycle, merge two sorted lists, or attach a dummy head so the edge cases disappear. Learn the four and the rest is assembly.',
    tell: 'You use a dummy head by reflex and can reverse a list in place without drawing it.',
    skills: ['dsa.linked-list', 'dsa.cycle-detection'],
    prerequisites: ['two-pointers'],
    problems: [
      P('Reverse Linked List', 'easy', 'reverse-linked-list'),
      P('Merge Two Sorted Lists', 'easy', 'merge-two-sorted-lists'),
      P('Linked List Cycle', 'easy', 'linked-list-cycle'),
      P('Remove Nth Node From End of List', 'medium', 'remove-nth-node-from-end-of-list'),
      P('Reorder List', 'medium', 'reorder-list'),
      P('Copy List with Random Pointer', 'medium', 'copy-list-with-random-pointer'),
      P('Find the Duplicate Number', 'medium', 'find-the-duplicate-number'),
      P('LRU Cache', 'medium', 'lru-cache'),
    ],
  },
  {
    id: 'trees',
    name: 'Trees & BSTs',
    order: 7,
    intro:
      'Recursion with a shape. Most tree problems are one question asked at every node, with the answer assembled from the children — decide what each call RETURNS and the code writes itself. Then BSTs, where the ordering invariant turns traversal into search, and level-order (BFS) for anything depth-related.',
    tell: 'You can state, in one sentence, what your recursive call returns — before writing any code.',
    skills: ['dsa.binary-tree', 'dsa.tree-traversal', 'dsa.bst', 'dsa.segment-tree'],
    prerequisites: ['stack'],
    problems: [
      P('Invert Binary Tree', 'easy', 'invert-binary-tree'),
      P('Maximum Depth of Binary Tree', 'easy', 'maximum-depth-of-binary-tree'),
      P('Diameter of Binary Tree', 'easy', 'diameter-of-binary-tree'),
      P('Balanced Binary Tree', 'easy', 'balanced-binary-tree'),
      P('Binary Tree Level Order Traversal', 'medium', 'binary-tree-level-order-traversal'),
      P('Validate Binary Search Tree', 'medium', 'validate-binary-search-tree'),
      P('Lowest Common Ancestor of a BST', 'medium', 'lowest-common-ancestor-of-a-binary-search-tree'),
      P('Kth Smallest Element in a BST', 'medium', 'kth-smallest-element-in-a-bst'),
      P('Construct Binary Tree from Preorder and Inorder', 'medium', 'construct-binary-tree-from-preorder-and-inorder-traversal'),
      P('Range Sum Query — Mutable', 'medium', 'range-sum-query-mutable'),
      P('Binary Tree Maximum Path Sum', 'hard', 'binary-tree-maximum-path-sum'),
      P('Serialize and Deserialize Binary Tree', 'hard', 'serialize-and-deserialize-binary-tree'),
    ],
  },
  {
    id: 'tries',
    name: 'Tries',
    order: 8,
    intro:
      'A tree keyed by characters, so a prefix is a path. Small pattern, narrow use, and worth its own slot because when a problem is about prefixes or a dictionary of words, a trie is not one option among several — it is the answer, and interviewers expect you to reach for it immediately.',
    tell: 'You can build insert and search from a blank editor in a few minutes.',
    skills: ['dsa.trie'],
    prerequisites: ['trees'],
    problems: [
      P('Implement Trie (Prefix Tree)', 'medium', 'implement-trie-prefix-tree'),
      P('Design Add and Search Words Data Structure', 'medium', 'design-add-and-search-words-data-structure'),
      P('Word Search II', 'hard', 'word-search-ii'),
    ],
  },
  {
    id: 'heap',
    name: 'Heaps & Priority Queues',
    order: 9,
    intro:
      'When you need the smallest or largest thing repeatedly but do not need everything sorted. "Top k" is a k-sized heap, not a full sort. Two heaps facing each other give you a running median. Recognising "k" in a problem statement is most of the work.',
    tell: 'You size the heap to k rather than sorting n, and can say why that is faster.',
    skills: ['dsa.heap'],
    prerequisites: ['trees'],
    problems: [
      P('Kth Largest Element in a Stream', 'easy', 'kth-largest-element-in-a-stream'),
      P('Last Stone Weight', 'easy', 'last-stone-weight'),
      P('K Closest Points to Origin', 'medium', 'k-closest-points-to-origin'),
      P('Kth Largest Element in an Array', 'medium', 'kth-largest-element-in-an-array'),
      P('Task Scheduler', 'medium', 'task-scheduler'),
      P('Merge k Sorted Lists', 'hard', 'merge-k-sorted-lists'),
      P('Find Median from Data Stream', 'hard', 'find-median-from-data-stream'),
    ],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    order: 10,
    intro:
      'Build a candidate, and when it cannot work, undo the last move and try the next one. Subsets, permutations, combinations and grid searches are all the same skeleton: choose → recurse → un-choose. Write that skeleton once and the variations become parameter changes.',
    tell: 'You write choose/recurse/un-choose without thinking, and know where the pruning goes.',
    skills: ['dsa.backtracking'],
    prerequisites: ['trees'],
    problems: [
      P('Subsets', 'medium', 'subsets'),
      P('Combination Sum', 'medium', 'combination-sum'),
      P('Permutations', 'medium', 'permutations'),
      P('Word Search', 'medium', 'word-search'),
      P('Palindrome Partitioning', 'medium', 'palindrome-partitioning'),
      P('N-Queens', 'hard', 'n-queens'),
    ],
  },
  {
    id: 'graphs',
    name: 'Graphs',
    order: 11,
    intro:
      'The biggest pattern, and mostly two traversals. BFS for shortest path in an unweighted graph and for anything that spreads level by level; DFS for connectivity, components and cycles. On top of those sit topological sort (dependencies), union-find (grouping) and Dijkstra (weighted shortest path). A grid is a graph — that realisation unlocks half the questions.',
    tell: 'You see a grid or a dependency list and immediately know whether it is BFS, DFS, topo-sort or union-find.',
    skills: ['dsa.graph-basics', 'dsa.bfs', 'dsa.dfs', 'dsa.topological-sort', 'dsa.shortest-path', 'dsa.union-find', 'dsa.mst'],
    prerequisites: ['trees'],
    problems: [
      P('Number of Islands', 'medium', 'number-of-islands'),
      P('Max Area of Island', 'medium', 'max-area-of-island'),
      P('Clone Graph', 'medium', 'clone-graph'),
      P('Rotting Oranges', 'medium', 'rotting-oranges'),
      P('Course Schedule', 'medium', 'course-schedule'),
      P('Redundant Connection', 'medium', 'redundant-connection'),
      P('Min Cost to Connect All Points', 'medium', 'min-cost-to-connect-all-points'),
      P('Network Delay Time', 'medium', 'network-delay-time'),
      P('Word Ladder', 'hard', 'word-ladder'),
    ],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    order: 12,
    intro:
      'Recursion where the same subproblem keeps reappearing, so you solve each one once and remember it. Always start from the brute-force recursion, add memoisation, then flip it to a table if you want. The hard part is never the code — it is naming the state and writing the transition honestly.',
    tell: 'You can write the recurrence and say what each dimension of the state means before coding.',
    skills: ['dsa.dynamic-programming', 'dsa.dp-knapsack', 'dsa.dp-strings'],
    prerequisites: ['backtracking'],
    problems: [
      P('Climbing Stairs', 'easy', 'climbing-stairs'),
      P('House Robber', 'medium', 'house-robber'),
      P('Coin Change', 'medium', 'coin-change'),
      P('Longest Increasing Subsequence', 'medium', 'longest-increasing-subsequence'),
      P('Unique Paths', 'medium', 'unique-paths'),
      P('Partition Equal Subset Sum', 'medium', 'partition-equal-subset-sum'),
      P('Longest Common Subsequence', 'medium', 'longest-common-subsequence'),
      P('Longest Palindromic Substring', 'medium', 'longest-palindromic-substring'),
      P('Best Time to Buy and Sell Stock with Cooldown', 'medium', 'best-time-to-buy-and-sell-stock-with-cooldown'),
      P('Edit Distance', 'medium', 'edit-distance'),
    ],
  },
  {
    id: 'greedy',
    name: 'Greedy',
    order: 13,
    intro:
      'Take the locally best option and never reconsider. Dangerous precisely because it is easy to code and easy to get wrong — greedy is only correct when you can argue the local choice never blocks a better global one. Learn it AFTER DP, so you can tell the two apart under pressure.',
    tell: 'You can argue why the greedy choice is safe — or recognise that it is not and reach for DP.',
    skills: ['dsa.greedy'],
    prerequisites: ['dynamic-programming'],
    problems: [
      P('Jump Game', 'medium', 'jump-game'),
      P('Jump Game II', 'medium', 'jump-game-ii'),
      P('Gas Station', 'medium', 'gas-station'),
      P('Hand of Straights', 'medium', 'hand-of-straights'),
      P('Partition Labels', 'medium', 'partition-labels'),
      P('Merge Triplets to Form Target Triplet', 'medium', 'merge-triplets-to-form-target-triplet'),
    ],
  },
  {
    id: 'intervals',
    name: 'Intervals',
    order: 14,
    intro:
      'Small, self-contained, and asked constantly. Sort by start (or by end — the choice is the whole problem), then sweep once and either merge overlaps or count conflicts. Last because it is quick to pick up and pays off immediately in interviews.',
    tell: 'You know whether to sort by start or by end from the question alone.',
    skills: ['dsa.intervals'],
    prerequisites: ['binary-search'],
    problems: [
      P('Insert Interval', 'medium', 'insert-interval'),
      P('Merge Intervals', 'medium', 'merge-intervals'),
      P('Non-overlapping Intervals', 'medium', 'non-overlapping-intervals'),
      P('Minimum Number of Arrows to Burst Balloons', 'medium', 'minimum-number-of-arrows-to-burst-balloons'),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────────────────

const BY_ID = new Map(DSA_PATTERNS.map(p => [p.id, p]));

/** skill id → pattern id. One-to-one by the invariant above. */
const PATTERN_BY_SKILL = new Map();
for (const p of DSA_PATTERNS) {
  for (const s of p.skills) if (!PATTERN_BY_SKILL.has(s)) PATTERN_BY_SKILL.set(s, p.id);
}

export function getPattern(id) {
  return BY_ID.get(id) || null;
}

export function patternForSkill(skillId) {
  return PATTERN_BY_SKILL.get(skillId) || null;
}

/** Ordered ids — the canonical teaching sequence. */
export const PATTERN_ORDER = DSA_PATTERNS.map(p => p.id);

/** Total problems across every pattern. Used for pace maths. */
export const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((n, p) => n + p.problems.length, 0);

/**
 * Client-safe pattern view: everything except the full problem list, which the
 * plan attaches per-pattern with completion state.
 */
export function patternSummary(pattern) {
  if (!pattern) return null;
  const { id, name, order, intro, tell, skills, prerequisites, problems, skippable } = pattern;
  return {
    id, name, order, intro, tell, skills, prerequisites,
    skippable: !!skippable,
    problemCount: problems.length,
    difficultyMix: problems.reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Sanity check for the debug endpoint / a future test: every `dsa.*` skill in
 * the taxonomy is claimed by exactly one pattern, and no pattern claims a skill
 * that doesn't exist. Not run at import time — a taxonomy edit should surface as
 * a visible check, not a module that refuses to load in production.
 *
 * @param {string[]} allDsaSkillIds  ids from skillsForDomain('dsa')
 */
export function assertCoverage(allDsaSkillIds) {
  const claimed = new Map();
  const duplicates = [];
  const unknown = [];

  for (const p of DSA_PATTERNS) {
    for (const s of p.skills) {
      if (claimed.has(s)) duplicates.push({ skill: s, patterns: [claimed.get(s), p.id] });
      else claimed.set(s, p.id);
      if (!allDsaSkillIds.includes(s)) unknown.push({ skill: s, pattern: p.id });
    }
  }

  const uncovered = allDsaSkillIds.filter(s => !claimed.has(s));
  return { ok: !duplicates.length && !unknown.length && !uncovered.length, duplicates, unknown, uncovered };
}
