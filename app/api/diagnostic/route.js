import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { saveAttemptReview } from '@/lib/attemptReview';

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('diagnostic_tests')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (existing) return successResponse({ diagnostic: existing, alreadyTaken: true });

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug')
      .eq('id', payload.userId)
      .single();

    const domain = user?.domain_slug || 'fullstack';

    const prompt = `Generate 15 diagnostic questions for a ${domain} engineering student.
Mix difficulty: 5 easy, 6 medium, 4 hard.
Questions test real understanding not just definitions.
Cover core concepts of ${domain}.

Return ONLY valid JSON array:
[
  {
    "question": "...",
    "options": ["A","B","C","D"],
    "correct": "A",
    "difficulty": "easy",
    "topic": "specific topic name",
    "points": 10
  }
]
Easy = 10 pts, Medium = 15 pts, Hard = 20 pts`;

    let questions = [];
    try {
      const text = await callClaude(prompt);
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (claudeErr) {
      console.warn('[diagnostic/route] Claude call failed. Using high-quality static fallback diagnostic questions...', claudeErr.message);
      questions = [
        {
          "question": "What is the time complexity to access an element in a standard array by its index?",
          "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
          "correct": "A",
          "difficulty": "easy",
          "topic": "Arrays",
          "points": 10
        },
        {
          "question": "Which data structure operates on a Last-In-First-Out (LIFO) model?",
          "options": ["Queue", "Stack", "Tree", "Graph"],
          "correct": "B",
          "difficulty": "easy",
          "topic": "Stacks",
          "points": 10
        },
        {
          "question": "What is the time complexity of binary search on a sorted array of size n?",
          "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          "correct": "B",
          "difficulty": "easy",
          "topic": "Searching",
          "points": 10
        },
        {
          "question": "Which HTML5 element is used to specify semantic footer content?",
          "options": ["<bottom>", "<footer>", "<section>", "<aside>"],
          "correct": "B",
          "difficulty": "easy",
          "topic": "HTML5",
          "points": 10
        },
        {
          "question": "What does CSS flex-direction: column do?",
          "options": ["Lays out items horizontally", "Lays out items vertically", "Hides all items", "Floats items left"],
          "correct": "B",
          "difficulty": "easy",
          "topic": "CSS3",
          "points": 10
        },
        {
          "question": "What is the worst-case time complexity of Quick Sort?",
          "options": ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
          "correct": "C",
          "difficulty": "medium",
          "topic": "Sorting",
          "points": 15
        },
        {
          "question": "Which HTTP status code represents 'Unauthorized access'?",
          "options": ["400", "401", "403", "404"],
          "correct": "B",
          "difficulty": "medium",
          "topic": "HTTP Protocols",
          "points": 15
        },
        {
          "question": "What is the purpose of React hooks like useEffect?",
          "options": ["Handling state only", "Performing side effects in functional components", "Directly altering DOM", "Rendering raw HTML"],
          "correct": "B",
          "difficulty": "medium",
          "topic": "React Hooks",
          "points": 15
        },
        {
          "question": "In database normalization, which form ensures there are no transitive functional dependencies?",
          "options": ["1NF", "2NF", "3NF", "BCNF"],
          "correct": "C",
          "difficulty": "medium",
          "topic": "Database Normalization",
          "points": 15
        },
        {
          "question": "What does a promise representing 'rejected' status mean in JS?",
          "options": ["Completed successfully", "Asynchronous operation failed", "Pending execution", "Cancelled by browser"],
          "correct": "B",
          "difficulty": "medium",
          "topic": "Asynchronous JS",
          "points": 15
        },
        {
          "question": "Which data structure is naturally suited for Dijkstra's shortest path algorithm implementation?",
          "options": ["Stack", "Simple Array", "Binary Min-Heap (Priority Queue)", "Binary Search Tree"],
          "correct": "C",
          "difficulty": "hard",
          "topic": "Graphs",
          "points": 20
        },
        {
          "question": "What is the CAP Theorem trade-off during network partitions?",
          "options": ["Consistency vs Availability", "Speed vs Space", "Reliability vs Security", "Database vs Server"],
          "correct": "A",
          "difficulty": "hard",
          "topic": "Distributed Systems",
          "points": 20
        },
        {
          "question": "In Node.js, what is the event loop primary role?",
          "options": ["Compile Javascript", "Offload non-blocking I/O operations and handle execution phases", "Run synchronous math", "Manage CPU cores"],
          "correct": "B",
          "difficulty": "hard",
          "topic": "NodeJS Internals",
          "points": 20
        },
        {
          "question": "Which index type is best for equality lookups in PostgreSQL database?",
          "options": ["B-Tree", "Hash Index", "GIN Index", "GiST Index"],
          "correct": "B",
          "difficulty": "hard",
          "topic": "PostgreSQL indexing",
          "points": 20
        },
        {
          "question": "What is the time complexity of the Floyd-Warshall all-pairs shortest paths algorithm?",
          "options": ["O(V + E)", "O(E log V)", "O(V³)", "O(V²)"],
          "correct": "C",
          "difficulty": "hard",
          "topic": "Floyd-Warshall",
          "points": 20
        }
      ];
    }

    const { data: diagnostic } = await supabase
      .from('diagnostic_tests')
      .insert({
        user_id: payload.userId,
        domain_slug: domain,
        questions,
        completed: false,
      })
      .select()
      .single();

    return successResponse({ diagnostic, alreadyTaken: false });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`diagnostic_${payload.userId}`, 3, 60000)) return rateLimitResponse();

    const { answers } = await request.json();
    const supabase = getAdminClient();

    const { data: diagnostic } = await supabase
      .from('diagnostic_tests')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (!diagnostic) return errorResponse('Diagnostic not found', 404);
    if (diagnostic.completed) return errorResponse('Already completed', 400);

    const questions = diagnostic.questions || [];
    let score = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

    questions.forEach((q, i) => {
      if (answers[i] === q.correct) {
        score += q.points || 10;
      }
    });

    const percentage = Math.round((score / totalPoints) * 100);

    let skillLevel = 'beginner';
    if (percentage >= 80) skillLevel = 'advanced';
    else if (percentage >= 60) skillLevel = 'intermediate';
    else if (percentage >= 40) skillLevel = 'beginner';
    else skillLevel = 'novice';

    // Evidence bus: this route used to store only `answers` + a skill_level on
    // diagnostic_tests, so which of the 15 questions were wrong was lost. Emit
    // the normalized per-question rows. Fire-and-forget — a missing
    // test_questions table never breaks the results screen.
    const attemptId = await saveAttemptReview({
      userId: payload.userId,
      attemptType: 'diagnostic',
      sourceId: diagnostic.id,
      topic: diagnostic.domain_slug || 'Diagnostic',
      score: percentage,
      questions: questions.map((q, i) => ({
        question: q.question,
        options: q.options ?? null,
        correct_answer: q.correct,
        user_answer: answers[i],
        is_correct: answers[i] === q.correct,
        explanation: q.explanation || '',
        topic: q.topic || null,
      })),
    });

    const { error: writeErr } = await supabase.from('diagnostic_tests').update({
      answers,
      score: percentage,
      skill_level: skillLevel,
      completed: true,
      taken_at: new Date().toISOString(),
    }).eq('user_id', payload.userId);
    if (writeErr) console.error('DB write failed: diagnostic_tests.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    const { error: writeErr2 } = await supabase.from('progress').update({
      diagnostic_score: percentage,
      diagnostic_taken: true,
    }).eq('user_id', payload.userId);
    if (writeErr2) console.error('DB write failed: progress.update', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });

    return successResponse({
      score: percentage,
      skillLevel,
      attemptId,
      totalQuestions: questions.length,
      correctAnswers: questions.filter((q, i) => answers[i] === q.correct).length,
      breakdown: {
        easy: questions.filter(q => q.difficulty === 'easy' && answers[questions.indexOf(q)] === q.correct).length,
        medium: questions.filter(q => q.difficulty === 'medium' && answers[questions.indexOf(q)] === q.correct).length,
        hard: questions.filter(q => q.difficulty === 'hard' && answers[questions.indexOf(q)] === q.correct).length,
      },
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
