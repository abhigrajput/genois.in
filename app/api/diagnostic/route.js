import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

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

    const text = await callClaude(prompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
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

    await supabase.from('diagnostic_tests').update({
      answers,
      score: percentage,
      skill_level: skillLevel,
      completed: true,
      taken_at: new Date().toISOString(),
    }).eq('user_id', payload.userId);

    await supabase.from('progress').update({
      diagnostic_score: percentage,
      diagnostic_taken: true,
    }).eq('user_id', payload.userId);

    return successResponse({
      score: percentage,
      skillLevel,
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
