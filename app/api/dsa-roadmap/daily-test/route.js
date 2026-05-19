import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaude } from '@/lib/claude';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`dsa_test_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const day = parseInt(searchParams.get('day') || '1');

    const supabase = getAdminClient();
    const { data: progress } = await supabase
      .from('dsa_roadmap_progress')
      .select('level')
      .eq('user_id', payload.userId)
      .single();

    const level = progress?.level || 'beginner';
    const curriculum = DSA_LEVELS[level] || DSA_LEVELS.beginner;
    const dayData = curriculum.find(d => d.day === day);

    if (!dayData) return errorResponse('Day not found', 404);

    const cacheKey = buildCacheKey('dsa_daily_test', level, day, dayData.topic);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ test: cached, topic: dayData.topic, day, level, fromCache: true });

    const prompt = `Generate a DSA daily test for: ${dayData.topic}
Day ${day} of ${level} level DSA roadmap.

Create exactly 10 questions in this format:
- 5 theory MCQs about ${dayData.topic}
- 3 multiple choice "what does this code do" with code snippet
- 2 fill in the blank code questions

For ${level} difficulty.

Return ONLY valid JSON like this:
{
  "questions": [
    {
      "type": "theory_mcq",
      "question": "What is the time complexity of...",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      "correct": "O(n)",
      "explanation": "Brief explanation"
    },
    {
      "type": "code_mcq",
      "question": "What does this code print?",
      "code": "for(int i=0; i<5; i++) cout<<i;",
      "options": ["01234", "12345", "0123", "Error"],
      "correct": "01234",
      "explanation": "Loop runs 0-4"
    },
    {
      "type": "fill_blank",
      "question": "Complete the code to reverse a string",
      "code": "string reverse(string s) {\\n  int i=0, j=s.length()-1;\\n  while(i<j) {\\n    ___;\\n    i++; j--;\\n  }\\n}",
      "correct": "swap(s[i], s[j])",
      "explanation": "Swap characters at i and j"
    }
  ]
}

Total: 5 theory_mcq + 3 code_mcq + 2 fill_blank = 10 questions.
All questions must be specifically about ${dayData.topic}.`;

    const aiResponse = await askClaude(prompt, '', 4000);
    
    let test;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      test = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch {
      return errorResponse('Failed to generate test', 500);
    }

    if (!test?.questions || test.questions.length === 0) {
      return errorResponse('Invalid test generated', 500);
    }

    setCached(cacheKey, test, 168);

    return successResponse({ test, topic: dayData.topic, day, level });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    
    const { day, answers, questions } = body || {};
    if (!Array.isArray(answers) || !Array.isArray(questions)) {
      return errorResponse('Invalid submission', 400);
    }

    let correct = 0;
    questions.forEach((q, i) => {
      const userAnswer = (answers[i] || '').toLowerCase().trim();
      const correctAnswer = (q.correct || '').toLowerCase().trim();
      if (q.type === 'fill_blank') {
        if (userAnswer.includes(correctAnswer.split('(')[0]) || userAnswer === correctAnswer) correct++;
      } else {
        if (userAnswer === correctAnswer) correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    const supabase = getAdminClient();
    
    if (passed) {
      const { data: existing } = await supabase
        .from('users')
        .select('total_score')
        .eq('id', payload.userId)
        .single();
      
      await supabase
        .from('users')
        .update({ total_score: (existing?.total_score || 0) + 25 })
        .eq('id', payload.userId);
    }

    return successResponse({ correct, total: questions.length, score, passed, pointsAwarded: passed ? 25 : 0 });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
