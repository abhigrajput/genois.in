import { getAdminClient } from '@/lib/supabaseAdmin';
import { getCompanyFromRequest } from '@/lib/companyAuth';
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
    const company = await getCompanyFromRequest(request);
    if (!company) return errorResponse('Unauthorized', 401);
    const supabase = getAdminClient();

    const { data: challenges } = await supabase
      .from('company_challenges')
      .select('*')
      .eq('company_id', company.companyId)
      .order('created_at', { ascending: false });

    const enriched = await Promise.all((challenges || []).map(async c => {
      const { data: attempts } = await supabase
        .from('challenge_attempts')
        .select('user_id, score, completed')
        .eq('challenge_id', c.id);

      return {
        ...c,
        totalAttempts: attempts?.length || 0,
        completedAttempts: attempts?.filter(a => a.completed).length || 0,
        avgScore: attempts?.filter(a => a.completed).length > 0
          ? Math.round(attempts.filter(a => a.completed).reduce((sum, a) => sum + a.score, 0) / attempts.filter(a => a.completed).length)
          : 0,
      };
    }));

    return successResponse({ challenges: enriched });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const company = await getCompanyFromRequest(request);
    if (!company) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`company_challenges_${company.companyId}`, 5, 60000)) return rateLimitResponse();

    const { title, description, domain, difficulty, deadline } = await request.json();
    if (!title || !description) return errorResponse('Title and description required', 400);

    const supabase = getAdminClient();

    const { data: companyData } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company.companyId)
      .single();

    const prompt = `You are a senior technical interviewer at ${companyData?.name}.

Generate 5 technical interview questions for this job challenge:
Title: ${title}
Description: ${description}
Domain: ${domain || 'general software engineering'}
Difficulty: ${difficulty || 'medium'}

Create questions that test real understanding not memorization.
Mix: 2 conceptual, 2 technical, 1 problem solving.

Return ONLY valid JSON array with no markdown:
[
  {
    "question": "...",
    "type": "mcq",
    "options": ["A", "B", "C", "D"],
    "correct": "A",
    "explanation": "why this is correct",
    "points": 20
  }
]`;

    const text = await callClaude(prompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
    }

    const { data: challenge, error: writeErr } = await supabase
      .from('company_challenges')
      .insert({
        company_id: company.companyId,
        title,
        description,
        domain: domain || null,
        difficulty: difficulty || 'medium',
        questions,
        deadline: deadline || null,
      })
      .select()
      .single();
    if (writeErr) console.error('DB write failed: company_challenges.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ challenge });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
