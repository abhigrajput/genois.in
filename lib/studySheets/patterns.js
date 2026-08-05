/**
 * Curated revision sheets — one per DSA pattern.
 *
 * HAND-AUTHORED ON PURPOSE, exactly like lib/dsaPatterns.js and
 * lib/skillTaxonomy.js. Nothing here is AI-generated and nothing here is
 * generated at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * /notes was "type a topic → an AI writes you a note". A tester's verdict was
 * that it "feels like a ChatGPT wrapper". They were right: a fresh generation
 * per student per request is not study material. It cannot be proof-read, it
 * cannot be corrected once and stay corrected, two students revising Trees the
 * night before the same interview get different sheets, and nobody can point at
 * a line and say "that is wrong" and have it stay fixed.
 *
 * Curated content is the opposite trade: written once, reviewed, versioned in
 * git, identical for everyone, free to serve, and instant. Fix a mistake here
 * and it is fixed for all 8749+ saved notes' worth of students at once.
 *
 * WHAT A SHEET DOES NOT DUPLICATE
 * -------------------------------
 * `id` matches a pattern id in lib/dsaPatterns.js, and the API joins them. The
 * pattern's `intro`, `tell`, `skills` and `problems` are NOT restated here —
 * they are read from that file at request time, so a pattern edit can never
 * leave its sheet quietly stale. This file adds only what a revision sheet
 * needs and the taxonomy does not carry: recall drills, complexity tables,
 * a reference implementation, and the mistakes that actually cost marks.
 *
 * CONTENT RULES
 * -------------
 *   - Every complexity figure is the standard, defensible one. Where a bound is
 *     amortised or has a bad worst case, the row says so rather than quoting
 *     the pretty number alone.
 *   - Code templates are C++ (the language the rest of GENOIS teaches in), kept
 *     short enough to memorise and correct enough to compile.
 *   - `recall` items are flashcards: a question a student can answer out loud in
 *     under fifteen seconds. Not trivia — the things you must have cold.
 *   - `interview` items are what an interviewer actually follows up with.
 */

/** @typedef {{ term: string, detail: string }} Concept */
/** @typedef {{ label: string, time: string, space: string, note?: string }} ComplexityRow */
/** @typedef {{ q: string, a: string }} Card */

export const PATTERN_SHEETS = [
  {
    id: 'foundations',
    title: 'Complexity, Recursion & Bit Tricks',
    summary:
      'How to price a solution before you write it. Every later pattern assumes you can do this in your head.',
    recognise: [
      'Any time you are asked "can you do better?" — the answer starts with the current cost.',
      '"What is the complexity?" as a follow-up to code you just wrote.',
      'Constraints in the problem statement: n ≤ 10^5 rules out O(n²); n ≤ 20 invites exponential.',
    ],
    concepts: [
      { term: 'Big-O is an upper bound on growth', detail: 'It describes how cost scales, not how fast the code runs. O(n) with a huge constant can lose to O(n log n) at real sizes — say that out loud and interviewers notice.' },
      { term: 'Drop constants and lower terms', detail: 'O(3n² + 500n + 9) is O(n²). The 500n stops mattering once n is large, which is the only regime Big-O talks about.' },
      { term: 'Read the loops, not the lines', detail: 'Sequential loops add (O(n) + O(n) = O(n)); nested loops multiply (O(n) × O(n) = O(n²)). A loop whose counter doubles is O(log n).' },
      { term: 'Recursion costs stack space', detail: 'Depth d recursion is O(d) space even when it allocates nothing. Recursing once per element on a 10^5-long list is a stack overflow, not a style choice.' },
      { term: 'Recurrences, roughly', detail: 'T(n) = 2T(n/2) + O(n) → O(n log n) (merge sort). T(n) = T(n/2) + O(1) → O(log n) (binary search). T(n) = 2T(n-1) + O(1) → O(2ⁿ) (naive subsets).' },
      { term: 'Amortised ≠ average', detail: 'A vector push_back is O(1) amortised: individual pushes can be O(n) when it reallocates, but any sequence of n pushes totals O(n). Amortised is a worst-case guarantee over a sequence; average is a probabilistic claim.' },
      { term: 'x & (x - 1) clears the lowest set bit', detail: 'Repeat until zero to count set bits in O(number of set bits). x & -x isolates that lowest set bit instead.' },
      { term: 'XOR is self-inverse', detail: 'a ^ a = 0 and a ^ 0 = a, so XOR-ing a whole array where every value appears twice except one leaves exactly the odd one out.' },
    ],
    complexity: [
      { label: 'Constant', time: 'O(1)', space: 'O(1)', note: 'Array index, hash lookup (average).' },
      { label: 'Logarithmic', time: 'O(log n)', space: 'O(1)', note: 'Halving the search space each step.' },
      { label: 'Linear', time: 'O(n)', space: 'O(1)', note: 'A single pass.' },
      { label: 'Linearithmic', time: 'O(n log n)', space: 'O(n)', note: 'Comparison sorting — the proven floor for comparison-based sorts.' },
      { label: 'Quadratic', time: 'O(n²)', space: 'O(1)', note: 'Nested pass. Dies above roughly n = 10⁴.' },
      { label: 'Exponential', time: 'O(2ⁿ)', space: 'O(n)', note: 'Subsets, naive recursion. Only viable for n ≲ 20–25.' },
    ],
    template: {
      caption: 'The three bit tricks worth memorising',
      lang: 'cpp',
      code: `int countSetBits(int x) {
    int count = 0;
    while (x) { x &= (x - 1); count++; }   // clears lowest set bit each turn
    return count;                          // O(set bits), not O(32)
}

int lowestSetBit(int x) { return x & -x; } // isolates it, e.g. 12 -> 4

int findUnique(const vector<int>& a) {     // every value twice except one
    int acc = 0;
    for (int v : a) acc ^= v;              // pairs cancel, the loner survives
    return acc;
}`,
    },
    pitfalls: [
      'Quoting O(n) for a loop that calls a helper which is itself O(n). Nested cost is multiplied, not ignored — always price what you call.',
      'Forgetting the space your recursion uses. "O(1) space" while recursing n deep is wrong.',
      'Calling hash-map lookup O(1) worst case. It is O(1) average; adversarial or pathological keys degrade it to O(n).',
      'Treating O(n log n) and O(n) as interchangeable "fast". If the interviewer set n = 10⁶ and a 1-second limit, the difference is the whole question.',
      'Using int for a sum that can exceed 2·10⁹. Overflow is the most common wrong-answer in otherwise correct code — reach for long long.',
    ],
    recall: [
      { q: 'What does O(n²) actually mean?', a: 'Cost grows with the square of input size: double n, roughly quadruple the work. It says nothing about absolute runtime.' },
      { q: 'Space complexity of recursing to depth d?', a: 'O(d) for the call stack, even if the function allocates nothing itself.' },
      { q: 'T(n) = 2T(n/2) + O(n) solves to?', a: 'O(n log n) — the merge-sort recurrence.' },
      { q: 'What does x & (x - 1) do?', a: 'Clears the lowest set bit of x.' },
      { q: 'Why is push_back O(1) if it sometimes copies everything?', a: 'Amortised: reallocation doubles capacity, so n pushes cost O(n) total.' },
      { q: 'Constraint n ≤ 20 hints at which family of solutions?', a: 'Exponential — subsets/bitmask/backtracking. 2²⁰ ≈ 10⁶ is fine.' },
    ],
    interview: [
      { q: 'Your solution is O(n log n). Can you do better?', a: 'Ask what is forcing the log: if it is a sort, can a hash map or counting sort replace it? If the output itself requires order, O(n log n) is the floor and you should say so.' },
      { q: 'What is the difference between O and Θ?', a: 'O is an upper bound (cost is at most this); Θ is a tight bound (at most and at least). Most people say O when they mean Θ, and that is usually accepted.' },
      { q: 'Is O(1) always faster than O(n)?', a: 'No — asymptotically yes, at a specific n not necessarily. A hash lookup with an expensive hash can lose to scanning a 4-element array.' },
    ],
  },

  {
    id: 'arrays-hashing',
    title: 'Arrays & Hashing',
    summary:
      'Spend memory to buy time. Most O(n²) scans are secretly asking "have I seen this before?" — which is a map or a set.',
    recognise: [
      'The words duplicate, count, frequency, seen, pair, or "exists such that".',
      'A nested loop where the inner one is just searching for something.',
      'Anything asking about a subarray sum — think prefix sums.',
      'Grouping items that share a computed key (anagrams share a sorted spelling).',
    ],
    concepts: [
      { term: 'The core trade', detail: 'A hash set turns "is x in this collection?" from O(n) into O(1) average, at the cost of O(n) memory. That single swap collapses O(n²) to O(n).' },
      { term: 'Map vs set', detail: 'Set when you only need membership. Map when you need to remember something about each key — an index, a count, a list of members.' },
      { term: 'Complement search', detail: 'For Two Sum, do not look for pairs. For each x, ask whether target − x has already been seen. One pass, one map.' },
      { term: 'Frequency counting', detail: 'unordered_map<char,int> or a fixed int[26] for lowercase letters. The array version is faster and is what you want when the alphabet is bounded.' },
      { term: 'Prefix sums', detail: 'pre[i] = a[0..i-1] summed. Then any range sum a[l..r] = pre[r+1] − pre[l] in O(1) after O(n) setup. Turns repeated range queries from O(n) each into O(1) each.' },
      { term: 'Prefix sum + hash map', detail: 'Counting subarrays that sum to k: as you sweep, ask how many earlier prefixes equal running − k. That count is the number of subarrays ending here.' },
      { term: 'Grouping by canonical key', detail: 'Anagrams: the key is the sorted string (or a 26-length count signature). Anything that should collide must produce an identical key.' },
      { term: 'Kadane', detail: 'Maximum subarray in one pass: at each element, either extend the running sum or restart from this element — whichever is larger. Track the best seen.' },
    ],
    complexity: [
      { label: 'Hash insert / lookup / erase', time: 'O(1) avg', space: 'O(n)', note: 'O(n) worst case under collisions.' },
      { label: 'Build a frequency map', time: 'O(n)', space: 'O(k)', note: 'k = distinct keys.' },
      { label: 'Prefix sum build', time: 'O(n)', space: 'O(n)', note: 'Then O(1) per range query.' },
      { label: 'Kadane / max subarray', time: 'O(n)', space: 'O(1)', note: 'Single pass, no extra structure.' },
      { label: 'Sort-then-scan alternative', time: 'O(n log n)', space: 'O(1)–O(n)', note: 'Use when you also need order or cannot afford the map.' },
    ],
    template: {
      caption: 'Complement lookup and prefix-sum-plus-map, the two moves you reuse most',
      lang: 'cpp',
      code: `vector<int> twoSum(vector<int>& a, int target) {
    unordered_map<int,int> seen;              // value -> its index
    for (int i = 0; i < (int)a.size(); i++) {
        int need = target - a[i];
        if (seen.count(need)) return {seen[need], i};
        seen[a[i]] = i;                       // insert AFTER the check
    }
    return {};
}

int subarraysSumK(vector<int>& a, int k) {
    unordered_map<long long,int> freq{{0, 1}}; // empty prefix seen once
    long long running = 0; int count = 0;
    for (int v : a) {
        running += v;
        count += freq.count(running - k) ? freq[running - k] : 0;
        freq[running]++;
    }
    return count;
}`,
    },
    pitfalls: [
      'Inserting into the map before checking it, so an element pairs with itself. Check first, insert after.',
      'Forgetting to seed the prefix-sum map with {0: 1}. Without it you miss every subarray that starts at index 0.',
      'Using int for a running prefix sum. With n = 10⁵ and values up to 10⁴ it overflows — use long long.',
      'Sorting when a map would do. Sorting is O(n log n) and destroys the original indices, which the answer often needs.',
      'Assuming iteration order in an unordered_map. There is none; if you need order, use map or sort the keys.',
    ],
    recall: [
      { q: 'How does a hash map turn O(n²) into O(n)?', a: 'It replaces the inner search loop with an O(1) average lookup.' },
      { q: 'Range sum a[l..r] from a prefix array?', a: 'pre[r+1] − pre[l].' },
      { q: 'Why seed the prefix-count map with {0: 1}?', a: 'So subarrays starting at index 0 are counted — their prefix-before is the empty prefix, 0.' },
      { q: 'Canonical key for grouping anagrams?', a: 'The sorted string, or a 26-slot character count signature.' },
      { q: 'Kadane in one sentence?', a: 'At each element take max(element, running + element), and track the best value seen.' },
      { q: 'Worst-case hash map lookup?', a: 'O(n) — all keys colliding into one bucket. O(1) is the average case.' },
    ],
    interview: [
      { q: 'Solve Two Sum without extra space.', a: 'Sort and use two pointers — O(n log n) time, O(1) extra. Note the trade: sorting loses the original indices, so if the answer needs them you must store pairs first.' },
      { q: 'Product of array except self without division?', a: 'Two sweeps: a left-products pass and a right-products pass, multiplied. O(n) time, O(1) extra beyond the output.' },
      { q: 'Why not always use a hash map?', a: 'Memory, and worst-case degradation. With a small bounded key range a plain array is faster and has a real O(1) worst case.' },
    ],
  },

  {
    id: 'two-pointers',
    title: 'Two Pointers',
    summary:
      'On sorted input, two indices replace a nested loop. The skill is justifying why the side you discard can never hold the answer.',
    recognise: [
      'The input is sorted, or sorting it does not destroy the question.',
      'You are looking for a pair, triplet, or a container defined by two ends.',
      'In-place partitioning or removal ("move all zeroes", "remove duplicates").',
      'Palindrome checks — compare inward from both ends.',
    ],
    concepts: [
      { term: 'Opposite ends', detail: 'left at 0, right at n−1, walking toward each other. Used when the answer is a pair whose combined value moves predictably as you move either end.' },
      { term: 'The discard argument', detail: 'On a sorted array with sum too small, moving right inward only ever shrinks the sum — so left must move. That sentence IS the correctness proof, and interviewers want to hear it.' },
      { term: 'Same direction (fast/slow)', detail: 'Both start at the left; slow marks where the next kept element goes, fast scans ahead. This is how in-place filtering works without extra memory.' },
      { term: 'Container With Most Water', detail: 'Area is limited by the shorter wall, so moving the taller wall inward can never help — width shrinks and height is still capped. Always move the shorter one.' },
      { term: 'Triplets = fix one, two-point the rest', detail: '3Sum is: sort, fix index i, then run a two-pointer scan for −a[i] on the remainder. O(n²), not O(n³).' },
      { term: 'Skipping duplicates', detail: 'After recording a hit, advance past equal values on both sides. This is what makes 3Sum return distinct triplets without a set.' },
    ],
    complexity: [
      { label: 'Single two-pointer sweep', time: 'O(n)', space: 'O(1)', note: 'Each index moves forward at most n times.' },
      { label: 'With a required sort', time: 'O(n log n)', space: 'O(1)–O(n)', note: 'The sort dominates.' },
      { label: '3Sum (fix one + sweep)', time: 'O(n²)', space: 'O(1)', note: 'Excluding output storage.' },
      { label: 'In-place partition', time: 'O(n)', space: 'O(1)', note: 'Fast/slow, one pass.' },
    ],
    template: {
      caption: 'Both shapes: converging ends, and fast/slow in-place filtering',
      lang: 'cpp',
      code: `// Converging — sorted array, find a pair summing to target
pair<int,int> twoSumSorted(vector<int>& a, int target) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        int sum = a[l] + a[r];
        if (sum == target) return {l, r};
        if (sum < target) l++;      // only a bigger left can help
        else               r--;     // only a smaller right can help
    }
    return {-1, -1};
}

// Fast/slow — compact non-zero values in place, O(1) extra
int removeZeros(vector<int>& a) {
    int slow = 0;
    for (int fast = 0; fast < (int)a.size(); fast++)
        if (a[fast] != 0) a[slow++] = a[fast];
    return slow;                    // a[0..slow-1] is the kept prefix
}`,
    },
    pitfalls: [
      'Using two pointers on unsorted data where the discard argument does not hold. Without sortedness, moving a pointer proves nothing.',
      'while (l <= r) when the two must be distinct elements — that lets an element pair with itself.',
      'Forgetting to skip duplicates, so 3Sum returns the same triplet repeatedly.',
      'Moving the taller wall in Container With Most Water. It cannot improve the answer; only the shorter side can.',
      'Sorting when the problem needs original indices, without saving them first.',
    ],
    recall: [
      { q: 'Precondition for the converging two-pointer scan?', a: 'The array is sorted (or the property being tested is monotonic along it).' },
      { q: 'Sum is below target on a sorted array — which pointer moves?', a: 'left, rightward. Moving right can only shrink the sum further.' },
      { q: 'Why move the shorter wall in Container With Most Water?', a: 'Height is capped by the shorter wall, and width always shrinks, so moving the taller one can never increase the area.' },
      { q: 'Time complexity of 3Sum done properly?', a: 'O(n²) — sort, then fix one element and two-pointer the rest.' },
      { q: 'What does the slow pointer mean in the fast/slow shape?', a: 'The write position: the boundary of the kept prefix.' },
      { q: 'How do you avoid duplicate triplets?', a: 'After a hit, skip over equal neighbouring values on both sides.' },
    ],
    interview: [
      { q: 'Prove your two-pointer solution is correct.', a: 'Show that each move discards only pairs that cannot be the answer. On a sorted array with sum < target, every pair using the current left and any smaller right is also too small, so left is safe to advance.' },
      { q: 'Trapping Rain Water with O(1) space?', a: 'Two pointers with running leftMax/rightMax. Process whichever side has the smaller max — its water level is already determined by that side.' },
      { q: 'When is a hash map better than two pointers here?', a: 'When the input is unsorted and you must keep original indices — sorting to enable two pointers would destroy them.' },
    ],
  },

  {
    id: 'sliding-window',
    title: 'Sliding Window',
    summary:
      'A window over a contiguous run, maintaining state as it grows and shrinks. Fixed windows are mechanical; the shrink condition is the whole problem in variable ones.',
    recognise: [
      'The words substring, subarray, contiguous, consecutive — contiguity is mandatory.',
      '"Longest/shortest … such that <condition>".',
      '"Of size k" — that is the fixed-size variant.',
      'At most / exactly k distinct elements.',
    ],
    concepts: [
      { term: 'Fixed size k', detail: 'Add the entering element, remove the leaving one, read the answer. No inner loop, no condition — just maintain the aggregate.' },
      { term: 'Variable size', detail: 'right always advances. left advances only while the window is invalid. Both indices move forward at most n times, which is why it stays O(n) despite the nested while.' },
      { term: 'The invariant', detail: 'Name what must be true of the window: "at most k distinct", "no repeated character", "sum ≥ target". Every line of the loop either restores or exploits it.' },
      { term: 'Grow-then-shrink skeleton', detail: 'Expand right → while invalid, shrink from left → record the answer. Where you record depends on whether you want the longest (record after shrinking) or shortest (record inside the shrink loop).' },
      { term: '"Exactly k" = atMost(k) − atMost(k−1)', detail: 'Counting subarrays with exactly k distinct values directly is painful. Counting at-most is easy, and the subtraction is exact.' },
      { term: 'Window state', detail: 'A frequency map, a running sum, or a distinct-count. Update it on both entry and exit — an un-decremented count on exit is the classic bug.' },
    ],
    complexity: [
      { label: 'Fixed window', time: 'O(n)', space: 'O(1)', note: 'Or O(k) if you keep a map.' },
      { label: 'Variable window', time: 'O(n)', space: 'O(k)', note: 'Each index advances at most n times total.' },
      { label: 'With a char-count array', time: 'O(n)', space: 'O(1)', note: 'A fixed 26/128-slot array is constant space.' },
      { label: 'Sliding Window Maximum', time: 'O(n)', space: 'O(k)', note: 'Needs a monotonic deque, not a plain window.' },
    ],
    template: {
      caption: 'The variable-window skeleton — longest substring with no repeats',
      lang: 'cpp',
      code: `int longestUnique(const string& s) {
    vector<int> count(128, 0);
    int left = 0, best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        count[s[right]]++;                       // element enters
        while (count[s[right]] > 1) {            // invariant broken
            count[s[left]]--;                    // element leaves
            left++;
        }
        best = max(best, right - left + 1);      // window is valid here
    }
    return best;
}`,
    },
    pitfalls: [
      'Forgetting to update the state when an element leaves the window. The map must shrink as well as grow.',
      'Recording the answer in the wrong place — inside the shrink loop gives you the shortest valid window, after it gives you the longest.',
      'Using a window on a problem that allows non-contiguous picks. Subsequence problems are not window problems.',
      'if instead of while for shrinking. One shrink may not be enough to restore the invariant.',
      'Trying to slide a window over an array with negative numbers for a "sum ≥ target" question — growing no longer monotonically increases the sum, so the shrink logic breaks. Use prefix sums plus a map instead.',
    ],
    recall: [
      { q: 'Why is a variable sliding window O(n) despite the inner while?', a: 'left and right each advance at most n times across the whole run, so total work is linear.' },
      { q: 'Where do you record the answer for the SHORTEST valid window?', a: 'Inside the shrink loop, while the window is still valid.' },
      { q: 'How do you count subarrays with exactly k distinct values?', a: 'atMost(k) − atMost(k − 1).' },
      { q: 'What breaks sliding window on arrays with negative numbers?', a: 'Growing the window no longer monotonically increases the sum, so "shrink while too big" is not a valid rule.' },
      { q: 'Fixed-size window: what happens each step?', a: 'Add the entering element, remove the leaving one, read the aggregate.' },
      { q: 'Which structure gives O(n) sliding window maximum?', a: 'A monotonic deque holding indices in decreasing value order.' },
    ],
    interview: [
      { q: 'Minimum Window Substring — how do you know the window is valid?', a: 'Keep a "have vs need" counter of how many required characters are satisfied at the required multiplicity. Increment only when a count reaches its needed value, and the window is valid when that counter equals the number of distinct needed characters.' },
      { q: 'Why not just check every substring?', a: 'That is O(n²) substrings and O(n) to validate each. The window reuses the previous state instead of recomputing it.' },
      { q: 'Fixed vs variable — how do you tell from the statement?', a: 'If the size is given ("of length k") it is fixed. If the size is what you are optimising ("longest such that…") it is variable.' },
    ],
  },

  {
    id: 'stack',
    title: 'Stack & Monotonic Stack',
    summary:
      'LIFO for nesting and "the most recent unresolved thing". Then the sharp version: one pass answers "next greater" for every element.',
    recognise: [
      'Brackets, nesting, undo, expression evaluation.',
      '"Next greater / previous smaller element" — for every element.',
      'A nested loop scanning backwards or forwards looking for a first-bigger value.',
      'Histogram / skyline / rectangle-area problems.',
      '"Remove k characters to make the smallest number" — monotonic stack.',
    ],
    concepts: [
      { term: 'Why a stack for brackets', detail: 'The only bracket that can legally close is the most recently opened one. That is exactly LIFO.' },
      { term: 'Monotonic stack, the idea', detail: 'Keep the stack sorted (increasing or decreasing). Before pushing, pop everything that violates the order — and each pop is the moment you learn that element\'s answer.' },
      { term: 'Decreasing stack → next greater', detail: 'Hold values in decreasing order. When x arrives and pops y, x is the next greater element of y. Every element is pushed once and popped once: O(n).' },
      { term: 'Increasing stack → next smaller', detail: 'Mirror image. Used for histogram problems, where you need the first bar shorter than the current one on each side.' },
      { term: 'Store indices, not values', detail: 'You almost always need the distance between positions (widths, day gaps), which values cannot give you.' },
      { term: 'Sentinels', detail: 'Appending a 0-height bar to a histogram forces the stack to drain at the end, so you do not need a separate cleanup loop.' },
      { term: 'Min Stack', detail: 'Push a pair (value, min-so-far), or keep a parallel stack of minimums. Both give O(1) getMin because each entry remembers the minimum at its own depth.' },
    ],
    complexity: [
      { label: 'Push / pop / top', time: 'O(1)', space: 'O(1)', note: 'Per operation.' },
      { label: 'Balanced brackets', time: 'O(n)', space: 'O(n)', note: 'Worst case all opening brackets.' },
      { label: 'Monotonic stack sweep', time: 'O(n)', space: 'O(n)', note: 'Amortised: each index pushed once, popped once.' },
      { label: 'Largest Rectangle in Histogram', time: 'O(n)', space: 'O(n)', note: 'One increasing-stack pass.' },
      { label: 'Min Stack getMin', time: 'O(1)', space: 'O(n)', note: 'Extra minimum tracked per entry.' },
    ],
    template: {
      caption: 'Next greater element — the monotonic stack in its clearest form',
      lang: 'cpp',
      code: `vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    stack<int> st;                       // indices, values DECREASING
    for (int i = 0; i < n; i++) {
        // a[i] is the first bigger value for everything it pops
        while (!st.empty() && a[st.top()] < a[i]) {
            res[st.top()] = a[i];
            st.pop();
        }
        st.push(i);
    }
    return res;                          // still-stacked indices keep -1
}`,
    },
    pitfalls: [
      'Popping an empty stack. Always guard with !st.empty() before top() — in C++ this is undefined behaviour, not an exception.',
      'Storing values when you need indices for width or distance calculations.',
      'Getting the comparison backwards: < builds a decreasing stack (next greater), > builds an increasing one (next smaller).',
      'Forgetting elements left on the stack at the end. They have no next-greater — make sure the default answer covers them.',
      'Checking only the count of brackets rather than their types and order. "([)]" has balanced counts and is still invalid.',
    ],
    recall: [
      { q: 'Why is a monotonic stack O(n) when it has a nested while?', a: 'Each index is pushed once and popped at most once, so total pops are bounded by n.' },
      { q: 'Decreasing stack answers which question?', a: 'Next greater element.' },
      { q: 'Why push indices rather than values?', a: 'Widths and distances need positions; values cannot recover them.' },
      { q: 'How does Min Stack achieve O(1) getMin?', a: 'Each entry stores the minimum as of its own push, so the top always knows the current minimum.' },
      { q: 'Purpose of a sentinel bar in the histogram problem?', a: 'It forces the stack to drain, removing the need for a separate final cleanup loop.' },
      { q: 'Why does LIFO match bracket matching?', a: 'Only the most recently opened bracket can legally be closed next.' },
    ],
    interview: [
      { q: 'Largest Rectangle in Histogram — what does a pop mean?', a: 'When bar i pops bar j, i is the first shorter bar to the right of j, and the new stack top is the first shorter bar to its left. Those two bounds give j\'s maximal width in O(1).' },
      { q: 'Implement a queue with two stacks.', a: 'An in-stack and an out-stack. Push to in; to pop, if out is empty, drain in into out (which reverses the order) and pop from out. Amortised O(1) per operation.' },
      { q: 'Daily Temperatures without a stack?', a: 'O(n²) by scanning forward from each day. The stack removes the rescanning by remembering unresolved days.' },
    ],
  },

  {
    id: 'binary-search',
    title: 'Binary Search',
    summary:
      'Halve the space each step. The interview version is rarely "find x in a sorted array" — it is binary search on the ANSWER.',
    recognise: [
      'Sorted input, or rotated-sorted input.',
      '"Minimum k such that …" or "maximum k such that …" — search the answer range.',
      'A feasibility question with a yes/no answer that flips exactly once as k grows.',
      'Constraints so large that O(n) per check is fine but O(n) checks are not.',
    ],
    concepts: [
      { term: 'The real precondition', detail: 'Not sortedness — monotonicity. If "is k feasible?" is false, false, …, true, true, you can binary search k even when no array is sorted.' },
      { term: 'Binary search on the answer', detail: 'Define a predicate feasible(k), find the boundary where it flips. Koko Eating Bananas: can she finish at speed k? Slower is never easier, so the predicate is monotonic.' },
      { term: 'Half-open discipline', detail: 'Pick one convention and keep it. [lo, hi) with while (lo < hi) and hi = mid / lo = mid + 1 never off-by-ones, because the loop shrinks the range every iteration.' },
      { term: 'Overflow-safe midpoint', detail: 'lo + (hi − lo) / 2, never (lo + hi) / 2 — the latter overflows once the bounds are near INT_MAX.' },
      { term: 'Rotated arrays', detail: 'One half of a rotated sorted array is always properly sorted. Work out which by comparing a[lo] with a[mid], then decide whether the target lies inside that sorted half.' },
      { term: 'lower_bound vs upper_bound', detail: 'lower_bound is the first element ≥ x; upper_bound is the first > x. The gap between them is the count of x.' },
    ],
    complexity: [
      { label: 'Classic search', time: 'O(log n)', space: 'O(1)', note: 'Iterative.' },
      { label: 'Search on the answer', time: 'O(n log R)', space: 'O(1)', note: 'R = size of the answer range; each check is O(n).' },
      { label: 'Rotated array search', time: 'O(log n)', space: 'O(1)', note: 'Degrades to O(n) with duplicates.' },
      { label: 'Median of two sorted arrays', time: 'O(log(min(m,n)))', space: 'O(1)', note: 'Partition search, not element search.' },
      { label: 'Sorting to enable it', time: 'O(n log n)', space: 'O(1)–O(n)', note: 'Only worth it for repeated queries.' },
    ],
    template: {
      caption: 'Half-open boundary search, then the same loop applied to an answer range',
      lang: 'cpp',
      code: `// First index where pred becomes true; n if never. [lo, hi) convention.
int lowerBoundBy(int n, function<bool(int)> pred) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;       // never overflows
        if (pred(mid)) hi = mid;            // answer is mid or left of it
        else           lo = mid + 1;        // answer is strictly right
    }
    return lo;
}

// Koko: smallest speed k finishing all piles within h hours
int minEatingSpeed(vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end());
    while (lo < hi) {
        int k = lo + (hi - lo) / 2;
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;   // ceil division
        if (hours <= h) hi = k; else lo = k + 1;
    }
    return lo;
}`,
    },
    pitfalls: [
      'Mixing conventions — while (lo <= hi) with hi = mid is an infinite loop. Pick [lo, hi) or [lo, hi] and stay in it.',
      '(lo + hi) / 2 overflowing on large bounds.',
      'Binary searching a predicate that is not monotonic. If feasible flips more than once, the result is meaningless.',
      'Setting the answer range too narrow. For Koko, hi must be the largest pile — anything smaller can exclude the answer.',
      'Integer division where you need a ceiling. Hours per pile is ceil(p / k), written (p + k − 1) / k.',
    ],
    recall: [
      { q: 'What must be true to binary search — sortedness or monotonicity?', a: 'Monotonicity. Sortedness is just the common special case.' },
      { q: 'Overflow-safe midpoint?', a: 'lo + (hi − lo) / 2.' },
      { q: '"Minimum k such that P(k)" — what do you search?', a: 'The answer range for k, using P as the predicate.' },
      { q: 'Difference between lower_bound and upper_bound?', a: 'First element ≥ x versus first element > x.' },
      { q: 'Rotated sorted array — key observation?', a: 'At least one half around mid is properly sorted; compare endpoints to find which.' },
      { q: 'Ceiling division of p by k in integers?', a: '(p + k − 1) / k.' },
    ],
    interview: [
      { q: 'Complexity of Koko Eating Bananas?', a: 'O(n log maxPile) — a log-many binary search steps over the speed range, each costing an O(n) feasibility check.' },
      { q: 'Why does search break on a rotated array with duplicates?', a: 'a[lo] == a[mid] no longer tells you which half is sorted, so you must step the bound in by one — worst case O(n).' },
      { q: 'Find the first and last position of a target.', a: 'Two boundary searches: lower_bound(target) and lower_bound(target + 1) − 1. Same loop, different predicates.' },
    ],
  },

  {
    id: 'linked-list',
    title: 'Linked Lists',
    summary:
      'Pointer surgery. Four moves cover almost everything: reverse, fast/slow, merge, dummy head.',
    recognise: [
      'Any problem where the input is a list head rather than an array.',
      '"Find the middle", "detect a cycle", "find where the cycle starts".',
      '"Reverse between positions m and n", "reorder", "swap pairs".',
      'Anything requiring O(1) extra space over a sequence you cannot index into.',
    ],
    concepts: [
      { term: 'Dummy head', detail: 'Allocate a node in front of the real head. Deleting or inserting at position 0 stops being a special case, which removes most of the branching bugs.' },
      { term: 'Reverse in place', detail: 'Three pointers: prev, curr, next. Save next, point curr back at prev, shuffle all three forward. Memorise it — it is the building block of half the medium problems.' },
      { term: 'Fast/slow for the middle', detail: 'fast moves two, slow moves one. When fast falls off the end, slow is at the middle. Which middle you land on for even lengths depends on the loop condition — check it deliberately.' },
      { term: "Floyd's cycle detection", detail: 'If fast and slow ever meet, there is a cycle. To find its start: reset one pointer to the head and advance both one step at a time — they meet at the entry node.' },
      { term: 'Merging sorted lists', detail: 'Dummy head plus a tail pointer, repeatedly attach the smaller head. Attach the non-empty remainder at the end rather than looping it node by node.' },
      { term: 'Two-pass vs one-pass removal', detail: '"Remove the nth from the end" in one pass: advance a lead pointer n steps first, then move both until lead hits the end. The trailer is at the node before the target.' },
      { term: 'LRU Cache', detail: 'A hash map to a doubly linked list node. The map gives O(1) lookup, the list gives O(1) reordering. Neither structure alone can do both.' },
    ],
    complexity: [
      { label: 'Traverse / search', time: 'O(n)', space: 'O(1)', note: 'No random access — index i costs i steps.' },
      { label: 'Reverse in place', time: 'O(n)', space: 'O(1)', note: 'Iterative. Recursive is O(n) stack.' },
      { label: 'Find middle / detect cycle', time: 'O(n)', space: 'O(1)', note: 'Fast and slow pointers.' },
      { label: 'Merge two sorted lists', time: 'O(n + m)', space: 'O(1)', note: 'Relinking, not copying.' },
      { label: 'Merge k lists (heap)', time: 'O(N log k)', space: 'O(k)', note: 'N total nodes across k lists.' },
      { label: 'LRU get / put', time: 'O(1)', space: 'O(capacity)', note: 'Hash map + doubly linked list.' },
    ],
    template: {
      caption: 'Reverse, and the cycle-entry trick worth memorising',
      lang: 'cpp',
      code: `ListNode* reverse(ListNode* head) {
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* next = curr->next;   // save it before you destroy it
        curr->next = prev;             // flip the arrow
        prev = curr; curr = next;      // shuffle forward
    }
    return prev;                       // old tail is the new head
}

ListNode* cycleStart(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {                       // cycle confirmed
            ListNode* p = head;
            while (p != slow) { p = p->next; slow = slow->next; }
            return p;                             // the entry node
        }
    }
    return nullptr;
}`,
    },
    pitfalls: [
      'Losing the rest of the list by reassigning curr->next before saving it.',
      'Dereferencing fast->next->next without checking fast && fast->next first.',
      'Not using a dummy head, then writing separate branches for "delete the first node".',
      'Returning head after reversing. The new head is prev — head is now the tail.',
      'Comparing node values when the question is about identity. Two intersecting lists share a NODE, not a value.',
    ],
    recall: [
      { q: 'What does a dummy head buy you?', a: 'Head insertion and deletion stop being special cases.' },
      { q: 'Three pointers in an in-place reverse?', a: 'prev, curr, next.' },
      { q: 'After reversing, what do you return?', a: 'prev — the old tail.' },
      { q: 'How do you find the START of a cycle?', a: 'After fast and slow meet, reset one to the head and advance both one step at a time; they meet at the entry.' },
      { q: 'Which two structures make an LRU cache O(1)?', a: 'A hash map for lookup plus a doubly linked list for ordering.' },
      { q: 'Remove nth from end in one pass — how?', a: 'Advance a lead pointer n steps, then move lead and trail together until lead reaches the end.' },
    ],
    interview: [
      { q: 'Why does the cycle-entry trick work?', a: 'If the tail before the cycle has length a and they meet k into a cycle of length c, the distance from the meeting point back around to the entry equals a modulo c — so two pointers moving at the same speed from the head and the meeting point converge at the entry.' },
      { q: 'Reverse a list recursively — what is the cost?', a: 'Still O(n) time, but O(n) stack space, which the iterative version avoids. On a long list that is a real overflow risk.' },
      { q: 'Copy a list with random pointers in O(1) extra space?', a: 'Interleave copies into the original list, wire the random pointers from the neighbours, then split the two lists apart.' },
    ],
  },

  {
    id: 'trees',
    title: 'Trees & BSTs',
    summary:
      'Recursion with a shape. Decide what one call RETURNS and the code writes itself.',
    recognise: [
      'The input is a root pointer.',
      '"Depth", "height", "diameter", "path", "ancestor".',
      '"Level by level" or "left to right at each depth" — that is BFS.',
      'Anything mentioning a BST invariant, sorted order, or the kth smallest.',
    ],
    concepts: [
      { term: 'Decide the return value first', detail: 'Most tree bugs are really "this function returns two different things depending on the branch". Write the one-sentence contract — "returns the height of this subtree" — before any code.' },
      { term: 'The traversals', detail: 'Preorder (node, left, right) copies or serialises a tree. Inorder (left, node, right) on a BST yields sorted order. Postorder (left, right, node) is for anything needing children resolved first, like deletion or height.' },
      { term: 'BFS = level order', detail: 'A queue. To process strictly level by level, capture the queue size at the top of each round and pop exactly that many nodes.' },
      { term: 'Global answer, local return', detail: 'Diameter and max-path-sum both need this: the function RETURNS the best downward path, while updating a shared best that may combine both children. Confusing the two is the classic error.' },
      { term: 'BST invariant', detail: 'Every node in the left subtree is smaller, every node on the right is larger — for the WHOLE subtree, not just the immediate children. Validating with only parent-child comparisons is wrong.' },
      { term: 'Validate with bounds', detail: 'Pass (min, max) down. Each node must lie strictly inside, and it narrows the bound for its children.' },
      { term: 'Kth smallest in a BST', detail: 'Inorder traversal with a counter, stopping at k. O(h + k), not O(n) — no need to walk the whole tree.' },
      { term: 'Balance matters', detail: 'Every BST bound below is O(h). That is O(log n) only if balanced; a degenerate BST is a linked list at O(n).' },
    ],
    complexity: [
      { label: 'Any full traversal', time: 'O(n)', space: 'O(h)', note: 'h = height; O(n) stack in the worst case.' },
      { label: 'BFS level order', time: 'O(n)', space: 'O(w)', note: 'w = maximum width, up to n/2 at the bottom level.' },
      { label: 'BST search / insert / delete', time: 'O(h)', space: 'O(1)', note: 'O(log n) balanced, O(n) degenerate.' },
      { label: 'Kth smallest (BST)', time: 'O(h + k)', space: 'O(h)', note: 'Early-exit inorder.' },
      { label: 'Build from preorder + inorder', time: 'O(n)', space: 'O(n)', note: 'With an index map; O(n²) without one.' },
      { label: 'Segment tree query / update', time: 'O(log n)', space: 'O(n)', note: 'Build is O(n).' },
    ],
    template: {
      caption: 'The global-answer/local-return shape, and level-order BFS',
      lang: 'cpp',
      code: `int best = 0;
// RETURNS: height of this subtree. UPDATES: best diameter seen anywhere.
int height(TreeNode* node) {
    if (!node) return 0;
    int L = height(node->left), R = height(node->right);
    best = max(best, L + R);        // path THROUGH this node
    return 1 + max(L, R);           // path going DOWN from it
}

vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> out;
    if (!root) return out;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int n = q.size();           // freeze the level boundary
        vector<int> level;
        for (int i = 0; i < n; i++) {
            TreeNode* cur = q.front(); q.pop();
            level.push_back(cur->val);
            if (cur->left)  q.push(cur->left);
            if (cur->right) q.push(cur->right);
        }
        out.push_back(level);
    }
    return out;
}`,
    },
    pitfalls: [
      'Missing the null base case, or checking it after dereferencing the node.',
      'Returning the through-node value instead of the downward value in diameter/path-sum problems. The parent can only use a downward path.',
      'Validating a BST by comparing each node only with its immediate children. The constraint applies to entire subtrees.',
      'Not freezing the queue size in BFS, so one round drains nodes belonging to the next level.',
      'Assuming O(log n) for BST operations without saying "if balanced". An unbalanced BST is O(n).',
      'Building from preorder + inorder with a linear index search each time — that is O(n²). Pre-hash the inorder positions.',
    ],
    recall: [
      { q: 'Which traversal yields sorted order on a BST?', a: 'Inorder (left, node, right).' },
      { q: 'Space complexity of a recursive tree traversal?', a: 'O(h) for the call stack — O(n) if the tree is degenerate.' },
      { q: 'Diameter: what does the recursive call return?', a: 'The height of the subtree. The diameter is tracked in a separate global maximum.' },
      { q: 'How do you keep BFS levels separate?', a: 'Capture queue.size() at the start of each round and pop exactly that many.' },
      { q: 'Correct way to validate a BST?', a: 'Pass down (min, max) bounds, or do an inorder walk and check it is strictly increasing.' },
      { q: 'Cost of kth smallest in a BST?', a: 'O(h + k) with an early-exit inorder traversal.' },
    ],
    interview: [
      { q: 'Lowest Common Ancestor in a BST vs a general binary tree?', a: 'In a BST, walk down while both targets are on the same side; the first node that splits them is the LCA — O(h). In a general tree you must search both subtrees and return the node where both sides report a hit — O(n).' },
      { q: 'Serialize and deserialize a binary tree.', a: 'Preorder with explicit null markers. Preorder alone is ambiguous without them; with markers the structure is fully recoverable in one pass.' },
      { q: 'Why can a BST degrade to O(n)?', a: 'Inserting already-sorted data produces a single chain. Self-balancing trees (AVL, red-black) rotate to prevent that.' },
    ],
  },

  {
    id: 'tries',
    title: 'Tries (Prefix Trees)',
    summary:
      'A tree keyed by characters, so a prefix is a path. Narrow use, but when prefixes are the question a trie is the expected answer.',
    recognise: [
      'The words prefix, autocomplete, dictionary, starts with.',
      'Repeated lookups against a fixed set of words.',
      'Wildcard matching against a word list.',
      'Word Search II — searching a grid for many words at once.',
    ],
    concepts: [
      { term: 'Structure', detail: 'Each node holds up to 26 children plus an isEnd flag. The path from root to node spells a prefix; the flag marks the ones that are complete words.' },
      { term: 'Why isEnd matters', detail: 'Without it you cannot tell "app is a stored word" from "app is merely a prefix of apple". Nearly every trie bug traces back to this flag.' },
      { term: 'Cost is per-word, not per-dictionary', detail: 'Lookup is O(L) in the length of the query word, independent of how many words are stored. That is the whole selling point over a hash set for prefix queries.' },
      { term: 'Wildcards need DFS', detail: 'A "." that matches any character forces you to branch into every child, so search becomes a DFS rather than a walk. Worst case O(26^L), fine in practice.' },
      { term: 'Trie + grid DFS', detail: 'Word Search II: walk the grid once carrying a trie pointer, instead of running a separate search per word. Prune the moment the current prefix leaves the trie.' },
      { term: 'Memory is the real cost', detail: '26 pointers per node is heavy. A hash map per node saves space on sparse alphabets and costs a little speed.' },
    ],
    complexity: [
      { label: 'Insert a word', time: 'O(L)', space: 'O(L)', note: 'L = word length; new nodes only for new prefixes.' },
      { label: 'Search a word', time: 'O(L)', space: 'O(1)', note: 'Independent of dictionary size.' },
      { label: 'startsWith(prefix)', time: 'O(L)', space: 'O(1)', note: 'Same walk, skip the isEnd check.' },
      { label: 'Wildcard search', time: 'O(26^d)', space: 'O(L)', note: 'd = number of wildcards.' },
      { label: 'Whole structure', time: '—', space: 'O(total chars × 26)', note: 'The reason to use a map per node instead.' },
    ],
    template: {
      caption: 'The whole trie — insert, search, startsWith',
      lang: 'cpp',
      code: `struct Trie {
    struct Node { Node* kids[26] = {}; bool isEnd = false; };
    Node* root = new Node();

    void insert(const string& w) {
        Node* cur = root;
        for (char c : w) {
            int i = c - 'a';
            if (!cur->kids[i]) cur->kids[i] = new Node();
            cur = cur->kids[i];
        }
        cur->isEnd = true;               // without this, prefixes look like words
    }

    Node* walk(const string& w) {
        Node* cur = root;
        for (char c : w) {
            cur = cur->kids[c - 'a'];
            if (!cur) return nullptr;
        }
        return cur;
    }

    bool search(const string& w)      { Node* n = walk(w); return n && n->isEnd; }
    bool startsWith(const string& p)  { return walk(p) != nullptr; }
};`,
    },
    pitfalls: [
      'Forgetting isEnd, so search("app") returns true merely because "apple" was inserted.',
      'Reusing search() for startsWith(). They differ only in the isEnd check, and that difference is the point.',
      'Assuming lowercase a–z without checking the constraints. Mixed case or digits need a bigger array or a map.',
      'Using a trie where a hash set would do. For exact-match lookups only, a hash set is simpler and lighter — the trie earns its place on PREFIX queries.',
      'In Word Search II, not pruning dead trie branches — the search re-explores paths that can no longer spell any word.',
    ],
    recall: [
      { q: 'Cost of searching a word of length L?', a: 'O(L), independent of how many words the trie holds.' },
      { q: 'What does isEnd distinguish?', a: 'A stored word from a mere prefix of one.' },
      { q: 'Only difference between search and startsWith?', a: 'search additionally requires isEnd on the final node.' },
      { q: 'Why does a wildcard force DFS?', a: 'A "." can match any child, so you must branch into all of them.' },
      { q: 'Main drawback of a trie?', a: 'Memory — 26 pointers per node in the array form.' },
      { q: 'When is a hash set better?', a: 'When you only need exact-match lookup and never query by prefix.' },
    ],
    interview: [
      { q: 'Why a trie over a hash set for autocomplete?', a: 'A hash set cannot answer "all words starting with pre" without scanning everything. In a trie that prefix is a single node, and the answers are the subtree beneath it.' },
      { q: 'How does a trie speed up Word Search II?', a: 'One grid DFS carries a trie pointer and matches all words simultaneously, pruning as soon as the current path is not a prefix of anything — instead of a separate grid search per word.' },
      { q: 'How would you store a count of words under each prefix?', a: 'Keep a counter on each node, incremented along the insert path. Then prefix counts are O(L) lookups.' },
    ],
  },

  {
    id: 'heap',
    title: 'Heaps & Priority Queues',
    summary:
      'The smallest or largest thing, repeatedly, without sorting everything. Spotting "k" in the statement is most of the work.',
    recognise: [
      '"Top k", "k largest", "k closest", "kth smallest".',
      '"Running median" or any statistic over a stream.',
      'Repeatedly taking the current best and pushing something back (task scheduling, merging).',
      'Merging k sorted sequences.',
    ],
    concepts: [
      { term: 'A heap is not sorted', detail: 'It guarantees only that the root is the extreme value. The rest is partially ordered — which is exactly why it is cheaper than a full sort.' },
      { term: 'Size the heap to k, not n', detail: 'For "k largest", keep a MIN-heap of size k: push, and if the size exceeds k, pop the smallest. O(n log k) beats sorting\'s O(n log n) and uses O(k) memory.' },
      { term: 'The inversion catches people out', detail: 'k LARGEST needs a MIN-heap (so the weakest survivor is the one you evict). k SMALLEST needs a MAX-heap. Getting this backwards is the single most common heap error.' },
      { term: 'Two heaps for a median', detail: 'A max-heap of the lower half and a min-heap of the upper half, kept balanced within one element. The median is a root, or the mean of both roots.' },
      { term: 'Heapify is O(n)', detail: 'Building a heap from an existing array is O(n), not O(n log n) — the bound comes from most nodes sitting near the leaves, where sift-down is cheap.' },
      { term: 'Merging k lists', detail: 'A heap of the k current heads. Pop the smallest, push its successor. O(N log k) for N total elements.' },
      { term: 'C++ defaults to a max-heap', detail: 'priority_queue<int> is a max-heap. For a min-heap you need priority_queue<int, vector<int>, greater<int>>.' },
    ],
    complexity: [
      { label: 'push / pop', time: 'O(log n)', space: 'O(1)', note: 'Sift up or down the height.' },
      { label: 'peek (top)', time: 'O(1)', space: 'O(1)', note: 'The root.' },
      { label: 'Build from an array (heapify)', time: 'O(n)', space: 'O(1)', note: 'Not O(n log n).' },
      { label: 'k largest of n', time: 'O(n log k)', space: 'O(k)', note: 'Size-k min-heap.' },
      { label: 'Merge k sorted lists', time: 'O(N log k)', space: 'O(k)', note: 'N elements total.' },
      { label: 'Running median', time: 'O(log n) per add', space: 'O(n)', note: 'Two balanced heaps.' },
      { label: 'Heap sort', time: 'O(n log n)', space: 'O(1)', note: 'In-place but not stable.' },
    ],
    template: {
      caption: 'k largest with a size-k min-heap, and the two-heap median',
      lang: 'cpp',
      code: `int kthLargest(vector<int>& a, int k) {
    priority_queue<int, vector<int>, greater<int>> minHeap;   // MIN-heap for k LARGEST
    for (int v : a) {
        minHeap.push(v);
        if ((int)minHeap.size() > k) minHeap.pop();  // evict the weakest survivor
    }
    return minHeap.top();                            // the kth largest
}

struct MedianStream {
    priority_queue<int> lo;                                   // max-heap, lower half
    priority_queue<int, vector<int>, greater<int>> hi;        // min-heap, upper half

    void add(int x) {
        lo.push(x);
        hi.push(lo.top()); lo.pop();                 // funnel through to keep order
        if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }
    }
    double median() {
        return lo.size() > hi.size() ? lo.top() : (lo.top() + hi.top()) / 2.0;
    }
};`,
    },
    pitfalls: [
      'Using a max-heap for "k largest". You need a min-heap of size k so the smallest of your survivors is the one that gets evicted.',
      'Forgetting that C++ priority_queue is a max-heap by default.',
      'Sorting the whole array for a top-k question — O(n log n) when O(n log k) was available.',
      'Expecting heap iteration to be sorted. Only the root is guaranteed.',
      'Searching a heap for an arbitrary element — that is O(n). Heaps answer extremes, not membership.',
      'Letting the two median heaps drift by more than one element. Rebalance on every insert.',
    ],
    recall: [
      { q: 'Which heap for "k largest", and what size?', a: 'A min-heap of size k.' },
      { q: 'Cost of heapifying an existing array?', a: 'O(n).' },
      { q: 'Is a heap sorted?', a: 'No — only the root is guaranteed to be the extreme value.' },
      { q: 'Merging k sorted lists with a heap costs?', a: 'O(N log k) for N total elements.' },
      { q: 'Two-heap median setup?', a: 'Max-heap for the lower half, min-heap for the upper, sizes kept within one.' },
      { q: 'C++ min-heap declaration?', a: 'priority_queue<int, vector<int>, greater<int>>.' },
    ],
    interview: [
      { q: 'Top k frequent elements — heap or bucket sort?', a: 'A heap gives O(n log k). Bucket sort by frequency gives O(n), since frequencies are bounded by n. Mention both; the bucket answer is the stronger one.' },
      { q: 'Why is heapify O(n) and not O(n log n)?', a: 'Sift-down cost is proportional to a node\'s height, and half the nodes are leaves with height 0. Summing height × node-count converges to O(n).' },
      { q: 'Find the kth largest without a heap.', a: 'Quickselect — average O(n), worst case O(n²). Better average performance, worse guarantee, and it mutates the array.' },
    ],
  },

  {
    id: 'backtracking',
    title: 'Backtracking',
    summary:
      'Choose → recurse → un-choose. Write the skeleton once and the variations become parameter changes.',
    recognise: [
      '"All possible", "every combination", "generate all …".',
      'Subsets, permutations, combinations, partitions.',
      'Constraint puzzles: N-Queens, Sudoku, word search in a grid.',
      'Small constraints — n ≤ 20 is an open invitation.',
    ],
    concepts: [
      { term: 'The skeleton', detail: 'Push a choice, recurse, pop it. The pop is the "back" in backtracking, and forgetting it is the number-one bug.' },
      { term: 'The decision tree', detail: 'Each level is one position to fill; each branch is a candidate value. Complexity is (branching factor)^(depth), which is why these are exponential.' },
      { term: 'Subsets vs permutations', detail: 'Subsets: at index i, either take it or skip it, and recurse on i+1 — order does not matter. Permutations: at each level try every unused element — order does matter, so you track used ones.' },
      { term: 'Combinations need a start index', detail: 'Passing start prevents revisiting earlier elements, which is exactly what stops [2,3] and [3,2] both appearing.' },
      { term: 'Pruning is the real skill', detail: 'Cut a branch the moment it cannot lead to a solution — sum already over target, column already attacked. Pruning does not change the big-O but routinely changes minutes into milliseconds.' },
      { term: 'Duplicates', detail: 'Sort first, then at each level skip a candidate equal to its predecessor unless the predecessor was used on this path. That is the standard recipe for distinct results.' },
      { term: 'Grid backtracking', detail: 'Mark the cell as visited before recursing and unmark after. Mutating the board in place and restoring it beats copying it.' },
    ],
    complexity: [
      { label: 'Subsets', time: 'O(n · 2ⁿ)', space: 'O(n)', note: '2ⁿ subsets, O(n) to copy each out.' },
      { label: 'Permutations', time: 'O(n · n!)', space: 'O(n)', note: 'Recursion depth n.' },
      { label: 'Combinations C(n, k)', time: 'O(k · C(n,k))', space: 'O(k)', note: '' },
      { label: 'N-Queens', time: 'O(n!)', space: 'O(n)', note: 'Heavily pruned in practice.' },
      { label: 'Word Search (grid)', time: 'O(m·n·4^L)', space: 'O(L)', note: 'L = word length.' },
    ],
    template: {
      caption: 'One skeleton, two problems — subsets and permutations',
      lang: 'cpp',
      code: `void subsets(int start, vector<int>& a, vector<int>& path, vector<vector<int>>& out) {
    out.push_back(path);                       // every node is a valid subset
    for (int i = start; i < (int)a.size(); i++) {
        path.push_back(a[i]);                  // choose
        subsets(i + 1, a, path, out);          // recurse (i+1 = no revisits)
        path.pop_back();                       // UN-choose
    }
}

void permute(vector<int>& a, vector<bool>& used,
             vector<int>& path, vector<vector<int>>& out) {
    if (path.size() == a.size()) { out.push_back(path); return; }
    for (int i = 0; i < (int)a.size(); i++) {
        if (used[i]) continue;                 // permutations track usage
        used[i] = true;  path.push_back(a[i]);
        permute(a, used, path, out);
        path.pop_back(); used[i] = false;      // undo BOTH
    }
}`,
    },
    pitfalls: [
      'Forgetting to undo the choice, so state leaks into sibling branches.',
      'Undoing only part of the state — popping the path but leaving used[i] true.',
      'Pushing a reference to the working path instead of a copy. All results end up identical (and empty).',
      'Using a start index for permutations, or forgetting it for combinations. Start index means "order does not matter".',
      'Skipping duplicates without sorting first. The dedupe rule assumes equal values are adjacent.',
      'Not pruning. A correct but unpruned N-Queens or Sudoku solver will time out.',
    ],
    recall: [
      { q: 'Three steps of the skeleton?', a: 'Choose, recurse, un-choose.' },
      { q: 'What does passing a start index enforce?', a: 'That order does not matter — no revisiting earlier elements, so combinations rather than permutations.' },
      { q: 'Time complexity of generating all subsets?', a: 'O(n · 2ⁿ).' },
      { q: 'How do you avoid duplicate results with repeated inputs?', a: 'Sort, then skip a candidate equal to its predecessor unless the predecessor is used on the current path.' },
      { q: 'Does pruning change the big-O?', a: 'No, but it routinely changes whether the solution finishes in time.' },
      { q: 'Space complexity of backtracking?', a: 'O(depth) for the recursion and path — output storage is counted separately.' },
    ],
    interview: [
      { q: 'Subsets iteratively?', a: 'Bitmask: for mask 0..2ⁿ−1, include element i when bit i is set. Same complexity, no recursion, and it makes the 2ⁿ obvious.' },
      { q: 'How do you prune N-Queens?', a: 'Track attacked columns and both diagonals in sets or boolean arrays. A diagonal is identified by row + col, an anti-diagonal by row − col — so each check is O(1).' },
      { q: 'When is backtracking the wrong choice?', a: 'When you need a count or an optimum rather than the enumeration itself, and subproblems repeat — that is DP. Backtracking re-explores what DP would have memoised.' },
    ],
  },

  {
    id: 'graphs',
    title: 'Graphs',
    summary:
      'Mostly two traversals. BFS for shortest hops, DFS for connectivity — then topo-sort, union-find and Dijkstra on top. A grid is a graph.',
    recognise: [
      'Explicit nodes and edges, or a grid (cells are nodes, neighbours are edges).',
      '"Shortest path" in an unweighted graph → BFS. Weighted and non-negative → Dijkstra.',
      '"Prerequisites", "ordering", "dependencies" → topological sort.',
      '"Connected components", "islands", "groups", "is it one network?" → DFS or union-find.',
      '"Detect a cycle" — the method differs for directed and undirected graphs.',
    ],
    concepts: [
      { term: 'Representation', detail: 'Adjacency list (vector<vector<int>>) for almost everything — O(V + E) space. Adjacency matrix only for dense graphs or O(1) edge lookups, at O(V²) space.' },
      { term: 'BFS gives shortest hops', detail: 'On an UNWEIGHTED graph, the first time BFS reaches a node it has done so in the fewest edges. That guarantee dies the moment edges have differing weights.' },
      { term: 'Mark visited at PUSH time', detail: 'Marking at pop time lets the same node enter the queue many times before it is processed — which turns O(V+E) into a blowup. Mark when you enqueue.' },
      { term: 'DFS for structure', detail: 'Components, cycles, path existence, flood fill. Recursive is shorter; on a 10⁶-node graph it overflows the stack, so know the iterative form too.' },
      { term: 'Cycles: directed vs undirected', detail: 'Directed needs three colours (unvisited / in-progress / done) — an edge back into an in-progress node is a cycle. Undirected only needs a visited set plus the parent, ignoring the edge you arrived on.' },
      { term: 'Topological sort', detail: "Kahn's algorithm: repeatedly take a node with in-degree 0 and decrement its neighbours. If you emit fewer than V nodes, there is a cycle — which is exactly the Course Schedule answer." },
      { term: 'Union-Find (DSU)', detail: 'Near-O(1) "are these connected?" and "merge these groups" with path compression plus union by rank. The right tool for dynamic connectivity, Kruskal, and redundant-edge detection.' },
      { term: 'Dijkstra', detail: 'BFS with a priority queue, for non-negative weights. Once a node is popped its distance is final. Negative edges break that guarantee — use Bellman-Ford instead.' },
      { term: 'Multi-source BFS', detail: 'Push every source into the queue before starting. Rotting Oranges is one BFS from all rotten cells at once, not one BFS per cell.' },
    ],
    complexity: [
      { label: 'BFS / DFS', time: 'O(V + E)', space: 'O(V)', note: 'Adjacency list.' },
      { label: 'Grid BFS / DFS', time: 'O(m · n)', space: 'O(m · n)', note: 'Every cell visited once.' },
      { label: 'Topological sort (Kahn)', time: 'O(V + E)', space: 'O(V)', note: 'Also detects cycles.' },
      { label: 'Union-Find op', time: 'O(α(n))', space: 'O(n)', note: 'Effectively constant with compression + rank.' },
      { label: 'Dijkstra (binary heap)', time: 'O((V + E) log V)', space: 'O(V)', note: 'Non-negative weights only.' },
      { label: 'Bellman-Ford', time: 'O(V · E)', space: 'O(V)', note: 'Handles negative edges, detects negative cycles.' },
      { label: 'Kruskal MST', time: 'O(E log E)', space: 'O(V)', note: 'Sort edges, union-find to reject cycles.' },
    ],
    template: {
      caption: 'BFS with correct visit-marking, and union-find with both optimisations',
      lang: 'cpp',
      code: `int shortestHops(vector<vector<int>>& adj, int src, int dst) {
    vector<int> dist(adj.size(), -1);
    queue<int> q;
    dist[src] = 0; q.push(src);                 // mark AT PUSH, not at pop
    while (!q.empty()) {
        int u = q.front(); q.pop();
        if (u == dst) return dist[u];
        for (int v : adj[u])
            if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return -1;
}

struct DSU {
    vector<int> parent, rank_;
    DSU(int n) : parent(n), rank_(n, 0) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression
        return parent[x];
    }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                          // already joined = cycle
        if (rank_[a] < rank_[b]) swap(a, b);
        parent[b] = a;
        if (rank_[a] == rank_[b]) rank_[a]++;
        return true;
    }
};`,
    },
    pitfalls: [
      'Marking visited on pop instead of push, so nodes queue up multiple times.',
      'Using BFS for shortest path on a WEIGHTED graph. Fewest edges is not lowest cost.',
      'Using Dijkstra with negative weights. The finality-on-pop guarantee does not hold.',
      'Treating a directed cycle check like an undirected one. Directed needs in-progress state, not just visited.',
      'Recursive DFS on a very large graph — stack overflow. Go iterative.',
      'Union-find without path compression or rank. Without them find degrades toward O(n).',
      'Forgetting that a grid has bounds. Check row and column ranges before indexing.',
    ],
    recall: [
      { q: 'When does BFS give the shortest path?', a: 'Unweighted graphs (or uniform weights).' },
      { q: 'When do you mark a node visited in BFS?', a: 'When you enqueue it, never when you dequeue it.' },
      { q: 'How do you detect a cycle in a DIRECTED graph?', a: 'Three-colour DFS — an edge into an in-progress node is a back edge, hence a cycle.' },
      { q: "Kahn's algorithm detects a cycle how?", a: 'It emits fewer than V nodes.' },
      { q: 'Two optimisations that make union-find near-constant?', a: 'Path compression and union by rank/size.' },
      { q: 'Dijkstra with a binary heap costs?', a: 'O((V + E) log V), non-negative weights only.' },
      { q: 'What is multi-source BFS?', a: 'Seeding the queue with every source before the loop, so all sources expand simultaneously.' },
    ],
    interview: [
      { q: 'Number of Islands — BFS, DFS or union-find?', a: 'All three are O(m·n). DFS is shortest to write, BFS avoids stack overflow on a large grid, union-find is the one to reach for if the grid is being modified between queries.' },
      { q: 'Course Schedule II — what are you really doing?', a: 'A topological sort. If a valid ordering covering every course exists, output it; if the emitted count falls short of V, the prerequisite graph has a cycle and no ordering exists.' },
      { q: 'Why does Dijkstra fail on negative edges?', a: 'It assumes a popped node\'s distance is final. A later negative edge could still improve it, so the assumption — and the answer — breaks.' },
    ],
  },

  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming',
    summary:
      'Recursion where subproblems repeat, so you solve each once. Start from brute force, add memoisation, then flip to a table if you want.',
    recognise: [
      '"Maximum/minimum … ", "how many ways … ", "is it possible to …".',
      'Choices at each step where earlier choices constrain later ones.',
      'A brute-force recursion whose call tree recomputes the same arguments.',
      'Optimal substructure: the best answer is built from best answers to smaller instances.',
    ],
    concepts: [
      { term: 'The reliable route', detail: 'Brute-force recursion → add a memo → (optional) convert to bottom-up. Trying to write the table straight away is how people get stuck; the recursion tells you what the state is.' },
      { term: 'State is everything', detail: 'State = the minimum set of parameters that fully determines the remaining answer. If two different paths reaching the same state can produce different answers, your state is incomplete.' },
      { term: 'Top-down vs bottom-up', detail: 'Memoised recursion only computes reachable states and is easier to derive. Tabulation avoids stack depth and enables space optimisation. Same complexity; pick by constraints.' },
      { term: 'The transition', detail: 'Write it as a formula before coding: dp[i] = max(dp[i−1], dp[i−2] + a[i]) for House Robber. If you cannot state it in one line, you do not yet have the state.' },
      { term: 'Knapsack shapes', detail: '0/1 (each item once) iterates capacity DOWNWARD in the 1-D form; unbounded (reusable items) iterates UPWARD. That loop direction is the entire difference between the two.' },
      { term: 'Space optimisation', detail: 'If dp[i] only reads dp[i−1], keep two rows — or one, iterated in the right direction. O(n·W) becomes O(W).' },
      { term: 'String DP', detail: 'LCS and Edit Distance are 2-D over the two lengths: match → take the diagonal, mismatch → best of the neighbouring cells plus a cost.' },
      { term: 'DP vs greedy', detail: 'Greedy commits to a local choice; DP considers all of them. If a counterexample defeats the greedy rule, you need DP.' },
    ],
    complexity: [
      { label: 'Rule of thumb', time: 'O(states × transitions)', space: 'O(states)', note: 'The one formula worth memorising.' },
      { label: '1-D (Fibonacci, House Robber)', time: 'O(n)', space: 'O(1)', note: 'Rolling variables.' },
      { label: 'Coin Change', time: 'O(n · amount)', space: 'O(amount)', note: 'Unbounded knapsack.' },
      { label: '0/1 Knapsack', time: 'O(n · W)', space: 'O(W)', note: 'Pseudo-polynomial — W is a value, not a size.' },
      { label: 'LCS / Edit Distance', time: 'O(m · n)', space: 'O(min(m,n))', note: 'Two rows suffice.' },
      { label: 'LIS', time: 'O(n log n)', space: 'O(n)', note: 'Patience sorting; the naive DP is O(n²).' },
    ],
    template: {
      caption: 'The same problem three ways — the progression to internalise',
      lang: 'cpp',
      code: `// 1. Brute force: O(2^n), recomputes everything
int rob(vector<int>& a, int i) {
    if (i >= (int)a.size()) return 0;
    return max(rob(a, i + 1), a[i] + rob(a, i + 2));
}

// 2. Memoised: O(n) — each state computed once
int robMemo(vector<int>& a, int i, vector<int>& memo) {
    if (i >= (int)a.size()) return 0;
    if (memo[i] != -1) return memo[i];
    return memo[i] = max(robMemo(a, i + 1, memo), a[i] + robMemo(a, i + 2, memo));
}

// 3. Bottom-up, O(1) space — only the last two states are ever read
int robDP(vector<int>& a) {
    int skip = 0, take = 0;                 // dp[i+1], dp[i+2]
    for (int i = a.size() - 1; i >= 0; i--) {
        int cur = max(skip, a[i] + take);
        take = skip; skip = cur;
    }
    return skip;
}`,
    },
    pitfalls: [
      'Jumping straight to a table without deriving the recursion. You end up guessing the state.',
      'An incomplete state — two paths reaching "the same" state that actually differ. Symptom: the memo returns a wrong answer while the plain recursion is right.',
      'Wrong loop direction in 1-D knapsack. Ascending allows item reuse (unbounded); descending enforces once-only (0/1).',
      'Initialising the memo with a value that is a legal answer. Use −1 or a sentinel that can never be a real result.',
      'Missing or wrong base cases — dp[0] for Coin Change is 0 ways-cost, not infinity.',
      'Calling O(n·W) knapsack "polynomial". It is pseudo-polynomial: W is a magnitude, so the cost is exponential in the input\'s bit length.',
    ],
    recall: [
      { q: 'Two ingredients that make a problem a DP problem?', a: 'Overlapping subproblems and optimal substructure.' },
      { q: 'General complexity formula for DP?', a: 'O(number of states × cost per transition).' },
      { q: 'Loop direction for 0/1 knapsack in 1-D?', a: 'Descending over capacity — ascending would let an item be reused.' },
      { q: 'Route to take when you are stuck?', a: 'Brute-force recursion first, then memoise, then tabulate.' },
      { q: 'LIS in better than O(n²)?', a: 'O(n log n) via patience sorting — binary search into a tails array.' },
      { q: 'Difference between memoisation and tabulation?', a: 'Memoisation is lazy top-down recursion; tabulation is eager bottom-up iteration. Same states, different order.' },
    ],
    interview: [
      { q: 'Walk me through your DP thought process.', a: 'State the brute-force recursion, identify which parameters actually vary, name those as the state, write the transition as one formula, set base cases, then decide top-down or bottom-up from the constraints.' },
      { q: 'Coin Change — why does greedy fail?', a: 'Coins [1,3,4] for amount 6: greedy takes 4+1+1 = three coins, the optimum is 3+3 = two. Locally best is not globally best, so every combination must be considered.' },
      { q: 'Reduce Edit Distance to O(min(m,n)) space.', a: 'Each row depends only on the previous one, so keep two rows and iterate over the shorter dimension. You lose the ability to reconstruct the actual edit sequence.' },
    ],
  },

  {
    id: 'greedy',
    title: 'Greedy',
    summary:
      'Take the locally best option and never reconsider. Easy to code, easy to get wrong — the proof is the work.',
    recognise: [
      '"Minimum number of …" where a sensible ordering exists.',
      'Interval scheduling, activity selection, meeting rooms.',
      'Jump/reach problems — the furthest reachable point is a greedy frontier.',
      'The problem yields to sorting by a single well-chosen key.',
    ],
    concepts: [
      { term: 'When greedy is valid', detail: 'It needs the greedy-choice property (a locally optimal pick is part of some global optimum) and optimal substructure. Without the first, greedy is simply wrong.' },
      { term: 'The exchange argument', detail: 'The standard proof: take any optimal solution, swap in your greedy choice, show it is no worse. If you can make that argument, greedy is safe — and interviewers want to hear it, not just the code.' },
      { term: 'Sorting key is the decision', detail: 'Non-overlapping intervals: sort by END time, because finishing earliest leaves the most room. Sorting by start is the classic wrong answer.' },
      { term: 'Jump Game', detail: 'Sweep once, tracking the furthest index reachable. If your current index ever exceeds that frontier you are stuck. No DP needed.' },
      { term: 'Greedy vs DP', detail: 'Same shape, different commitment. Greedy takes one option; DP evaluates all. If a small counterexample beats your greedy rule, switch to DP.' },
      { term: 'Gas Station', detail: 'If total gas ≥ total cost a solution exists. Whenever the running tank goes negative, no start in that window can work — restart from the next station. One pass.' },
    ],
    complexity: [
      { label: 'Sort then sweep', time: 'O(n log n)', space: 'O(1)', note: 'The sort dominates; the sweep is linear.' },
      { label: 'Single greedy pass', time: 'O(n)', space: 'O(1)', note: 'Jump Game, Gas Station.' },
      { label: 'Greedy with a heap', time: 'O(n log n)', space: 'O(n)', note: 'Task Scheduler, meeting rooms II.' },
      { label: 'Interval scheduling', time: 'O(n log n)', space: 'O(1)', note: 'Sort by end time.' },
    ],
    template: {
      caption: 'Interval scheduling (sort by END) and the one-pass reach frontier',
      lang: 'cpp',
      code: `// Max non-overlapping intervals — sort by END time, not start
int maxNonOverlapping(vector<pair<int,int>>& iv) {
    sort(iv.begin(), iv.end(),
         [](auto& a, auto& b) { return a.second < b.second; });
    int count = 0, lastEnd = INT_MIN;
    for (auto& [s, e] : iv)
        if (s >= lastEnd) { count++; lastEnd = e; }   // finishing early leaves room
    return count;
}

bool canJump(vector<int>& a) {
    int reach = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (i > reach) return false;          // frontier passed, stuck
        reach = max(reach, i + a[i]);
    }
    return true;
}`,
    },
    pitfalls: [
      'Assuming greedy works because it looks right on the sample. Always try to build a counterexample first.',
      'Sorting by start time for interval scheduling. End time is what leaves maximum room.',
      'Using greedy on Coin Change with arbitrary denominations — it is only correct for canonical systems like standard currency.',
      'Not stating the exchange argument. Correct code with no justification reads as a guess.',
      'Reconsidering earlier choices. The moment you need to undo one, it is DP, not greedy.',
    ],
    recall: [
      { q: 'Two properties greedy requires?', a: 'The greedy-choice property and optimal substructure.' },
      { q: 'Sort key for maximum non-overlapping intervals?', a: 'End time, ascending.' },
      { q: 'How do you prove a greedy algorithm?', a: 'An exchange argument — swapping the greedy choice into any optimal solution leaves it no worse.' },
      { q: 'Greedy vs DP in one line?', a: 'Greedy commits to one choice; DP evaluates them all.' },
      { q: 'Jump Game in one pass?', a: 'Track the furthest reachable index; fail if the current index ever passes it.' },
      { q: 'When does greedy Coin Change fail?', a: 'Non-canonical denominations — [1,3,4] for 6 gives 3 coins greedily, 2 optimally.' },
    ],
    interview: [
      { q: 'Prove sorting by end time is optimal.', a: 'Exchange argument: given an optimal set, replace its first interval with the globally earliest-ending compatible one. It cannot conflict with anything the original allowed, so the count is unchanged and the schedule stays valid. Induct.' },
      { q: 'Meeting Rooms II — how many rooms?', a: 'A min-heap of end times: for each meeting, pop rooms that have freed up, then push this end time. The heap\'s peak size is the answer. Equivalently, sweep starts and ends as +1/−1 events and take the running maximum.' },
      { q: 'How do you decide greedy vs DP under time pressure?', a: 'Spend thirty seconds hunting a counterexample to the greedy rule. Find one and it is DP; fail to find one and you can usually sketch the exchange argument that justifies greedy.' },
    ],
  },

  {
    id: 'intervals',
    title: 'Intervals',
    summary:
      'Sort, then sweep once. Small pattern, asked constantly — the only real decision is which endpoint you sort by.',
    recognise: [
      'The input is a list of [start, end] pairs.',
      '"Merge", "overlap", "conflict", "insert into a schedule".',
      'Booking, calendars, meeting rooms.',
      '"Minimum number of X to cover/remove/hit".',
    ],
    concepts: [
      { term: 'The sort decides everything', detail: 'Sort by START to merge overlaps. Sort by END to maximise how many you keep. Getting this backwards produces confident, wrong code.' },
      { term: 'Overlap test', detail: 'Two intervals overlap iff a.start ≤ b.end AND b.start ≤ a.end. Agree with the interviewer whether touching endpoints ([1,2] and [2,3]) count — it changes ≤ to <.' },
      { term: 'Merging', detail: 'Sort by start. If the next start is ≤ the current end, extend the current end to max(end, next.end); otherwise emit and start fresh. The max matters — one interval can be fully contained in another.' },
      { term: 'Insert into a sorted list', detail: 'Three phases: emit everything ending before the new one, absorb everything overlapping it, emit the rest. O(n) with no sort needed.' },
      { term: 'Sweep line', detail: 'Turn each interval into +1 at start and −1 at end, sort the events, and sweep. The running total is concurrent occupancy; its maximum is the room/resource count.' },
      { term: 'Minimum removals', detail: 'Removing the fewest to eliminate overlaps = total minus the maximum you can keep, which is the sort-by-end greedy from the Greedy sheet.' },
    ],
    complexity: [
      { label: 'Merge intervals', time: 'O(n log n)', space: 'O(n)', note: 'The sort dominates.' },
      { label: 'Insert into a sorted list', time: 'O(n)', space: 'O(n)', note: 'Already sorted — no re-sort.' },
      { label: 'Non-overlapping (max keep)', time: 'O(n log n)', space: 'O(1)', note: 'Sort by end, greedy sweep.' },
      { label: 'Sweep line / max concurrency', time: 'O(n log n)', space: 'O(n)', note: '2n events sorted.' },
      { label: 'Min arrows / hitting set', time: 'O(n log n)', space: 'O(1)', note: 'Sort by end, shoot at each end.' },
    ],
    template: {
      caption: 'Merge (sort by start) and max-concurrency (sweep line)',
      lang: 'cpp',
      code: `vector<pair<int,int>> merge(vector<pair<int,int>> iv) {
    sort(iv.begin(), iv.end());                    // by START
    vector<pair<int,int>> out;
    for (auto& cur : iv) {
        if (!out.empty() && cur.first <= out.back().second)
            out.back().second = max(out.back().second, cur.second); // max: nesting
        else
            out.push_back(cur);
    }
    return out;
}

int maxConcurrent(vector<pair<int,int>>& iv) {
    vector<pair<int,int>> ev;                      // (time, +1 start / -1 end)
    for (auto& [s, e] : iv) { ev.push_back({s, 1}); ev.push_back({e, -1}); }
    sort(ev.begin(), ev.end());                    // -1 sorts before +1 at equal time,
    int cur = 0, best = 0;                         // so touching intervals don't clash
    for (auto& [t, d] : ev) { cur += d; best = max(best, cur); }
    return best;
}`,
    },
    pitfalls: [
      'Sorting by start when the question asks how many you can keep. That needs end-time order.',
      'Writing out.back().second = cur.second instead of max(...). A fully nested interval would wrongly shrink the merged range.',
      'Never asking whether touching endpoints count as overlapping. It silently flips a comparison.',
      'Re-sorting an already-sorted list in Insert Interval, turning an O(n) solution into O(n log n).',
      'In the sweep line, ordering +1 before −1 at equal timestamps — that reports a conflict between a meeting ending and the next starting at the same moment.',
    ],
    recall: [
      { q: 'Sort by start or by end — to MERGE?', a: 'By start.' },
      { q: 'Sort by start or by end — to keep the MAXIMUM number?', a: 'By end.' },
      { q: 'Overlap condition for two intervals?', a: 'a.start ≤ b.end and b.start ≤ a.end.' },
      { q: 'Why max() when extending a merged interval?', a: 'The next interval may be entirely nested inside the current one.' },
      { q: 'How does a sweep line find the room count?', a: '+1 at each start, −1 at each end, sorted; the maximum running total is the answer.' },
      { q: 'Minimum removals to remove all overlaps?', a: 'n minus the maximum non-overlapping subset (sort by end, greedy).' },
    ],
    interview: [
      { q: 'Insert Interval without re-sorting.', a: 'Three phases over the already-sorted list: copy intervals ending before the new start, merge everything that overlaps by taking min-start and max-end, then copy the remainder. O(n).' },
      { q: 'How do you handle touching endpoints?', a: 'Ask. For meeting rooms [1,2] and [2,3] do not conflict; for merging ranges they usually should be merged. State your assumption before coding.' },
      { q: 'Minimum arrows to burst all balloons?', a: 'Sort by end, shoot at the first end, skip every balloon that endpoint hits, repeat. Identical greedy to interval scheduling — count the shots rather than the survivors.' },
    ],
  },
];

export default PATTERN_SHEETS;
