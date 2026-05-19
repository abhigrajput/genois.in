import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

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
async function askDeepSeekDiagnostic(timeoutMs = 25000) {
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
            { role: 'user',   content: USER_PROMPT },
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

    // Check for cached questions (7-day cache)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('diagnostic_questions')
      .select('id, questions, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached?.questions) {
      const shuffled = [...cached.questions].sort(() => Math.random() - 0.5);
      return successResponse({ questions: shuffled, cached: true });
    }

    // --- Primary: Claude with 25-second timeout ---
    let questions = null;
    let source = 'claude';

    try {
      const claudeController = new AbortController();
      const claudeTimer = setTimeout(() => claudeController.abort(), 25000);
      try {
        questions = await askClaudeJSON(USER_PROMPT, SYSTEM_PROMPT, 6000);
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
        questions = await askDeepSeekDiagnostic(25000);
        if (!Array.isArray(questions) && Array.isArray(questions?.questions)) {
          questions = questions.questions;
        }
      } catch (dsErr) {
        console.error('[dsa-diagnostic/generate] DeepSeek also failed:', dsErr.message);
        return errorResponse('Question generation temporarily unavailable. Try again in 30 seconds.', 503);
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
