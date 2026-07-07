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

// Strict day-based difficulty ramp so the roadmap gets measurably harder over
// time instead of plateauing at whatever the phase's static level says.
const difficultyPhase = (day) => {
  if (day <= 3) return 'FOUNDATION: Core syntax, fundamental concepts. Build a base. Easy problems only.';
  if (day <= 10) return 'BUILD: LeetCode Easy to Medium. Debug broken code snippets. Write test cases. Increase rigor daily.';
  if (day <= 20) return 'PUSH: LeetCode Medium consistently. Time-complexity optimization. Pattern recognition (sliding window, two pointers, DP).';
  return 'MASTERY: LeetCode Hard. Edge-case optimization. System design basics. Real interview-level problems.';
};

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

  const structure = DOMAIN_STRUCTURES[domain] || DOMAIN_STRUCTURES['fullstack'];
  const week = Math.ceil(dayNumber / 7);

  // Find current phase
  const phase = structure.phases.find(p => {
    const [start, end] = p.weeks.split('-').map(Number);
    return week >= start && week <= end;
  }) || structure.phases[structure.phases.length - 1];

  // Check if this is a project week
  const projectThisWeek = structure.projectSchedule.find(p => p.week === week);
  const isProjectDay = projectThisWeek && dayNumber === (week * 7); // Last day of project week

  const { systemContext, urgencyLevel, primaryTarget, hasWeaknesses } = buildUserContext(user);

  // Layer real performance data on top of the static profile so the day adapts
  // to how the student is ACTUALLY doing. Only runs on cache-miss generations.
  let performanceAdaptation = '';
  let solveRateNote = '';
  if (user?.id) {
    try {
      const ctx = await buildFullStudentContext(user.id);
      performanceAdaptation = buildAdaptationInstructions(ctx);
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

  const difficultyInstruction = `DIFFICULTY FOR DAY ${dayNumber}: ${difficultyPhase(dayNumber)}
The roadmap MUST get progressively harder. Day ${dayNumber} should be measurably more challenging than day ${dayNumber - 1}.
Never repeat the same difficulty flat. If the student is on day ${dayNumber}, they've already covered easier material — do NOT regenerate basics.${solveRateNote}`;

  const companyProfileInstruction = primaryTarget
    ? `TARGET COMPANY: ${primaryTarget}
${COMPANY_PROFILES[primaryTarget] || 'Focus on strong DSA fundamentals and standard interview patterns.'}
Every task today should move the student closer to clearing ${primaryTarget}'s specific interview process. Include at least one task directly relevant to their interview pattern.`
    : '';

  const { searchKnowledgeBase, formatRagContext } = await import('./ragSearch.js');
  const ragResults = await searchKnowledgeBase(phase.focus, domain, primaryTarget, 3);
  const ragContext = formatRagContext(ragResults, 'VERIFIED PLACEMENT DATA (prioritize this in your content)');

  const contextualPrefix = (systemContext || ragContext || performanceAdaptation)
    ? `${systemContext}\n${urgencyInstruction}\n${companyInstruction}\n${weaknessInstruction}${performanceAdaptation}${ragContext}\n\n`
    : '';

  const prompt = `${contextualPrefix}You are a senior software engineer creating a structured learning curriculum for Indian engineering students.

Domain: ${structure.name}
Day: ${dayNumber} of 365
Week: ${week}
Current Phase: ${phase.focus}
Level: ${phase.level}

${difficultyInstruction}

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
        return { ...parsed, generated_by: `deepseek (${model})` };
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
    return { ...result, generated_by: 'claude' };
  } catch (e) {
    console.error('Claude also failed, using static fallback:', e);
  }

  // Static fallback - always works
  return getStaticFallback(domain, dayNumber, week, phase, isProjectDay, projectThisWeek);
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
