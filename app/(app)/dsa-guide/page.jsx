'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  {
    id: 'level',
    question: 'What is your current programming level?',
    options: [
      { value: 'beginner', label: '🌱 Beginner — Know basic syntax only' },
      { value: 'intermediate', label: '💻 Intermediate — Built small projects' },
      { value: 'advanced', label: '🚀 Advanced — Can build full apps' },
    ],
  },
  {
    id: 'known',
    question: 'Which language do you know BEST right now?',
    options: [
      { value: 'c', label: 'C' },
      { value: 'cpp', label: 'C++' },
      { value: 'java', label: 'Java' },
      { value: 'python', label: 'Python' },
      { value: 'javascript', label: 'JavaScript' },
      { value: 'none', label: 'None really' },
    ],
  },
  {
    id: 'goal',
    question: 'What is your DSA goal?',
    options: [
      { value: 'product', label: '🏆 Crack product companies (Google, Amazon, Meta)' },
      { value: 'service', label: '💼 Clear service company tests (TCS, Infosys)' },
      { value: 'startup', label: '⚡ Join fast-moving startups' },
      { value: 'competitive', label: '🥇 Competitive programming' },
    ],
  },
  {
    id: 'time',
    question: 'How much time can you commit daily?',
    options: [
      { value: 'low', label: '1-2 hours' },
      { value: 'medium', label: '2-4 hours' },
      { value: 'high', label: '4+ hours' },
    ],
  },
];

const LANGUAGES = {
  cpp: {
    name: 'C++',
    color: '#7F77DD',
    icon: '⚡',
    pros: [
      'Fastest execution — critical for time-limited tests',
      'STL (vectors, maps, sets) makes DSA easy',
      'Used by 90% of top competitive programmers',
      'Industry standard for product company interviews',
      'Shows strong CS fundamentals to interviewers',
    ],
    cons: [
      'Steeper learning curve',
      'Manual memory management in some cases',
      'Verbose syntax compared to Python',
    ],
    timeToMaster: '4-6 months',
    companies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Codeforces elite'],
    resources: [
      { name: 'Striver A2Z DSA Course', link: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2' },
      { name: 'Love Babbar 450 Questions', link: 'https://drive.google.com/file/d/1FMdN_OCfOI0iAeDlqswCiC2DZzD4nPsb/view' },
      { name: 'LeetCode', link: 'https://leetcode.com' },
      { name: 'Codeforces', link: 'https://codeforces.com' },
    ],
    bestFor: 'Serious DSA students targeting top product companies',
  },
  java: {
    name: 'Java',
    color: '#E24B4A',
    icon: '☕',
    pros: [
      'Most jobs in India use Java (service companies love it)',
      'Object-oriented helps understand OOP deeply',
      'Good balance of speed and readability',
      'Huge community and resources in India',
      'Strong in enterprise roles',
    ],
    cons: [
      'Verbose syntax (more lines to write)',
      'Slightly slower than C++ in execution',
      'Need to manage class structure',
    ],
    timeToMaster: '4-6 months',
    companies: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Oracle', 'Goldman Sachs'],
    resources: [
      { name: 'Striver DSA Sheet', link: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/' },
      { name: 'GeeksforGeeks DSA', link: 'https://www.geeksforgeeks.org/data-structures/' },
      { name: 'LeetCode Java Track', link: 'https://leetcode.com' },
      { name: 'InterviewBit', link: 'https://www.interviewbit.com' },
    ],
    bestFor: 'Students targeting service companies and Indian MNCs',
  },
  python: {
    name: 'Python',
    color: '#1D9E75',
    icon: '🐍',
    pros: [
      'Shortest code — write solutions faster',
      'Readable syntax — focus on logic not syntax',
      'Best for beginners starting DSA',
      'Same language for DSA + ML + backend + automation',
      'Growing acceptance at top companies',
    ],
    cons: [
      'Slowest execution — can fail time limits on hard problems',
      'Some companies (old-school) may prefer C++/Java',
      'Can hide complexity — harder to learn deep CS',
    ],
    timeToMaster: '3-5 months',
    companies: ['Google', 'Meta', 'Microsoft', 'Netflix', 'Most ML/AI startups'],
    resources: [
      { name: 'NeetCode 150', link: 'https://neetcode.io/practice' },
      { name: 'Striver Sheet (Python)', link: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/' },
      { name: 'LeetCode Python', link: 'https://leetcode.com' },
      { name: 'HackerRank Python', link: 'https://www.hackerrank.com/domains/python' },
    ],
    bestFor: 'Beginners, ML/AI students, those who want fastest learning curve',
  },
};

const DSA_ROADMAP = [
  { week: 1, title: 'Arrays & Strings', topics: ['Array basics', 'Two pointer', 'Sliding window', 'String manipulation', 'Sorting algorithms'], difficulty: 'Easy', problemCount: 30 },
  { week: 2, title: 'Hashing & HashMaps', topics: ['Hash tables', 'Frequency counting', 'Hash sets', 'LeetCode Top 100 - Easy Hashing'], difficulty: 'Easy', problemCount: 25 },
  { week: 3, title: 'Linked Lists', topics: ['Singly linked list', 'Doubly linked list', 'Reverse linked list', 'Cycle detection', 'Merge sorted lists'], difficulty: 'Medium', problemCount: 25 },
  { week: 4, title: 'Stacks & Queues', topics: ['Stack operations', 'Monotonic stack', 'Queue implementation', 'Priority queue basics'], difficulty: 'Medium', problemCount: 20 },
  { week: 5, title: 'Recursion & Backtracking', topics: ['Recursion basics', 'N-queens', 'Subset generation', 'Permutations'], difficulty: 'Medium', problemCount: 25 },
  { week: 6, title: 'Trees', topics: ['Binary tree', 'Tree traversals', 'BST', 'Tree problems', 'Lowest common ancestor'], difficulty: 'Medium', problemCount: 30 },
  { week: 7, title: 'Heaps & Priority Queue', topics: ['Min heap', 'Max heap', 'Top K problems', 'Merge K sorted lists'], difficulty: 'Medium', problemCount: 20 },
  { week: 8, title: 'Graphs - Basics', topics: ['Graph representation', 'BFS', 'DFS', 'Connected components'], difficulty: 'Hard', problemCount: 25 },
  { week: 9, title: 'Graphs - Advanced', topics: ['Dijkstra', 'Topological sort', 'Union find', 'Minimum spanning tree'], difficulty: 'Hard', problemCount: 20 },
  { week: 10, title: 'Dynamic Programming - Intro', topics: ['1D DP', 'Fibonacci', 'Climbing stairs', 'House robber'], difficulty: 'Hard', problemCount: 25 },
  { week: 11, title: 'DP - Advanced', topics: ['2D DP', 'Knapsack', 'LCS', 'Edit distance', 'Matrix chain multiplication'], difficulty: 'Hard', problemCount: 30 },
  { week: 12, title: 'Greedy + System Design Basics', topics: ['Greedy algorithms', 'Interval scheduling', 'Basic system design', 'Mock interviews'], difficulty: 'Hard', problemCount: 25 },
];

function recommend(answers) {
  const { level, known, goal, time } = answers;

  if (goal === 'competitive') return 'cpp';
  if (goal === 'product' && time === 'high') return 'cpp';

  if (goal === 'service') return 'java';
  if (known === 'java') return 'java';

  if (level === 'beginner') return 'python';
  if (known === 'python' && goal !== 'competitive') return 'python';
  if (time === 'low') return 'python';

  if (known === 'cpp' || known === 'c') return 'cpp';

  return 'cpp';
}

export default function DSAGuidePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function selectOption(questionId, value) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 250);
    } else {
      setTimeout(() => {
        const rec = recommend(newAnswers);
        setResult(rec);
      }, 250);
    }
  }

  if (result) {
    const lang = LANGUAGES[result];
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d9a3', letterSpacing: 2, marginBottom: 10 }}>RECOMMENDATION</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#e8e8ed' }}>
            Do your DSA in <span style={{ color: lang.color }}>{lang.name}</span>
          </h1>
          <p style={{ color: '#5a7a9a', fontSize: 14, marginTop: 8 }}>Based on your level, goals and available time.</p>
        </div>

        <div style={{ background: `linear-gradient(135deg,${lang.color}10,transparent)`, border: `2px solid ${lang.color}30`, borderRadius: 16, padding: 28, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${lang.color},transparent)` }} />
          <div style={{ fontSize: 64, marginBottom: 12 }}>{lang.icon}</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: lang.color, marginBottom: 10 }}>{lang.name}</div>
          <div style={{ color: '#8a9ab0', fontSize: 14, lineHeight: 1.7 }}>{lang.bestFor}</div>
          <div style={{ marginTop: 12, display: 'inline-flex', gap: 12, padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#5a7a9a' }}>Time to master: <strong style={{ color: lang.color }}>{lang.timeToMaster}</strong></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#070f1f', border: '1px solid rgba(29,158,117,0.15)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1D9E75', letterSpacing: 2, marginBottom: 12 }}>✓ WHY THIS WORKS FOR YOU</div>
            {lang.pros.map((p, i) => (
              <div key={i} style={{ fontSize: 13, color: '#c8d8e8', padding: '6px 0', lineHeight: 1.5 }}>• {p}</div>
            ))}
          </div>
          <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.12)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#EF9F27', letterSpacing: 2, marginBottom: 12 }}>⚠️ KEEP IN MIND</div>
            {lang.cons.map((c, i) => (
              <div key={i} style={{ fontSize: 13, color: '#8a9ab0', padding: '6px 0', lineHeight: 1.5 }}>• {c}</div>
            ))}
          </div>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(0,217,163,0.1)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00d9a3', letterSpacing: 2, marginBottom: 12 }}>COMPANIES THAT USE {lang.name.toUpperCase()}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lang.companies.map((c, i) => (
              <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: `${lang.color}12`, color: lang.color, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </div>

        <div style={{ background: '#070f1f', border: '1px solid rgba(255,107,74,0.12)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b4a', letterSpacing: 2, marginBottom: 14 }}>START HERE — FREE RESOURCES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lang.resources.map((r, i) => (
              <a key={i} href={r.link} target="_blank" rel="noreferrer" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,107,74,0.06)', border: '1px solid rgba(255,107,74,0.1)', color: '#c8d8e8', textDecoration: 'none', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📚 {r.name}</span>
                <span style={{ color: '#ff6b4a', fontSize: 12 }}>→</span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setStep(0); setAnswers({}); setResult(null); }} style={{ flex: 1, padding: '13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5a7a9a', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 14 }}>Retake Quiz</button>
          <button onClick={() => { document.getElementById('dsa-roadmap-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${lang.color},${lang.color}99)`, color: '#020812', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700 }}>
            Start DSA Roadmap →
          </button>
        </div>

        <div id="dsa-roadmap-section" style={{ marginTop: 32, scrollMarginTop: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d9a3', letterSpacing: 2, marginBottom: 14 }}>90-DAY DSA ROADMAP</div>
          <div style={{ fontSize: 13, color: '#5a7a9a', marginBottom: 20 }}>
            Follow this 12-week roadmap in {lang.name}. Dedicate 2-3 hours daily. 300 problems total.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DSA_ROADMAP.map((week, i) => {
              const diffColor = week.difficulty === 'Easy' ? '#1D9E75' : week.difficulty === 'Medium' ? '#EF9F27' : '#ff2d78';
              return (
                <div key={i} style={{ background: '#070f1f', border: `1px solid ${diffColor}15`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${diffColor}15`, color: diffColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700 }}>W{week.week}</div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#e8e8ed' }}>{week.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${diffColor}12`, color: diffColor, fontFamily: 'var(--font-mono)' }}>{week.difficulty.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: '#5a7a9a', fontFamily: 'var(--font-mono)' }}>{week.problemCount} PROBLEMS</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {week.topics.map((t, ti) => (
                      <span key={ti} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', color: '#8a9ab0', fontFamily: 'var(--font-mono)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'linear-gradient(135deg,rgba(0,217,163,0.06),rgba(255,107,74,0.02))', border: '1px solid rgba(0,217,163,0.15)', borderRadius: 12, padding: 18, marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#00d9a3', marginBottom: 6 }}>90 Days. 300 Problems. 1 Job.</div>
            <div style={{ fontSize: 12, color: '#5a7a9a' }}>Consistency beats intensity. Do 3-4 problems daily in {lang.name}.</div>
          </div>
        </div>

      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00d9a3', letterSpacing: 2, marginBottom: 6 }}>DSA LANGUAGE RECOMMENDER</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#e8e8ed' }}>Which language should you use for DSA?</h1>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a7a9a', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>
          QUESTION {step + 1} OF {QUESTIONS.length}
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: 'linear-gradient(90deg,#00d9a3,#ff6b4a)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#e8e8ed', marginBottom: 20, textAlign: 'center' }}>{q.question}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map(opt => {
          const selected = answers[q.id] === opt.value;
          return (
            <button key={opt.value} onClick={() => selectOption(q.id, opt.value)} style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1px solid ${selected ? 'rgba(0,217,163,0.5)' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(0,217,163,0.08)' : 'rgba(255,255,255,0.02)', color: selected ? '#00d9a3' : '#c8d8e8', fontSize: 15 }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)} style={{ marginTop: 20, background: 'transparent', border: 'none', color: '#5a7a9a', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)' }}>
          ← Previous Question
        </button>
      )}
    </div>
  );
}
