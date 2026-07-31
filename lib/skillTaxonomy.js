/**
 * GENOIS skill taxonomy — the controlled tag vocabulary for the evidence bus.
 *
 * HAND-AUTHORED ON PURPOSE. Every id, label and alias below was written by a
 * human. Nothing here is AI-generated and nothing here should be generated at
 * runtime: the whole point of a controlled vocabulary is that it is fixed, so
 * evidence collected in March still aggregates against evidence collected in
 * November. If an assessment produces a topic that doesn't map, the right fix
 * is to add an alias to this file — never to invent a tag at write time.
 *
 * Ids are namespaced by domain (`dsa.`, `cs.`, `apt.`, `comm.`) because the
 * same word means different things in different places — "coding-decoding" is
 * an aptitude reasoning topic, "coding" is writing programs; "arrays" in DSA is
 * not "array basics" in an aptitude series question.
 *
 * The aptitude ids deliberately mirror the slugs in lib/aptitudeConfig.js so
 * aptitude sessions map one-to-one with no guessing.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Domains
// ─────────────────────────────────────────────────────────────────────────────

export const SKILL_DOMAINS = {
  dsa: { key: 'dsa', label: 'Data Structures & Algorithms' },
  cs: { key: 'cs', label: 'CS Fundamentals' },
  apt: { key: 'apt', label: 'Aptitude' },
  comm: { key: 'comm', label: 'Communication & Resume' },
};

// Tag used when nothing in the vocabulary matches. Kept out of SKILLS so it can
// never be offered as a real skill, but readable so it shows up in debug output
// and tells us which aliases are missing.
export const UNCLASSIFIED = 'unclassified';

// ─────────────────────────────────────────────────────────────────────────────
// DSA — 40 skills
// ─────────────────────────────────────────────────────────────────────────────

const DSA_SKILLS = [
  // Foundations
  { id: 'dsa.complexity', label: 'Time & Space Complexity', group: 'Foundations',
    aliases: ['complexity', 'big o', 'big-o', 'time complexity', 'space complexity', 'asymptotic analysis', 'algorithm analysis'] },
  { id: 'dsa.recursion', label: 'Recursion', group: 'Foundations',
    aliases: ['recursion', 'recursion fundamentals', 'recursion intro', 'recursive', 'factorial', 'fibonacci', 'factorial & fibonacci'] },
  { id: 'dsa.bit-manipulation', label: 'Bit Manipulation', group: 'Foundations',
    aliases: ['bit manipulation', 'bitwise', 'bits', 'xor', 'bit masking', 'bitmask'] },
  { id: 'dsa.math', label: 'Math for Programming', group: 'Foundations',
    aliases: ['math', 'number theory', 'gcd', 'lcm', 'primes', 'sieve', 'modular arithmetic', 'math/loops'] },

  // Arrays & strings
  { id: 'dsa.arrays', label: 'Arrays', group: 'Arrays & Strings',
    aliases: ['arrays', 'array', 'array basics', 'arrays introduction', 'arrays introduction & basics', 'array traversal', 'array traversal & searching', 'array reversal & rotation', 'array rotation'] },
  { id: 'dsa.strings', label: 'Strings', group: 'Arrays & Strings',
    aliases: ['strings', 'string', 'string basics', 'strings introduction', 'string manipulation', 'palindrome', 'anagram', 'group anagrams pattern'] },
  { id: 'dsa.two-pointers', label: 'Two Pointers', group: 'Arrays & Strings',
    aliases: ['two pointers', 'two pointer', 'two pointers technique', 'two pointers pattern', 'fast and slow pointers'] },
  { id: 'dsa.sliding-window', label: 'Sliding Window', group: 'Arrays & Strings',
    aliases: ['sliding window', 'sliding window basics', 'sliding window maximum', 'longest substring without repeat', 'longest substring'] },
  { id: 'dsa.prefix-sum', label: 'Prefix Sums', group: 'Arrays & Strings',
    aliases: ['prefix sum', 'prefix sums', 'cumulative sum', 'subarray sum', 'subarray sum problems', 'kadane', "kadane's algorithm"] },
  { id: 'dsa.sorting', label: 'Sorting', group: 'Arrays & Strings',
    aliases: ['sorting', 'sort', 'bubble sort', 'selection sort', 'insertion sort', 'merge sort', 'quick sort', 'quicksort', 'counting sort'] },
  { id: 'dsa.binary-search', label: 'Binary Search', group: 'Arrays & Strings',
    aliases: ['binary search', 'binary search basics', 'searching', 'linear search', 'binary search on answer'] },
  { id: 'dsa.matrix', label: 'Matrix / 2D Arrays', group: 'Arrays & Strings',
    aliases: ['matrix', '2d array', '2d arrays', 'grid', 'spiral matrix', 'rotate matrix'] },
  { id: 'dsa.intervals', label: 'Intervals', group: 'Arrays & Strings',
    aliases: ['intervals', 'merge intervals', 'interval scheduling', 'meeting rooms'] },

  // Hashing
  // Classic problem titles live on the skill they actually exercise — coding
  // submissions arrive titled ("Two Sum"), not topic-tagged.
  { id: 'dsa.hashing', label: 'Hash Maps & Sets', group: 'Hashing',
    aliases: ['hashing', 'hash map', 'hash maps', 'hashmap', 'hash table', 'hash sets', 'hash set', 'hashing introduction', 'hash maps introduction', 'dictionaries', 'two sum', 'valid anagram', 'contains duplicate'] },
  { id: 'dsa.frequency-counting', label: 'Frequency Counting', group: 'Hashing',
    aliases: ['frequency counting', 'frequency counter', 'counting', 'character count', 'top k frequent elements'] },

  // Linear structures
  { id: 'dsa.linked-list', label: 'Linked Lists', group: 'Linear Structures',
    aliases: ['linked list', 'linked lists', 'linked list basics', 'reverse linked list', 'doubly linked list', 'merge two sorted lists', 'merge sorted lists', 'middle of linked list', 'remove nth node from end'] },
  { id: 'dsa.cycle-detection', label: 'Cycle Detection', group: 'Linear Structures',
    aliases: ['cycle detection', 'detect cycle', 'cycle detection (floyd)', 'floyd', "floyd's algorithm", 'tortoise and hare'] },
  { id: 'dsa.stack', label: 'Stacks', group: 'Linear Structures',
    aliases: ['stack', 'stacks', 'stack basics', 'stack basics & operations', 'valid parentheses', 'balanced brackets', 'expression evaluation', 'infix postfix'] },
  { id: 'dsa.queue', label: 'Queues', group: 'Linear Structures',
    aliases: ['queue', 'queues', 'queue basics', 'circular queue', 'deque'] },
  { id: 'dsa.monotonic-stack', label: 'Monotonic Stack', group: 'Linear Structures',
    aliases: ['monotonic stack', 'monotonic queue', 'next greater element', 'largest rectangle in histogram'] },

  // Trees
  { id: 'dsa.binary-tree', label: 'Binary Trees', group: 'Trees',
    aliases: ['binary tree', 'binary trees', 'tree', 'trees', 'tree basics', 'binary tree basics', 'height & depth of tree', 'diameter of tree', 'lca of binary tree', 'lowest common ancestor'] },
  { id: 'dsa.tree-traversal', label: 'Tree Traversal', group: 'Trees',
    aliases: ['tree traversal', 'tree traversals', 'tree traversals (dfs)', 'inorder', 'preorder', 'postorder', 'level order traversal', 'level order traversal (bfs)'] },
  { id: 'dsa.bst', label: 'Binary Search Trees', group: 'Trees',
    aliases: ['bst', 'binary search tree', 'binary search tree (bst)', 'avl tree', 'balanced bst', 'validate bst'] },
  { id: 'dsa.heap', label: 'Heaps & Priority Queues', group: 'Trees',
    aliases: ['heap', 'heaps', 'heap data structure', 'priority queue', 'priority queue basics', 'min heap', 'max heap', 'kth largest', 'kth largest/smallest', 'merge k sorted lists'] },
  { id: 'dsa.trie', label: 'Tries', group: 'Trees',
    aliases: ['trie', 'tries', 'tries introduction', 'prefix tree', 'autocomplete'] },
  { id: 'dsa.segment-tree', label: 'Segment Trees & Fenwick', group: 'Trees',
    aliases: ['segment tree', 'segment trees', 'segment trees basics', 'fenwick tree', 'binary indexed tree', 'range query'] },

  // Graphs
  { id: 'dsa.graph-basics', label: 'Graph Representation', group: 'Graphs',
    aliases: ['graph', 'graphs', 'graph representation', 'adjacency list', 'adjacency matrix', 'connected components'] },
  { id: 'dsa.bfs', label: 'Breadth-First Search', group: 'Graphs',
    aliases: ['bfs', 'breadth first search', 'bfs traversal', 'islands problem', 'number of islands', 'flood fill'] },
  { id: 'dsa.dfs', label: 'Depth-First Search', group: 'Graphs',
    aliases: ['dfs', 'depth first search', 'dfs traversal', 'cycle detection in graph'] },
  { id: 'dsa.topological-sort', label: 'Topological Sort', group: 'Graphs',
    aliases: ['topological sort', 'topological sorting', 'kahn', "kahn's algorithm", 'course schedule'] },
  { id: 'dsa.shortest-path', label: 'Shortest Paths', group: 'Graphs',
    aliases: ['shortest path', 'dijkstra', 'dijkstra shortest path', 'bellman ford', 'bellman-ford', 'floyd warshall', 'floyd-warshall', 'a star'] },
  { id: 'dsa.union-find', label: 'Union Find (DSU)', group: 'Graphs',
    aliases: ['union find', 'union-find', 'union find (dsu)', 'dsu', 'disjoint set', 'disjoint set union'] },
  { id: 'dsa.mst', label: 'Minimum Spanning Tree', group: 'Graphs',
    aliases: ['mst', 'minimum spanning tree', 'kruskal', 'prim', "prim's algorithm"] },

  // Paradigms
  { id: 'dsa.backtracking', label: 'Backtracking', group: 'Paradigms',
    aliases: ['backtracking', 'n-queens', 'n-queens backtracking', 'sudoku solver', 'subset generation', 'subsets', 'permutations', 'combinations'] },
  { id: 'dsa.greedy', label: 'Greedy Algorithms', group: 'Paradigms',
    aliases: ['greedy', 'greedy algorithms', 'activity selection', 'huffman'] },
  { id: 'dsa.dynamic-programming', label: 'Dynamic Programming', group: 'Paradigms',
    aliases: ['dp', 'dynamic programming', 'memoization', 'tabulation', 'dp basics', 'climbing stairs', 'house robber'] },
  { id: 'dsa.dp-knapsack', label: 'DP — Knapsack Patterns', group: 'Paradigms',
    aliases: ['knapsack', '0/1 knapsack', 'subset sum', 'coin change', 'partition equal subset'] },
  { id: 'dsa.dp-strings', label: 'DP — String Patterns', group: 'Paradigms',
    aliases: ['lcs', 'longest common subsequence', 'edit distance', 'longest increasing subsequence', 'lis', 'palindromic substring'] },
  { id: 'dsa.divide-conquer', label: 'Divide & Conquer', group: 'Paradigms',
    aliases: ['divide and conquer', 'divide & conquer', 'master theorem'] },
  { id: 'dsa.problem-solving', label: 'General Problem Solving', group: 'Paradigms',
    aliases: ['problem solving', 'coding', 'implementation', 'logic building', 'programming basics', 'variables, data types & operators', 'conditionals', 'conditionals (if-else)', 'loops', 'loops (for, while)', 'functions basics'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// CS Fundamentals — 37 skills
// ─────────────────────────────────────────────────────────────────────────────

const CS_SKILLS = [
  // OOP
  { id: 'cs.oop-encapsulation', label: 'OOP — Encapsulation', group: 'OOP',
    aliases: ['encapsulation', 'data hiding', 'access modifiers', 'getters and setters'] },
  { id: 'cs.oop-inheritance', label: 'OOP — Inheritance', group: 'OOP',
    aliases: ['inheritance', 'superclass', 'subclass', 'multiple inheritance', 'diamond problem'] },
  { id: 'cs.oop-polymorphism', label: 'OOP — Polymorphism', group: 'OOP',
    aliases: ['polymorphism', 'method overloading', 'method overriding', 'overloading', 'overriding', 'dynamic dispatch', 'virtual functions'] },
  { id: 'cs.oop-abstraction', label: 'OOP — Abstraction & Interfaces', group: 'OOP',
    aliases: ['abstraction', 'abstract class', 'interface', 'interfaces'] },
  { id: 'cs.oop-solid', label: 'SOLID Principles', group: 'OOP',
    aliases: ['solid', 'solid principles', 'single responsibility', 'dependency inversion', 'open closed principle'] },
  { id: 'cs.design-patterns', label: 'Design Patterns', group: 'OOP',
    aliases: ['design patterns', 'singleton', 'factory pattern', 'observer pattern', 'strategy pattern', 'mvc'] },

  // Operating systems
  { id: 'cs.os-processes', label: 'OS — Processes', group: 'Operating Systems',
    aliases: ['process', 'processes', 'process management', 'pcb', 'fork', 'ipc', 'inter process communication'] },
  { id: 'cs.os-threads', label: 'OS — Threads & Concurrency', group: 'Operating Systems',
    aliases: ['thread', 'threads', 'threading', 'multithreading', 'concurrency', 'context switch', 'context switching'] },
  { id: 'cs.os-scheduling', label: 'OS — CPU Scheduling', group: 'Operating Systems',
    aliases: ['scheduling', 'cpu scheduling', 'round robin', 'fcfs', 'shortest job first', 'sjf', 'priority scheduling'] },
  { id: 'cs.os-synchronization', label: 'OS — Synchronization', group: 'Operating Systems',
    aliases: ['synchronization', 'mutex', 'semaphore', 'semaphores', 'critical section', 'race condition', 'monitors', 'producer consumer'] },
  { id: 'cs.os-deadlock', label: 'OS — Deadlocks', group: 'Operating Systems',
    aliases: ['deadlock', 'deadlocks', "banker's algorithm", 'bankers algorithm', 'starvation', 'livelock'] },
  { id: 'cs.os-memory', label: 'OS — Memory Management', group: 'Operating Systems',
    aliases: ['memory management', 'memory allocation', 'fragmentation', 'stack vs heap', 'garbage collection', 'segmentation'] },
  { id: 'cs.os-virtual-memory', label: 'OS — Virtual Memory & Paging', group: 'Operating Systems',
    aliases: ['virtual memory', 'paging', 'page fault', 'page replacement', 'lru page replacement', 'tlb', 'thrashing', 'demand paging'] },
  { id: 'cs.os-file-systems', label: 'OS — File Systems & I/O', group: 'Operating Systems',
    aliases: ['file system', 'file systems', 'inode', 'disk scheduling', 'i/o management', 'raid'] },

  // Databases
  { id: 'cs.db-sql', label: 'DBMS — SQL Queries', group: 'Databases',
    aliases: ['sql', 'sql queries', 'select query', 'group by', 'aggregate functions', 'subquery', 'subqueries', 'window functions'] },
  { id: 'cs.db-joins', label: 'DBMS — Joins & Relational Algebra', group: 'Databases',
    aliases: ['joins', 'join', 'inner join', 'left join', 'outer join', 'relational algebra', 'foreign key', 'keys in dbms'] },
  { id: 'cs.db-normalization', label: 'DBMS — Normalization', group: 'Databases',
    aliases: ['normalization', 'database normalization', '1nf', '2nf', '3nf', 'bcnf', 'functional dependency', 'denormalization'] },
  { id: 'cs.db-indexing', label: 'DBMS — Indexing', group: 'Databases',
    aliases: ['indexing', 'index', 'b-tree index', 'hash index', 'clustered index', 'postgresql indexing', 'query optimization', 'explain plan'] },
  { id: 'cs.db-transactions', label: 'DBMS — Transactions & ACID', group: 'Databases',
    aliases: ['transaction', 'transactions', 'acid', 'acid properties', 'commit', 'rollback', 'atomicity', 'durability'] },
  { id: 'cs.db-concurrency', label: 'DBMS — Concurrency Control', group: 'Databases',
    aliases: ['concurrency control', 'isolation levels', 'locking', 'two phase locking', 'dirty read', 'phantom read', 'mvcc'] },
  { id: 'cs.db-nosql', label: 'DBMS — NoSQL & Data Modelling', group: 'Databases',
    aliases: ['nosql', 'mongodb', 'document database', 'key value store', 'redis', 'schema design', 'er diagram', 'er model'] },

  // Networks
  { id: 'cs.net-models', label: 'CN — OSI & TCP/IP Models', group: 'Networks',
    aliases: ['osi model', 'osi', 'tcp/ip model', 'networking layers', 'network layers', 'encapsulation in networking'] },
  { id: 'cs.net-transport', label: 'CN — TCP & UDP', group: 'Networks',
    aliases: ['tcp', 'udp', 'tcp vs udp', 'three way handshake', '3-way handshake', 'flow control', 'congestion control'] },
  { id: 'cs.net-http', label: 'CN — HTTP & Web Protocols', group: 'Networks',
    aliases: ['http', 'https', 'http protocols', 'http status codes', 'rest', 'websockets', 'cookies and sessions', 'cors'] },
  { id: 'cs.net-dns', label: 'CN — DNS & Addressing', group: 'Networks',
    aliases: ['dns', 'ip address', 'ipv4', 'ipv6', 'subnetting', 'nat', 'dhcp', 'mac address', 'arp'] },
  { id: 'cs.net-routing', label: 'CN — Routing & Switching', group: 'Networks',
    aliases: ['routing', 'router', 'switching', 'routing algorithms', 'distance vector', 'link state', 'ospf', 'bgp'] },
  { id: 'cs.net-security', label: 'CN — Network Security & TLS', group: 'Networks',
    aliases: ['network security', 'tls', 'ssl', 'encryption', 'symmetric encryption', 'public key', 'firewall', 'hashing algorithms', 'digital signature'] },
  { id: 'cs.net-sockets', label: 'CN — Sockets & Client-Server', group: 'Networks',
    aliases: ['socket', 'sockets', 'socket programming', 'client server', 'client-server model', 'port'] },

  // Systems & engineering practice
  { id: 'cs.sd-scalability', label: 'System Design — Scalability', group: 'Systems & Practice',
    aliases: ['scalability', 'system design', 'horizontal scaling', 'vertical scaling', 'sharding', 'partitioning', 'replication',
      // The stock system-design prompts, so a round tagged only by its question
      // title still lands somewhere real.
      'url shortener', 'design instagram', 'news feed', 'design twitter', 'design youtube',
      'chat application', 'design whatsapp', 'parking lot', 'ride sharing', 'rate limiter design'] },
  { id: 'cs.sd-caching', label: 'System Design — Caching', group: 'Systems & Practice',
    aliases: ['caching', 'cache', 'cdn', 'cache invalidation', 'lru cache', 'write through cache'] },
  { id: 'cs.sd-load-balancing', label: 'System Design — Load Balancing', group: 'Systems & Practice',
    aliases: ['load balancing', 'load balancer', 'reverse proxy', 'consistent hashing'] },
  { id: 'cs.sd-cap', label: 'System Design — CAP & Distributed Systems', group: 'Systems & Practice',
    aliases: ['cap theorem', 'cap', 'distributed systems', 'eventual consistency', 'consensus', 'raft', 'paxos'] },
  { id: 'cs.sd-api', label: 'System Design — API Design', group: 'Systems & Practice',
    aliases: ['api design', 'rest api', 'graphql', 'rate limiting', 'idempotency', 'versioning', 'authentication', 'jwt', 'oauth'] },
  { id: 'cs.sd-queues', label: 'System Design — Queues & Async', group: 'Systems & Practice',
    aliases: ['message queue', 'message queues', 'kafka', 'rabbitmq', 'pub sub', 'event driven', 'async processing', 'nodejs internals', 'event loop'] },
  { id: 'cs.git', label: 'Git & Version Control', group: 'Systems & Practice',
    aliases: ['git', 'version control', 'branching', 'merge conflict', 'pull request', 'rebase'] },
  { id: 'cs.testing', label: 'Testing & Debugging', group: 'Systems & Practice',
    aliases: ['testing', 'unit testing', 'integration testing', 'tdd', 'debugging', 'code quality', 'code review'] },
  { id: 'cs.web-fundamentals', label: 'Web Fundamentals', group: 'Systems & Practice',
    aliases: ['html', 'html5', 'css', 'css3', 'javascript', 'asynchronous js', 'promises', 'react', 'react hooks', 'dom', 'frontend basics', 'browser rendering'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Aptitude — 34 skills (first 30 mirror lib/aptitudeConfig.js slugs exactly)
// ─────────────────────────────────────────────────────────────────────────────

const APT_SKILLS = [
  // Quantitative
  { id: 'apt.percentages', label: 'Percentages', group: 'Quantitative',
    aliases: ['percentages', 'percentage', 'percent'] },
  { id: 'apt.profit-loss', label: 'Profit & Loss', group: 'Quantitative',
    aliases: ['profit-loss', 'profit & loss', 'profit and loss', 'discount', 'marked price'] },
  { id: 'apt.ratio-proportion', label: 'Ratio & Proportion', group: 'Quantitative',
    aliases: ['ratio-proportion', 'ratio & proportion', 'ratio and proportion', 'ratio', 'proportion', 'partnership'] },
  { id: 'apt.time-work', label: 'Time & Work', group: 'Quantitative',
    aliases: ['time-work', 'time & work', 'time and work', 'pipes and cisterns', 'work efficiency'] },
  { id: 'apt.time-speed-distance', label: 'Time, Speed & Distance', group: 'Quantitative',
    aliases: ['time-speed-distance', 'time, speed & distance', 'speed distance time', 'trains', 'boats and streams', 'relative speed'] },
  { id: 'apt.averages', label: 'Averages', group: 'Quantitative',
    aliases: ['averages', 'average', 'weighted average'] },
  { id: 'apt.simple-compound-interest', label: 'Simple & Compound Interest', group: 'Quantitative',
    aliases: ['simple-compound-interest', 'simple & compound interest', 'simple interest', 'compound interest', 'interest'] },
  { id: 'apt.permutation-combination', label: 'Permutation & Combination', group: 'Quantitative',
    aliases: ['permutation-combination', 'permutation & combination', 'permutations and combinations', 'ncr', 'npr', 'counting principle'] },
  { id: 'apt.probability', label: 'Probability', group: 'Quantitative',
    aliases: ['probability', 'chance', 'bayes'] },
  { id: 'apt.number-systems', label: 'Number Systems', group: 'Quantitative',
    aliases: ['number-systems', 'number system', 'number systems', 'hcf', 'lcm', 'divisibility', 'remainders', 'factors'] },
  { id: 'apt.mensuration', label: 'Mensuration & Geometry', group: 'Quantitative',
    aliases: ['mensuration', 'geometry', 'area and volume', 'surface area', 'triangles', 'circles'] },
  { id: 'apt.algebra', label: 'Algebra & Equations', group: 'Quantitative',
    aliases: ['algebra', 'linear equations', 'quadratic equations', 'equations', 'inequalities'] },
  { id: 'apt.mixtures', label: 'Mixtures & Alligation', group: 'Quantitative',
    aliases: ['mixtures', 'mixture', 'alligation', 'mixtures and alligation'] },
  { id: 'apt.clocks-calendars', label: 'Clocks & Calendars', group: 'Quantitative',
    aliases: ['clocks', 'clock', 'calendars', 'calendar', 'clocks and calendars', 'odd days'] },

  // Logical reasoning
  { id: 'apt.seating-arrangement', label: 'Seating Arrangement', group: 'Logical Reasoning',
    aliases: ['seating-arrangement', 'seating arrangement', 'circular arrangement', 'linear arrangement'] },
  { id: 'apt.blood-relations', label: 'Blood Relations', group: 'Logical Reasoning',
    aliases: ['blood-relations', 'blood relations', 'family tree', 'relations'] },
  { id: 'apt.coding-decoding', label: 'Coding-Decoding', group: 'Logical Reasoning',
    aliases: ['coding-decoding', 'coding decoding', 'letter coding', 'number coding'] },
  { id: 'apt.syllogisms', label: 'Syllogisms', group: 'Logical Reasoning',
    aliases: ['syllogisms', 'syllogism', 'logical deduction'] },
  { id: 'apt.puzzles', label: 'Puzzles', group: 'Logical Reasoning',
    aliases: ['puzzles', 'puzzle', 'logical puzzles', 'floor puzzle', 'scheduling puzzle'] },
  { id: 'apt.number-series', label: 'Number & Letter Series', group: 'Logical Reasoning',
    aliases: ['number-series', 'number & letter series', 'number series', 'letter series', 'series completion', 'missing number'] },
  { id: 'apt.data-interpretation', label: 'Data Interpretation', group: 'Logical Reasoning',
    aliases: ['data-interpretation', 'data interpretation', 'bar graph', 'pie chart', 'line graph', 'tabular data', 'data sufficiency'] },
  { id: 'apt.statements-conclusions', label: 'Statements & Conclusions', group: 'Logical Reasoning',
    aliases: ['statements-conclusions', 'statements & conclusions', 'statement and conclusion', 'statement and assumption', 'course of action', 'critical reasoning'] },
  { id: 'apt.direction-sense', label: 'Direction Sense', group: 'Logical Reasoning',
    aliases: ['direction-sense', 'direction sense', 'directions', 'distance and direction'] },
  { id: 'apt.analogies', label: 'Analogies', group: 'Logical Reasoning',
    aliases: ['analogies', 'analogy', 'classification', 'odd one out'] },

  // Verbal
  { id: 'apt.grammar', label: 'Grammar', group: 'Verbal Ability',
    aliases: ['grammar', 'parts of speech', 'tenses', 'subject verb agreement', 'articles', 'prepositions'] },
  { id: 'apt.reading-comprehension', label: 'Reading Comprehension', group: 'Verbal Ability',
    aliases: ['reading-comprehension', 'reading comprehension', 'passage', 'comprehension', 'inference from passage'] },
  { id: 'apt.sentence-correction', label: 'Sentence Correction', group: 'Verbal Ability',
    aliases: ['sentence-correction', 'sentence correction', 'sentence improvement', 'sentence rearrangement'] },
  { id: 'apt.synonyms-antonyms', label: 'Synonyms & Antonyms', group: 'Verbal Ability',
    aliases: ['synonyms-antonyms', 'synonyms & antonyms', 'synonyms', 'antonyms'] },
  { id: 'apt.vocabulary', label: 'Vocabulary', group: 'Verbal Ability',
    aliases: ['vocabulary', 'word meaning', 'one word substitution', 'spellings'] },
  { id: 'apt.para-jumbles', label: 'Para Jumbles', group: 'Verbal Ability',
    aliases: ['para-jumbles', 'para jumbles', 'parajumbles', 'sentence ordering'] },
  { id: 'apt.fill-in-blanks', label: 'Fill in the Blanks', group: 'Verbal Ability',
    aliases: ['fill-in-blanks', 'fill in the blanks', 'fill in blanks', 'sentence completion'] },
  { id: 'apt.error-spotting', label: 'Error Spotting', group: 'Verbal Ability',
    aliases: ['error-spotting', 'error spotting', 'spot the error', 'find the error'] },
  { id: 'apt.idioms-phrases', label: 'Idioms & Phrases', group: 'Verbal Ability',
    aliases: ['idioms-phrases', 'idioms & phrases', 'idioms', 'phrasal verbs', 'phrases'] },
  { id: 'apt.cloze-test', label: 'Cloze Test', group: 'Verbal Ability',
    aliases: ['cloze-test', 'cloze test', 'cloze passage'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Communication & Resume — 31 skills
// ─────────────────────────────────────────────────────────────────────────────

const COMM_SKILLS = [
  // Resume
  { id: 'comm.resume-ats', label: 'Resume — ATS Compatibility', group: 'Resume',
    aliases: ['ats', 'ats score', 'ats compatibility', 'applicant tracking', 'resume parsing'] },
  { id: 'comm.resume-structure', label: 'Resume — Structure & Sections', group: 'Resume',
    aliases: ['resume structure', 'resume sections', 'section headers', 'missing sections', 'resume layout', 'resume order'] },
  { id: 'comm.resume-impact', label: 'Resume — Quantified Impact', group: 'Resume',
    aliases: ['quantified impact', 'missing impact', 'metrics in resume', 'measurable outcome', 'impact statements', 'results'] },
  { id: 'comm.resume-action-verbs', label: 'Resume — Strong Bullet Writing', group: 'Resume',
    aliases: ['action verbs', 'weak bullets', 'bullet points', 'duty based bullets', 'bullet rewriting', 'passive voice'] },
  { id: 'comm.resume-keywords', label: 'Resume — Role Keywords', group: 'Resume',
    aliases: ['missing keywords', 'resume keywords', 'keyword optimization', 'skills section', 'role alignment'] },
  { id: 'comm.resume-projects', label: 'Resume — Project Presentation', group: 'Resume',
    aliases: ['project description', 'projects section', 'project presentation', 'github links', 'portfolio'] },
  { id: 'comm.resume-brevity', label: 'Resume — Brevity & Density', group: 'Resume',
    aliases: ['resume length', 'brevity', 'conciseness in resume', 'one page resume', 'long paragraphs'] },
  { id: 'comm.resume-formatting', label: 'Resume — Formatting Hygiene', group: 'Resume',
    aliases: ['formatting', 'resume formatting', 'formatting flags', 'multi column layout', 'tables in resume', 'fonts', 'graphics in resume'] },
  { id: 'comm.resume-contact', label: 'Resume — Contact & Links', group: 'Resume',
    aliases: ['contact info', 'contact information', 'email in resume', 'linkedin', 'missing contact'] },

  // Interview delivery
  { id: 'comm.self-introduction', label: 'Self Introduction', group: 'Interview Delivery',
    aliases: ['self introduction', 'tell me about yourself', 'introduce yourself', 'elevator pitch'] },
  // 'behavioral' / 'situational' are question TYPES, not topics — but that is
  // exactly what the interview flows pass as `topic`, so they need a home.
  { id: 'comm.star-method', label: 'STAR Storytelling', group: 'Interview Delivery',
    aliases: ['star method', 'star', 'situation task action result', 'storytelling', 'behavioral structure', 'behavioral', 'behavioural', 'situational'] },
  { id: 'comm.clarity', label: 'Clarity of Explanation', group: 'Interview Delivery',
    aliases: ['clarity', 'communication clarity', 'clear explanation', 'articulation'] },
  { id: 'comm.conciseness', label: 'Conciseness', group: 'Interview Delivery',
    aliases: ['conciseness', 'concise', 'rambling', 'to the point', 'answer length'] },
  { id: 'comm.confidence', label: 'Confidence & Tone', group: 'Interview Delivery',
    aliases: ['confidence', 'confidence score', 'tone', 'assertiveness', 'nervousness'] },
  { id: 'comm.filler-words', label: 'Filler Words', group: 'Interview Delivery',
    aliases: ['filler words', 'fillers', 'um uh', 'verbal tics'] },
  { id: 'comm.pacing', label: 'Pacing & Pauses', group: 'Interview Delivery',
    aliases: ['pacing', 'speaking speed', 'pauses', 'speech rate'] },
  { id: 'comm.listening', label: 'Listening & Clarifying', group: 'Interview Delivery',
    aliases: ['listening', 'clarifying questions', 'active listening', 'understanding the question'] },
  { id: 'comm.structured-thinking', label: 'Structured Thinking Aloud', group: 'Interview Delivery',
    aliases: ['structured thinking', 'thinking aloud', 'think out loud', 'problem breakdown', 'approach explanation'] },
  { id: 'comm.technical-explanation', label: 'Explaining Technical Concepts', group: 'Interview Delivery',
    aliases: ['technical explanation', 'explaining concepts', 'technical communication', 'conceptual', 'technical accuracy', 'technical'] },
  { id: 'comm.whiteboard', label: 'Whiteboard / Code Narration', group: 'Interview Delivery',
    aliases: ['whiteboard', 'code narration', 'explaining code', 'walking through code', 'dry run'] },

  // Behavioural & HR
  { id: 'comm.teamwork', label: 'Teamwork & Collaboration', group: 'Behavioural & HR',
    aliases: ['teamwork', 'collaboration', 'working in a team', 'team player'] },
  { id: 'comm.conflict', label: 'Conflict Resolution', group: 'Behavioural & HR',
    aliases: ['conflict', 'conflict resolution', 'disagreement', 'difficult teammate'] },
  { id: 'comm.leadership', label: 'Leadership & Ownership', group: 'Behavioural & HR',
    aliases: ['leadership', 'ownership', 'taking initiative', 'leading a team'] },
  { id: 'comm.failure-learning', label: 'Handling Failure & Feedback', group: 'Behavioural & HR',
    aliases: ['failure', 'handling failure', 'learning from mistakes', 'receiving feedback', 'biggest challenge'] },
  { id: 'comm.strengths-weaknesses', label: 'Strengths & Weaknesses', group: 'Behavioural & HR',
    aliases: ['strengths and weaknesses', 'strengths', 'weaknesses', 'greatest weakness'] },
  { id: 'comm.motivation', label: 'Career Motivation & Goals', group: 'Behavioural & HR',
    aliases: ['career goals', 'motivation', 'why this role', 'where do you see yourself', 'career plans', 'hr round', 'hr'] },
  { id: 'comm.company-research', label: 'Company & Role Research', group: 'Behavioural & HR',
    aliases: ['company research', 'why this company', 'about the company', 'role understanding'] },
  { id: 'comm.negotiation', label: 'Salary & Offer Discussion', group: 'Behavioural & HR',
    aliases: ['salary', 'salary expectations', 'negotiation', 'compensation', 'notice period'] },
  { id: 'comm.questions-for-interviewer', label: 'Questions for the Interviewer', group: 'Behavioural & HR',
    aliases: ['questions for interviewer', 'do you have any questions', 'candidate questions'] },

  // Written
  { id: 'comm.email-etiquette', label: 'Professional Email & Follow-up', group: 'Written',
    aliases: ['email etiquette', 'professional email', 'follow up email', 'cold email', 'thank you note'] },
  { id: 'comm.documentation', label: 'Technical Writing & Documentation', group: 'Written',
    aliases: ['documentation', 'technical writing', 'readme', 'writing docs', 'commit messages'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat vocabulary + lookups
// ─────────────────────────────────────────────────────────────────────────────

export const SKILLS = [
  ...DSA_SKILLS.map(s => ({ ...s, domain: 'dsa' })),
  ...CS_SKILLS.map(s => ({ ...s, domain: 'cs' })),
  ...APT_SKILLS.map(s => ({ ...s, domain: 'apt' })),
  ...COMM_SKILLS.map(s => ({ ...s, domain: 'comm' })),
];

const BY_ID = new Map(SKILLS.map(s => [s.id, s]));

export function getSkill(id) {
  return BY_ID.get(id) || null;
}

export function skillLabel(id) {
  if (id === UNCLASSIFIED) return 'Unclassified';
  return BY_ID.get(id)?.label || id;
}

export function skillsForDomain(domain) {
  return SKILLS.filter(s => s.domain === domain);
}

export function isKnownSkill(id) {
  return BY_ID.has(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolver — free text → canonical skill id
// ─────────────────────────────────────────────────────────────────────────────

// Lowercase, collapse whitespace, drop punctuation that AI topic strings sprinkle
// in ("Cycle Detection (Floyd)", "Time, Speed & Distance"). Ampersands become
// "and" so both spellings hit the same alias.
function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Alias index: normalized alias → skill id. Built once. Ids, labels and aliases
// all become lookup keys, so a caller that already knows the canonical id gets
// an exact hit for free.
const ALIAS_INDEX = new Map();
for (const skill of SKILLS) {
  const keys = [skill.id, skill.id.split('.')[1], skill.label, ...(skill.aliases || [])];
  for (const key of keys) {
    const n = norm(key);
    // First writer wins: skills are declared in a deliberate order, so an alias
    // shared by two skills sticks with the one that owns it more strongly.
    if (n && !ALIAS_INDEX.has(n)) ALIAS_INDEX.set(n, skill.id);
  }
}

// Longest aliases first so "binary search tree" beats "binary search" and
// "sliding window maximum" beats "sliding window".
const ALIASES_BY_LENGTH = [...ALIAS_INDEX.keys()].sort((a, b) => b.length - a.length);

// Word-boundary containment — prevents "art" matching inside "start" and
// "dp" matching inside "update".
function containsAlias(haystack, alias) {
  const i = haystack.indexOf(alias);
  if (i === -1) return false;
  const before = i === 0 ? ' ' : haystack[i - 1];
  const after = i + alias.length >= haystack.length ? ' ' : haystack[i + alias.length];
  return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
}

/**
 * Map free text (an assessment's topic string, or the question itself) onto one
 * canonical skill id.
 *
 * @param {string} text          topic string, or question text as a fallback
 * @param {object} [opts]
 * @param {string[]} [opts.domains]  restrict/prioritise to these domain keys
 *                                   (e.g. ['apt'] for an aptitude session) —
 *                                   a match inside them always wins
 * @param {string} [opts.fallback]   returned when nothing matches
 * @returns {string} a skill id, or the fallback (default UNCLASSIFIED)
 */
export function resolveSkill(text, opts = {}) {
  const { domains = null, fallback = UNCLASSIFIED } = opts;
  const n = norm(text);
  if (!n) return fallback;

  const inScope = (id) => !domains?.length || domains.includes(id.split('.')[0]);

  // 1. Exact hit on an id / label / alias.
  const exact = ALIAS_INDEX.get(n);
  if (exact && inScope(exact)) return exact;

  // 2. Longest in-scope alias appearing as a whole phrase in the text. Aliases
  //    under 4 chars are skipped here ("dp", "bst", "sql") — they're too noisy
  //    for substring search and are already covered by the exact pass above.
  for (const alias of ALIASES_BY_LENGTH) {
    if (alias.length < 4) continue;
    const id = ALIAS_INDEX.get(alias);
    if (!inScope(id)) continue;
    if (containsAlias(n, alias)) return id;
  }

  // 3. Domain-restricted searches fall back to a global sweep — a "technical"
  //    interview question about deadlocks should still tag cs.os-deadlock.
  if (domains?.length && exact) return exact;
  if (domains?.length) {
    for (const alias of ALIASES_BY_LENGTH) {
      if (alias.length < 4) continue;
      if (containsAlias(n, alias)) return ALIAS_INDEX.get(alias);
    }
  }

  return fallback;
}

/** Resolve using topic first, then question text. Used by the evidence bus. */
export function resolveSkillFromEntry(entry, opts = {}) {
  const fromTopic = resolveSkill(entry?.topic, { ...opts, fallback: null });
  if (fromTopic) return fromTopic;
  const fromQuestion = resolveSkill(entry?.question, { ...opts, fallback: null });
  return fromQuestion || opts.fallback || UNCLASSIFIED;
}

// Counts for the debug endpoint / sanity checks.
export const TAXONOMY_STATS = {
  total: SKILLS.length,
  byDomain: Object.fromEntries(
    Object.keys(SKILL_DOMAINS).map(d => [d, SKILLS.filter(s => s.domain === d).length])
  ),
};
