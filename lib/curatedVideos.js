/**
 * Curated topic → video map. THE hand-authored list, in the same spirit as
 * lib/dsaPatterns.js and lib/skillTaxonomy.js: static code, no database, no
 * network, no AI call at runtime.
 *
 * WHY CURATION AND NOT SEARCH
 * ---------------------------
 * Every "watch" task used to hand the student a `youtube.com/results?search_query=…`
 * link in a new tab. That does the student's job badly and does ours not at all:
 * they leave the product, land on unvetted results, and still have to pick.
 *
 * The alternative that does NOT work is asking a model for "the best video on
 * trees". Models emit 11-character ids that are syntactically perfect and point
 * at nothing. This repo used to carry a hand-maintained "dead link → live link"
 * table (deleted along with this change) that mapped dead ids onto OTHER dead
 * ids, and whose entries included `yVd3yYh_3Pw` and `C46QfTjVCnu` — off-by-a-
 * character ghosts of the real `yVdKa8dnKiE` and `C46QfTjVCNU` below. That is
 * exactly what a plausible-looking invented id costs you.
 *
 * So every id in this file was sourced from YouTube's own search results and
 * then checked twice before landing here:
 *   1. oEmbed 200 — the video exists. `title` and `channel` below are the exact
 *      strings oEmbed returned, so they are YouTube's words, not ours.
 *   2. /embed/<id> returns playabilityStatus OK — the owner permits framing, so
 *      the student gets a player and not an "unavailable" box.
 * All 68 entries passed both. Re-run scripts/verify-curated-videos.mjs before
 * adding or changing an id; a link that fails is removed, never guessed at.
 *
 * IF A TOPIC HAS NO ENTRY, IT GETS NO VIDEO. Callers render nothing. A gap in
 * this list is a gap we own — it is not a licence to fall back to a search page.
 */

// Resolution order for a free-text topic, most specific first.
const NORMALISE = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();

export const CURATED_VIDEOS = [
  {
    slug: 'dsa-complexity',
    id: 'FPu9Uld7W-E',
    title: 'Time and Space Complexity - Strivers A2Z DSA Course',
    channel: 'take U forward',
    pattern: 'foundations',
    sheets: ['foundations'],
    skills: ['dsa.complexity'],
    match: ['time complexity', 'space complexity', 'big o', 'big-o', 'asymptotic', 'complexity analysis'],
  },
  {
    slug: 'dsa-recursion',
    id: 'yVdKa8dnKiE',
    title: 'Re 1. Introduction to Recursion | Recursion Tree | Stack Space | Strivers A2Z DSA Course',
    channel: 'take U forward',
    skills: ['dsa.recursion'],
    match: ['recursion', 'recursive', 'recurrence', 'base case', 'factorial', 'fibonacci'],
  },
  {
    slug: 'dsa-bit-manipulation',
    id: 'qQd-ViW7bfk',
    title: 'L1. Introduction to Bit Manipulation | 1\'s 2\'s Compliment | Bit Operators',
    channel: 'take U forward',
    skills: ['dsa.bit-manipulation', 'dsa.math'],
    match: ['bit manipulation', 'bitwise', 'bitmask', 'xor'],
  },
  {
    slug: 'dsa-arrays',
    id: '8wmn7k1TTcI',
    title: 'Array Data Structure - Part1 | DSA Series by Shradha Khapra Ma\'am | C++',
    channel: 'Apna College',
    pattern: 'arrays-hashing',
    sheets: ['arrays-hashing'],
    skills: ['dsa.arrays'],
    match: ['array', 'arrays', 'subarray', 'kadane', '2d array'],
  },
  {
    slug: 'dsa-strings',
    id: 'dSRFgEs3a6A',
    title: 'Valid Palindrome & Remove all Occurrences | Strings Part 2 | DSA Placement Series',
    channel: 'Apna College',
    skills: ['dsa.strings'],
    match: ['string', 'strings', 'palindrome', 'anagram', 'substring'],
  },
  {
    slug: 'dsa-two-pointers',
    id: '9kdHxplyl5I',
    title: 'L1. Introduction to Sliding Window and 2 Pointers | Templates | Patterns',
    channel: 'take U forward',
    pattern: 'two-pointers',
    sheets: ['two-pointers'],
    skills: ['dsa.two-pointers'],
    match: ['two pointer', 'two pointers', '2 pointers', 'fast and slow'],
  },
  {
    slug: 'dsa-sliding-window',
    id: 'EHCGAZBbB88',
    title: 'Sliding Window Introduction Identification And Types',
    channel: 'Aditya Verma',
    pattern: 'sliding-window',
    sheets: ['sliding-window'],
    skills: ['dsa.sliding-window'],
    match: ['sliding window'],
  },
  {
    slug: 'dsa-prefix-sum',
    id: 'yuws7YK0Yng',
    title: 'Prefix Sum in 4 minutes | LeetCode Pattern',
    channel: 'AlgoMasterIO',
    skills: ['dsa.prefix-sum'],
    match: ['prefix sum', 'range sum', 'cumulative sum'],
  },
  {
    slug: 'dsa-sorting',
    id: '1jCFUv-Xlqo',
    title: 'Sorting Algorithms | Bubble Sort, Selection Sort & Insertion Sort | DSA Series by Shradha Ma\'am',
    channel: 'Apna College',
    skills: ['dsa.sorting'],
    match: ['sorting', 'sort', 'bubble sort', 'selection sort', 'insertion sort', 'merge sort', 'quick sort'],
  },
  {
    slug: 'dsa-binary-search',
    id: 'MHf6awe89xw',
    title: 'BS-1. Binary Search Introduction | Real Life Example | Iterative | Recursive | Overflow Cases',
    channel: 'take U forward',
    pattern: 'binary-search',
    sheets: ['binary-search'],
    skills: ['dsa.binary-search'],
    match: ['binary search', 'lower bound', 'upper bound', 'search on answer'],
  },
  {
    slug: 'dsa-matrix',
    id: '3Zv-s9UUrFM',
    title: 'Spiral Traversal of a Matrix | Spiral Matrix',
    channel: 'take U forward',
    skills: ['dsa.matrix'],
    match: ['matrix', 'spiral', 'rotate image', 'grid'],
  },
  {
    slug: 'dsa-intervals',
    id: 'IexN60k62jo',
    title: 'Merge Overlapping Intervals | Brute, Optimal with Precise TC analysis',
    channel: 'take U forward',
    pattern: 'intervals',
    sheets: ['intervals'],
    skills: ['dsa.intervals'],
    match: ['interval', 'intervals', 'merge intervals', 'meeting rooms'],
  },
  {
    slug: 'dsa-hashing',
    id: 'KEs5UyBJ39g',
    title: 'Hashing | Maps | Time Complexity | Collisions | Division Rule of Hashing | Strivers A2Z DSA Course',
    channel: 'take U forward',
    skills: ['dsa.hashing', 'dsa.frequency-counting'],
    match: ['hashing', 'hash map', 'hashmap', 'hash table', 'frequency count', 'frequency counter', 'hash set', 'hash sets', 'unordered_map'],
  },
  {
    slug: 'dsa-linked-list',
    id: 'Nq7ok-OyEpg',
    title: 'L1. Introduction to LinkedList | Traversal | Length | Search an Element',
    channel: 'take U forward',
    pattern: 'linked-list',
    sheets: ['linked-list'],
    skills: ['dsa.linked-list'],
    match: ['linked list', 'linkedlist', 'reverse linked list', 'merge sorted lists', 'merge sorted', 'node'],
  },
  {
    slug: 'dsa-cycle-detection',
    id: 'gBTe7lFR3vc',
    title: 'Linked List Cycle - Floyd\'s Tortoise and Hare - Leetcode 141 - Python',
    channel: 'NeetCode',
    skills: ['dsa.cycle-detection'],
    match: ['cycle detection', 'detect cycle', 'floyd', 'tortoise'],
  },
  {
    slug: 'dsa-stack',
    id: 'tqQ5fTamIN4',
    title: 'L1. Introduction to Stack and Queue | Implementation using Data Structures',
    channel: 'take U forward',
    pattern: 'stack',
    sheets: ['stack'],
    skills: ['dsa.stack'],
    match: ['stack', 'balanced parentheses', 'valid parentheses'],
  },
  {
    slug: 'dsa-queue',
    id: 'va_6RmSrKCg',
    title: 'Complete Queue Data Structure | in One Shot | Java Placement Course',
    channel: 'Apna College',
    skills: ['dsa.queue'],
    match: ['queue', 'deque', 'circular queue', 'enqueue'],
  },
  {
    slug: 'dsa-monotonic-stack',
    id: 'Dq_ObZwTY_Q',
    title: 'Monotonic Stack Data Structure Explained',
    channel: 'AlgoMonster',
    skills: ['dsa.monotonic-stack'],
    match: ['monotonic stack', 'next greater', 'next smaller'],
  },
  {
    slug: 'dsa-binary-tree',
    id: '_ANrF3FJm7I',
    title: 'L1. Introduction to Trees | Types of Trees',
    channel: 'take U forward',
    pattern: 'trees',
    sheets: ['trees'],
    skills: ['dsa.binary-tree'],
    match: ['binary tree', 'tree', 'trees', 'height of tree', 'diameter of tree', 'lca'],
  },
  {
    slug: 'dsa-tree-traversal',
    id: 'XRcC7bAtL3c',
    title: 'Lec-56: Preorder, Inorder and Postorder in 5 minute | Tree Traversal | Easiest and Shortest Trick',
    channel: 'Gate Smashers',
    skills: ['dsa.tree-traversal'],
    match: ['tree traversal', 'inorder', 'preorder', 'postorder', 'level order'],
  },
  {
    slug: 'dsa-bst',
    id: 'p7-9UvDQZ3w',
    title: 'L39. Introduction to Binary Search Tree | BST',
    channel: 'take U forward',
    skills: ['dsa.bst'],
    match: ['binary search tree', 'bst', 'avl'],
  },
  {
    slug: 'dsa-heap',
    id: 'Qf-TDPr0nYw',
    title: 'Introduction to Heap Data Structure + Priority Queue + Heapsort Tutorial',
    channel: 'Kunal Kushwaha',
    pattern: 'heap',
    sheets: ['heap'],
    skills: ['dsa.heap'],
    match: ['heap', 'priority queue', 'heapify', 'kth largest', 'kth smallest', 'top k'],
  },
  {
    slug: 'dsa-trie',
    id: 'dBGUmUQhjaM',
    title: 'L1. Implement TRIE | INSERT | SEARCH | STARTSWITH',
    channel: 'take U forward',
    pattern: 'tries',
    sheets: ['tries'],
    skills: ['dsa.trie'],
    match: ['trie', 'tries', 'prefix tree'],
  },
  {
    slug: 'dsa-segment-tree',
    id: 'ciHThtTVNto',
    title: 'Segment Trees Tutorial | Range Queries | Interview Questions',
    channel: 'Kunal Kushwaha',
    skills: ['dsa.segment-tree'],
    match: ['segment tree', 'fenwick', 'binary indexed tree', 'range query'],
  },
  {
    slug: 'dsa-graph-basics',
    id: 'M3_pLsDdeuU',
    title: 'G-1. Introduction to Graph | Types | Different Conventions Used',
    channel: 'take U forward',
    pattern: 'graphs',
    sheets: ['graphs'],
    skills: ['dsa.graph-basics'],
    match: ['graph', 'graphs', 'adjacency list', 'adjacency matrix'],
  },
  {
    slug: 'dsa-bfs',
    id: '-tgVpUgsQ5k',
    title: 'G-5. Breadth-First Search (BFS) | C++ and Java | Traversal Technique in Graphs',
    channel: 'take U forward',
    skills: ['dsa.bfs'],
    match: ['bfs', 'breadth first', 'breadth-first'],
  },
  {
    slug: 'dsa-dfs',
    id: 'Qzf1a--rhp8',
    title: 'G-6. Depth-First Search (DFS) | C++ and Java | Traversal Technique in Graphs',
    channel: 'take U forward',
    skills: ['dsa.dfs'],
    match: ['dfs', 'depth first', 'depth-first'],
  },
  {
    slug: 'dsa-topological-sort',
    id: '5lZ0iJMrUMk',
    title: 'G-21. Topological Sort Algorithm | DFS',
    channel: 'take U forward',
    skills: ['dsa.topological-sort'],
    match: ['topological sort', 'topological', 'kahn', 'course schedule'],
  },
  {
    slug: 'dsa-shortest-path',
    id: 'V6H1qAeB-l4',
    title: 'G-32. Dijkstra\'s Algorithm - Using Priority Queue - C++ and Java - Part 1',
    channel: 'take U forward',
    skills: ['dsa.shortest-path'],
    match: ['shortest path', 'dijkstra', 'bellman ford', 'bellman-ford', 'floyd warshall'],
  },
  {
    slug: 'dsa-union-find',
    id: 'aBxjDBC4M1U',
    title: 'G-46. Disjoint Set | Union by Rank | Union by Size | Path Compression',
    channel: 'take U forward',
    skills: ['dsa.union-find'],
    match: ['union find', 'disjoint set', 'dsu', 'union-find'],
  },
  {
    slug: 'dsa-mst',
    id: 'ZSPjZuZWCME',
    title: 'G-44. Minimum Spanning Tree - Theory',
    channel: 'take U forward',
    skills: ['dsa.mst'],
    match: ['minimum spanning tree', 'spanning tree', 'mst', 'prim', 'kruskal'],
  },
  {
    slug: 'dsa-backtracking',
    id: 'i05Ju7AftcM',
    title: 'L14. N-Queens | Leetcode Hard | Backtracking',
    channel: 'take U forward',
    pattern: 'backtracking',
    sheets: ['backtracking'],
    skills: ['dsa.backtracking'],
    match: ['backtracking', 'n-queens', 'n queens', 'sudoku', 'permutations', 'subsets'],
  },
  {
    slug: 'dsa-greedy',
    id: 'ARvQcqJ_-NY',
    title: '3. Greedy Method -  Introduction',
    channel: 'Abdul Bari',
    pattern: 'greedy',
    sheets: ['greedy'],
    skills: ['dsa.greedy'],
    match: ['greedy', 'job scheduling', 'activity selection', 'fractional knapsack'],
  },
  {
    slug: 'dsa-dynamic-programming',
    id: 'tyB0ztf0DNY',
    title: 'DP 1. Introduction to Dynamic Programming | Memoization | Tabulation | Space Optimization Techniques',
    channel: 'take U forward',
    pattern: 'dynamic-programming',
    sheets: ['dynamic-programming'],
    skills: ['dsa.dynamic-programming'],
    match: ['dynamic programming', 'dp', 'memoization', 'tabulation', 'climbing stairs', 'house robber'],
  },
  {
    slug: 'dsa-dp-knapsack',
    id: 'GqOmJHQZivw',
    title: 'DP 19. 0/1 Knapsack | Recursion to Single Array Space Optimised Approach | DP on Subsequences',
    channel: 'take U forward',
    skills: ['dsa.dp-knapsack'],
    match: ['knapsack', 'subset sum', 'partition equal subset', 'coin change'],
  },
  {
    slug: 'dsa-dp-strings',
    id: 'NPZn9jBrX8U',
    title: 'Dp 25. Longest Common Subsequence | Top Down | Bottom-Up | Space Optimised | DP on Strings',
    channel: 'take U forward',
    skills: ['dsa.dp-strings'],
    match: ['longest common subsequence', 'lcs', 'edit distance', 'dp on strings'],
  },
  {
    slug: 'dsa-divide-conquer',
    id: '2Rr2tW9zvRg',
    title: '2 Divide And Conquer',
    channel: 'Abdul Bari',
    skills: ['dsa.divide-conquer', 'dsa.problem-solving'],
    match: ['divide and conquer', 'divide & conquer'],
  },
  {
    slug: 'cs-oop-pillars',
    id: 'mlIUKyZIUUU',
    title: 'OOPs Tutorial in One Shot | Object Oriented Programming | in C++ Language | for Placement Interviews',
    channel: 'Apna College',
    sheets: ['oop-pillars'],
    skills: ['cs.oop-encapsulation', 'cs.oop-inheritance', 'cs.oop-polymorphism', 'cs.oop-abstraction'],
    match: ['oop', 'object oriented', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
  },
  {
    slug: 'cs-oop-solid',
    id: 'kF7rQmSRlq0',
    title: 'SOLID Principles: Do You Really Understand Them?',
    channel: 'Alex Hyett',
    sheets: ['oop-design'],
    skills: ['cs.oop-solid'],
    match: ['solid', 'solid principles', 'single responsibility', 'dependency inversion'],
  },
  {
    slug: 'cs-design-patterns',
    id: 'tv-_1er1mWI',
    title: '10 Design Patterns Explained in 10 Minutes',
    channel: 'Fireship',
    skills: ['cs.design-patterns'],
    match: ['design pattern', 'design patterns', 'singleton', 'factory pattern', 'observer pattern'],
  },
  {
    slug: 'cs-os-processes',
    id: '2dJdHMpCLIg',
    title: 'L-1.5: Process States in Operating System| Schedulers(Long term,Short term,Medium term)',
    channel: 'Gate Smashers',
    sheets: ['os-processes-threads'],
    skills: ['cs.os-processes'],
    match: ['process', 'processes', 'process state', 'pcb', 'fork'],
  },
  {
    slug: 'cs-os-threads',
    id: 'ITc09gOrqZk',
    title: 'L-1.11: Process Vs Threads in Operating System',
    channel: 'Gate Smashers',
    skills: ['cs.os-threads'],
    match: ['thread', 'threads', 'multithreading', 'process vs thread'],
  },
  {
    slug: 'cs-os-scheduling',
    id: 'zFnrUVqtiOY',
    title: 'L-2.1: Process Scheduling Algorithms (Preemption Vs Non-Preemption) | CPU Scheduling in OS',
    channel: 'Gate Smashers',
    sheets: ['os-scheduling'],
    skills: ['cs.os-scheduling'],
    match: ['cpu scheduling', 'scheduling', 'round robin', 'fcfs', 'shortest job first'],
  },
  {
    slug: 'cs-os-sync-deadlock',
    id: 'rWFH6PLOIEI',
    title: 'L-4.1: DEADLOCK concept | Example | Necessary condition | Operating System',
    channel: 'Gate Smashers',
    sheets: ['os-sync-deadlock'],
    skills: ['cs.os-synchronization', 'cs.os-deadlock'],
    match: ['deadlock', 'synchronization', 'semaphore', 'mutex', 'critical section', 'banker\'s algorithm'],
  },
  {
    slug: 'cs-os-memory',
    id: '6c-mOFZwP_8',
    title: 'L-5.9: What is Paging | Memory management |  Operating System',
    channel: 'Gate Smashers',
    sheets: ['os-memory'],
    skills: ['cs.os-memory', 'cs.os-virtual-memory', 'cs.os-file-systems'],
    match: ['paging', 'virtual memory', 'memory management', 'segmentation', 'page fault', 'thrashing'],
  },
  {
    slug: 'cs-db-sql-joins',
    id: '0OQJDd3QqQM',
    title: 'SQL JOINS Tutorial for beginners | Practice SQL Queries using JOINS - Part 1',
    channel: 'techTFQ',
    sheets: ['db-sql-joins'],
    skills: ['cs.db-sql', 'cs.db-joins'],
    match: ['sql', 'join', 'joins', 'inner join', 'left join', 'group by', 'query'],
  },
  {
    slug: 'cs-db-design',
    id: 'GFQaEYEc8_8',
    title: 'Learn Database Normalization - 1NF, 2NF, 3NF, 4NF, 5NF',
    channel: 'Decomplexify',
    sheets: ['db-design'],
    skills: ['cs.db-normalization', 'cs.db-indexing'],
    match: ['normalization', 'normal form', '1nf', '2nf', '3nf', 'bcnf', 'schema design', 'er diagram'],
  },
  {
    slug: 'cs-db-indexing',
    id: '3G293is403I',
    title: 'How do indexes make databases read faster?',
    channel: 'Arpit Bhayani',
    skills: ['cs.db-indexing'],
    match: ['indexing', 'database index', 'b-tree index', 'b+ tree'],
  },
  {
    slug: 'cs-db-transactions',
    id: '-GS0OxFJsYQ',
    title: 'Lec-88: ACID Properties of a Transaction | Database Management System',
    channel: 'Gate Smashers',
    sheets: ['db-transactions'],
    skills: ['cs.db-transactions', 'cs.db-concurrency'],
    match: ['acid', 'transaction', 'transactions', 'isolation level', 'concurrency control', 'deadlock in dbms'],
  },
  {
    slug: 'cs-db-nosql',
    id: 'Q5aTUc7c4jg',
    title: 'SQL vs. NoSQL: What\'s the difference?',
    channel: 'IBM Technology',
    sheets: ['db-nosql'],
    skills: ['cs.db-nosql'],
    match: ['nosql', 'sql vs nosql', 'mongodb', 'document database', 'key value store'],
  },
  {
    slug: 'cs-net-models',
    id: '0y6FtKsg6J4',
    title: 'What is OSI Model | Real World Examples',
    channel: 'ByteByteGo',
    sheets: ['net-models'],
    skills: ['cs.net-models'],
    match: ['osi', 'osi model', 'tcp/ip model', 'networking layers', 'network model'],
  },
  {
    slug: 'cs-net-http',
    id: 'wOPrIhmi7l0',
    title: 'HTTP Explained',
    channel: 'NeetCodeIO',
    sheets: ['net-web'],
    skills: ['cs.net-http', 'cs.net-sockets'],
    match: ['http', 'https', 'rest over http', 'request response', 'cookies', 'websocket'],
  },
  {
    slug: 'cs-net-dns',
    id: 'NiQTs9DbtW4',
    title: 'What is DNS? (and how it makes the Internet work)',
    channel: 'NetworkChuck',
    sheets: ['net-infra'],
    skills: ['cs.net-dns', 'cs.net-routing', 'cs.net-security'],
    match: ['dns', 'domain name', 'cdn', 'routing', 'ip address', 'subnet'],
  },
  {
    slug: 'cs-net-transport',
    id: 'uwoD5YsGACg',
    title: 'TCP vs UDP Comparison',
    channel: 'PowerCert Animated Videos',
    skills: ['cs.net-transport'],
    match: ['tcp', 'udp', 'tcp vs udp', 'transport layer', 'three way handshake'],
  },
  {
    slug: 'cs-sd-scaling',
    id: 'EWS_CIxttVw',
    title: 'Scalability Simply Explained in 10 Minutes',
    channel: 'ByteByteGo',
    sheets: ['sd-scaling'],
    skills: ['cs.sd-scalability'],
    match: ['scalability', 'scaling', 'horizontal scaling', 'vertical scaling', 'system design basics'],
  },
  {
    slug: 'cs-sd-caching',
    id: 'U3RkDLtS7uY',
    title: 'What are Distributed CACHES and how do they manage DATA CONSISTENCY?',
    channel: 'Gaurav Sen',
    skills: ['cs.sd-caching'],
    match: ['caching', 'cache', 'redis', 'lru cache', 'cdn cache'],
  },
  {
    slug: 'cs-sd-load-balancing',
    id: 'LQuuoHTyYz8',
    title: 'What is a LOAD BALANCER really about?',
    channel: 'ByteByteGo',
    skills: ['cs.sd-load-balancing'],
    match: ['load balancer', 'load balancing', 'reverse proxy'],
  },
  {
    slug: 'cs-sd-cap',
    id: 'BHqjEjzAicA',
    title: 'CAP Theorem Simplified',
    channel: 'ByteByteGo',
    sheets: ['sd-distributed'],
    skills: ['cs.sd-cap'],
    match: ['cap theorem', 'distributed system', 'consistency', 'partition tolerance', 'sharding', 'replication'],
  },
  {
    slug: 'cs-sd-api',
    id: '-mN3VyJuCjM',
    title: 'What Is REST API? Examples And How To Use It: Crash Course System Design #3',
    channel: 'ByteByteGo',
    sheets: ['sd-api'],
    skills: ['cs.sd-api'],
    match: ['rest api', 'api design', 'restful', 'graphql', 'rate limiter', 'idempotency'],
  },
  {
    slug: 'cs-sd-queues',
    id: 'oUJbuFMyBDk',
    title: 'What is a MESSAGE QUEUE and Where is it used?',
    channel: 'Gaurav Sen',
    skills: ['cs.sd-queues'],
    match: ['message queue', 'kafka', 'rabbitmq', 'pub sub', 'event driven'],
  },
  {
    slug: 'cs-git',
    id: 'RGOj5yH7evk',
    title: 'Git and GitHub for Beginners - Crash Course',
    channel: 'freeCodeCamp.org',
    sheets: ['eng-practice'],
    skills: ['cs.git'],
    match: ['git', 'github', 'version control', 'branching', 'pull request', 'merge conflict'],
  },
  {
    slug: 'cs-testing',
    id: '3kzHmaeozDI',
    title: 'What is Unit Testing? Why YOU Should Learn It + Easy to Understand Examples',
    channel: 'Andy Sterkowitz',
    skills: ['cs.testing'],
    match: ['unit test', 'unit testing', 'testing', 'tdd', 'integration test'],
  },
  {
    slug: 'cs-web-fundamentals',
    id: 'AlkDbnbv7dk',
    title: 'What happens when you type a URL into your browser?',
    channel: 'ByteByteGo',
    sheets: ['web-fundamentals'],
    skills: ['cs.web-fundamentals'],
    match: ['how the web works', 'web fundamentals', 'browser', 'url', 'client server', 'dom'],
  },  {
    slug: 'cpp-variables',
    id: 'Dxu7GKtdbnA',
    title: 'Lecture 2 : Variable, Data Types & Operators | DSA Series by Shradha Ma\'am | C++',
    channel: 'Apna College',
    skills: ['dsa.problem-solving'],
    match: ['variables', 'data types', 'operators', 'variable'],
  },
  {
    slug: 'cpp-conditionals',
    id: 'NG0Iw6xNO0s',
    title: 'Lec-21: If/else Statement in C++ programming | Control Flow Statements | C++ by Varun sir',
    channel: 'Gate Smashers',
    match: ['conditionals', 'if else', 'if-else', 'conditional statements'],
  },
  {
    slug: 'cpp-loops',
    id: 'a7dfSBrTZtE',
    title: 'For, While and do-while loops in C++ | C++ Tutorials for Beginners #10',
    channel: 'CodeWithHarry',
    match: ['loops', 'for while', 'loop', 'while loop', 'for loop'],
  },
  {
    slug: 'cpp-functions',
    id: 'P08Z_NC8GuY',
    title: 'Lecture 5: Functions | DSA Series by Shradha Khapra Ma\'am | C++',
    channel: 'Apna College',
    match: ['functions basics', 'functions', 'function'],
  },
  {
    slug: 'dsa-linear-search',
    id: '_HRA37X8N_Q',
    title: 'Linear Search Algorithm - Theory + Code + Questions',
    channel: 'Kunal Kushwaha',
    match: ['linear search', 'sequential search'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Indexes — built once at module load. All O(1) lookups from here on.
// ─────────────────────────────────────────────────────────────────────────────

const BY_SLUG = new Map(CURATED_VIDEOS.map((v) => [v.slug, v]));
const BY_PATTERN = new Map();
const BY_SHEET = new Map();
const BY_SKILL = new Map();

for (const v of CURATED_VIDEOS) {
  if (v.pattern && !BY_PATTERN.has(v.pattern)) BY_PATTERN.set(v.pattern, v);
  for (const s of v.sheets || []) if (!BY_SHEET.has(s)) BY_SHEET.set(s, v);
  for (const s of v.skills || []) if (!BY_SKILL.has(s)) BY_SKILL.set(s, v);
}

/**
 * Keyword index for free-text topics. Longest phrase first so "binary search
 * tree" cannot be swallowed by "binary search", and "sliding window" beats
 * "window".
 */
const MATCH_INDEX = CURATED_VIDEOS
  .flatMap((v) => (v.match || []).map((phrase) => ({ phrase: ` ${NORMALISE(phrase)} `, video: v })))
  .sort((a, b) => b.phrase.length - a.phrase.length);

// ─────────────────────────────────────────────────────────────────────────────
// Lookups. Every one of them returns an entry or null — never a fallback URL.
// ─────────────────────────────────────────────────────────────────────────────

export function videoBySlug(slug) {
  return BY_SLUG.get(slug) || null;
}

/** The video for a DSA pattern id from lib/dsaPatterns.js. */
export function videoForPattern(patternId) {
  return BY_PATTERN.get(patternId) || null;
}

/** The video for a study sheet id from lib/studySheets. */
export function videoForSheet(sheetId) {
  // Pattern sheets share their id with the pattern, so try both indexes.
  return BY_SHEET.get(sheetId) || BY_PATTERN.get(sheetId) || null;
}

/** The video for a taxonomy skill id from lib/skillTaxonomy.js. */
export function videoForSkill(skillId) {
  return BY_SKILL.get(skillId) || null;
}

/**
 * Best video for a free-text topic ("Sliding Window Basics", "Dijkstra
 * Shortest Path", a generated roadmap day title).
 *
 * WHOLE-WORD match against the longest-first phrase index — both sides are
 * space-padded, so "scaling" matches "Horizontal Scaling" but NOT "Kubernetes
 * autoscaling", and "binary search tree" wins over "binary search".
 *
 * Deliberately conservative: an unrecognised topic returns null and the caller
 * shows no video, which is the correct outcome for a topic nobody has curated
 * yet. A wrong video is worse than none.
 */
export function videoForTopic(topic) {
  const t = NORMALISE(topic);
  if (!t) return null;
  const padded = ` ${t} `;
  for (const { phrase, video } of MATCH_INDEX) {
    if (padded.includes(phrase)) return video;
  }
  return null;
}

/**
 * Resolve a roadmap day / sheet / skill to a video, trying the most reliable
 * signal first. `skills` beats free text because a taxonomy id is exact.
 */
export function videoFor({ slug, pattern, sheet, skills, topic } = {}) {
  if (slug) { const v = videoBySlug(slug); if (v) return v; }
  if (pattern) { const v = videoForPattern(pattern); if (v) return v; }
  if (sheet) { const v = videoForSheet(sheet); if (v) return v; }
  for (const s of skills || []) { const v = videoForSkill(s); if (v) return v; }
  if (topic) { const v = videoForTopic(topic); if (v) return v; }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The ONLY URL shape this codebase may put in an <iframe>. `/embed/<id>` is the
 * one YouTube serves without X-Frame-Options; watch / results / channel URLs
 * render as "refused to connect".
 *
 * youtube-nocookie.com is the privacy-preserving host — same player, no
 * ad-tracking cookie until the student presses play.
 */
export function embedUrl(video, { autoplay = false } = {}) {
  const id = typeof video === 'string' ? video : video?.id;
  if (!id) return null;
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** Poster frame, for the click-to-play variant. */
export function thumbnailUrl(video) {
  const id = typeof video === 'string' ? video : video?.id;
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/**
 * Wire shape for API responses — the entry minus its `match` keywords, which
 * are a resolution detail the client has no use for.
 */
export function publicVideo(video) {
  if (!video) return null;
  const { slug, id, title, channel } = video;
  return { slug, id, title, channel };
}

/** Convenience for API routes: resolve a roadmap day's topic in one call. */
export function curatedVideoForDay(topic) {
  return publicVideo(videoForTopic(topic));
}

/**
 * Guard used by the API layer: true for any YouTube *search* URL. Cached
 * roadmap rows written before this feature still hold one of these in
 * `video_url`, and they must never reach the UI again.
 */
export function isYouTubeSearchUrl(url) {
  return typeof url === 'string' && /youtube\.com\/results/i.test(url);
}
