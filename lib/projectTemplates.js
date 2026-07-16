/**
 * Hand-curated portfolio project templates, keyed by domains.slug (DB values:
 * fullstack, dsa, ml, ai, ds, cybersec, cloud, mobile, devops, sysdesign).
 *
 * Every project ships with:
 *  - phases        : phased implementation guidance (rendered instead of the old flat steps grid)
 *  - tech          : realistic stack the student should actually use
 *  - resumeBullets : copy-ready, impact-oriented resume lines (quantify only what the project itself defines)
 *  - deploy        : where/how to ship THAT stack — real services only
 *  - searchTerms   : feeds githubSearchUrl() below
 *
 * DB rows for these templates are created lazily by /api/projects/submit on first
 * submission, so this file is the single source of truth for the catalog.
 */

// Same anti-hallucination pattern as the YouTube search links in
// lib/dsaCurriculumLevels.js: never store repo URLs (they rot or get invented) —
// link a live GitHub search for the project's key terms instead.
export function githubSearchUrl(terms) {
  return `https://github.com/search?q=${encodeURIComponent(terms)}&type=repositories`;
}

export const DOMAIN_PROJECTS = {
  fullstack: [
    {
      week: 4, title: 'Personal Portfolio Website', difficulty: 'beginner',
      description: 'Build a responsive portfolio with HTML/CSS showing your profile, skills, and contact form',
      phases: [
        { name: 'Foundation', steps: ['Set up the project in VS Code with a clean folder structure (index.html, css/, assets/)', 'Write semantic HTML — header, hero, skills, projects, contact sections', 'Initialise git and make your first commit'] },
        { name: 'Core build', steps: ['Style with CSS Grid/Flexbox; make it responsive down to 360px with media queries', 'Add a contact form with HTML5 validation (required, email pattern)', 'Add smooth-scroll navigation and a mobile menu'] },
        { name: 'Polish & ship', steps: ['Run Lighthouse and fix image sizes/alt text until scores are green', 'Push to a public GitHub repo with a README and screenshot', 'Deploy and put the live URL in your GitHub bio and resume'] },
      ],
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Git'],
      resumeBullets: [
        'Designed and shipped a fully responsive personal portfolio (semantic HTML5, CSS Grid/Flexbox) that works down to 360px-wide screens',
        'Implemented client-side form validation and accessible, keyboard-navigable UI; deployed to production with a custom URL',
        'Managed the project end-to-end with git — feature commits, README documentation, and a live deployment',
      ],
      deploy: { platform: 'GitHub Pages / Netlify / Vercel', notes: ['Pure static site: enable GitHub Pages on the repo (Settings → Pages → deploy from main), or drag-and-drop the folder into Netlify', 'No build step needed — what you push is what gets served'] },
      searchTerms: 'personal portfolio website html css javascript responsive',
    },
    {
      week: 8, title: 'JavaScript Quiz App', difficulty: 'beginner',
      description: 'Build an interactive quiz app with timer, score tracking, and local storage',
      phases: [
        { name: 'Foundation', steps: ['Lay out the quiz screen states in HTML/CSS: start, question, result', 'Model questions as a JS array of {question, options, answerIndex}'] },
        { name: 'Core build', steps: ['Render questions dynamically and handle answer clicks with event delegation', 'Add a per-question countdown timer that auto-advances on zero', 'Track score and show a result summary with correct answers'] },
        { name: 'Polish & ship', steps: ['Persist high scores in localStorage and show a best-score board', 'Add keyboard support (1-4 to answer) and a progress bar', 'Deploy and link from your portfolio'] },
      ],
      tech: ['HTML5', 'CSS3', 'JavaScript (DOM, events, localStorage)'],
      resumeBullets: [
        'Built a state-driven quiz application in vanilla JavaScript with per-question countdown timers and automatic progression',
        'Persisted high scores with the localStorage API and rendered a results breakdown showing correct vs chosen answers',
        'Used event delegation and DOM templating instead of frameworks, keeping the app dependency-free',
      ],
      deploy: { platform: 'GitHub Pages / Netlify', notes: ['Static app — same flow as the portfolio: push to GitHub, enable Pages', 'Test on a phone after deploying; timers and tap targets behave differently on mobile'] },
      searchTerms: 'quiz app vanilla javascript timer localstorage',
    },
    {
      week: 12, title: 'React Todo App with Authentication', difficulty: 'beginner',
      description: 'Full todo app with React hooks, user auth, and persistent storage',
      phases: [
        { name: 'Foundation', steps: ['Scaffold with Vite (npm create vite@latest) and clean the template', 'Build TodoList/TodoItem/AddTodo components with useState', 'Lift state up and pass handlers down as props'] },
        { name: 'Core build', steps: ['Create a Supabase project; add email/password auth with signup + login forms', 'Store todos in a Supabase table keyed by user id; protect routes for logged-out users', 'Wire CRUD: add, toggle complete, delete, edit inline'] },
        { name: 'Polish & ship', steps: ['Add filters (all/active/done) with useMemo', 'Handle loading and error states for every network call', 'Deploy to Vercel with Supabase keys in environment variables'] },
      ],
      tech: ['React', 'Vite', 'Supabase (auth + Postgres)', 'CSS'],
      resumeBullets: [
        'Developed a multi-user todo application in React with Supabase email/password authentication and per-user data isolation',
        'Implemented full CRUD against a hosted Postgres table with optimistic UI updates and explicit loading/error states',
        'Deployed to Vercel with environment-based configuration, keeping API keys out of the repository',
      ],
      deploy: { platform: 'Vercel', notes: ['Import the GitHub repo in Vercel — Vite is auto-detected', 'Add SUPABASE_URL / ANON_KEY as environment variables in the Vercel dashboard, never commit them'] },
      searchTerms: 'react todo app supabase authentication vite',
    },
    {
      week: 16, title: 'REST API with Node.js', difficulty: 'intermediate',
      description: 'Build a complete REST API with Express, JWT auth, and PostgreSQL',
      phases: [
        { name: 'Foundation', steps: ['Set up Express with a layered structure: routes → controllers → services → db', 'Design the schema (users, items) and write SQL migrations', 'Add dotenv config and a Postgres connection pool'] },
        { name: 'Core build', steps: ['Implement signup/login issuing JWTs (bcrypt for password hashing)', 'Write auth middleware that verifies the token and attaches the user', 'Build CRUD endpoints for items with ownership checks (users only touch their rows)'] },
        { name: 'Polish & ship', steps: ['Validate request bodies (zod or express-validator) and return consistent error JSON', 'Add rate limiting on auth routes', 'Document every endpoint in the README with example curl commands; deploy'] },
      ],
      tech: ['Node.js', 'Express', 'PostgreSQL', 'JWT', 'bcrypt'],
      resumeBullets: [
        'Designed and built a REST API (Express + PostgreSQL) with JWT authentication, bcrypt password hashing, and per-user resource ownership enforcement',
        'Structured the codebase in layers (routes/controllers/services) with request validation and consistent error envelopes across all endpoints',
        'Deployed the API with a managed Postgres instance and documented every endpoint with runnable curl examples',
      ],
      deploy: { platform: 'Render / Railway', notes: ['Create a free Web Service from the GitHub repo (start command: node src/index.js) plus a free PostgreSQL instance', 'Set DATABASE_URL and JWT_SECRET as environment variables; run migrations once via the service shell'] },
      searchTerms: 'express rest api jwt postgresql node',
    },
    {
      week: 20, title: 'Full Stack Blog Platform', difficulty: 'intermediate',
      description: 'Complete blog with React frontend, Node backend, PostgreSQL database',
      phases: [
        { name: 'Foundation', steps: ['Create a monorepo layout: /client (React) and /server (Express)', 'Design tables: users, posts, comments — write migrations and seeds', 'Reuse your week-16 auth pattern (JWT middleware) in the server'] },
        { name: 'Core build', steps: ['Build post CRUD endpoints with pagination and an author-only edit rule', 'Create the React feed, post page, and a markdown editor for writing', 'Add comments with nested display'] },
        { name: 'Polish & ship', steps: ['Add slugs for post URLs and basic SEO tags', 'Handle empty states (no posts, no comments) deliberately', 'Deploy client and server separately and wire the API base URL via env'] },
      ],
      tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Markdown rendering'],
      resumeBullets: [
        'Built a full-stack blog platform (React + Express + PostgreSQL) with JWT auth, markdown authoring, comments, and paginated feeds',
        'Modelled relational data across users/posts/comments with migrations and seed scripts for reproducible local setup',
        'Deployed frontend and backend independently with environment-driven API configuration',
      ],
      deploy: { platform: 'Vercel (client) + Render (API + Postgres)', notes: ['Deploy the React app to Vercel and the Express API to Render with its free Postgres', 'Set the client’s API base URL via a VITE_/NEXT_PUBLIC_ env var; enable CORS for the client origin only'] },
      searchTerms: 'fullstack blog platform react express postgresql',
    },
    {
      week: 24, title: 'E-commerce App with Next.js', difficulty: 'advanced',
      description: 'Full e-commerce with product listing, cart, payments, and admin panel',
      phases: [
        { name: 'Foundation', steps: ['Scaffold Next.js (App Router); model products, orders, cart in Postgres (Prisma or Supabase)', 'Build the product listing with server-side data fetching and a product detail page'] },
        { name: 'Core build', steps: ['Implement a cart (context or zustand) that survives refresh', 'Integrate a payment sandbox — Stripe test mode or Razorpay test keys — for checkout', 'Record orders on successful payment webhooks'] },
        { name: 'Polish & ship', steps: ['Build an admin area (protected route) for product CRUD and order status', 'Add image optimisation with next/image and loading skeletons', 'Deploy to Vercel; keep webhook secrets in env vars'] },
      ],
      tech: ['Next.js (App Router)', 'PostgreSQL + Prisma/Supabase', 'Stripe or Razorpay (test mode)', 'zustand/Context'],
      resumeBullets: [
        'Built an end-to-end e-commerce application in Next.js with product catalog, persistent cart, sandboxed payment checkout, and webhook-driven order recording',
        'Implemented an admin panel with protected routes for product and order management',
        'Optimised product pages with server-side rendering and next/image, deployed on Vercel',
      ],
      deploy: { platform: 'Vercel', notes: ['Import the repo in Vercel — Next.js needs zero config; add DB and payment keys as env vars', 'Point the payment provider’s webhook to /api/webhooks/... using the test dashboard; verify signatures server-side'] },
      searchTerms: 'nextjs ecommerce stripe cart app router',
    },
    {
      week: 28, title: 'Real-time Chat Application', difficulty: 'advanced',
      description: 'Chat app with WebSockets, rooms, message history, and notifications',
      phases: [
        { name: 'Foundation', steps: ['Design the socket event contract first: join_room, message, typing, presence', 'Set up an Express + Socket.io server and a React client that connects with auth'] },
        { name: 'Core build', steps: ['Implement rooms with join/leave and broadcast scoping', 'Persist messages to Postgres and load history on room join (paginated)', 'Show online presence and typing indicators'] },
        { name: 'Polish & ship', steps: ['Add browser notifications (Notification API) for messages in unfocused tabs', 'Handle reconnection gracefully — resend queue, dedupe by message id', 'Deploy the socket server on a host that supports WebSockets'] },
      ],
      tech: ['React', 'Socket.io', 'Node.js', 'PostgreSQL'],
      resumeBullets: [
        'Built a real-time chat system with Socket.io — rooms, presence, typing indicators, and persisted, paginated message history',
        'Designed the WebSocket event contract up front and implemented reconnection with client-side message deduplication',
        'Added browser notifications for background tabs via the Notification API',
      ],
      deploy: { platform: 'Render (server) + Vercel (client)', notes: ['Render’s free web services support WebSockets — deploy the Socket.io server there', 'Serverless platforms don’t hold socket connections; keep the socket server on a long-running host and the React client on Vercel'] },
      searchTerms: 'socket.io chat app rooms react node',
    },
    {
      week: 32, title: 'Social Media Platform', difficulty: 'advanced',
      description: 'Social app with posts, likes, comments, follows, and real-time updates',
      phases: [
        { name: 'Foundation', steps: ['Model the graph: users, posts, likes, comments, follows (composite unique keys on likes/follows)', 'Build auth + profile pages with avatar upload (Supabase Storage or S3-compatible)'] },
        { name: 'Core build', steps: ['Implement the feed query: posts from followed users, newest first, cursor-paginated', 'Add like/comment/follow with counts done in SQL, not client math', 'Push new-post notifications over websockets or polling'] },
        { name: 'Polish & ship', steps: ['Add an explore page and user search', 'Write indexes for the feed query and measure before/after with EXPLAIN', 'Deploy and seed demo accounts so reviewers see a living feed'] },
      ],
      tech: ['Next.js or React+Express', 'PostgreSQL', 'Supabase Storage / S3', 'WebSockets'],
      resumeBullets: [
        'Engineered a social platform with follow-graph feeds, likes, and nested comments backed by cursor-based pagination in PostgreSQL',
        'Optimised the home-feed query with composite indexes, validating improvements with EXPLAIN ANALYZE',
        'Implemented media upload to object storage and real-time new-post updates',
      ],
      deploy: { platform: 'Vercel + Supabase (or Render)', notes: ['Supabase gives you Postgres, auth, storage, and realtime in one free project — ideal for this build', 'Seed a few demo users/posts in production so the deployed app never looks empty'] },
      searchTerms: 'social media clone feed follow postgresql nextjs',
    },
    {
      week: 40, title: 'SaaS Application', difficulty: 'expert',
      description: 'Complete SaaS product with subscriptions, dashboard, and analytics',
      phases: [
        { name: 'Foundation', steps: ['Pick one sharp problem (e.g. link-in-bio, uptime pings, form backend) and write a one-page spec', 'Model orgs/workspaces, members, and plan limits in the schema from day one'] },
        { name: 'Core build', steps: ['Build the core feature loop end-to-end before anything else', 'Add subscription tiers with a payment sandbox and plan-limit middleware (e.g. max projects per plan)', 'Create the usage dashboard with charts (recharts or chart.js)'] },
        { name: 'Polish & ship', steps: ['Add onboarding: empty states that teach, a demo workspace, docs page', 'Instrument key events (signup, activation, limit-hit) into an events table', 'Deploy, then write a launch-style README with screenshots and architecture diagram'] },
      ],
      tech: ['Next.js', 'PostgreSQL', 'Stripe/Razorpay (test mode)', 'recharts'],
      resumeBullets: [
        'Designed and shipped a multi-tenant SaaS product with workspaces, role-based membership, subscription tiers, and plan-limit enforcement middleware',
        'Built a usage-analytics dashboard driven by an append-only events table',
        'Owned the full lifecycle — spec, schema, implementation, deployment, and documentation with architecture diagrams',
      ],
      deploy: { platform: 'Vercel + managed Postgres', notes: ['Vercel for the app; Neon or Supabase for Postgres (both have free tiers)', 'Keep payment provider in test mode and say so in the README — reviewers care about the integration, not real money'] },
      searchTerms: 'saas starter nextjs subscriptions multi-tenant',
    },
    {
      week: 52, title: 'Portfolio Capstone Project', difficulty: 'expert',
      description: 'Your best project combining all skills - deploy and present to employers',
      phases: [
        { name: 'Foundation', steps: ['Choose a problem you genuinely hit — the story matters in interviews', 'Write the spec: users, core flows, non-goals, success criteria', 'Design the schema and system diagram before coding'] },
        { name: 'Core build', steps: ['Build the core loop first, deploy in week one, iterate on production', 'Add auth, persistence, and one “hard” differentiator (realtime, search, AI, offline)', 'Write tests for the trickiest module'] },
        { name: 'Polish & ship', steps: ['Set up CI (GitHub Actions: lint + test on PR) and auto-deploy on main', 'Record a 2-minute demo video and embed it in the README', 'Write a case study: problem → decisions → trade-offs → results'] },
      ],
      tech: ['Your strongest stack', 'PostgreSQL', 'GitHub Actions CI', 'Vercel/Render'],
      resumeBullets: [
        'Conceived, specified, and shipped a production-deployed capstone application with CI/CD (GitHub Actions) and automated deploys on merge',
        'Documented the system with an architecture diagram, demo video, and a written case study covering design trade-offs',
        'Iterated on a live deployment throughout development instead of a single end-of-project release',
      ],
      deploy: { platform: 'Vercel / Render + GitHub Actions', notes: ['Auto-deploy from main; protect main behind the CI check', 'The README is the product page: screenshots, live URL, demo video, architecture diagram'] },
      searchTerms: 'capstone fullstack project portfolio production',
    },
  ],

  dsa: [
    {
      week: 4, title: 'Array & String Problem Set', difficulty: 'beginner',
      description: 'Solve 20 array and string problems on LeetCode, write C++ solutions with explanations',
      phases: [
        { name: 'Foundation', steps: ['Pick 10 Easy + 10 Medium problems across two-pointers, sliding window, prefix sums', 'Create a repo with one folder per pattern, one file per problem'] },
        { name: 'Core build', steps: ['Solve each with an optimal approach; note the brute force you rejected and why', 'Add a header comment per file: intuition, approach, time/space complexity'] },
        { name: 'Polish & ship', steps: ['Write a README table: problem → pattern → complexity → link', 'Re-solve the 5 hardest from scratch after a week to confirm retention'] },
      ],
      tech: ['C++ (STL)', 'LeetCode', 'Git'],
      resumeBullets: [
        'Solved and documented 20 array/string problems in C++ organised by pattern (two pointers, sliding window, prefix sums) with complexity analysis for each',
        'Maintained a pattern-indexed solutions repository with intuition write-ups, used as a personal revision system',
      ],
      deploy: { platform: 'GitHub', notes: ['This ships as a repository, not a hosted app — the README index IS the interface', 'Pin the repo on your GitHub profile; interviewers do click these'] },
      searchTerms: 'leetcode solutions c++ array string patterns',
    },
    {
      week: 8, title: 'Linked List Library', difficulty: 'beginner',
      description: 'Build a complete linked list implementation in C++ with all operations and visualizer',
      phases: [
        { name: 'Foundation', steps: ['Design Node and List classes (singly first, then doubly) with clear ownership rules', 'Set up a test file that exercises every operation'] },
        { name: 'Core build', steps: ['Implement insert (head/tail/index), delete, search, reverse, middle, cycle detection', 'Manage memory explicitly — destructor frees all nodes; verify with valgrind or ASan'] },
        { name: 'Polish & ship', steps: ['Add a terminal visualizer that prints the list state after each operation', 'Document API + complexity table in the README'] },
      ],
      tech: ['C++', 'valgrind / AddressSanitizer', 'Make or CMake'],
      resumeBullets: [
        'Implemented a memory-safe singly + doubly linked list library in C++ (insert/delete/reverse/cycle-detection) verified leak-free with AddressSanitizer',
        'Built a terminal visualizer for step-by-step operation tracing and documented per-operation complexity',
      ],
      deploy: { platform: 'GitHub (+ GitHub Actions)', notes: ['Add a CI workflow that compiles with -fsanitize=address and runs the test binary on every push', 'Header-only layout makes the library trivially reusable in later projects'] },
      searchTerms: 'linked list implementation c++ library sanitizer',
    },
    {
      week: 12, title: 'Custom Stack & Queue Implementation', difficulty: 'beginner',
      description: 'Implement stack, queue, and deque from scratch in C++ with all edge cases',
      phases: [
        { name: 'Foundation', steps: ['Implement array-backed and linked-node variants of stack and queue', 'Define behaviour for underflow/overflow explicitly (exceptions vs sentinel returns)'] },
        { name: 'Core build', steps: ['Add a circular-buffer deque with amortised O(1) push/pop at both ends', 'Solve two classic applications: balanced parentheses, sliding-window maximum'] },
        { name: 'Polish & ship', steps: ['Package as reusable headers with a demo main.cpp', 'Benchmark array vs linked variants and record the numbers in the README'] },
      ],
      tech: ['C++', 'CMake', 'Google Benchmark (optional)'],
      resumeBullets: [
        'Built stack, queue, and circular-buffer deque data structures from scratch in C++ with explicit edge-case contracts and unit tests',
        'Applied them to classic problems (balanced parentheses, sliding-window maximum) and benchmarked array-backed vs pointer-backed variants',
      ],
      deploy: { platform: 'GitHub', notes: ['Ship as a header-only library with a compile-and-run demo documented in the README', 'A CI badge (build passing) makes library repos look maintained'] },
      searchTerms: 'stack queue deque implementation c++ from scratch',
    },
    {
      week: 16, title: 'Binary Tree Visualizer', difficulty: 'intermediate',
      description: 'Build a C++ program that builds and visualizes binary trees with all traversals',
      phases: [
        { name: 'Foundation', steps: ['Implement TreeNode + level-order insertion from an array (LeetCode-style null markers)', 'Print the tree sideways in the terminal so structure is visible'] },
        { name: 'Core build', steps: ['Implement all four traversals (pre/in/post/level) both recursive and iterative', 'Add height, node count, mirror, and validity-check (is-BST) utilities'] },
        { name: 'Polish & ship', steps: ['Animate traversals: reprint the tree highlighting the current node with ANSI colors', 'Accept trees from stdin or a file so others can play with it'] },
      ],
      tech: ['C++', 'ANSI terminal escapes'],
      resumeBullets: [
        'Built a terminal binary-tree visualizer in C++ with animated pre/in/post/level-order traversals (recursive and iterative implementations)',
        'Implemented tree utilities — height, mirroring, BST validation — over a LeetCode-compatible array constructor',
      ],
      deploy: { platform: 'GitHub', notes: ['Include an asciinema recording or GIF of the animation in the README — visual repos get stars', 'Provide sample input files so it runs in one command'] },
      searchTerms: 'binary tree visualizer terminal c++ traversal',
    },
    {
      week: 20, title: 'Graph Problem Solver', difficulty: 'intermediate',
      description: 'Implement BFS, DFS, Dijkstra, and Kruskal in C++ with a graph visualizer',
      phases: [
        { name: 'Foundation', steps: ['Build an adjacency-list Graph class supporting directed/undirected + weighted edges', 'Load graphs from simple edge-list text files'] },
        { name: 'Core build', steps: ['Implement BFS/DFS (path reconstruction included)', 'Implement Dijkstra with a priority queue and Kruskal with union-find', 'Emit Graphviz DOT output so results can be rendered as images'] },
        { name: 'Polish & ship', steps: ['Add a CLI: solver <file> --algo dijkstra --from A --to F', 'Include rendered example graphs in the README (dot -Tpng)'] },
      ],
      tech: ['C++', 'STL priority_queue', 'Graphviz DOT'],
      resumeBullets: [
        'Implemented BFS, DFS, Dijkstra (binary-heap based), and Kruskal (union-find based) over an adjacency-list graph library in C++',
        'Designed a CLI that loads edge-list files and emits Graphviz DOT visualisations of paths and spanning trees',
      ],
      deploy: { platform: 'GitHub', notes: ['Commit the rendered PNGs — reviewers should see results without installing Graphviz', 'Document the file format and every CLI flag in the README'] },
      searchTerms: 'graph algorithms c++ dijkstra kruskal visualizer',
    },
    {
      week: 24, title: 'DP Problem Collection', difficulty: 'advanced',
      description: 'Solve 30 DP problems with detailed explanations, time/space analysis in C++',
      phases: [
        { name: 'Foundation', steps: ['Pick 30 problems covering the core families: knapsack, LIS, grid paths, partition, strings (LCS/edit distance), state machines', 'One file per problem, grouped by family'] },
        { name: 'Core build', steps: ['For each: write the recursive relation first as a comment, then memoised top-down, then bottom-up', 'Note the space optimisation where one exists (2 rows → 1 row)'] },
        { name: 'Polish & ship', steps: ['Write a README “DP decision guide”: how to spot the family from the problem statement', 'Re-derive the 10 hardest recurrences on paper a week later'] },
      ],
      tech: ['C++', 'LeetCode/Codeforces'],
      resumeBullets: [
        'Solved 30 dynamic-programming problems across six pattern families in C++, documenting the recurrence, memoised, and tabulated forms for each',
        'Authored a pattern-recognition guide mapping problem statements to DP families, with space-optimisation notes per problem',
      ],
      deploy: { platform: 'GitHub', notes: ['The decision-guide README is the differentiator — most solution dumps have no synthesis', 'Cross-link each family section to your solved files'] },
      searchTerms: 'dynamic programming patterns c++ solutions knapsack lis',
    },
    {
      week: 28, title: 'Competitive Programming Toolkit', difficulty: 'advanced',
      description: 'Build a C++ template with all common algorithms ready for competitive programming',
      phases: [
        { name: 'Foundation', steps: ['Create a base template: fast IO, typedefs, debug macros gated behind #ifdef LOCAL', 'Organise snippets by topic: math, graphs, strings, DS'] },
        { name: 'Core build', steps: ['Add tested implementations: sieve, modpow/modinv, DSU, segment tree (point update + range query), Fenwick, KMP, Dijkstra', 'Every snippet gets a small verification against a known problem'] },
        { name: 'Polish & ship', steps: ['Add a stress-testing script: brute force vs optimised on random inputs', 'Use the toolkit in 3 live contests and note what was missing'] },
      ],
      tech: ['C++17', 'Bash/Python stress scripts', 'Codeforces/AtCoder'],
      resumeBullets: [
        'Built and battle-tested a competitive programming toolkit in C++17 — DSU, segment tree, Fenwick tree, KMP, modular arithmetic — each verified against judge problems',
        'Wrote a stress-testing harness comparing brute-force and optimised solutions on randomised inputs to catch edge-case bugs pre-submission',
      ],
      deploy: { platform: 'GitHub', notes: ['Verification links per snippet (which judge problem proves it) give the repo credibility', 'Keep snippets copy-paste sized — that’s how they’re used in contests'] },
      searchTerms: 'competitive programming template c++ segment tree dsu',
    },
    {
      week: 36, title: 'LeetCode 100 Challenge', difficulty: 'expert',
      description: 'Solve 100 LeetCode problems (easy/medium/hard mix) and document all solutions',
      phases: [
        { name: 'Foundation', steps: ['Plan the split (e.g. 30 easy / 55 medium / 15 hard) across all major topics', 'Set a sustainable cadence (~3/day) and a tracking sheet'] },
        { name: 'Core build', steps: ['Commit solutions organised by pattern with a standard header (intuition, complexity, pitfalls)', 'For every hard problem, write the “why my first approach failed” note'] },
        { name: 'Polish & ship', steps: ['Generate a progress table in the README (script it — that’s a mini-project itself)', 'Write a summary post: 5 patterns that covered 80% of problems'] },
      ],
      tech: ['C++ or your interview language', 'Python (tracking script)'],
      resumeBullets: [
        'Completed a structured 100-problem LeetCode challenge across all major DSA topics, with per-problem intuition notes and complexity analysis',
        'Automated repo progress tracking with a Python script that regenerates the README index from solution files',
      ],
      deploy: { platform: 'GitHub', notes: ['The auto-generated index script doubles as proof of scripting skill', 'Consistency of the commit history itself demonstrates discipline'] },
      searchTerms: 'leetcode 100 solutions documented patterns',
    },
    {
      week: 44, title: 'Mock Interview Preparation', difficulty: 'expert',
      description: 'Complete 50 mock interview problems with time constraints and explanations',
      phases: [
        { name: 'Foundation', steps: ['Select 50 frequently-asked questions (company-tagged lists) across difficulty', 'Set up a strict protocol: 45-minute timer, no IDE autocomplete, think aloud'] },
        { name: 'Core build', steps: ['Do 2-3 timed sessions per week; record outcome, time used, and mistakes', 'Write the verbal explanation you gave (or should have given) after each'] },
        { name: 'Polish & ship', steps: ['Build a mistake taxonomy (off-by-one, missed edge case, wrong DS choice) and tally it', 'Do 5 sessions with a peer or on a mock platform and compare notes'] },
      ],
      tech: ['Whiteboard / plain editor', 'Timer', 'Peer mocks'],
      resumeBullets: [
        'Completed 50 timed mock-interview problems under realistic constraints, maintaining written solution walkthroughs and a categorised error log',
        'Reduced recurring mistake categories by tracking a personal error taxonomy across sessions',
      ],
      deploy: { platform: 'GitHub (notes repo)', notes: ['This ships as a study-system repo: protocol, logs, taxonomy, retrospectives', 'The error-taxonomy table is a genuinely interesting interview talking point'] },
      searchTerms: 'coding interview preparation timed practice log',
    },
    {
      week: 52, title: 'Complete DSA Portfolio', difficulty: 'expert',
      description: 'GitHub repo with all solutions, complexity analysis, and study notes',
      phases: [
        { name: 'Foundation', steps: ['Consolidate all previous repos into one organised portfolio (or a pinned index repo)', 'Standardise file headers and folder naming across everything'] },
        { name: 'Core build', steps: ['Write topic README-s: your own explanation of each DS/algorithm in your words', 'Fill gaps: any classic topic with zero solved problems gets three'] },
        { name: 'Polish & ship', steps: ['Create the master README: topics → notes → best solutions, with your stats', 'Add the repo to your resume and LinkedIn; pin it on GitHub'] },
      ],
      tech: ['Git', 'Markdown', 'Everything you built this year'],
      resumeBullets: [
        'Curated a complete DSA portfolio — implementations, 150+ solved problems, and original study notes — organised by topic with complexity references',
        'Wrote explanatory notes for every major data structure and algorithm family, demonstrating depth beyond solution-copying',
      ],
      deploy: { platform: 'GitHub', notes: ['One pinned, polished index repo beats ten scattered ones', 'Link every claim on your resume directly to a folder in this repo'] },
      searchTerms: 'dsa portfolio notes solutions complexity github',
    },
  ],
  ml: [
    {
      week: 4, title: 'House Price Predictor', difficulty: 'beginner',
      description: 'Train a regression model on a housing dataset and evaluate it properly',
      phases: [
        { name: 'Foundation', steps: ['Load a public housing dataset (e.g. California housing) with pandas', 'Do EDA: distributions, correlations, missing values — plot them'] },
        { name: 'Core build', steps: ['Split train/test; build a scikit-learn pipeline (impute → scale → LinearRegression)', 'Compare against a RandomForestRegressor baseline', 'Evaluate with RMSE and R², not just training accuracy'] },
        { name: 'Polish & ship', steps: ['Plot predicted vs actual and residuals', 'Write a notebook that tells the story: question → data → model → result', 'Export the model with joblib'] },
      ],
      tech: ['Python', 'pandas', 'scikit-learn', 'matplotlib', 'Jupyter'],
      resumeBullets: [
        'Built and evaluated regression models (linear and random forest) for housing price prediction with scikit-learn pipelines, reporting RMSE/R² on a held-out test set',
        'Performed exploratory data analysis and residual diagnostics to justify feature and model choices',
      ],
      deploy: { platform: 'Kaggle / Google Colab / GitHub', notes: ['Publish the notebook on Kaggle or link a Colab badge from the repo so it runs in one click', 'Commit the .ipynb with outputs rendered — GitHub previews notebooks inline'] },
      searchTerms: 'house price prediction regression scikit-learn notebook',
    },
    {
      week: 10, title: 'Image Classifier (CNN)', difficulty: 'intermediate',
      description: 'Train a convolutional neural network to classify images and analyse errors',
      phases: [
        { name: 'Foundation', steps: ['Pick a dataset (CIFAR-10 or a Kaggle image set); build a tf.data / DataLoader pipeline', 'Set up train/val/test splits and data augmentation'] },
        { name: 'Core build', steps: ['Build a small CNN from scratch and train it; track train vs val curves', 'Then fine-tune a pretrained backbone (ResNet/MobileNet) and compare', 'Add early stopping and checkpointing'] },
        { name: 'Polish & ship', steps: ['Plot a confusion matrix and inspect the worst misclassifications', 'Write up what transfer learning bought you (accuracy + training time)', 'Save the model and a small inference script'] },
      ],
      tech: ['Python', 'PyTorch or TensorFlow/Keras', 'NumPy', 'matplotlib'],
      resumeBullets: [
        'Trained a CNN image classifier from scratch and via transfer learning (pretrained ResNet/MobileNet), quantifying the accuracy and training-time gains from transfer learning',
        'Diagnosed model errors with confusion matrices and misclassification review, and applied augmentation + early stopping to curb overfitting',
      ],
      deploy: { platform: 'Hugging Face Spaces / Colab', notes: ['Wrap inference in a Gradio app and deploy free on Hugging Face Spaces for a shareable live demo', 'Colab with a GPU runtime is the standard free training environment — link the notebook'] },
      searchTerms: 'image classifier cnn transfer learning pytorch',
    },
    {
      week: 18, title: 'Sentiment Analysis Pipeline', difficulty: 'intermediate',
      description: 'Build an end-to-end NLP pipeline that classifies text sentiment',
      phases: [
        { name: 'Foundation', steps: ['Load a labelled text dataset (reviews/tweets); clean and explore class balance', 'Establish a TF-IDF + LogisticRegression baseline'] },
        { name: 'Core build', steps: ['Fine-tune a small transformer (DistilBERT) with Hugging Face Transformers', 'Compare baseline vs transformer on the same test split (F1, not just accuracy)', 'Handle class imbalance deliberately'] },
        { name: 'Polish & ship', steps: ['Add an inference function that returns label + confidence', 'Document where the model fails (sarcasm, negation)', 'Ship a small demo UI'] },
      ],
      tech: ['Python', 'Hugging Face Transformers', 'scikit-learn', 'pandas'],
      resumeBullets: [
        'Built a text-sentiment classifier, benchmarking a TF-IDF + logistic-regression baseline against a fine-tuned DistilBERT transformer using macro-F1 on a held-out set',
        'Addressed class imbalance and documented systematic failure modes (negation, sarcasm) for the deployed model',
      ],
      deploy: { platform: 'Hugging Face Spaces', notes: ['Push the fine-tuned model to the Hugging Face Hub and serve a Gradio demo on Spaces', 'The Hub model card is your documentation — fill in intended use and limitations'] },
      searchTerms: 'sentiment analysis distilbert huggingface transformers',
    },
    {
      week: 30, title: 'End-to-End ML Web App', difficulty: 'advanced',
      description: 'Serve a trained model behind an API with a frontend and monitoring',
      phases: [
        { name: 'Foundation', steps: ['Take a model you already trained; freeze it and write a clean inference module', 'Design the API contract (input schema, output schema, errors)'] },
        { name: 'Core build', steps: ['Wrap the model in a FastAPI service with input validation (pydantic)', 'Build a simple frontend (Streamlit or a small React page) that calls it', 'Add request logging so you can see real inputs'] },
        { name: 'Polish & ship', steps: ['Containerise with Docker for reproducible deploys', 'Log prediction distributions to watch for drift', 'Write a README with an architecture diagram'] },
      ],
      tech: ['Python', 'FastAPI', 'pydantic', 'Docker', 'Streamlit/React'],
      resumeBullets: [
        'Deployed a trained ML model as a validated FastAPI inference service with a Streamlit frontend, containerised with Docker for reproducible deployment',
        'Instrumented request and prediction-distribution logging to surface input drift in production',
      ],
      deploy: { platform: 'Render / Hugging Face Spaces (Docker)', notes: ['Both Render and HF Spaces can deploy a Dockerfile directly from GitHub', 'Streamlit apps also deploy free on Streamlit Community Cloud if you skip the custom API'] },
      searchTerms: 'fastapi model serving ml web app docker streamlit',
    },
  ],

  ai: [
    {
      week: 4, title: 'AI Chatbot with an LLM API', difficulty: 'beginner',
      description: 'Build a chat interface backed by an LLM API with proper prompt handling',
      phases: [
        { name: 'Foundation', steps: ['Set up a project that calls an LLM API (keep the key server-side, never in the browser)', 'Build a minimal chat UI with message history'] },
        { name: 'Core build', steps: ['Maintain conversation context across turns; add a system prompt that sets behaviour', 'Stream responses token-by-token for a responsive feel', 'Handle rate limits and API errors with retries and user-facing messages'] },
        { name: 'Polish & ship', steps: ['Add a few preset “personas” via different system prompts', 'Persist conversations locally', 'Deploy with the API key in server env vars'] },
      ],
      tech: ['Next.js or Python (FastAPI)', 'An LLM API', 'Server-side key handling'],
      resumeBullets: [
        'Built a streaming AI chatbot with multi-turn context management and system-prompt-based persona switching, keeping API credentials server-side',
        'Implemented resilient API handling — retries, rate-limit backoff, and user-facing error states',
      ],
      deploy: { platform: 'Vercel', notes: ['Put the LLM API call in a server route/function so the key is never exposed to the client', 'Set the API key as a Vercel environment variable, not in the repo'] },
      searchTerms: 'llm chatbot streaming nextjs system prompt',
    },
    {
      week: 12, title: 'RAG Document Q&A', difficulty: 'intermediate',
      description: 'Answer questions over your own documents using retrieval-augmented generation',
      phases: [
        { name: 'Foundation', steps: ['Ingest documents: chunk them sensibly (overlap on boundaries) and embed each chunk', 'Store embeddings in a vector store (pgvector, Chroma, or FAISS)'] },
        { name: 'Core build', steps: ['On a question, embed it, retrieve top-k chunks, and stuff them into the prompt with citations', 'Return answers that cite which chunk they came from', 'Handle “I don’t know” when retrieval is weak'] },
        { name: 'Polish & ship', steps: ['Build an upload UI so users bring their own docs', 'Tune chunk size / k and record what worked', 'Show sources under each answer'] },
      ],
      tech: ['Python or Next.js', 'An embeddings model', 'Vector store (pgvector/Chroma/FAISS)', 'An LLM API'],
      resumeBullets: [
        'Built a retrieval-augmented generation system for document Q&A — chunking, embedding, vector search, and cited answer synthesis with graceful “no answer” handling',
        'Tuned chunking and retrieval-k empirically and surfaced source passages beneath every generated answer for verifiability',
      ],
      deploy: { platform: 'Vercel + Supabase pgvector (or Render)', notes: ['Supabase ships pgvector on its free tier — one place for docs, embeddings, and metadata', 'Keep embedding + LLM calls server-side; cache embeddings so re-uploads are cheap'] },
      searchTerms: 'rag document qa vector search embeddings pgvector',
    },
    {
      week: 22, title: 'AI Agent with Tool Use', difficulty: 'advanced',
      description: 'Build an agent that plans and calls tools to complete multi-step tasks',
      phases: [
        { name: 'Foundation', steps: ['Define 3-4 tools with clear schemas (e.g. web search, calculator, a data lookup)', 'Set up the LLM tool-calling loop: model requests a tool → you run it → feed the result back'] },
        { name: 'Core build', steps: ['Implement the agent loop with a max-steps guard to prevent runaways', 'Add error handling so a failing tool doesn’t crash the run', 'Log the full trace (thoughts, tool calls, results) for debugging'] },
        { name: 'Polish & ship', steps: ['Pick one real task it does well end-to-end and demo that', 'Add guardrails: validate tool inputs, cap costs', 'Write up the failure modes you found'] },
      ],
      tech: ['Python or TypeScript', 'An LLM API with tool calling', 'Your custom tools'],
      resumeBullets: [
        'Built an LLM agent with a tool-calling loop (search, computation, data lookup), including step limits, per-tool error isolation, and full execution tracing',
        'Added input validation and cost guardrails, and documented observed failure modes for a real multi-step task',
      ],
      deploy: { platform: 'Vercel / Render', notes: ['Long agent runs can exceed short function timeouts — run them on a platform with generous execution limits or stream progress', 'Never expose provider keys client-side; the agent loop runs on the server'] },
      searchTerms: 'llm agent tool calling loop function calling',
    },
  ],

  ds: [
    {
      week: 4, title: 'Exploratory Data Analysis Report', difficulty: 'beginner',
      description: 'Turn a raw dataset into a clear, insight-driven analysis notebook',
      phases: [
        { name: 'Foundation', steps: ['Choose a dataset with a real question behind it (not just “explore”)', 'Clean it: types, missing values, duplicates, outliers — document every decision'] },
        { name: 'Core build', steps: ['Answer 3-5 concrete questions with grouped aggregations and visualisations', 'Use the right chart per question (distribution, relationship, composition)', 'State findings in plain sentences, not just plots'] },
        { name: 'Polish & ship', steps: ['Write an executive summary at the top: what you found in 5 bullets', 'Make every chart labelled and self-explanatory', 'Publish the notebook'] },
      ],
      tech: ['Python', 'pandas', 'matplotlib / seaborn', 'Jupyter'],
      resumeBullets: [
        'Produced an end-to-end EDA report answering concrete business questions on a real dataset, with documented cleaning decisions and an executive summary of findings',
        'Selected appropriate visualisations per question type and translated statistical patterns into plain-language insights',
      ],
      deploy: { platform: 'Kaggle / GitHub', notes: ['Kaggle notebooks render publicly and get an audience; GitHub previews .ipynb inline', 'Lead the README/notebook with the findings, not the code'] },
      searchTerms: 'exploratory data analysis pandas seaborn notebook',
    },
    {
      week: 12, title: 'Interactive Analytics Dashboard', difficulty: 'intermediate',
      description: 'Build a dashboard that lets users explore a dataset interactively',
      phases: [
        { name: 'Foundation', steps: ['Prepare a clean, aggregated dataset the dashboard will read', 'Sketch the dashboard: what filters, what charts, what KPIs'] },
        { name: 'Core build', steps: ['Build it in Streamlit or Plotly Dash with working filters that update all charts', 'Add KPI cards, a time series, and a breakdown chart', 'Cache data loading so interactions stay fast'] },
        { name: 'Polish & ship', steps: ['Handle empty filter results gracefully', 'Make it readable on a laptop screen without scrolling everything', 'Deploy so a non-technical person can click through'] },
      ],
      tech: ['Python', 'Streamlit or Plotly Dash', 'pandas', 'Plotly'],
      resumeBullets: [
        'Built an interactive analytics dashboard (Streamlit/Plotly Dash) with cross-filtering, KPI cards, and time-series breakdowns over a cleaned dataset',
        'Optimised interactivity with cached data loading and handled empty-filter edge cases for a non-technical audience',
      ],
      deploy: { platform: 'Streamlit Community Cloud / Render', notes: ['Streamlit Community Cloud deploys straight from a GitHub repo for free', 'Ship a small pre-aggregated dataset with the app so it loads instantly'] },
      searchTerms: 'streamlit analytics dashboard plotly interactive',
    },
    {
      week: 24, title: 'Customer Churn Analysis & Model', difficulty: 'advanced',
      description: 'Predict churn and translate the model into business recommendations',
      phases: [
        { name: 'Foundation', steps: ['Frame it as a business problem: what does churn cost, what would we do with predictions', 'EDA focused on churn drivers; engineer features from raw columns'] },
        { name: 'Core build', steps: ['Train and compare models (logistic regression, gradient boosting)', 'Evaluate with precision/recall and a cost-aware threshold, not raw accuracy', 'Extract feature importance / SHAP to explain drivers'] },
        { name: 'Polish & ship', steps: ['Write recommendations tied to the top churn drivers', 'Quantify the potential impact of acting on the model', 'Package as a report + reproducible notebook'] },
      ],
      tech: ['Python', 'scikit-learn', 'XGBoost/LightGBM', 'SHAP', 'pandas'],
      resumeBullets: [
        'Built a customer-churn prediction model (gradient boosting) evaluated with a cost-aware precision/recall threshold rather than raw accuracy',
        'Explained churn drivers with SHAP and translated them into quantified, actionable retention recommendations',
      ],
      deploy: { platform: 'Kaggle / GitHub + Streamlit demo', notes: ['The report is the deliverable — a Streamlit “what-if” demo on top is a strong bonus', 'Emphasise the business framing; that’s what separates DS from ML here'] },
      searchTerms: 'customer churn prediction shap xgboost analysis',
    },
  ],

  cybersec: [
    {
      week: 4, title: 'Port Scanner & Host Discovery Tool', difficulty: 'beginner',
      description: 'Build a Python scanner that discovers hosts and open ports on networks you own',
      phases: [
        { name: 'Foundation', steps: ['Parse a target CIDR/IP range and a port range from CLI args', 'Understand the difference between TCP connect and SYN scans (you’ll do connect scans)'] },
        { name: 'Core build', steps: ['Implement a threaded TCP connect scanner with timeouts', 'Add simple banner grabbing on open ports', 'Only ever run it against your own hosts or explicit lab targets'] },
        { name: 'Polish & ship', steps: ['Output a clean report (table + optional JSON)', 'Add rate limiting so you don’t hammer targets', 'Document the legal/ethical scope prominently in the README'] },
      ],
      tech: ['Python', 'socket', 'threading / concurrent.futures'],
      resumeBullets: [
        'Built a multi-threaded TCP port scanner with host discovery and banner grabbing in Python, with rate limiting and structured reporting',
        'Documented authorised-use scope and scan ethics, reinforcing responsible security tooling practices',
      ],
      deploy: { platform: 'GitHub (CLI tool)', notes: ['Ships as a CLI, not a hosted app — package with a clear README and requirements.txt', 'State loudly that it must only be run against systems you own or are authorised to test'] },
      searchTerms: 'python port scanner network discovery tool',
    },
    {
      week: 10, title: 'Web Vulnerability Lab & Scanner', difficulty: 'intermediate',
      description: 'Study OWASP Top 10 in a deliberately vulnerable lab and script basic checks',
      phases: [
        { name: 'Foundation', steps: ['Stand up a deliberately-vulnerable app locally (e.g. OWASP Juice Shop or DVWA) in Docker', 'Work through the main OWASP Top 10 categories hands-on'] },
        { name: 'Core build', steps: ['Script detectors for a few classes you understand (reflected XSS test payloads, missing security headers, open redirects)', 'For each finding, document impact and remediation', 'Never test these techniques outside your own lab'] },
        { name: 'Polish & ship', steps: ['Write a mini pentest-style report for the lab app', 'Add remediation notes a developer could act on', 'Explain each vulnerability class in your own words'] },
      ],
      tech: ['Docker', 'Python (requests)', 'OWASP Juice Shop / DVWA', 'Burp Suite (community)'],
      resumeBullets: [
        'Completed a hands-on OWASP Top 10 lab against deliberately-vulnerable applications and scripted detectors for missing security headers, reflected XSS, and open redirects',
        'Authored a structured findings report pairing each vulnerability with concrete developer-facing remediation',
      ],
      deploy: { platform: 'GitHub (lab + report) — local Docker only', notes: ['The vulnerable apps run only in your local Docker lab, never deployed publicly', 'Deliverable is the report + scripts repo; keep all testing inside the sandboxed lab'] },
      searchTerms: 'owasp top 10 lab juice shop security scanner python',
    },
    {
      week: 20, title: 'File Integrity Monitor', difficulty: 'intermediate',
      description: 'Build a tool that detects unauthorised changes to files via hashing',
      phases: [
        { name: 'Foundation', steps: ['Design a baseline: walk a directory tree and hash every file (SHA-256)', 'Store the baseline manifest with timestamps'] },
        { name: 'Core build', steps: ['On each run, re-hash and diff against the baseline: report added/modified/deleted files', 'Add a watch mode that alerts on changes', 'Handle large trees efficiently (skip by mtime where safe)'] },
        { name: 'Polish & ship', steps: ['Add config for included/excluded paths', 'Emit alerts (console + log file, optional webhook)', 'Document how this maps to a real HIDS concept'] },
      ],
      tech: ['Python', 'hashlib', 'watchdog (optional)'],
      resumeBullets: [
        'Built a file-integrity monitoring tool using SHA-256 baselining that detects added, modified, and deleted files with a real-time watch mode',
        'Designed configurable path scoping and alerting, mapping the implementation to host-based intrusion-detection concepts',
      ],
      deploy: { platform: 'GitHub (CLI/daemon)', notes: ['Runs as a local CLI or background daemon — ship with a sample config and systemd/service note', 'Include a demo showing a tampered file being caught'] },
      searchTerms: 'file integrity monitor hashing python hids',
    },
  ],

  cloud: [
    {
      week: 4, title: 'Static Site on Cloud Object Storage + CDN', difficulty: 'beginner',
      description: 'Host a static site on cloud object storage fronted by a CDN, all reproducible',
      phases: [
        { name: 'Foundation', steps: ['Build or reuse a static site; understand the object-storage + CDN pattern', 'Create a cloud account and an object storage bucket'] },
        { name: 'Core build', steps: ['Upload the site and configure it for static website hosting', 'Put a CDN in front for HTTPS and caching', 'Set correct cache headers and a cache-invalidation step'] },
        { name: 'Polish & ship', steps: ['Script the whole upload+invalidate as a deploy command', 'Add a custom domain with DNS', 'Document the architecture and monthly cost'] },
      ],
      tech: ['AWS S3+CloudFront or Cloudflare R2/Pages', 'CLI', 'DNS'],
      resumeBullets: [
        'Deployed a static site on cloud object storage fronted by a CDN with HTTPS, cache-control tuning, and a scripted upload-plus-invalidation deploy step',
        'Configured custom-domain DNS and documented the architecture and cost model',
      ],
      deploy: { platform: 'AWS (S3 + CloudFront) or Cloudflare (R2 + CDN)', notes: ['Both have free tiers sufficient for a portfolio site; Cloudflare Pages is the simplest on-ramp', 'The scripted deploy (not click-ops) is what makes this a cloud project rather than a hosting task'] },
      searchTerms: 's3 cloudfront static site cdn deploy script',
    },
    {
      week: 12, title: 'Serverless REST API', difficulty: 'intermediate',
      description: 'Build a REST API with serverless functions and a managed database',
      phases: [
        { name: 'Foundation', steps: ['Design the API and pick a serverless platform + managed DB', 'Define infrastructure as code (Serverless Framework, SAM, or Terraform)'] },
        { name: 'Core build', steps: ['Implement CRUD handlers as individual functions', 'Connect to the managed database with pooled/proxied connections', 'Add auth (JWT or a managed authorizer)'] },
        { name: 'Polish & ship', steps: ['Add structured logging and basic metrics/alarms', 'Handle cold starts and set sensible timeouts/memory', 'Document deploy + teardown as single commands'] },
      ],
      tech: ['AWS Lambda / Vercel Functions', 'Managed Postgres/DynamoDB', 'IaC (Terraform/SAM/Serverless)'],
      resumeBullets: [
        'Built a serverless REST API with function-per-endpoint handlers, a managed database, and JWT authentication, provisioned entirely through infrastructure-as-code',
        'Added structured logging, alarms, and cold-start-aware configuration with reproducible deploy and teardown commands',
      ],
      deploy: { platform: 'AWS (Lambda + API Gateway) or Vercel Functions', notes: ['Vercel Functions are the fastest path; AWS SAM/Serverless Framework shows deeper IaC skill', 'For SQL from serverless, use a pooled/proxied connection (e.g. a serverless-friendly Postgres) to avoid connection exhaustion'] },
      searchTerms: 'serverless rest api lambda terraform managed database',
    },
    {
      week: 22, title: 'Containerised App on Kubernetes', difficulty: 'advanced',
      description: 'Containerise a multi-service app and run it on Kubernetes with IaC',
      phases: [
        { name: 'Foundation', steps: ['Containerise each service with a lean, multi-stage Dockerfile', 'Get it running locally with docker-compose first'] },
        { name: 'Core build', steps: ['Write Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets)', 'Run on a managed cluster or a local one (kind/minikube)', 'Add liveness/readiness probes and resource limits'] },
        { name: 'Polish & ship', steps: ['Add an Ingress and horizontal pod autoscaling', 'Package as a Helm chart', 'Document the deploy and a rollback'] },
      ],
      tech: ['Docker', 'Kubernetes', 'Helm', 'kind/minikube or a managed cluster'],
      resumeBullets: [
        'Containerised a multi-service application with multi-stage Docker builds and orchestrated it on Kubernetes with probes, resource limits, and horizontal autoscaling',
        'Packaged the deployment as a Helm chart with documented rollout and rollback procedures',
      ],
      deploy: { platform: 'Local (kind/minikube) or managed K8s (GKE/EKS free-tier trial)', notes: ['You can demo the whole thing on a local kind cluster — no cloud bill required', 'Commit the manifests/Helm chart; the reproducible config is the deliverable'] },
      searchTerms: 'kubernetes helm docker multi-service deployment manifests',
    },
  ],

  mobile: [
    {
      week: 4, title: 'Mobile Notes App', difficulty: 'beginner',
      description: 'Build a cross-platform notes app with local persistence',
      phases: [
        { name: 'Foundation', steps: ['Scaffold with Expo (React Native) or Flutter; run it on your phone', 'Set up navigation between a list screen and an editor screen'] },
        { name: 'Core build', steps: ['Implement create/edit/delete notes with local persistence (AsyncStorage / SQLite / Hive)', 'Add search and sort', 'Handle the empty state'] },
        { name: 'Polish & ship', steps: ['Add light/dark theme following the system setting', 'Test on both a small and large device size', 'Build a release APK / share via Expo'] },
      ],
      tech: ['React Native (Expo) or Flutter', 'Local storage (AsyncStorage/SQLite/Hive)'],
      resumeBullets: [
        'Built a cross-platform mobile notes app (React Native/Flutter) with local persistence, search, and system-aware light/dark theming',
        'Implemented multi-screen navigation and verified layouts across device sizes, producing a shareable release build',
      ],
      deploy: { platform: 'Expo / APK', notes: ['Expo lets testers open the app instantly via a QR code — no store needed', 'For a downloadable build, generate a release APK and link it from the README'] },
      searchTerms: 'react native notes app expo local storage',
    },
    {
      week: 12, title: 'Weather App with Location & API', difficulty: 'intermediate',
      description: 'Build a mobile weather app using device location and a weather API',
      phases: [
        { name: 'Foundation', steps: ['Request location permission properly (handle denial)', 'Fetch weather from a public API for the device coordinates'] },
        { name: 'Core build', steps: ['Show current conditions + a multi-day forecast with icons', 'Add city search as a fallback to GPS', 'Cache the last result for offline open'] },
        { name: 'Polish & ship', steps: ['Handle loading, error, and no-network states explicitly', 'Add pull-to-refresh', 'Polish the visual design and ship a build'] },
      ],
      tech: ['React Native (Expo) or Flutter', 'Geolocation', 'A weather API'],
      resumeBullets: [
        'Built a mobile weather app using device geolocation and a live weather API, with city-search fallback and offline caching of the last result',
        'Handled permission denial, network errors, and loading states explicitly, with pull-to-refresh UX',
      ],
      deploy: { platform: 'Expo / APK', notes: ['Keep the weather API key out of the client where possible, or scope/restrict it', 'Expo Go is the quickest way to let reviewers run it on their own phone'] },
      searchTerms: 'mobile weather app geolocation api react native flutter',
    },
    {
      week: 24, title: 'Full-Stack Mobile App with Auth & Backend', difficulty: 'advanced',
      description: 'Build a mobile app backed by a real API with authentication and sync',
      phases: [
        { name: 'Foundation', steps: ['Design the feature (e.g. habit tracker, expense log) and its data model', 'Stand up a backend (Supabase/Firebase or your own API)'] },
        { name: 'Core build', steps: ['Implement auth (email or OAuth) with secure token storage on-device', 'Sync data to the backend; handle offline writes and reconciliation', 'Add push notifications for a relevant event'] },
        { name: 'Polish & ship', steps: ['Handle token refresh and logout across app restarts', 'Test the offline→online sync path deliberately', 'Ship a build and write setup docs'] },
      ],
      tech: ['React Native (Expo) or Flutter', 'Supabase/Firebase or custom API', 'Push notifications'],
      resumeBullets: [
        'Built a full-stack mobile app with authenticated, synced backend data, secure on-device token storage, and offline-write reconciliation',
        'Integrated push notifications and handled token refresh/logout across app restarts',
      ],
      deploy: { platform: 'Expo (EAS) + Supabase/Firebase', notes: ['Supabase/Firebase give you auth + database + push without running servers', 'EAS Build produces installable binaries; TestFlight/Play internal testing for real device distribution'] },
      searchTerms: 'react native fullstack app supabase auth offline sync',
    },
  ],

  devops: [
    {
      week: 4, title: 'CI Pipeline with GitHub Actions', difficulty: 'beginner',
      description: 'Add a real CI pipeline that lints, tests, and builds on every push',
      phases: [
        { name: 'Foundation', steps: ['Take an existing app repo; make lint/test/build runnable with one command each locally', 'Create a .github/workflows CI file'] },
        { name: 'Core build', steps: ['Run lint → test → build as separate jobs/steps on push and PR', 'Cache dependencies to speed up runs', 'Make the build fail the check when tests fail (verify it actually blocks)'] },
        { name: 'Polish & ship', steps: ['Add a status badge to the README', 'Protect main so merges require green CI', 'Add a matrix (e.g. two Node versions)'] },
      ],
      tech: ['GitHub Actions', 'YAML', 'Your app’s test/lint tooling'],
      resumeBullets: [
        'Set up a GitHub Actions CI pipeline (lint → test → build) with dependency caching and a version matrix, gating merges to main behind green checks',
        'Verified the pipeline blocks broken code by asserting failing tests fail the required status check',
      ],
      deploy: { platform: 'GitHub Actions', notes: ['This runs on GitHub itself — no external infra; the workflow file is the deliverable', 'Branch protection requiring the CI check is what makes it real, not just a passing badge'] },
      searchTerms: 'github actions ci pipeline lint test build',
    },
    {
      week: 12, title: 'Dockerised App + CD to a Host', difficulty: 'intermediate',
      description: 'Containerise an app and continuously deploy it on every merge to main',
      phases: [
        { name: 'Foundation', steps: ['Write a lean multi-stage Dockerfile and run the container locally', 'Push the image to a registry (GHCR/Docker Hub) from CI'] },
        { name: 'Core build', steps: ['Add a CD workflow: on merge to main, build → push image → deploy', 'Deploy to a host (Render, Railway, or a VPS via SSH + compose)', 'Use env vars/secrets for config — nothing hardcoded'] },
        { name: 'Polish & ship', steps: ['Add a health check and a rollback path (redeploy previous tag)', 'Tag images by commit SHA for traceability', 'Document the pipeline with a diagram'] },
      ],
      tech: ['Docker', 'GitHub Actions', 'A container registry', 'Render/Railway or a VPS'],
      resumeBullets: [
        'Built a continuous-deployment pipeline that builds a multi-stage Docker image, pushes it to a registry tagged by commit SHA, and deploys on every merge to main',
        'Implemented health checks and a tag-based rollback path with all configuration driven by secrets/env vars',
      ],
      deploy: { platform: 'Render / Railway (or VPS)', notes: ['Render and Railway both deploy from a Dockerfile and can auto-deploy on push', 'SHA-tagged images make “roll back to the last good deploy” a one-line operation'] },
      searchTerms: 'docker cd github actions deploy registry render',
    },
    {
      week: 22, title: 'Infrastructure as Code + Monitoring', difficulty: 'advanced',
      description: 'Provision cloud infra with Terraform and add real monitoring/alerting',
      phases: [
        { name: 'Foundation', steps: ['Define your infra (compute, DB, networking) as Terraform modules', 'Keep state remote and reviewable; plan before every apply'] },
        { name: 'Core build', steps: ['Provision an app + database + networking reproducibly from scratch', 'Add monitoring (Prometheus/Grafana or a managed equivalent) with real dashboards', 'Set alerts on meaningful signals (error rate, latency, saturation)'] },
        { name: 'Polish & ship', steps: ['Wire Terraform apply into CI (plan on PR, apply on merge with approval)', 'Document a full teardown so nothing costs money idle', 'Include dashboard screenshots'] },
      ],
      tech: ['Terraform', 'A cloud provider', 'Prometheus/Grafana or managed monitoring', 'GitHub Actions'],
      resumeBullets: [
        'Provisioned reproducible cloud infrastructure (compute, database, networking) with modular Terraform and remote state, integrated into a plan-on-PR / apply-on-merge workflow',
        'Instrumented monitoring dashboards and threshold-based alerting on error rate, latency, and saturation signals',
      ],
      deploy: { platform: 'Cloud provider via Terraform', notes: ['Use a free-tier-eligible provider and commit a documented teardown so idle infra costs nothing', 'The Terraform code + CI integration is the artefact; screenshots prove the monitoring works'] },
      searchTerms: 'terraform infrastructure as code prometheus grafana monitoring',
    },
  ],

  sysdesign: [
    {
      week: 4, title: 'URL Shortener — Design & Build', difficulty: 'beginner',
      description: 'Design and implement a URL shortener, then write up the design decisions',
      phases: [
        { name: 'Foundation', steps: ['Write the requirements: shorten, redirect, custom aliases, basic analytics', 'Decide the encoding (base62 of an id) and the data model'] },
        { name: 'Core build', steps: ['Build the shorten + redirect endpoints with a database', 'Handle collisions and custom-alias conflicts', 'Add click counting'] },
        { name: 'Polish & ship', steps: ['Write a design doc: capacity estimate, schema, why base62, caching plan', 'Add a read cache for hot links', 'Deploy a working demo'] },
      ],
      tech: ['Any backend (Node/Python/Go)', 'PostgreSQL/Redis', 'A design doc'],
      resumeBullets: [
        'Designed and built a URL shortener with base62 encoding, collision/alias handling, and click analytics, accompanied by a written design doc with capacity estimates',
        'Added a read-through cache for hot links and documented the schema and caching strategy',
      ],
      deploy: { platform: 'Render / Vercel + managed DB', notes: ['The written design doc matters as much as the running service here', 'A working deploy plus a doc that reasons about scale is the whole point of a system-design project'] },
      searchTerms: 'url shortener system design base62 redis',
    },
    {
      week: 14, title: 'Rate Limiter Service', difficulty: 'intermediate',
      description: 'Implement and compare rate-limiting algorithms as a reusable service',
      phases: [
        { name: 'Foundation', steps: ['Study the algorithms: fixed window, sliding window log, sliding window counter, token bucket', 'Decide the interface (middleware or standalone service)'] },
        { name: 'Core build', steps: ['Implement token bucket and sliding-window counter backed by Redis', 'Make limits configurable per key (user/IP/route)', 'Return proper 429s with Retry-After headers'] },
        { name: 'Polish & ship', steps: ['Load-test and compare the algorithms’ behaviour at the boundary', 'Document trade-offs (accuracy vs memory vs burst handling)', 'Package as reusable middleware'] },
      ],
      tech: ['Redis', 'Any backend language', 'A load-testing tool (k6/wrk)'],
      resumeBullets: [
        'Implemented and benchmarked multiple rate-limiting algorithms (token bucket, sliding-window counter) backed by Redis, with per-key configurable limits and correct 429/Retry-After semantics',
        'Load-tested boundary behaviour and documented accuracy-vs-memory-vs-burst trade-offs between algorithms',
      ],
      deploy: { platform: 'Render + managed Redis (or Docker demo)', notes: ['Upstash/managed Redis on a free tier is enough; or ship a docker-compose demo', 'The comparison write-up and load-test results are what make this a system-design artefact'] },
      searchTerms: 'rate limiter token bucket sliding window redis',
    },
    {
      week: 26, title: 'Scalable System Design Case Studies', difficulty: 'advanced',
      description: 'Produce rigorous design docs (and prototypes) for classic large-scale systems',
      phases: [
        { name: 'Foundation', steps: ['Pick 3 systems (e.g. news feed, chat, ride-matching); gather requirements + scale estimates', 'Standardise a design-doc template'] },
        { name: 'Core build', steps: ['For each: functional + non-functional requirements, capacity estimation, API design, data model, high-level architecture', 'Discuss the hard part explicitly (fan-out, consistency, hot keys) with alternatives', 'Prototype the single trickiest component of one system'] },
        { name: 'Polish & ship', steps: ['Draw clear architecture diagrams', 'Add a “bottlenecks & scaling” section per design', 'Publish as a readable design portfolio'] },
      ],
      tech: ['Design docs + diagrams', 'One prototype in your strongest stack'],
      resumeBullets: [
        'Authored rigorous system-design documents for three large-scale systems — requirements, capacity estimation, API/data models, and architecture with explicit trade-off analysis',
        'Prototyped the hardest component of one design (e.g. feed fan-out) to validate the proposed approach',
      ],
      deploy: { platform: 'GitHub (design portfolio)', notes: ['This ships as a documentation repo with diagrams — the reasoning is the product', 'A working prototype of one tricky component sets it apart from pure paper designs'] },
      searchTerms: 'system design case studies scalability architecture feed',
    },
  ],
};
