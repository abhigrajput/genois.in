const DOMAIN_STRUCTURES = {
  fullstack: {
    name: 'Full Stack Development',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'HTML5, CSS3, Flexbox, Grid, Responsive Design' },
      { weeks: '5-8', level: 'beginner', focus: 'JavaScript ES6+, DOM, Events, Fetch API, LocalStorage' },
      { weeks: '9-12', level: 'intermediate', focus: 'React.js, Components, Hooks, State Management, React Router' },
      { weeks: '13-16', level: 'intermediate', focus: 'Node.js, Express.js, REST APIs, Middleware, Authentication' },
      { weeks: '17-20', level: 'intermediate', focus: 'PostgreSQL, Supabase, SQL queries, Database design, ORMs' },
      { weeks: '21-24', level: 'advanced', focus: 'Next.js, TypeScript, Testing, CI/CD, Docker basics' },
      { weeks: '25-28', level: 'advanced', focus: 'System Design, Performance, Security, Deployment, AWS basics' },
      { weeks: '29-32', level: 'advanced', focus: 'Advanced React patterns, Microservices, WebSockets, Redis' },
      { weeks: '33-40', level: 'expert', focus: 'Full projects, Portfolio, Open source, Interview prep' },
      { weeks: '41-52', level: 'expert', focus: 'Advanced projects, System design interviews, Job applications' },
    ],
    projectSchedule: [
      { week: 4, title: 'Personal Portfolio Website', difficulty: 'beginner', description: 'Build a responsive portfolio with HTML/CSS showing your profile, skills, and contact form' },
      { week: 8, title: 'JavaScript Quiz App', difficulty: 'beginner', description: 'Build an interactive quiz app with timer, score tracking, and local storage' },
      { week: 12, title: 'React Todo App with Authentication', difficulty: 'beginner', description: 'Full todo app with React hooks, user auth, and persistent storage' },
      { week: 16, title: 'REST API with Node.js', difficulty: 'intermediate', description: 'Build a complete REST API with Express, JWT auth, and PostgreSQL' },
      { week: 20, title: 'Full Stack Blog Platform', difficulty: 'intermediate', description: 'Complete blog with React frontend, Node backend, PostgreSQL database' },
      { week: 24, title: 'E-commerce App with Next.js', difficulty: 'advanced', description: 'Full e-commerce with product listing, cart, payments, and admin panel' },
      { week: 28, title: 'Real-time Chat Application', difficulty: 'advanced', description: 'Chat app with WebSockets, rooms, message history, and notifications' },
      { week: 32, title: 'Social Media Platform', difficulty: 'advanced', description: 'Social app with posts, likes, comments, follows, and real-time updates' },
      { week: 40, title: 'SaaS Application', difficulty: 'expert', description: 'Complete SaaS product with subscriptions, dashboard, and analytics' },
      { week: 52, title: 'Portfolio Capstone Project', difficulty: 'expert', description: 'Your best project combining all skills - deploy and present to employers' },
    ]
  },
  dsa: {
    name: 'Data Structures & Algorithms',
    phases: [
      { weeks: '1-2', level: 'beginner', focus: 'C++ basics, Time & Space complexity, Big O notation' },
      { weeks: '3-6', level: 'beginner', focus: 'Arrays, Strings, Two pointers, Sliding window, Prefix sums' },
      { weeks: '7-10', level: 'beginner', focus: 'Linked Lists, Stacks, Queues, Hashing, Basic sorting' },
      { weeks: '11-14', level: 'intermediate', focus: 'Recursion, Backtracking, Binary Search, Divide & Conquer' },
      { weeks: '15-18', level: 'intermediate', focus: 'Trees, BST, Heaps, Priority Queue, Segment Trees' },
      { weeks: '19-22', level: 'intermediate', focus: 'Graphs, BFS, DFS, Topological Sort, Union Find, MST' },
      { weeks: '23-26', level: 'advanced', focus: 'Dynamic Programming - 1D, 2D, Knapsack, LCS, LIS' },
      { weeks: '27-30', level: 'advanced', focus: 'Advanced DP, Greedy, Tries, Advanced Graph algorithms' },
      { weeks: '31-40', level: 'advanced', focus: 'Competitive programming patterns, Hard LeetCode problems' },
      { weeks: '41-52', level: 'expert', focus: 'Interview prep, Mock interviews, Company-specific problems' },
    ],
    projectSchedule: [
      { week: 4, title: 'Array & String Problem Set', difficulty: 'beginner', description: 'Solve 20 array and string problems on LeetCode, write C++ solutions with explanations' },
      { week: 8, title: 'Linked List Library', difficulty: 'beginner', description: 'Build a complete linked list implementation in C++ with all operations and visualizer' },
      { week: 12, title: 'Custom Stack & Queue Implementation', difficulty: 'beginner', description: 'Implement stack, queue, and deque from scratch in C++ with all edge cases' },
      { week: 16, title: 'Binary Tree Visualizer', difficulty: 'intermediate', description: 'Build a C++ program that builds and visualizes binary trees with all traversals' },
      { week: 20, title: 'Graph Problem Solver', difficulty: 'intermediate', description: 'Implement BFS, DFS, Dijkstra, and Kruskal in C++ with a graph visualizer' },
      { week: 24, title: 'DP Problem Collection', difficulty: 'advanced', description: 'Solve 30 DP problems with detailed explanations, time/space analysis in C++' },
      { week: 28, title: 'Competitive Programming Toolkit', difficulty: 'advanced', description: 'Build a C++ template with all common algorithms ready for competitive programming' },
      { week: 36, title: 'LeetCode 100 Challenge', difficulty: 'expert', description: 'Solve 100 LeetCode problems (easy/medium/hard mix) and document all solutions' },
      { week: 44, title: 'Mock Interview Preparation', difficulty: 'expert', description: 'Complete 50 mock interview problems with time constraints and explanations' },
      { week: 52, title: 'Complete DSA Portfolio', difficulty: 'expert', description: 'GitHub repo with all solutions, complexity analysis, and study notes' },
    ]
  },
  cybersecurity: {
    name: 'Cybersecurity',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Linux fundamentals, Networking basics, TCP/IP, DNS, HTTP' },
      { weeks: '5-8', level: 'beginner', focus: 'Python for security, Scripting, Automation, Basic cryptography' },
      { weeks: '9-12', level: 'intermediate', focus: 'Web security, OWASP Top 10, SQL injection, XSS, CSRF' },
      { weeks: '13-16', level: 'intermediate', focus: 'Network security, Wireshark, Nmap, Metasploit basics' },
      { weeks: '17-20', level: 'intermediate', focus: 'Ethical hacking, CTF challenges, Burp Suite, Web app pentesting' },
      { weeks: '21-28', level: 'advanced', focus: 'Malware analysis, Reverse engineering, Advanced pentesting' },
      { weeks: '29-52', level: 'expert', focus: 'Bug bounty, CVE research, Security certifications prep (CEH/OSCP)' },
    ],
    projectSchedule: [
      { week: 4, title: 'Network Scanner Tool', difficulty: 'beginner', description: 'Build a Python network scanner using sockets to discover hosts and open ports' },
      { week: 8, title: 'Password Cracker', difficulty: 'beginner', description: 'Build a Python dictionary attack tool for educational purposes' },
      { week: 12, title: 'Web Vulnerability Scanner', difficulty: 'intermediate', description: 'Build a tool to detect XSS and SQL injection vulnerabilities' },
      { week: 16, title: 'Packet Analyzer', difficulty: 'intermediate', description: 'Build a Python packet sniffer and analyzer using Scapy' },
      { week: 24, title: 'CTF Challenge Solutions', difficulty: 'advanced', description: 'Solve 10 CTF challenges and document methodology and tools used' },
      { week: 36, title: 'Complete Security Audit Report', difficulty: 'expert', description: 'Perform a security audit on a test application and write professional report' },
      { week: 52, title: 'Bug Bounty Portfolio', difficulty: 'expert', description: 'Document all security research, tools built, and CTF achievements' },
    ]
  },
  aiml: {
    name: 'AI & Machine Learning',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Python basics, NumPy, Pandas, Data manipulation' },
      { weeks: '5-8', level: 'beginner', focus: 'Statistics, Matplotlib, Seaborn, Data visualization' },
      { weeks: '9-12', level: 'intermediate', focus: 'Scikit-learn, Linear regression, Classification, Clustering' },
      { weeks: '13-16', level: 'intermediate', focus: 'Neural networks, TensorFlow/PyTorch, Deep learning basics' },
      { weeks: '17-20', level: 'intermediate', focus: 'CNN for images, RNN for sequences, Transfer learning' },
      { weeks: '21-28', level: 'advanced', focus: 'NLP, Transformers, BERT, GPT, LLMs, RAG systems' },
      { weeks: '29-52', level: 'expert', focus: 'MLOps, Model deployment, FastAPI, Advanced projects' },
    ],
    projectSchedule: [
      { week: 4, title: 'Exploratory Data Analysis', difficulty: 'beginner', description: 'Analyze a Kaggle dataset, create visualizations, find insights' },
      { week: 8, title: 'House Price Predictor', difficulty: 'beginner', description: 'Build linear regression model to predict house prices' },
      { week: 12, title: 'Image Classifier', difficulty: 'intermediate', description: 'Build CNN to classify images using TensorFlow' },
      { week: 16, title: 'Sentiment Analysis Tool', difficulty: 'intermediate', description: 'Build NLP model for sentiment analysis on product reviews' },
      { week: 24, title: 'Chatbot with LLM', difficulty: 'advanced', description: 'Build a domain-specific chatbot using OpenAI API or local LLM' },
      { week: 36, title: 'Complete ML Pipeline', difficulty: 'expert', description: 'End-to-end ML project with data collection, training, API, and deployment' },
      { week: 52, title: 'AI Portfolio Capstone', difficulty: 'expert', description: 'Your best AI project deployed and documented for employers' },
    ]
  },
  devops: {
    name: 'DevOps & Cloud',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Linux, Shell scripting, Git, GitHub, Version control' },
      { weeks: '5-8', level: 'beginner', focus: 'Docker, Containers, Docker Compose, Container networking' },
      { weeks: '9-12', level: 'intermediate', focus: 'Kubernetes, Pods, Deployments, Services, Helm' },
      { weeks: '13-16', level: 'intermediate', focus: 'CI/CD, GitHub Actions, Jenkins, GitLab CI' },
      { weeks: '17-20', level: 'intermediate', focus: 'AWS/GCP/Azure basics, EC2, S3, RDS, Lambda' },
      { weeks: '21-28', level: 'advanced', focus: 'Infrastructure as Code, Terraform, Ansible, Monitoring' },
      { weeks: '29-52', level: 'expert', focus: 'Advanced cloud, Multi-cloud, Security, Cost optimization' },
    ],
    projectSchedule: [
      { week: 4, title: 'Automated Backup System', difficulty: 'beginner', description: 'Shell script to automate backups with logging and notifications' },
      { week: 8, title: 'Dockerized Web App', difficulty: 'beginner', description: 'Containerize a web application with Docker and Docker Compose' },
      { week: 12, title: 'Kubernetes Deployment', difficulty: 'intermediate', description: 'Deploy a microservices app on Kubernetes with scaling' },
      { week: 16, title: 'CI/CD Pipeline', difficulty: 'intermediate', description: 'Complete CI/CD pipeline with testing, building, and deployment' },
      { week: 24, title: 'Infrastructure as Code', difficulty: 'advanced', description: 'Provision entire AWS infrastructure using Terraform' },
      { week: 36, title: 'Complete DevOps Project', difficulty: 'expert', description: 'Full production setup with monitoring, logging, alerting' },
      { week: 52, title: 'Cloud Architecture Portfolio', difficulty: 'expert', description: 'Document all cloud projects and certifications earned' },
    ]
  },
  android: {
    name: 'Android Development',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Kotlin basics, Android Studio, First app, UI basics' },
      { weeks: '5-8', level: 'beginner', focus: 'Layouts, Views, RecyclerView, Navigation, Intents' },
      { weeks: '9-12', level: 'intermediate', focus: 'Jetpack Compose, State management, Animations' },
      { weeks: '13-16', level: 'intermediate', focus: 'MVVM, ViewModel, LiveData, Room database, Coroutines' },
      { weeks: '17-20', level: 'intermediate', focus: 'Retrofit, APIs, Dependency injection with Hilt' },
      { weeks: '21-28', level: 'advanced', focus: 'Firebase, Push notifications, Maps, Payments' },
      { weeks: '29-52', level: 'expert', focus: 'Play Store publishing, Performance, Advanced features' },
    ],
    projectSchedule: [
      { week: 4, title: 'Calculator App', difficulty: 'beginner', description: 'Build a fully functional calculator with Kotlin' },
      { week: 8, title: 'Todo List App', difficulty: 'beginner', description: 'Todo app with Room database, RecyclerView, and notifications' },
      { week: 12, title: 'Weather App', difficulty: 'intermediate', description: 'Weather app using Jetpack Compose and OpenWeather API' },
      { week: 16, title: 'News Reader App', difficulty: 'intermediate', description: 'News app with MVVM, Retrofit, and Room caching' },
      { week: 24, title: 'Social Media App', difficulty: 'advanced', description: 'Social app with Firebase auth, posts, and real-time chat' },
      { week: 36, title: 'E-commerce App', difficulty: 'expert', description: 'Full e-commerce Android app with payments and admin panel' },
      { week: 52, title: 'Published Play Store App', difficulty: 'expert', description: 'Your best app published on Google Play Store' },
    ]
  },
  datascience: {
    name: 'Data Science',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Python, NumPy, Pandas, Data cleaning, EDA' },
      { weeks: '5-8', level: 'beginner', focus: 'Statistics, Probability, Hypothesis testing, Matplotlib' },
      { weeks: '9-12', level: 'intermediate', focus: 'Machine learning, Regression, Classification, Clustering' },
      { weeks: '13-16', level: 'intermediate', focus: 'Feature engineering, Model evaluation, Cross validation' },
      { weeks: '17-20', level: 'intermediate', focus: 'SQL, Big data basics, Spark, Data pipelines' },
      { weeks: '21-28', level: 'advanced', focus: 'Deep learning, NLP, Time series, Recommendation systems' },
      { weeks: '29-52', level: 'expert', focus: 'Kaggle competitions, MLOps, Business analytics' },
    ],
    projectSchedule: [
      { week: 4, title: 'EDA Project', difficulty: 'beginner', description: 'Complete EDA on real dataset with insights and visualizations' },
      { week: 8, title: 'Statistical Analysis', difficulty: 'beginner', description: 'Statistical analysis project with hypothesis testing' },
      { week: 12, title: 'Predictive Model', difficulty: 'intermediate', description: 'Build and deploy a predictive model for a business problem' },
      { week: 16, title: 'Data Pipeline', difficulty: 'intermediate', description: 'Build an automated data pipeline with cleaning and transformation' },
      { week: 24, title: 'Kaggle Competition', difficulty: 'advanced', description: 'Participate in a Kaggle competition and finish in top 30%' },
      { week: 36, title: 'Business Intelligence Dashboard', difficulty: 'expert', description: 'Complete BI dashboard with real data, insights, and recommendations' },
      { week: 52, title: 'Data Science Portfolio', difficulty: 'expert', description: 'Complete portfolio with 5+ projects deployed and documented' },
    ]
  },
  blockchain: {
    name: 'Blockchain Development',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Blockchain basics, Bitcoin, Ethereum, Cryptography' },
      { weeks: '5-8', level: 'beginner', focus: 'Solidity basics, Smart contracts, Hardhat, Remix IDE' },
      { weeks: '9-12', level: 'intermediate', focus: 'DeFi protocols, ERC20/ERC721 tokens, Web3.js' },
      { weeks: '13-16', level: 'intermediate', focus: 'React + Web3, MetaMask, IPFS, Decentralized apps' },
      { weeks: '17-24', level: 'advanced', focus: 'Advanced Solidity, Security, Auditing, Gas optimization' },
      { weeks: '25-52', level: 'expert', focus: 'DeFi projects, NFT marketplace, DAO, Layer 2' },
    ],
    projectSchedule: [
      { week: 4, title: 'Simple Smart Contract', difficulty: 'beginner', description: 'Deploy your first smart contract on Ethereum testnet' },
      { week: 8, title: 'ERC20 Token', difficulty: 'beginner', description: 'Create and deploy your own ERC20 token with full functionality' },
      { week: 12, title: 'NFT Collection', difficulty: 'intermediate', description: 'Build and deploy an NFT collection with metadata on IPFS' },
      { week: 16, title: 'DApp Frontend', difficulty: 'intermediate', description: 'React frontend connecting to smart contracts via Web3.js' },
      { week: 24, title: 'DeFi Protocol', difficulty: 'advanced', description: 'Build a simple DeFi lending/borrowing protocol' },
      { week: 40, title: 'Complete DApp', difficulty: 'expert', description: 'Full decentralized application with frontend, contracts, and tokenomics' },
      { week: 52, title: 'Blockchain Portfolio', difficulty: 'expert', description: 'All contracts audited, deployed on mainnet, portfolio presented' },
    ]
  },
  gamedev: {
    name: 'Game Development',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'C++ review, Unity basics, GameObjects, Scenes' },
      { weeks: '5-8', level: 'beginner', focus: 'Physics, Collisions, Input handling, Basic 2D games' },
      { weeks: '9-12', level: 'intermediate', focus: 'Animations, UI, Audio, Particle systems, Shaders' },
      { weeks: '13-16', level: 'intermediate', focus: '3D games, Lighting, Materials, Camera systems' },
      { weeks: '17-24', level: 'advanced', focus: 'AI, Pathfinding, Multiplayer basics, Optimization' },
      { weeks: '25-52', level: 'expert', focus: 'Full game projects, Publishing, Monetization' },
    ],
    projectSchedule: [
      { week: 4, title: 'Flappy Bird Clone', difficulty: 'beginner', description: 'Build a complete Flappy Bird clone with score and difficulty' },
      { week: 8, title: '2D Platformer', difficulty: 'beginner', description: 'Build a 2D platformer with multiple levels and enemies' },
      { week: 12, title: '3D Maze Game', difficulty: 'intermediate', description: 'Build a 3D maze game with timer and leaderboard' },
      { week: 16, title: 'Tower Defense Game', difficulty: 'intermediate', description: 'Complete tower defense with multiple enemy types and towers' },
      { week: 24, title: 'Multiplayer Game', difficulty: 'advanced', description: 'Simple multiplayer game with Unity Netcode' },
      { week: 36, title: 'Complete Game', difficulty: 'expert', description: 'Full polished game with multiple levels, audio, UI, and story' },
      { week: 52, title: 'Published Game', difficulty: 'expert', description: 'Game published on itch.io or mobile with player feedback' },
    ]
  },
  systemdesign: {
    name: 'System Design',
    phases: [
      { weeks: '1-4', level: 'beginner', focus: 'Networking, HTTP, DNS, CDN, Load balancers' },
      { weeks: '5-8', level: 'beginner', focus: 'Databases, SQL vs NoSQL, Indexing, Caching, Redis' },
      { weeks: '9-12', level: 'intermediate', focus: 'Microservices, API design, Message queues, Kafka' },
      { weeks: '13-16', level: 'intermediate', focus: 'Distributed systems, CAP theorem, Consistency models' },
      { weeks: '17-24', level: 'advanced', focus: 'Design patterns, URL shortener, Twitter, YouTube, Uber' },
      { weeks: '25-52', level: 'expert', focus: 'Advanced architectures, Interview prep, Case studies' },
    ],
    projectSchedule: [
      { week: 4, title: 'URL Shortener Design', difficulty: 'beginner', description: 'Design and implement a URL shortener system with analytics' },
      { week: 8, title: 'Cache System', difficulty: 'beginner', description: 'Implement a caching system with LRU eviction policy' },
      { week: 12, title: 'Rate Limiter', difficulty: 'intermediate', description: 'Build a distributed rate limiter with multiple algorithms' },
      { week: 16, title: 'Message Queue', difficulty: 'intermediate', description: 'Implement a simple message queue system' },
      { week: 24, title: 'Twitter Clone Architecture', difficulty: 'advanced', description: 'Design and implement Twitter-like system with feed generation' },
      { week: 36, title: 'Complete System Design Portfolio', difficulty: 'expert', description: 'Document 10 system designs with diagrams and trade-offs' },
      { week: 52, title: 'Production System', difficulty: 'expert', description: 'Deploy a production-grade system with monitoring and scaling' },
    ]
  }
};

import { buildUserContext, buildFullStudentContext } from './contextBuilder.js';
import { youtubeSearchUrl } from './youtubeEmbed.js';
import { roadmapTotalDays } from './roadmapCache.js';

// The model is prompted for a "real" YouTube URL but reliably hallucinates video
// ids that embed as "Video unavailable". We never trust a model-produced video
// URL: every generated day gets a topic search link, which always resolves to
// real results. Applied here so ALL callers of generateDayContent are covered.
function withSafeVideo(content) {
  if (content && typeof content === 'object') {
    content.video_url = youtubeSearchUrl(content.topic);
  }
  return content;
}

const DAY_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

/**
 * Normalize a day's depth metadata (estimated time, difficulty, prerequisites,
 * learning objectives) into a safe, storage-ready object. Accepts either raw
 * generated content (estimated_minutes) or an already-stored meta object
 * (estimated_time). Returns null when none of the fields are present — old
 * cache rows and stripped fallbacks — so callers can skip rendering entirely
 * instead of showing empty badges.
 * @param {object|null|undefined} content
 * @returns {{estimated_time: number|null, difficulty: string|null, prerequisites: string[], learning_objectives: string[]}|null}
 */
export function buildDayMeta(content) {
  if (!content || typeof content !== 'object') return null;
  const strList = (v, max) => Array.isArray(v)
    ? v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()).slice(0, max)
    : [];
  const rawDifficulty = String(content.difficulty || '').toLowerCase();
  const estimated = Number(content.estimated_time ?? content.estimated_minutes);
  const meta = {
    estimated_time: Number.isFinite(estimated) && estimated > 0 ? Math.round(estimated) : null,
    difficulty: DAY_DIFFICULTIES.has(rawDifficulty) ? rawDifficulty : null,
    prerequisites: strList(content.prerequisites, 6),
    learning_objectives: strList(content.learning_objectives, 3),
  };
  const empty = meta.estimated_time == null && !meta.difficulty
    && meta.prerequisites.length === 0 && meta.learning_objectives.length === 0;
  return empty ? null : meta;
}

// Turns real performance metrics into concrete instructions that reshape the
// day's content — revision when slipping, easier+hinted problems when stuck,
// harder challenges when the student is genuinely ahead.
function buildAdaptationInstructions(ctx) {
  const lines = [];

  if (ctx.testTrend === 'declining') {
    lines.push(`PERFORMANCE ALERT: ${ctx.name}'s test scores are DECLINING (avg ${ctx.avgTestScore}%). Add a short revision task on their weak areas (${ctx.weakSubjects.join(', ') || 'recent topics'}) before new material. Reinforce fundamentals.`);
  } else if (ctx.testTrend === 'improving') {
    lines.push(`${ctx.name} is IMPROVING (avg ${ctx.avgTestScore}%). Keep momentum — introduce a slightly harder stretch problem today.`);
  }

  if (ctx.codingSolveRate != null && ctx.codingSolveRate < 40) {
    lines.push(`Coding solve rate is LOW (${ctx.codingSolveRate}%). Pick an EASIER coding problem today and include extra hints / a step-by-step approach so they can actually finish it.`);
  } else if (ctx.realLevel === 'advanced') {
    lines.push(`Real skill level is ADVANCED (test avg ${ctx.avgTestScore}%, solve rate ${ctx.codingSolveRate}%). Choose a HARDER, interview-grade coding problem and skip beginner explanations.`);
  }

  if (ctx.monthsToPlacement != null && ctx.monthsToPlacement <= 3) {
    lines.push(`Only ${ctx.monthsToPlacement} months to placement — keep today high-yield and interview-relevant, cap at ~2 hours.`);
  }

  if (!lines.length) return '';
  return `\n=== ADAPT TODAY TO REAL PERFORMANCE ===\n${lines.join('\n')}\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGID TRACK ROUTING
//
// Every domain routes to ITS OWN stack, language, difficulty ramp, and advanced
// ceiling — never a generic DSA default. This is the single source of truth that
// stops the old bug where a domain-blind difficulty ramp injected "LeetCode
// sliding window" into an AI/ML student's Python track.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'beginner'|'intermediate'|'advanced'|'expert'} SkillLevel
 * @typedef {'foundation'|'build'|'push'|'mastery'} LadderRung
 *
 * @typedef {Object} DomainTrack
 * @property {string}   language   Primary language coding tasks MUST be written in.
 * @property {string}   stack      The mandated stack / paradigms — the rigid route.
 * @property {boolean}  dataHeavy  Whether the messy-dataset mandate applies to this track.
 * @property {Record<LadderRung, string>} ladder  Domain-specific ramp, one line per rung.
 * @property {string[]} ceiling    Advanced-only scenarios injected at the higher ceiling.
 */

/**
 * Canonical routing table — exactly one entry per validDomains slug used at
 * signup. There is deliberately no generic fallback stack: an unknown input is
 * normalized to a real slug (see normalizeDomain) before it ever reaches here.
 * @type {Readonly<Record<string, DomainTrack>>}
 */
const DOMAIN_TRACKS = Object.freeze({
  aiml: {
    language: 'Python',
    stack: 'Python (NumPy, Pandas, scikit-learn, PyTorch/TensorFlow), advanced statistical models, data engineering paradigms, and the mathematical foundations (linear algebra, calculus of gradients, probability) underneath them. NEVER route AI/ML to C++ DSA.',
    dataHeavy: true,
    ladder: {
      foundation: 'Python + NumPy vectorization, Pandas, and the math foundations (vectors, matrices, gradients). No frameworks yet — understand the primitives.',
      build: 'Statistical modeling with scikit-learn: regression, classification, clustering, cross-validation and honest feature engineering on real datasets.',
      push: 'Neural networks and training loops in PyTorch/TensorFlow — CNNs, RNNs, regularization, hyperparameter search, and evaluation beyond raw accuracy.',
      mastery: 'Low-level, from-scratch implementations: derive the math by hand and build it in raw NumPy. No autograd, no pre-built layers. Optimize for numerical stability and memory.',
    },
    ceiling: [
      'Build a neural-network backpropagation layer from scratch using ONLY NumPy arrays — no pre-built frameworks, derive the gradients by hand',
      'Implement an optimizer (SGD w/ momentum or Adam) from first principles',
      'Implement a scaled-dot-product attention block from scratch',
      'Handle vanishing/exploding gradients and numerical-stability (log-sum-exp) explicitly',
    ],
  },
  datascience: {
    language: 'Python',
    stack: 'Python (Pandas, NumPy, SQL, Spark), statistical rigor, and production data-engineering pipelines. NEVER route Data Science to C++ DSA.',
    dataHeavy: true,
    ladder: {
      foundation: 'Python, Pandas, NumPy, data cleaning and EDA — load, profile, and sanity-check a real dataset.',
      build: 'Statistics and hypothesis testing, leak-free feature engineering, scikit-learn modeling, and multi-table SQL on real data.',
      push: 'Data-engineering paradigms: ETL pipelines, windowed aggregations, Spark, model evaluation and drift monitoring.',
      mastery: 'Production data engineering at scale on messy data: partitioning, memory-bounded processing, incremental pipelines, and custom estimators/metrics from scratch.',
    },
    ceiling: [
      'Process a dataset larger than RAM using chunking / generators / streaming — reason about memory-allocation overhead',
      'Implement a custom statistical estimator or metric from scratch (no library shortcut)',
      'Build a leakage-free, reproducible feature pipeline',
      'Add automated data-drift and schema-validation detection',
    ],
  },
  dsa: {
    language: 'C++ or Java',
    stack: 'Core SDE data structures & algorithms in Java/C++ — arrays, trees, graphs, dynamic programming, and complexity analysis, built toward LeetCode-style interviews.',
    dataHeavy: false,
    ladder: {
      foundation: 'Complexity analysis (Big-O), arrays, strings, hashing. Easy problems — prove the time/space cost of every solution.',
      build: 'LeetCode Easy→Medium: two pointers, sliding window, recursion, binary search. Debug broken solutions and write your own test cases.',
      push: 'LeetCode Medium consistently: trees, BST, heaps, graphs (BFS/DFS/topo), 1D & 2D DP. Optimize time and space deliberately.',
      mastery: 'LeetCode Hard: advanced DP, segment trees, union-find, tries, hard graph algorithms. Optimal complexity and edge-case-proof only.',
    },
    ceiling: [
      'A LeetCode Hard structural problem (segment tree / DSU / bitmask or digit DP)',
      'Give a rigorous amortized-complexity argument',
      'Produce a space-optimized DP (rolling array) and justify it',
    ],
  },
  fullstack: {
    language: 'JavaScript/TypeScript',
    stack: 'Modern web: HTML/CSS, JS/TS, React/Next.js on the front end, Node/Express + PostgreSQL on the back end, deployed and tested.',
    dataHeavy: false,
    ladder: {
      foundation: 'HTML5, CSS (Flexbox/Grid), and JavaScript fundamentals — DOM, events, semantic markup. Ship a working static page.',
      build: 'Interactive React components, hooks, async data fetching, form validation and state management. Ship a small feature.',
      push: 'Full-stack CRUD with auth, DB schema design, REST/Server Actions, optimistic UI, and integration tests.',
      mastery: 'Production system-design friction: caching layers, pagination at scale, N+1 elimination, WebSockets, DB indexing — interview grade.',
    },
    ceiling: [
      'Design a distributed caching layer (Redis) with a correct invalidation strategy',
      'Implement rate-limiting middleware (token/leaky bucket)',
      'Reason about database sharding / read-replica routing for a hot table',
      'Eliminate an N+1 query and prove the fix with query counts',
    ],
  },
  cybersecurity: {
    language: 'Python',
    stack: 'Linux + networking foundations, Python offensive/defensive scripting, OWASP web security, and hands-on pentesting/CTF tooling — authorized/lab contexts only.',
    dataHeavy: false,
    ladder: {
      foundation: 'Linux, networking (TCP/IP, DNS, HTTP) and Python scripting basics for automation.',
      build: 'Web security (OWASP Top 10), scanner/exploit scripting, and applied cryptography.',
      push: 'Pentesting workflow with Burp/Metasploit/Nmap, network attacks, and CTF challenges.',
      mastery: 'Reverse engineering, malware analysis, and multi-stage exploit chains against realistic CVE-style targets (authorized labs only).',
    },
    ceiling: [
      'Exploit-development reasoning (e.g. a buffer-overflow walk-through in a lab)',
      'Reverse-engineer a small binary and document the methodology',
      'Chain a multi-stage attack in an authorized lab and write the report',
    ],
  },
  devops: {
    language: 'Python/Bash',
    stack: 'Linux + shell, Docker/Kubernetes, CI/CD, cloud (AWS/GCP), and Infrastructure-as-Code (Terraform/Ansible) with monitoring.',
    dataHeavy: false,
    ladder: {
      foundation: 'Linux, shell scripting, Git, and container fundamentals.',
      build: 'Docker & Compose, Kubernetes pods/deployments/services, and CI/CD pipelines.',
      push: 'Infrastructure-as-Code (Terraform/Ansible), cloud services, monitoring and autoscaling.',
      mastery: 'Production reliability friction: multi-region, zero-downtime deploys, distributed caching, gateway rate-limiting, and cost/perf tradeoffs.',
    },
    ceiling: [
      'Design a zero-downtime blue-green / canary deploy',
      'Add distributed caching with correct invalidation at the edge',
      'Implement gateway-level rate-limiting',
      'Design multi-region failover and reason about RTO/RPO',
    ],
  },
  android: {
    language: 'Kotlin',
    stack: 'Kotlin + Android SDK, Jetpack Compose, MVVM, Room, coroutines, Retrofit, and Play Store delivery.',
    dataHeavy: false,
    ladder: {
      foundation: 'Kotlin, Android Studio, layouts and activities — a first working app.',
      build: 'Jetpack Compose, state, MVVM, Room persistence and coroutines.',
      push: 'Retrofit/APIs, dependency injection (Hilt), Firebase and offline-first sync.',
      mastery: 'Performance & architecture friction: recomposition profiling, memory-leak elimination, background-work constraints, and multi-module scaling.',
    },
    ceiling: [
      'Profile and fix recomposition / dropped-frame jank',
      'Hunt and eliminate a memory leak with the profiler',
      'Design offline-first sync with conflict resolution',
    ],
  },
  blockchain: {
    language: 'Solidity/JavaScript',
    stack: 'Solidity smart contracts (Hardhat/Foundry), ERC standards, Web3.js/ethers front ends, DeFi patterns, and security/gas auditing.',
    dataHeavy: false,
    ladder: {
      foundation: 'Blockchain & cryptography fundamentals, Solidity basics, and a first testnet deploy.',
      build: 'ERC20/ERC721 tokens, Hardhat testing, and Web3 front ends.',
      push: 'DeFi protocols, gas optimization, and secure contract patterns.',
      mastery: 'Auditing-grade work: reentrancy/overflow defense, opcode-level gas optimization, and invariant/attack-surface analysis.',
    },
    ceiling: [
      'Audit a contract for reentrancy / overflow and write the finding',
      'Optimize gas at the opcode level and quantify the saving',
      'Enumerate invariants and the attack surface (incl. MEV) for a protocol',
    ],
  },
  gamedev: {
    language: 'C++/C#',
    stack: 'Unity (C#) / C++ engines — GameObjects, physics, animation, 3D, AI pathfinding, netcode, and performance optimization.',
    dataHeavy: false,
    ladder: {
      foundation: 'Engine basics (Unity), GameObjects, input handling and 2D movement.',
      build: 'Physics, collisions, animation, UI, audio and complete 2D games.',
      push: '3D, lighting, AI pathfinding, particle systems and optimization.',
      mastery: 'Performance friction: frame-budget profiling, object pooling, spatial partitioning, netcode/lag compensation, and custom math from scratch.',
    },
    ceiling: [
      'Profile the frame budget and cut allocations via object pooling',
      'Implement vector/quaternion math from scratch (no engine helpers)',
      'Add netcode lag-compensation / client-side prediction',
    ],
  },
  systemdesign: {
    language: 'language-agnostic',
    stack: 'Distributed systems design — load balancing, caching, sharding, replication, message queues, consistency models, and capacity estimation.',
    dataHeavy: false,
    ladder: {
      foundation: 'Networking, HTTP, DNS, CDN, load balancers, and SQL-vs-NoSQL tradeoffs.',
      build: 'Caching (Redis), indexing, microservices, API design and message queues (Kafka).',
      push: 'Distributed systems: CAP, consistency models, sharding, replication, and real designs (URL shortener, feed).',
      mastery: 'FAANG design-round grade friction: distributed caching + invalidation, rate-limiting, sharding strategies, consensus, and back-of-envelope capacity math.',
    },
    ceiling: [
      'Design a distributed cache with an explicit invalidation strategy',
      'Design a rate-limiting algorithm (token bucket vs leaky bucket) with tradeoffs',
      'Design a database sharding + rebalancing scheme for a hot key',
      'Reason through a consistency/consensus tradeoff (quorum, Raft) with numbers',
    ],
  },
});

/**
 * Human-facing domain labels and shorthands → canonical slug. Lets the engine
 * route "AI/ML", "Data Science", "Core SDE" etc. correctly instead of silently
 * dumping them into the fullstack default.
 * @type {Readonly<Record<string, string>>}
 */
const DOMAIN_ALIASES = Object.freeze({
  'aiml': 'aiml', 'ai': 'aiml', 'ml': 'aiml', 'aandml': 'aiml',
  'machinelearning': 'aiml', 'artificialintelligence': 'aiml', 'deeplearning': 'aiml',
  'datascience': 'datascience', 'ds': 'datascience', 'dataengineering': 'datascience', 'dataanalytics': 'datascience',
  'coresde': 'dsa', 'sde': 'dsa', 'core': 'dsa', 'dsa': 'dsa',
  'algorithms': 'dsa', 'datastructures': 'dsa', 'competitiveprogramming': 'dsa', 'cp': 'dsa',
  'fullstack': 'fullstack', 'web': 'fullstack', 'webdev': 'fullstack', 'webdevelopment': 'fullstack', 'mern': 'fullstack', 'frontend': 'fullstack', 'backend': 'fullstack',
  'cybersecurity': 'cybersecurity', 'security': 'cybersecurity', 'infosec': 'cybersecurity', 'ethicalhacking': 'cybersecurity',
  'devops': 'devops', 'sre': 'devops', 'cloud': 'devops', 'clouddevops': 'devops',
  'android': 'android', 'androiddevelopment': 'android', 'mobile': 'android',
  'blockchain': 'blockchain', 'web3': 'blockchain', 'smartcontracts': 'blockchain',
  'gamedev': 'gamedev', 'gamedevelopment': 'gamedev', 'games': 'gamedev',
  'systemdesign': 'systemdesign', 'hld': 'systemdesign', 'lld': 'systemdesign', 'distributedsystems': 'systemdesign',
});

/**
 * Normalize any domain input (slug, label, or shorthand) to a canonical slug.
 * Watertight: strips spaces/separators/case, tries the tracks table and the
 * alias table, and only falls back to 'fullstack' when nothing matches.
 * @param {string|null|undefined} input
 * @returns {keyof typeof DOMAIN_TRACKS}
 */
function normalizeDomain(input) {
  if (!input) return 'fullstack';
  const raw = String(input).trim().toLowerCase();
  if (DOMAIN_TRACKS[raw]) return raw;                 // already a canonical slug
  if (DOMAIN_ALIASES[raw]) return DOMAIN_ALIASES[raw];
  const collapsed = raw.replace(/[\s._/+-]+/g, '');   // "AI / ML" → "aiml", "core sde" → "coresde"
  if (DOMAIN_TRACKS[collapsed]) return collapsed;
  if (DOMAIN_ALIASES[collapsed]) return DOMAIN_ALIASES[collapsed];
  return 'fullstack';
}

/** @type {Readonly<Record<SkillLevel, number>>} */
const LEVEL_RANK = Object.freeze({ beginner: 0, intermediate: 1, advanced: 2, expert: 3 });
/** @type {ReadonlyArray<SkillLevel>} */
const RANK_LEVEL = Object.freeze(['beginner', 'intermediate', 'advanced', 'expert']);

/**
 * Highest of several level signals (static phase, self-reported, real-performance).
 * @param {...(SkillLevel|null|undefined)} levels
 * @returns {SkillLevel}
 */
function highestLevel(...levels) {
  let max = 0;
  for (const l of levels) {
    const r = LEVEL_RANK[l];
    if (typeof r === 'number' && r > max) max = r;
  }
  return RANK_LEVEL[max];
}

/**
 * Day-based rung of the ramp. Thresholds preserve the original 3/10/20 cadence.
 * @param {number} day
 * @returns {LadderRung}
 */
function ladderRung(day) {
  if (day <= 3) return 'foundation';
  if (day <= 10) return 'build';
  if (day <= 20) return 'push';
  return 'mastery';
}

/**
 * Domain-aware difficulty ramp + higher ceiling. Replaces the old DSA-only
 * difficultyPhase: each track ramps in its own vocabulary, and advanced students
 * hit a hard ceiling that bans syntax summaries and forces structural work.
 * @param {DomainTrack} track
 * @param {number} day
 * @param {SkillLevel} effectiveLevel
 * @returns {string}
 */
function buildDifficultyDirective(track, day, effectiveLevel) {
  const rung = ladderRung(day);
  const atCeiling = LEVEL_RANK[effectiveLevel] >= LEVEL_RANK.advanced || rung === 'mastery';

  let out = `DIFFICULTY FOR DAY ${day} — ${rung.toUpperCase()} rung (effective level: ${effectiveLevel}):
${track.ladder[rung]}
The roadmap MUST get progressively harder. Day ${day} must be measurably more challenging than day ${day - 1}. Never regenerate basics the student has already passed.`;

  if (atCeiling) {
    out += `

=== HIGHER CEILING (ADVANCED) ===
This student is operating at an advanced ceiling. HARD RULES:
- STOP generating basic syntax summaries, definitions, "what is a variable/loop/function", or hello-world walkthroughs.
- Every task must be structurally challenging and interview / production grade.
- Inject AT LEAST ONE of the following today: ${track.ceiling.join('; ')}.
- Where it fits the domain, add real System Design friction (distributed caching + invalidation, rate-limiting, database sharding).
- Prefer low-level, from-scratch implementations over calling a pre-built library when the goal is understanding.`;
  }
  return out;
}

/**
 * Messy-dataset mandate. Only fires for data-heavy tracks (AI/ML, Data Science)
 * once the student is past the pure-foundation stage — forces real-world data
 * friction instead of clean toy CSVs.
 * @param {DomainTrack} track
 * @param {number} day
 * @param {SkillLevel} effectiveLevel
 * @returns {string}
 */
function buildMessyDataDirective(track, day, effectiveLevel) {
  if (!track.dataHeavy) return '';
  if (day <= 10 && LEVEL_RANK[effectiveLevel] < LEVEL_RANK.intermediate) return '';
  return `
=== MESSY DATA MANDATE ===
Structure today's data task around a REALISTICALLY MESSY dataset — never a clean toy CSV. The student must confront and solve for:
- Corrupted / malformed inputs (bad encodings, mixed types, malformed rows).
- Missing indices, missing values, and misaligned joins.
- Memory-allocation overhead — favor vectorized / chunked / streaming processing over naive loops that blow up RAM.
- An explicit data-cleaning and validation pipeline BEFORE any modeling step.
Grade the day on the robustness of the cleaning pipeline, not just the final metric.
`;
}

// Per-company interview focus injected into the day's generation so every task
// maps to the student's actual target process. Falls back to generic DSA prep,
// and (upstream) the RAG knowledge base fills gaps for companies not listed here.
const COMPANY_PROFILES = {
  'Amazon': 'Focus: Graphs, Trees, DP, System Design. CRITICAL: Leadership Principles (test behavioral scenarios). LeetCode Medium-Hard. Bar raiser round is brutal.',
  'Microsoft': 'Focus: Arrays, Strings, Trees, DP. Clean code emphasis. Problem-solving depth. 2-3 coding rounds + design.',
  'Google': 'Focus: Advanced DSA, Graphs, DP, complexity optimization. LeetCode Hard. Big-O obsession.',
  'Flipkart': 'Focus: DSA + Low-level design. Java/system fundamentals. Machine coding round (build working code in 90 min).',
  'TCS': 'Focus: TCS NQT pattern — Quant, Verbal, Logic, 2 coding problems (Easy-Medium). OOP concepts. Consistent basics.',
  'Infosys': 'Focus: Infosys SP — Aptitude, 2 coding problems, OOP, DBMS. Pseudocode. Medium difficulty.',
  'Wipro': 'Focus: Wipro NLTH — Aptitude, English, 3 coding problems (Easy-Medium-Hard). Essay writing.',
  'Accenture': 'Focus: Cognitive + Technical assessment. Pseudocode, networking, cloud basics. Communication round.',
  'Ather Energy': 'Focus: Embedded/domain-specific + strong DSA. Real-world engineering problems.',
};

export async function generateDayContent(domain, dayNumber, level, user = null) {
  const deepseekUrl = process.env.DEEPSEEK_BASE_URL;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  console.log('DeepSeek URL:', deepseekUrl || '(not set)');
  console.log('DeepSeek key exists:', !!deepseekKey);

  // Watertight routing: resolve ANY domain input (slug, label, shorthand) to a
  // canonical slug BEFORE any lookup, so "AI/ML" / "Data Science" / "Core SDE"
  // land on the right track instead of silently defaulting to fullstack.
  const domainSlug = normalizeDomain(domain);
  const structure = DOMAIN_STRUCTURES[domainSlug];
  const track = DOMAIN_TRACKS[domainSlug];
  const week = Math.ceil(dayNumber / 7);

  // ── TIMELINE COMPRESSION ────────────────────────────────────────────────
  // months_to_placement sets the TOTAL roadmap length. A shorter runway keeps
  // the same 52-week syllabus but traverses it faster: we map the student's raw
  // day onto the full 365-day arc (paceDay) so phase, difficulty and messy-data
  // pressure all advance proportionally. Unset timeline → 365 (unchanged).
  const totalDays = roadmapTotalDays(user?.months_to_placement);
  const paceDay = Math.max(1, Math.round((dayNumber / totalDays) * 365));
  const paceWeek = Math.max(1, Math.ceil(paceDay / 7));

  // Find current phase — by the SCALED week so compressed plans still reach the
  // advanced phases before their (shorter) deadline.
  const phase = structure.phases.find(p => {
    const [start, end] = p.weeks.split('-').map(Number);
    return paceWeek >= start && paceWeek <= end;
  }) || structure.phases[structure.phases.length - 1];

  // Project days stay on the raw 7-day calendar (a project lands on the last day
  // of its real week), independent of timeline compression.
  const projectThisWeek = structure.projectSchedule.find(p => p.week === week);
  const isProjectDay = projectThisWeek && dayNumber === (week * 7); // Last day of project week

  const { systemContext, urgencyLevel, primaryTarget, hasWeaknesses } = buildUserContext(user);

  // Layer real performance data on top of the static profile so the day adapts
  // to how the student is ACTUALLY doing. Only runs on cache-miss generations.
  let performanceAdaptation = '';
  let solveRateNote = '';
  let realLevel = null; // real-performance level, feeds the difficulty ceiling
  if (user?.id) {
    try {
      const ctx = await buildFullStudentContext(user.id);
      performanceAdaptation = buildAdaptationInstructions(ctx);
      realLevel = ctx.realLevel;
      // Gate the difficulty ramp on real solve rate: hold when struggling,
      // accelerate when clearly ahead.
      if (ctx.codingSolveRate != null && ctx.codingSolveRate < 40) {
        solveRateNote = `\nREAL PERFORMANCE OVERRIDE: coding solve rate is ${ctx.codingSolveRate}% (below 40%). HOLD difficulty — add more practice at the current level before advancing.`;
      } else if (ctx.codingSolveRate != null && ctx.codingSolveRate > 70) {
        solveRateNote = `\nREAL PERFORMANCE OVERRIDE: coding solve rate is ${ctx.codingSolveRate}% (above 70%). ACCELERATE — skip ahead and raise the challenge.`;
      }
    } catch (e) {
      console.error('buildFullStudentContext failed, skipping adaptation:', e);
    }
  }

  const urgencyInstruction = urgencyLevel === 'critical'
    ? 'CRITICAL MODE: Student has <3 months. Skip optional theory. High-yield patterns only. Include estimated time: max 2 hours.'
    : urgencyLevel === 'urgent'
    ? 'URGENT: Balance theory and practice. Include time estimate.'
    : '';

  const companyInstruction = primaryTarget
    ? `PRIMARY TARGET: ${primaryTarget}. Every example, problem, and concept should directly help pass ${primaryTarget} OA/interview.`
    : '';

  const weaknessInstruction = hasWeaknesses
    ? `If today's topic overlaps with student's weak areas, spend extra time on fundamentals before advancing.`
    : '';

  // Effective level = the highest of the static phase level, the self-reported
  // level, and the real-performance level. This is what raises the ceiling for
  // students who are genuinely ahead (rank-up milestones).
  const effectiveLevel = highestLevel(phase.level, level, realLevel);

  // RIGID TRACK ROUTING — state the mandated stack up front so the model cannot
  // drift a domain into someone else's syllabus (e.g. AI/ML → C++ DSA).
  const trackInstruction = `MANDATED TRACK for ${structure.name} (domain: ${domainSlug}): ${track.stack}
Do NOT substitute another domain's syllabus. Stay strictly on this track.`;

  const primaryLanguage = track.language;
  const languageInstruction = `PRIMARY LANGUAGE for ${domainSlug}: ${primaryLanguage}
Generate all coding tasks and examples in this language.
EXCEPTION: If a company's algorithmic round REQUIRES a different language (e.g. some require C++ for competitive rounds), you MAY override — but you MUST explicitly state: "Note: Using C++ here because [company]'s coding round requires it, even though your domain is ${domainSlug}."
Never silently switch languages.`;

  // Drive difficulty by the SCALED day so a compressed timeline ramps faster and
  // hits the higher ceiling sooner — an aggressive 60-day plan is measurably
  // harder per calendar day than a relaxed 365-day one.
  const difficultyInstruction = `${buildDifficultyDirective(track, paceDay, effectiveLevel)}${solveRateNote}`;

  const messyDataInstruction = buildMessyDataDirective(track, paceDay, effectiveLevel);

  const companyProfileInstruction = primaryTarget
    ? `TARGET COMPANY: ${primaryTarget}
${COMPANY_PROFILES[primaryTarget] || 'Focus on strong DSA fundamentals and standard interview patterns.'}
Every task today should move the student closer to clearing ${primaryTarget}'s specific interview process. Include at least one task directly relevant to their interview pattern.`
    : '';

  const { searchKnowledgeBase, formatRagContext } = await import('./ragSearch.js');
  const ragResults = await searchKnowledgeBase(phase.focus, domainSlug, primaryTarget, 3);
  const ragContext = formatRagContext(ragResults, 'VERIFIED PLACEMENT DATA (prioritize this in your content)');

  const contextualPrefix = (systemContext || ragContext || performanceAdaptation)
    ? `${systemContext}\n${urgencyInstruction}\n${companyInstruction}\n${weaknessInstruction}${performanceAdaptation}${ragContext}\n\n`
    : '';

  const prompt = `${contextualPrefix}You are a senior software engineer creating a structured learning curriculum for Indian engineering students.

Domain: ${structure.name}
Day: ${dayNumber} of ${totalDays}${totalDays < 365 ? ` (COMPRESSED ${totalDays}-day plan — the student targets placement in ~${user?.months_to_placement} months, so raise intensity and cut low-yield theory)` : ''}
Week: ${week}
Current Phase: ${phase.focus}
Level: ${phase.level}

${trackInstruction}

${difficultyInstruction}

${languageInstruction}
${messyDataInstruction}
${companyProfileInstruction}
${isProjectDay ? `TODAY IS PROJECT DAY: ${projectThisWeek.title}` : ''}

Generate a single day's learning content. Return ONLY valid JSON, no markdown, no explanation:

{
  "topic": "specific topic name for today (not generic)",
  "description": "2-3 sentence description of what student will learn today",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "video_url": "best YouTube URL for this exact topic (real URL)",
  "resource_url": "best tutorial/docs URL (takeuforward/gfg/official docs)",
  "article_url": "GeeksForGeeks or dev.to article URL",
  "coding_problem": "specific problem to solve today",
  "coding_problem_url": "LeetCode or GFG problem URL",
  "estimated_minutes": 90,
  "difficulty": "easy | medium | hard — honest difficulty of TODAY's work for this student",
  "prerequisites": ["topics the student must already know before starting today — [] if none"],
  "learning_objectives": ["1-3 short outcome bullets: what the student can DO after today"],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "is_project_day": ${isProjectDay ? 'true' : 'false'}
  ${isProjectDay ? `, "project": { "title": "${projectThisWeek?.title}", "description": "${projectThisWeek?.description}", "difficulty": "${projectThisWeek?.difficulty}", "steps": ["Step 1: Setup VS Code project", "Step 2: Plan the architecture", "Step 3: Build core features", "Step 4: Add styling and polish", "Step 5: Test and debug", "Step 6: Push to GitHub", "Step 7: Write README"], "github_required": true, "estimated_hours": 20, "resources": ["resource1", "resource2"], "evaluation_criteria": ["criterion1", "criterion2", "criterion3"] }` : ''}
}`;

  // deepseek-r1 is the wrong name for DeepSeek's own API — correct name is deepseek-reasoner
  const modelsToTry = [
    'deepseek-ai/deepseek-r1',
    'deepseek-ai/deepseek-chat',
    'deepseek-chat',
    'deepseek-reasoner',
  ];

  if (!deepseekUrl || !deepseekKey) {
    console.log('DeepSeek skipped: DEEPSEEK_BASE_URL or DEEPSEEK_API_KEY is not set');
  } else {
    // Try DeepSeek first (cheaper) with model fallback loop
    for (const model of modelsToTry) {
      try {
        const endpoint = deepseekUrl + '/chat/completions';
        console.log(`Attempting DeepSeek model=${model} endpoint=${endpoint}`);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + deepseekKey,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) {
          const errorBody = await res.text().catch(() => '(could not read body)');
          console.error(`DeepSeek HTTP ${res.status} for model=${model}:`, errorBody);
          continue;
        }
        const data = await res.json();
        let content = data.choices?.[0]?.message?.content || '';
        if (!content) {
          console.error(`DeepSeek model=${model} returned empty content. Full response:`, JSON.stringify(data));
          continue;
        }
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(content);
        console.log(`DeepSeek success with model=${model}`);
        return withSafeVideo({ ...parsed, generated_by: `deepseek (${model})` });
      } catch (e) {
        console.error(`DeepSeek threw for model=${model}:`, e);
      }
    }
    console.error('All DeepSeek models failed, falling back to Claude');
  }

  // Fallback to Claude
  try {
    const { askClaudeJSON } = await import('./claude.js');
    const result = await askClaudeJSON(prompt);
    return withSafeVideo({ ...result, generated_by: 'claude' });
  } catch (e) {
    console.error('Claude also failed, using static fallback:', e);
  }

  // Static fallback - always works
  return withSafeVideo(getStaticFallback(domainSlug, dayNumber, week, phase, isProjectDay, projectThisWeek));
}

function getStaticFallback(domain, dayNumber, week, phase, isProjectDay, project) {
  const topics = {
    fullstack: ['HTML Structure', 'CSS Styling', 'JavaScript Basics', 'DOM Events', 'Async/Await', 'Node.js', 'Express API', 'React Components', 'React Hooks', 'Database Design'],
    dsa: ['Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Binary Search', 'Recursion', 'Trees', 'Graphs', 'Dynamic Programming', 'Greedy'],
    cybersecurity: ['Linux Basics', 'Networking', 'Python Scripting', 'Web Security', 'Cryptography', 'Ethical Hacking', 'Penetration Testing', 'CTF Challenges'],
    aiml: ['Python Basics', 'NumPy', 'Pandas', 'Statistics', 'Machine Learning', 'Neural Networks', 'Deep Learning', 'NLP', 'Computer Vision'],
    devops: ['Linux', 'Shell Scripting', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Monitoring'],
    android: ['Kotlin', 'Android Studio', 'Layouts', 'Compose UI', 'MVVM', 'Retrofit', 'Firebase'],
    datascience: ['Python', 'Pandas', 'Statistics', 'Visualization', 'Machine Learning', 'SQL', 'Big Data'],
    blockchain: ['Blockchain Basics', 'Solidity', 'Smart Contracts', 'Web3', 'DeFi', 'NFTs'],
    gamedev: ['Unity Basics', 'C# Scripting', '2D Physics', '3D Models', 'Game AI', 'Multiplayer'],
    systemdesign: ['Scalability', 'Databases', 'Caching', 'Microservices', 'Load Balancing', 'System Patterns'],
  };
  
  const domainTopics = topics[domain] || topics.fullstack;
  const topic = domainTopics[(dayNumber - 1) % domainTopics.length];
  
  const resourceMap = {
    fullstack: { resource: 'https://developer.mozilla.org/en-US/', article: 'https://www.geeksforgeeks.org/web-development/', video: 'https://www.youtube.com/c/Fireship', problem_url: 'https://leetcode.com/problemset/' },
    dsa: { resource: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2', article: 'https://www.geeksforgeeks.org/data-structures/', video: 'https://www.youtube.com/@takeUforward', problem_url: 'https://leetcode.com/problemset/' },
    cybersecurity: { resource: 'https://owasp.org/', article: 'https://www.geeksforgeeks.org/cyber-security-tutorial/', video: 'https://www.youtube.com/@TCMSecurityAcademy', problem_url: 'https://tryhackme.com/' },
    aiml: { resource: 'https://scikit-learn.org/stable/', article: 'https://www.geeksforgeeks.org/machine-learning/', video: 'https://www.youtube.com/@3blue1brown', problem_url: 'https://www.kaggle.com/learn' },
    devops: { resource: 'https://docs.docker.com/', article: 'https://www.geeksforgeeks.org/devops-tutorial/', video: 'https://www.youtube.com/@TechWorldwithNana', problem_url: 'https://www.katacoda.com/' },
    android: { resource: 'https://developer.android.com/docs', article: 'https://www.geeksforgeeks.org/android-tutorial/', video: 'https://www.youtube.com/@PhilippLackner', problem_url: 'https://developer.android.com/codelabs' },
    datascience: { resource: 'https://pandas.pydata.org/docs/', article: 'https://www.geeksforgeeks.org/data-science-tutorial/', video: 'https://www.youtube.com/@coreyms', problem_url: 'https://www.kaggle.com/learn' },
    blockchain: { resource: 'https://docs.soliditylang.org/', article: 'https://www.geeksforgeeks.org/blockchain-technology/', video: 'https://www.youtube.com/@PatrickCollins', problem_url: 'https://cryptozombies.io/' },
    gamedev: { resource: 'https://docs.unity3d.com/', article: 'https://www.geeksforgeeks.org/unity-game-engine/', video: 'https://www.youtube.com/@Brackeys', problem_url: 'https://learn.unity.com/' },
    systemdesign: { resource: 'https://github.com/donnemartin/system-design-primer', article: 'https://www.geeksforgeeks.org/system-design-tutorial/', video: 'https://www.youtube.com/@Exponent', problem_url: 'https://leetcode.com/problemset/?topicSlugs=design' },
  };
  
  const res = resourceMap[domain] || resourceMap.fullstack;
  
  // Static-fallback day difficulty tracks the phase level (the AI path judges
  // this per-day; here the phase is the only real signal we have).
  const levelDifficulty = { beginner: 'easy', intermediate: 'medium', advanced: 'hard', expert: 'hard' };

  const fallback = {
    topic: `${topic} - Day ${dayNumber}`,
    description: `Learn ${topic} as part of your ${domain} journey. Today focuses on ${phase.focus}.`,
    objectives: [`Understand ${topic} fundamentals`, `Practice with hands-on exercises`, `Solve related problems`],
    video_url: res.video,
    resource_url: res.resource,
    article_url: res.article,
    coding_problem: `Practice ${topic} problems`,
    coding_problem_url: res.problem_url,
    estimated_minutes: 90,
    difficulty: levelDifficulty[phase.level] || 'easy',
    prerequisites: [],
    learning_objectives: [`Understand ${topic} fundamentals`, `Apply ${topic} in practice problems`],
    key_concepts: [topic, phase.level + ' level', 'Week ' + Math.ceil(dayNumber/7)],
    is_project_day: isProjectDay,
    generated_by: 'static_fallback'
  };

  if (isProjectDay && project) {
    fallback.project = {
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      steps: ['Setup VS Code project', 'Plan architecture', 'Build core features', 'Add styling', 'Test thoroughly', 'Push to GitHub', 'Write README'],
      github_required: true,
      estimated_hours: 20,
      resources: [res.resource, res.article],
      evaluation_criteria: ['Code quality', 'Functionality', 'Documentation']
    };
  }

  return fallback;
}

export { DOMAIN_STRUCTURES };
