import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

export const dynamic = 'force-dynamic';

// Per-company interview flavour. Falls back to a generic profile for anything
// not listed here.
const COMPANY_STYLE = {
  TCS:       'Focus on OOP concepts, basic DSA, SQL, and situational/managerial questions. Keep DSA at easy-medium.',
  Infosys:   'Focus on algorithms, database/DBMS concepts, OS basics, and project experience. Probe fundamentals.',
  Wipro:     'Focus on programming fundamentals, DBMS, and aptitude-style reasoning applied to code.',
  Accenture: 'Focus on practical coding, cloud/automation awareness, and communication-heavy situational questions.',
  Cognizant: 'Focus on DSA, DBMS, and applied problem-solving with follow-ups on trade-offs.',
  Amazon:    'Focus on Leadership Principles (ownership, bias for action, customer obsession) AND hard DSA problems. Demand specifics.',
  Microsoft: 'Focus on medium-hard DSA, system thinking, and clear reasoning out loud. Push on edge cases.',
  Google:    'Focus on hard DSA, complexity analysis, and rigorous reasoning. Be relentless on optimality.',
  Flipkart:  'Focus on DSA, scalability, and real-world system trade-offs for high-traffic e-commerce.',
};

function styleFor(company) {
  if (!company) return 'Mix fundamentals, DSA, and one situational question. Calibrate difficulty to the level.';
  return COMPANY_STYLE[company] || `Interview in the style of ${company}: probe domain fundamentals, problem-solving, and communication.`;
}

// Domain-specific subject matter so questions actually match the candidate's field.
const DOMAIN_CONTEXT = {
  dsa: 'Data Structures and Algorithms — arrays, trees, graphs, DP, sorting, searching',
  fullstack: 'Full Stack Development — React, Node.js, REST APIs, databases, deployment',
  aiml: 'AI/ML — machine learning algorithms, neural networks, Python, model training',
  cybersecurity: 'Cybersecurity — network security, ethical hacking, OWASP, encryption',
  devops: 'DevOps — CI/CD, Docker, Kubernetes, cloud platforms, monitoring',
  android: 'Android Development — Kotlin, Jetpack Compose, Android SDK, mobile architecture',
  datascience: 'Data Science — Python, pandas, visualization, statistical analysis',
  blockchain: 'Blockchain — smart contracts, Solidity, Web3, consensus mechanisms',
  gamedev: 'Game Development — game loops, physics, Unity/Unreal, shader programming',
  systemdesign: 'System Design — scalability, load balancing, databases, microservices',
};

// The page may send a slug ("dsa") or a humanised label ("Full Stack").
// Normalise to a key so the lookup works either way.
function domainFocusFor(domain) {
  const key = String(domain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (DOMAIN_CONTEXT[key]) return DOMAIN_CONTEXT[key];
  // Custom/unknown domain — build a focus from the raw text rather than forcing DSA.
  const raw = String(domain || '').trim();
  return raw ? `${raw} — core concepts, tools, and real-world problems in this field` : DOMAIN_CONTEXT.dsa;
}

function modeDirective(mode, questionNumber) {
  if (mode === 'hr') {
    return 'This is an HR / behavioural round. Ask about motivation, conflict, failure, teamwork, placement strategy, or communication. NO coding problems.';
  }
  if (mode === 'mixed') {
    // Alternate so a 10-question set is roughly half technical, half behavioural.
    return questionNumber % 2 === 0
      ? 'Ask a TECHNICAL question (DSA, system design, coding logic, or core CS).'
      : 'Ask a BEHAVIOURAL / situational question (teamwork, ownership, failure, communication).';
  }
  return 'This is a TECHNICAL round. Ask about DSA, system design, coding logic, complexity, or core CS fundamentals.';
}

function buildPrompts({ domain, level, targetCompany, mode, questionNumber, previousQuestions }) {
  const company = targetCompany || 'a top product company';
  const domainFocus = domainFocusFor(domain);
  const difficultyBand = questionNumber <= 3 ? 'easy' : questionNumber <= 7 ? 'medium' : 'hard';
  const system = `You are a hostile, senior engineer at ${company} conducting a real placement interview.
Communicate exclusively in professional, concise English. No slang, no filler.
DO NOT be friendly. Be direct, challenging, and probe weaknesses — but ask exactly ONE clear, answerable question.
Candidate profile:
- Domain: ${domain || 'Software Engineering'}
- Level: ${level || 'Fresher'}
- Target: ${company}
- Question: ${questionNumber}/10
The candidate's primary domain is: ${domainFocus}
Generate a question SPECIFIC to this domain. Do NOT ask generic questions.
- Ask about real concepts, algorithms, tools, or frameworks from ${domainFocus}.
- Make questions progressively harder: Q1-3 easy, Q4-7 medium, Q8-10 hard. This is question ${questionNumber}/10, so target ${difficultyBand} difficulty.
Interview style for ${company}: ${styleFor(targetCompany)}
${modeDirective(mode, questionNumber)}`;

  const prev = (previousQuestions || []).filter(Boolean);
  const user = `Generate exactly ONE interview question for this candidate.
${prev.length ? `Do NOT repeat or paraphrase any of these already-asked questions:\n${prev.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}
The question must be answerable verbally in 60-90 seconds (no "write code on screen" tasks — ask them to EXPLAIN the approach out loud).

Return ONLY a JSON object, no markdown:
{
  "question": "the exact question to ask, phrased as the interviewer speaking",
  "type": "technical|behavioral|situational",
  "hint": "what a strong answer covers (used only for grading, never shown to candidate)",
  "difficulty": "easy|medium|hard",
  "expectedDuration": 60
}`;

  return { system, user };
}

// DeepSeek-R1 via NVIDIA endpoint — primary generator.
async function askDeepSeek(system, user, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-r1',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content || '';
    // R1 emits <think>...</think> reasoning before the answer — strip it.
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
    raw = raw.replace(/```json|```/gi, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw);
  } finally {
    clearTimeout(timer);
  }
}

function normalize(q) {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return null;
  return {
    question: q.question.trim(),
    type: ['technical', 'behavioral', 'situational'].includes(q.type) ? q.type : 'technical',
    hint: typeof q.hint === 'string' ? q.hint : '',
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    expectedDuration: Number(q.expectedDuration) || 60,
  };
}

// Last-resort question so the interview can always proceed.
function fallbackQuestion(mode, questionNumber) {
  const technical = [
    'Walk me through how a hash map works internally, and tell me when it degrades to O(n).',
    'Explain the difference between an array and a linked list, and when you would pick each.',
    'How would you detect a cycle in a linked list? Explain your approach and its complexity.',
    'What happens, step by step, when you type a URL into a browser and press enter?',
    'Explain the difference between a process and a thread, with a real example.',
  ];
  const behavioral = [
    'Tell me about a time a project of yours failed. What did you do, and what did you learn?',
    'Why do you want to join this company, and why should we pick you over other candidates?',
    'Describe a disagreement you had with a teammate and how you resolved it.',
    'What is your biggest weakness, and what concrete steps are you taking to fix it?',
    'Tell me about the hardest technical problem you have solved on your own.',
  ];
  const pool = mode === 'hr' ? behavioral
    : mode === 'mixed' ? (questionNumber % 2 === 0 ? technical : behavioral)
    : technical;
  return normalize({
    question: pool[questionNumber % pool.length],
    type: mode === 'hr' ? 'behavioral' : 'technical',
    hint: 'Looking for structure, a concrete example, and clear reasoning.',
    difficulty: 'medium',
    expectedDuration: 60,
  });
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`vi_q_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const body = await request.json();
    const mode = ['technical', 'hr', 'mixed'].includes(body.mode) ? body.mode : 'technical';
    const questionNumber = Math.min(Math.max(parseInt(body.questionNumber, 10) || 1, 1), 10);
    const params = {
      domain: body.domain,
      level: body.level,
      targetCompany: body.targetCompany,
      mode,
      questionNumber,
      previousQuestions: Array.isArray(body.previousQuestions) ? body.previousQuestions.slice(0, 12) : [],
    };

    const { system, user } = buildPrompts(params);

    let question = null;
    let source = 'deepseek';

    // Primary: DeepSeek
    try {
      question = normalize(await askDeepSeek(system, user));
    } catch (e) {
      console.warn('[interview/questions] DeepSeek failed:', e.message);
    }

    // Fallback: Claude
    if (!question) {
      source = 'claude';
      try {
        question = normalize(await askClaudeJSON(user, system, 700));
      } catch (e) {
        console.warn('[interview/questions] Claude failed:', e.message);
      }
    }

    // Last resort: static bank — never break the interview.
    if (!question) {
      source = 'fallback';
      question = fallbackQuestion(mode, questionNumber);
    }

    return successResponse({ question, source });
  } catch (error) {
    console.error('[interview/questions] Error:', error);
    return errorResponse('Could not generate a question. Try again.', 500);
  }
}
