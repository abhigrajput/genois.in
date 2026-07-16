import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';
import { getRecentSeenQuestions, seenOverlap, shuffle } from '@/lib/attemptReview';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a DSA examiner for a professional coding platform. 
Generate exactly 25 MCQ questions for a C++ DSA diagnostic test.
Mix of code snippet and theory questions.
All code snippet questions must be in C++. Use STL heavily (vector, map, unordered_map, set, stack, queue, priority_queue, sort, etc.). Never use Java, Python or any other language in code questions.
Return ONLY valid JSON array. No markdown. No explanation. No code blocks. Raw JSON only.`;

const USER_PROMPT = `Generate 25 C++ DSA diagnostic MCQ questions with this exact structure:
- Questions 1-10: C++ code snippet questions (predict output / find error / fill blank)
- Questions 11-25: DSA theory and logic MCQs

Topics to cover: arrays, strings, linked lists, stacks, queues, trees, graphs, dynamic programming, greedy, sorting, recursion

Each question MUST have this exact JSON shape:
{
  "id": 1,
  "type": "code",
  "topic": "arrays",
  "difficulty": "easy",
  "question": "What is the output of this code?",
  "code": "#include<iostream>\\nusing namespace std;\\nint main(){\\n  int a[]={1,2,3};\\n  cout<<a[1];\\n  return 0;\\n}",
  "options": {"A": "1", "B": "2", "C": "3", "D": "Compile Error"},
  "correct": "B",
  "explanation": "Array index 1 refers to the second element which is 2."
}

For theory questions omit the "code" field.
Difficulty spread: 8 easy, 10 medium, 7 hard.
Return a JSON array of exactly 25 question objects.`;

// ---------------------------------------------------------------------------
// DeepSeek fallback via NVIDIA endpoint
// ---------------------------------------------------------------------------
async function askDeepSeekDiagnostic(timeoutMs = 25000, userPrompt = USER_PROMPT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const systemPrompt =
    'You are a DSA examiner for C++. Generate exactly 25 MCQ questions mixing C++ code snippets and theory. ' +
    'Return ONLY valid JSON array. No markdown. No explanation.';

  try {
    const res = await fetch(
      `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-ai/deepseek-r1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 6000,
        }),
      }
    );

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DeepSeek HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content || '';
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    return JSON.parse(raw);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`diag_gen_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();

    // Retake randomization: `diagnostic_questions` is treated as a POOL of
    // recent sets, not a single winner. A random set the user hasn't mostly
    // seen (per their last 2 attempts in test_questions) is served; if every
    // cached set is familiar, a fresh one is generated with an avoid-list and
    // added to the pool. Before: one global set for 7 days → identical
    // retakes with only the order shuffled.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cachedSets } = await supabase
      .from('diagnostic_questions')
      .select('id, questions, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    const seen = await getRecentSeenQuestions({
      userId: payload.userId, attemptTypes: 'dsa_diagnostic', attempts: 2,
    });

    const unseenSets = (cachedSets || []).filter(
      s => Array.isArray(s.questions) && s.questions.length >= 20 && seenOverlap(s.questions, seen) < 0.4
    );
    if (unseenSets.length > 0) {
      const pick = unseenSets[Math.floor(Math.random() * unseenSets.length)];
      return successResponse({ questions: shuffle(pick.questions), cached: true });
    }

    const avoidList = [...seen].slice(0, 15);
    const userPrompt = avoidList.length
      ? `${USER_PROMPT}\n\nIMPORTANT: Do NOT repeat or lightly rephrase any of these questions the student already saw:\n${avoidList.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : USER_PROMPT;

    // --- Primary: Claude with 25-second timeout ---
    let questions = null;
    let source = 'claude';

    try {
      const claudeController = new AbortController();
      const claudeTimer = setTimeout(() => claudeController.abort(), 25000);
      try {
        questions = await askClaudeJSON(userPrompt, SYSTEM_PROMPT, 6000);
        // Unwrap if Claude returned { questions: [...] }
        if (!Array.isArray(questions) && Array.isArray(questions?.questions)) {
          questions = questions.questions;
        }
      } finally {
        clearTimeout(claudeTimer);
      }
    } catch (claudeErr) {
      console.warn('[dsa-diagnostic/generate] Claude failed, trying DeepSeek:', claudeErr.message);
      source = 'deepseek';
    }

    // --- Fallback: DeepSeek via NVIDIA ---
    if (!Array.isArray(questions) || questions.length < 20) {
      try {
        questions = await askDeepSeekDiagnostic(25000, userPrompt);
        if (!Array.isArray(questions) && Array.isArray(questions?.questions)) {
          questions = questions.questions;
        }
      } catch (dsErr) {
        console.error('[dsa-diagnostic/generate] DeepSeek also failed:', dsErr.message);
        console.log('[dsa-diagnostic/generate] Using static fallback questions to prevent 503...');
        questions = [
          {
            "id": 1,
            "type": "code",
            "topic": "arrays",
            "difficulty": "easy",
            "question": "What is the output of this C++ code?",
            "code": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n  vector<int> v = {1, 2, 3};\n  v.push_back(4);\n  cout << v.size() << \" \" << v.capacity();\n  return 0;\n}",
            "options": {"A": "4 4", "B": "4 6", "C": "4 3", "D": "Size 4, Capacity is implementation dependent (usually >= 4)"},
            "correct": "D",
            "explanation": "vector::size returns the number of elements (4), whereas capacity is the total allocated memory which is usually dynamically doubled or kept >= size."
          },
          {
            "id": 2,
            "type": "code",
            "topic": "pointers",
            "difficulty": "medium",
            "question": "What is the output of this C++ code snippet?",
            "code": "#include <iostream>\nusing namespace std;\nint main() {\n  int x = 10;\n  int *p = &x;\n  int *&r = p;\n  *r = 20;\n  cout << x;\n  return 0;\n}",
            "options": {"A": "10", "B": "20", "C": "Compiler Error", "D": "Runtime Error"},
            "correct": "B",
            "explanation": "r is a reference to the pointer p. Modifying *r changes the value at the address p points to, which is x. So x becomes 20."
          },
          {
            "id": 3,
            "type": "theory",
            "topic": "complexity",
            "difficulty": "easy",
            "question": "What is the worst-case time complexity of lookup in a balanced Binary Search Tree (BST)?",
            "options": {"A": "O(1)", "B": "O(log n)", "C": "O(n)", "D": "O(n log n)"},
            "correct": "B",
            "explanation": "In a balanced BST like AVL or Red-Black Tree, lookup takes O(log n) time because the height is bounded by log(n)."
          },
          {
            "id": 4,
            "type": "theory",
            "topic": "complexity",
            "difficulty": "medium",
            "question": "What is the worst-case time complexity of Quick Sort?",
            "options": {"A": "O(n)", "B": "O(n log n)", "C": "O(n²)", "D": "O(2ⁿ)"},
            "correct": "C",
            "explanation": "Worst case for Quick Sort is O(n²) when the pivot chosen is always the smallest or largest element (e.g., sorted array with naive pivot selection)."
          },
          {
            "id": 5,
            "type": "code",
            "topic": "sorting",
            "difficulty": "hard",
            "question": "What is the output of using std::sort with a custom comparator returning true for greater-than elements?",
            "code": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nbool cmp(int a, int b) { return a > b; }\nint main() {\n  vector<int> v = {4, 1, 3};\n  sort(v.begin(), v.end(), cmp);\n  cout << v[0];\n  return 0;\n}",
            "options": {"A": "1", "B": "3", "C": "4", "D": "Compile Error"},
            "correct": "C",
            "explanation": "The comparator cmp orders the elements in descending order. Therefore, the vector becomes {4, 3, 1} and v[0] is 4."
          },
          {
            "id": 6,
            "type": "theory",
            "topic": "stacks",
            "difficulty": "easy",
            "question": "Which data structure is primary for evaluating postfix arithmetic expressions?",
            "options": {"A": "Queue", "B": "Stack", "C": "Tree", "D": "Deque"},
            "correct": "B",
            "explanation": "A stack is used because operands are pushed onto it, and operators pop the top elements to evaluate and push the result."
          },
          {
            "id": 7,
            "type": "theory",
            "topic": "queues",
            "difficulty": "easy",
            "question": "A standard queue operates on which principle?",
            "options": {"A": "LIFO", "B": "FIFO", "C": "Random Access", "D": "Priority-based"},
            "correct": "B",
            "explanation": "Standard queues operate on First-In-First-Out (FIFO) where elements are enqueued at the back and dequeued from the front."
          },
          {
            "id": 8,
            "type": "theory",
            "topic": "linkedlist",
            "difficulty": "medium",
            "question": "What is the best time complexity to detect a cycle in a linked list using Floyd's Cycle-Finding Algorithm?",
            "options": {"A": "O(1) space, O(n) time", "B": "O(n) space, O(n) time", "C": "O(1) space, O(1) time", "D": "O(log n) space, O(n) time"},
            "correct": "A",
            "explanation": "Floyd's algorithm (tortoise and hare) uses two pointers, which requires O(1) auxiliary space and O(n) time to traverse the list."
          },
          {
            "id": 9,
            "type": "theory",
            "topic": "trees",
            "difficulty": "medium",
            "question": "Which traversal of a Binary Search Tree (BST) yields elements in sorted ascending order?",
            "options": {"A": "Preorder", "B": "Postorder", "C": "Inorder", "D": "Level-order"},
            "correct": "C",
            "explanation": "Inorder traversal visits the left subtree, then the root, then the right subtree, which naturally sorts a BST."
          },
          {
            "id": 10,
            "type": "theory",
            "topic": "graphs",
            "difficulty": "hard",
            "question": "What is the time complexity of Dijkstra's algorithm using an adjacency list and a binary heap?",
            "options": {"A": "O(V²)", "B": "O(V + E)", "C": "O(E log V)", "D": "O(V log E)"},
            "correct": "C",
            "explanation": "Using a binary heap priority queue, Dijkstra's algorithm takes O((V + E) log V), which simplifies to O(E log V) for connected graphs."
          },
          {
            "id": 11,
            "type": "theory",
            "topic": "recursion",
            "difficulty": "easy",
            "question": "What happens if a recursive function does not have a base case?",
            "options": {"A": "It executes perfectly", "B": "Stack Overflow (Infinite Recursion)", "C": "Compilation Error", "D": "Nothing"},
            "correct": "B",
            "explanation": "Without a basecase, the recursive function keeps pushing call frames to the stack until it runs out of memory, causing stack overflow."
          },
          {
            "id": 12,
            "type": "theory",
            "topic": "hashing",
            "difficulty": "medium",
            "question": "In hash tables, what is 'chaining' used for?",
            "options": {"A": "Increasing key size", "B": "Handling collisions", "C": "Caching data", "D": "Sorting values"},
            "correct": "B",
            "explanation": "Chaining handles collisions by linking all colliding items in a linked list at that specific bucket index."
          },
          {
            "id": 13,
            "type": "theory",
            "topic": "dp",
            "difficulty": "hard",
            "question": "Dynamic Programming requires which properties to be applicable?",
            "options": {"A": "Overlapping subproblems and Optimal substructure", "B": "Greedy choices and Sorting", "C": "LIFO order and Hash indexes", "D": "Graph connectivity"},
            "correct": "A",
            "explanation": "DP requires overlapping subproblems (so we can memoize) and optimal substructure (optimal solution composed of optimal subproblem solutions)."
          },
          {
            "id": 14,
            "type": "theory",
            "topic": "greedy",
            "difficulty": "medium",
            "question": "Which of these is a typical greedy algorithm problem?",
            "options": {"A": "0/1 Knapsack", "B": "Fractional Knapsack", "C": "Matrix Chain Multiplication", "D": "LCS"},
            "correct": "B",
            "explanation": "Fractional Knapsack is solved greedily by sorting items by value/weight ratio. 0/1 Knapsack requires DP."
          },
          {
            "id": 15,
            "type": "code",
            "topic": "strings",
            "difficulty": "easy",
            "question": "What does std::string::substr(1, 3) return for \"leetcode\"?",
            "options": {"A": "eet", "B": "eetc", "C": "lee", "D": "eetco"},
            "correct": "A",
            "explanation": "string::substr(pos, len) starts at index 1 ('e') and takes 3 characters, yielding 'eet'."
          },
          {
            "id": 16,
            "type": "theory",
            "topic": "complexity",
            "difficulty": "medium",
            "question": "What is the time complexity of building a heap from an array of n elements?",
            "options": {"A": "O(1)", "B": "O(n)", "C": "O(n log n)", "D": "O(log n)"},
            "correct": "B",
            "explanation": "Building a heap (min/max heapify bottom-up) takes O(n) time mathematically using linear summation of node heights."
          },
          {
            "id": 17,
            "type": "theory",
            "topic": "trees",
            "difficulty": "hard",
            "question": "What is the height balance factor of any node in an AVL tree?",
            "options": {"A": "Exactly 0", "B": "At most 1", "C": "Between -1 and +1 inclusive", "D": "Less than 2"},
            "correct": "C",
            "explanation": "AVL trees are balanced by maintaining a height balance factor of -1, 0, or +1 at every node."
          },
          {
            "id": 18,
            "type": "theory",
            "topic": "graphs",
            "difficulty": "medium",
            "question": "Which algorithm is used to find all-pairs shortest paths in a weighted graph?",
            "options": {"A": "Dijkstra", "B": "Prim", "C": "Kruskal", "D": "Floyd-Warshall"},
            "correct": "D",
            "explanation": "Floyd-Warshall is a dynamic programming algorithm that finds all-pairs shortest paths in O(V³) time."
          },
          {
            "id": 19,
            "type": "theory",
            "topic": "sorting",
            "difficulty": "medium",
            "question": "Which of these sorting algorithms is naturally stable?",
            "options": {"A": "Quick Sort", "B": "Heap Sort", "C": "Merge Sort", "D": "Selection Sort"},
            "correct": "C",
            "explanation": "Merge Sort preserves the relative order of equal elements, making it highly stable."
          },
          {
            "id": 20,
            "type": "theory",
            "topic": "heaps",
            "difficulty": "easy",
            "question": "What is the time complexity to extract the minimum element from a Min-Heap of size n?",
            "options": {"A": "O(1)", "B": "O(log n)", "C": "O(n)", "D": "O(n log n)"},
            "correct": "B",
            "explanation": "Locating minimum is O(1), but removing it and restoring heap property (heapify down) takes O(log n)."
          },
          {
            "id": 21,
            "type": "theory",
            "topic": "trie",
            "difficulty": "hard",
            "question": "What is the time complexity to insert a word of length m into a Trie?",
            "options": {"A": "O(1)", "B": "O(m)", "C": "O(n)", "D": "O(m log n)"},
            "correct": "B",
            "explanation": "Inserting into a Trie requires traversing each character of the word, taking O(m) operations where m is the word length."
          },
          {
            "id": 22,
            "type": "theory",
            "topic": "backtracking",
            "difficulty": "medium",
            "question": "Which algorithm approach does the N-Queens problem solve with?",
            "options": {"A": "Greedy", "B": "Dynamic Programming", "C": "Backtracking", "D": "Divide and Conquer"},
            "correct": "C",
            "explanation": "N-Queens uses backtracking to try placements and backtrack immediately upon detecting attacking configurations."
          },
          {
            "id": 23,
            "type": "theory",
            "topic": "complexity",
            "difficulty": "easy",
            "question": "Which function grows the fastest as n approaches infinity?",
            "options": {"A": "n log n", "B": "2ⁿ", "C": "n³", "D": "n!"},
            "correct": "D",
            "explanation": "n! (factorial) grows faster than 2ⁿ (exponential) or any polynomial function."
          },
          {
            "id": 24,
            "type": "theory",
            "topic": "graphs",
            "difficulty": "medium",
            "question": "Which traversal strategy uses a Queue?",
            "options": {"A": "Depth First Search (DFS)", "B": "Breadth First Search (BFS)", "C": "Inorder traversal", "D": "Preorder traversal"},
            "correct": "B",
            "explanation": "BFS uses a Queue to visit nodes level-by-level, whereas DFS uses a Stack."
          },
          {
            "id": 25,
            "type": "theory",
            "topic": "linkedlist",
            "difficulty": "medium",
            "question": "What is the time complexity of deleting a node from a Doubly Linked List when a pointer to that node is given?",
            "options": {"A": "O(1)", "B": "O(n)", "C": "O(log n)", "D": "O(n log n)"},
            "correct": "A",
            "explanation": "In a Doubly Linked List, we can access both prev and next nodes from the given pointer directly, making deletion O(1)."
          }
        ];
      }
    }

    if (!Array.isArray(questions) || questions.length < 20) {
      return errorResponse('Question generation temporarily unavailable. Try again in 30 seconds.', 503);
    }

    // Keep exactly 25
    questions = questions.slice(0, 25).map((q, i) => ({ ...q, id: i + 1 }));

    console.log(`[dsa-diagnostic/generate] Generated via ${source}`);

    // Cache in Supabase
    await supabase.from('diagnostic_questions').insert({ questions });

    return successResponse({ questions, cached: false, source });
  } catch (error) {
    console.error('[dsa-diagnostic/generate] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
