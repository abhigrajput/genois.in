import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`api_${payload.userId}`, 5, 60000)) return rateLimitResponse();
    const supabase = getAdminClient();

    const { data: duels } = await supabase
      .from('duels')
      .select('*')
      .or(`challenger_id.eq.${payload.userId},opponent_id.eq.${payload.userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    const enriched = await Promise.all((duels || []).map(async d => {
      const otherId = d.challenger_id === payload.userId ? d.opponent_id : d.challenger_id;
      const { data: other } = await supabase.from('users').select('name, college, domain_slug').eq('id', otherId).single();
      const { data: me } = await supabase.from('users').select('name').eq('id', payload.userId).single();
      return {
        ...d,
        isChallenger: d.challenger_id === payload.userId,
        opponentName: other?.name || 'Unknown',
        opponentCollege: other?.college || '',
        myName: me?.name || 'You',
        myScore: d.challenger_id === payload.userId ? d.challenger_score : d.opponent_score,
        theirScore: d.challenger_id === payload.userId ? d.opponent_score : d.challenger_score,
        iFinished: d.challenger_id === payload.userId ? d.challenger_finished : d.opponent_finished,
        theyFinished: d.challenger_id === payload.userId ? d.opponent_finished : d.challenger_finished,
      };
    }));

    return successResponse({ duels: enriched });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`api_${payload.userId}`, 5, 60000)) return rateLimitResponse();
    const { opponentEmail } = await request.json();
    const supabase = getAdminClient();

    const { data: opponent } = await supabase
      .from('users')
      .select('id, name, domain_slug')
      .eq('email', opponentEmail.trim().toLowerCase())
      .single();

    if (!opponent) return errorResponse('Student not found with that email', 404);
    if (opponent.id === payload.userId) return errorResponse('You cannot duel yourself', 400);

    const { data: challenger } = await supabase
      .from('users')
      .select('domain_slug')
      .eq('id', payload.userId)
      .single();

    // Generate 10 questions using Claude
    const questionsPrompt = `Generate 10 multiple choice questions about ${challenger?.domain_slug || 'programming'} for an engineering student duel.
Each question should be answerable in 30 seconds.
Return ONLY valid JSON array with no markdown:
[{"question":"...","options":["A","B","C","D"],"correct":"A","explanation":"..."}]
Make questions challenging but fair. Mix easy medium and hard.`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: questionsPrompt }],
      }),
    });

    const aiData = await aiRes.json();
    let questions = [];
    try {
      const text = aiData.content[0].text.replace(/```json|```/g, '').trim();
      questions = JSON.parse(text);
    } catch {
      questions = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i + 1}: What is a key concept in ${challenger?.domain_slug}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: 'A',
        explanation: 'This is the correct answer.',
      }));
    }

    const { data: duel } = await supabase
      .from('duels')
      .insert({
        challenger_id: payload.userId,
        opponent_id: opponent.id,
        status: 'pending',
        questions,
        domain_slug: challenger?.domain_slug,
      })
      .select()
      .single();

    return successResponse({ duel, opponentName: opponent.name });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
