/**
 * Feature C — the guided BUILD path behind /projects.
 *
 * WHAT THIS ADDS TO lib/projectTemplates.js
 * -----------------------------------------
 * The catalog already knows WHAT to build: every project ships ordered phases,
 * a real stack, deployment notes and resume bullets. What it could not tell a
 * student was:
 *
 *   · which CONCEPTS a phase actually exercises (so it can hand them the
 *     curated video / study sheet for exactly that phase, and so finishing a
 *     phase means something in the same vocabulary as the rest of the product);
 *   · roughly HOW LONG the phase takes, so "build a project over six months"
 *     becomes a plan instead of an aspiration.
 *
 * This module derives both, and resolves the per-phase learning resources. The
 * catalog is untouched — nothing here is written back to it, and /projects
 * keeps working byte-for-byte if this module is never called.
 *
 * NO RUNTIME GUESSING
 * -------------------
 * Phase concepts are NOT resolved with lib/skillTaxonomy's free-text resolver.
 * That resolver is tuned for assessment topic strings, and turned loose on
 * build prose it produces confident nonsense — "bcrypt for password hashing"
 * lands on `dsa.hashing` (Hash Maps & Sets) because "hashing" is an alias
 * there. So this file carries its own HAND-AUTHORED build vocabulary
 * (BUILD_CONCEPTS below): a phrase only produces a skill if a human wrote that
 * mapping down. A phase whose steps match nothing gets NO skill chips, which
 * is the correct outcome — same rule lib/curatedVideos.js follows for videos.
 *
 * Domains outside the taxonomy (it covers DSA, CS fundamentals, aptitude and
 * communication) deliberately map to nothing: there is no honest taxonomy id
 * for "train a scikit-learn model" or "write a Terraform module", so those
 * phases show their tech chips and no skill chips rather than a wrong one.
 */

import { DOMAIN_PROJECTS } from '@/lib/projectTemplates';
import { isKnownSkill, skillLabel } from '@/lib/skillTaxonomy';
import { videoFor, publicVideo } from '@/lib/curatedVideos';
import { sheetForSkill } from '@/lib/studySheets';
import { tierForDifficulty, projectKey } from '@/lib/projectLevels';

// ─────────────────────────────────────────────────────────────────────────────
// The build vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * skill id → the phrases in build prose that mean it.
 *
 * Rules for adding to this list:
 *   · one human decides each mapping, and the mapping must be true of the
 *     phrase in a BUILD context (that is the whole reason this is not the
 *     assessment resolver);
 *   · phrases under 4 characters are dropped by the matcher — "ci", "os", "db"
 *     are far too noisy inside sentences;
 *   · longest phrase wins and its span is consumed, so 'message queue' can be
 *     a queueing concept while a bare 'queue' elsewhere is the data structure.
 */
const BUILD_CONCEPTS = {
  // ── Web & UI ──────────────────────────────────────────────────────────────
  'cs.web-fundamentals': [
    'semantic html', 'html5', 'html', 'css grid', 'flexbox', 'css3', 'css',
    'media queries', 'responsive', 'javascript', 'typescript', 'react hooks',
    'react native', 'react', 'next.js', 'nextjs', 'vite', 'tailwind',
    'dom', 'event delegation', 'localstorage', 'browser', 'lighthouse',
    'accessibility', 'client-side', 'frontend',
    // 'component(s)' is deliberately absent — "connected components" is a
    // graph term and would tag every graph phase as web work.
  ],

  // ── APIs & auth ───────────────────────────────────────────────────────────
  'cs.sd-api': [
    'rest api', 'api endpoint', 'api endpoints', 'endpoints', 'endpoint',
    'crud endpoints', 'express', 'fastapi', 'flask', 'graphql', 'openapi',
    'pagination', 'paginated', 'rate limiting', 'rate limit', 'idempotency',
    'api contract', 'request validation', 'jwt', 'jwts', 'oauth',
    'authentication', 'auth middleware', 'access token', 'refresh token',
    'signup/login', 'login', 'signup',
  ],

  // ── Security ──────────────────────────────────────────────────────────────
  'cs.net-security': [
    'bcrypt', 'password hashing', 'hash passwords', 'encryption', 'encrypt',
    'tls', 'ssl', 'certificate', 'sql injection', 'xss', 'csrf',
    'sanitise', 'sanitize', 'security headers', 'vulnerability', 'firewall',
    'penetration', 'hardening', 'secrets',
  ],

  // ── Databases ─────────────────────────────────────────────────────────────
  'cs.db-sql': [
    'postgresql', 'postgres', 'sqlite', 'mysql', 'sql query', 'sql',
    'migrations', 'migration', 'seed script', 'seeds', 'group by',
  ],
  'cs.db-joins': ['inner join', 'left join', 'joins', 'foreign key', 'relational'],
  'cs.db-normalization': ['normalisation', 'normalization', 'normalise the schema', 'denormalise'],
  'cs.db-indexing': ['indexing', 'add an index', 'indexes', 'query plan', 'query optimisation', 'query optimization'],
  'cs.db-transactions': ['transaction', 'transactions', 'atomicity', 'rollback'],
  'cs.db-concurrency': ['isolation level', 'optimistic locking', 'row lock'],
  'cs.db-nosql': [
    'mongodb', 'nosql', 'document database', 'redis', 'key-value store',
    // 'design the schema' is absent: in a Postgres phase it is followed by
    // "and write SQL migrations", and the longer phrase would outrank it.
    'schema design', 'er diagram',
    // 'data model' / 'model the data' are absent on purpose: in an ML phase
    // ("question → data → model → result") they mean the trained model.
    'vector database', 'vector store',
  ],

  // ── Networking ────────────────────────────────────────────────────────────
  'cs.net-http': ['http', 'https request', 'cors', 'cookies', 'status codes', 'webhook', 'webhooks'],
  'cs.net-sockets': ['websocket', 'websockets', 'socket.io', 'sockets', 'socket', 'real-time', 'realtime', 'presence'],
  'cs.net-dns': ['dns', 'custom domain', 'subdomain'],
  'cs.net-transport': ['tcp', 'udp', 'packet capture', 'port scan'],
  'cs.net-models': ['osi model', 'protocol stack'],
  'cs.net-routing': ['routing table', 'router config', 'subnet'],

  // ── System design ─────────────────────────────────────────────────────────
  'cs.sd-caching': ['caching', 'cache layer', 'cache invalidation', 'cdn', 'cache'],
  'cs.sd-load-balancing': ['load balancer', 'load balancing', 'reverse proxy', 'nginx'],
  'cs.sd-queues': [
    'message queue', 'kafka', 'rabbitmq', 'celery', 'background job',
    'background worker', 'job queue', 'pub/sub', 'event-driven',
    'async processing', 'event loop',
  ],
  'cs.sd-scalability': ['horizontal scaling', 'autoscaling', 'sharding', 'partitioning', 'replication', 'scalability', 'throughput'],
  'cs.sd-cap': ['eventual consistency', 'cap theorem', 'distributed system', 'distributed systems', 'consensus'],

  // ── Engineering practice ──────────────────────────────────────────────────
  'cs.git': ['pull request', 'version control', 'feature commits', 'branching', 'commit', 'commits', 'github repo', 'git'],
  'cs.testing': [
    'unit test', 'unit tests', 'integration test', 'integration tests',
    'test suite', 'pytest', 'jest', 'vitest', 'test coverage', 'testing',
    'debugging', 'code review', 'linting', 'ci pipeline', 'ci/cd',
  ],
  'comm.documentation': ['readme', 'documentation', 'api docs', 'document every endpoint', 'technical writing'],

  // ── OOP & design ──────────────────────────────────────────────────────────
  'cs.oop-encapsulation': ['encapsulation', 'access modifiers'],
  'cs.oop-inheritance': ['inheritance', 'subclass'],
  'cs.oop-polymorphism': ['polymorphism', 'method overriding', 'method overloading'],
  'cs.oop-abstraction': ['abstract class', 'interface', 'interfaces'],
  'cs.oop-solid': ['solid principles', 'single responsibility', 'dependency injection'],
  'cs.design-patterns': ['design pattern', 'design patterns', 'singleton', 'observer pattern', 'strategy pattern', 'factory pattern', 'mvc'],

  // ── Operating systems ─────────────────────────────────────────────────────
  'cs.os-threads': ['multithreading', 'worker threads', 'concurrency', 'thread pool', 'threads'],
  'cs.os-synchronization': ['mutex', 'semaphore', 'race condition', 'critical section'],
  'cs.os-processes': ['child process', 'subprocess', 'process management'],
  'cs.os-memory': ['memory management', 'garbage collection', 'memory leak'],
  'cs.os-file-systems': ['file system', 'file i/o', 'disk usage'],

  // ── DSA (the dsa domain's projects are algorithm builds) ──────────────────
  'dsa.complexity': ['time complexity', 'space complexity', 'big-o', 'complexity analysis', 'benchmark'],
  'dsa.recursion': ['recursion', 'recursive', 'base case'],
  'dsa.sorting': ['sorting algorithm', 'merge sort', 'quick sort', 'quicksort', 'bubble sort', 'insertion sort', 'sorting'],
  'dsa.binary-search': ['binary search'],
  'dsa.hashing': ['hash map', 'hashmap', 'hash table', 'hash set'],
  'dsa.arrays': ['array traversal', 'two-dimensional array'],
  'dsa.strings': ['string matching', 'palindrome', 'anagram'],
  'dsa.two-pointers': ['two pointers'],
  'dsa.sliding-window': ['sliding window'],
  'dsa.linked-list': ['linked list'],
  // Bare 'stack' is banned — "tech stack", "full stack" and "protocol stack"
  // are all common in build prose and none of them is the data structure.
  'dsa.stack': ['stack and queue', 'undo stack', 'call stack', 'stack of nodes'],
  'dsa.queue': ['queue', 'deque'],
  'dsa.cycle-detection': ['cycle detection', 'detect a cycle'],
  'dsa.heap': ['priority queue', 'min-heap', 'max-heap', 'heap'],
  // 'autocomplete' is NOT here: "no IDE autocomplete" is a practice rule in
  // build prose, not a mention of the data structure.
  'dsa.trie': ['trie', 'prefix tree'],
  'dsa.binary-tree': ['binary tree', 'tree node'],
  'dsa.tree-traversal': ['tree traversal', 'level order', 'inorder'],
  'dsa.bst': ['binary search tree'],
  'dsa.segment-tree': ['segment tree', 'fenwick tree'],
  // Bare 'graph' is banned too: a "social graph" or a "bar graph" is not the
  // DSA topic, and the graph-theory video would be the wrong thing to offer.
  'dsa.graph-basics': ['adjacency list', 'adjacency matrix', 'graph representation', 'graph traversal', 'weighted graph'],
  'dsa.bfs': ['breadth-first', 'bfs'],
  'dsa.dfs': ['depth-first', 'dfs'],
  'dsa.shortest-path': ['dijkstra', 'shortest path', 'a* search'],
  'dsa.topological-sort': ['topological sort'],
  'dsa.union-find': ['union-find', 'disjoint set'],
  'dsa.mst': ['minimum spanning tree', 'kruskal', 'prim'],
  'dsa.dynamic-programming': ['dynamic programming', 'memoisation', 'memoization', 'memoised', 'memoized', 'bottom-up', 'recursive relation', 'recurrence', 'recurrences'],
  'dsa.dp-knapsack': ['knapsack', 'subset sum', 'coin change'],
  'dsa.dp-strings': ['longest common subsequence', 'longest increasing subsequence', 'edit distance'],
  'dsa.backtracking': ['backtracking', 'n-queens', 'sudoku solver'],
  'dsa.greedy': ['greedy'],
  'dsa.bit-manipulation': ['bit manipulation', 'bitwise', 'bitmask'],
  'dsa.problem-solving': ['algorithm', 'algorithms', 'data structure', 'data structures'],
};

// Fail loudly in development if a mapping points at a skill that does not
// exist — a typo here would silently drop concepts from every phase.
const CONCEPT_INDEX = [];
for (const [skill, phrases] of Object.entries(BUILD_CONCEPTS)) {
  if (!isKnownSkill(skill)) {
    console.warn(`[projectJourney] unknown skill id "${skill}" — mapping ignored`);
    continue;
  }
  for (const phrase of phrases) {
    const p = normalise(phrase);
    if (p.length < 4) continue;
    CONCEPT_INDEX.push({ phrase: p, skill });
  }
}
// Longest first so 'binary search tree' cannot be eaten by 'binary search'.
CONCEPT_INDEX.sort((a, b) => b.phrase.length - a.phrase.length);

/**
 * Lowercase, collapse to letters/digits/a few code characters. `&` becomes
 * "and" (same as lib/skillTaxonomy's norm) so "Stack & Queue" and "stack and
 * queue" are one phrase rather than two spellings to maintain.
 */
function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#./*-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whole-word occurrences only — 'git' must not match inside 'digit'. */
function isBoundary(ch) {
  return ch === undefined || !/[a-z0-9]/.test(ch);
}

/**
 * Every concept a piece of build prose mentions, in match order.
 *
 * A matched span is BLANKED OUT before the next (shorter) phrase is tried, so
 * "message queue" is a queueing concept and does not also register as the
 * `dsa.queue` data structure.
 *
 * @param {string} text
 * @param {number} limit  keep the chip row readable
 * @returns {string[]} taxonomy skill ids, deduped
 */
export function conceptsIn(text, limit = 4) {
  let hay = ` ${normalise(text)} `;
  const found = [];

  for (const { phrase, skill } of CONCEPT_INDEX) {
    if (found.length >= limit) break;
    let i = hay.indexOf(phrase);
    let hit = false;
    while (i !== -1) {
      if (isBoundary(hay[i - 1]) && isBoundary(hay[i + phrase.length])) {
        hit = true;
        hay = hay.slice(0, i) + ' '.repeat(phrase.length) + hay.slice(i + phrase.length);
      }
      i = hay.indexOf(phrase, i + phrase.length);
    }
    if (hit && !found.includes(skill)) found.push(skill);
  }

  return found;
}

// ─────────────────────────────────────────────────────────────────────────────
// Time estimates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hours a student at this difficulty spends on one authored step.
 *
 * These are ESTIMATES and the UI says so. They are not measured — nothing in
 * the product records how long a build took yet — so they are derived from one
 * stated assumption rather than dressed up as data: a step is a sitting, and a
 * sitting gets longer the less you have done before.
 */
const HOURS_PER_STEP = { beginner: 1.5, intermediate: 2.5, advanced: 4, expert: 5.5 };

/**
 * Phases are not equal sized. The authored shape across the whole catalog is
 * setup → core feature → polish/ship, and the middle one is where the work is.
 */
function phaseWeight(index, total) {
  if (total <= 1) return 1;
  if (index === 0) return 0.7;                 // foundation: scaffolding
  if (index === total - 1) return 0.9;         // polish & ship
  return 1.4;                                  // the core build
}

/**
 * @returns {{min: number, max: number, label: string}} whole hours, ±
 */
function estimateHours(steps, difficulty, index, total) {
  const base = HOURS_PER_STEP[difficulty] ?? HOURS_PER_STEP.intermediate;
  const hours = (steps?.length || 1) * base * phaseWeight(index, total);
  const min = Math.max(1, Math.round(hours * 0.75));
  const max = Math.max(min + 1, Math.round(hours * 1.35));
  return { min, max, label: `${min}–${max} h` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Journey assembly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enrich one catalog project into a guided build path.
 *
 * @param {object} project  an entry from DOMAIN_PROJECTS
 * @param {string} domain   domains.slug
 * @param {Set<string>} usedVideos  video slugs already spent on this project,
 *                                  so a three-phase build does not show the
 *                                  same video three times
 */
function buildPath(project, domain, usedVideos) {
  const total = project.phases.length;
  // Project-wide signal, used only to top up a phase whose own steps said
  // little. The title matters here: "Linked List Library" names its subject
  // once and then never repeats it inside the phase steps.
  const projectText = `${project.title} ${project.description} ${(project.tech || []).join(' ')}`;

  const phases = project.phases.map((phase, index) => {
    const fromSteps = conceptsIn(`${phase.name} ${phase.steps.join(' ')}`, 4);
    const skills = fromSteps.length >= 2
      ? fromSteps
      : [...new Set([...fromSteps, ...conceptsIn(projectText, 3)])].slice(0, 4);

    // One curated video per phase, at most, and never a repeat inside the same
    // project. videoFor() returns null for a skill nobody has curated — we show
    // nothing rather than falling back to a search page.
    //
    // Two extra rules, both there because a *study* video and a *build* phase
    // are not the same thing:
    //   · only the phase's two most specific concepts may pull a video, so a
    //     third-place tag cannot drag in something off-topic;
    //   · the video's OWN first skill must be the one we asked for. Curated
    //     entries carry secondary tags — the DNS explainer is also tagged
    //     `cs.net-security` — and a secondary tag means "this touches it", not
    //     "this teaches it". Without the check, a phase about password hashing
    //     was offered a video about DNS.
    let video = null;
    for (const skill of skills.slice(0, 2)) {
      const candidate = videoFor({ skills: [skill] });
      if (candidate && candidate.skills?.[0] === skill && !usedVideos.has(candidate.slug)) {
        video = candidate;
        usedVideos.add(candidate.slug);
        break;
      }
    }

    // Study sheet for the first skill that has one.
    let sheet = null;
    for (const skill of skills) {
      const s = sheetForSkill(skill);
      if (s) { sheet = { id: s.id, title: s.title }; break; }
    }

    return {
      index,
      name: phase.name,
      steps: phase.steps,
      skills: skills.map(id => ({ id, label: skillLabel(id) })),
      hours: estimateHours(phase.steps, project.difficulty, index, total),
      video: publicVideo(video),
      sheet,
    };
  });

  const totalHours = phases.reduce(
    (acc, p) => ({ min: acc.min + p.hours.min, max: acc.max + p.hours.max }),
    { min: 0, max: 0 },
  );

  return {
    key: projectKey(domain, project.week, project.title),
    week: project.week,
    title: project.title,
    difficulty: project.difficulty,
    tier: tierForDifficulty(project.difficulty),
    phaseCount: phases.length,
    totalHours,
    phases,
  };
}

/**
 * The whole guided journey for a domain, in the catalog's authored order.
 * Falls back to the fullstack track for a domain with no templates — the same
 * fallback /projects already uses, kept identical so both agree on the list.
 */
export function buildJourney(domain) {
  const projects = DOMAIN_PROJECTS[domain] || DOMAIN_PROJECTS.fullstack;
  const usedVideos = new Set();
  return projects.map(p => buildPath(p, domain, usedVideos));
}

/** Every valid project key for a domain — the API's write allowlist. */
export function journeyKeys(domain) {
  const projects = DOMAIN_PROJECTS[domain] || DOMAIN_PROJECTS.fullstack;
  return new Map(
    projects.map(p => [projectKey(domain, p.week, p.title), p.phases.length]),
  );
}
