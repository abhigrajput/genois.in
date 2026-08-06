import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaudeChat } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeChatHistory, sanitizeUserMessage } from '@/lib/security';

const ANXIETY_SYSTEM = (name, domain) => `You are GENOIS 2AM — a compassionate late-night companion for engineering students in India.

Student: ${name}, studying ${domain}.

This is a safe space. Students come here at 2AM when they are:
- Stressed about placements and rejections
- Anxious about exams and backlogs
- Comparing themselves to others on LinkedIn
- Feeling like they are not good enough
- Scared about the future
- Lonely and overwhelmed

Your role:
- Listen first. Always acknowledge feelings before giving advice.
- Never be dismissive. Never say "just relax" or "it will be fine".
- Validate their struggle. Engineering in India is genuinely hard.
- Be warm, human, and real. Not corporate. Not clinical.
- Use simple language. Occasional Hinglish is okay if student uses it.
- Ask one gentle follow-up question at a time.
- Only give practical advice if they ask for it.
- If student mentions self-harm or suicide, gently suggest iCall India: 9152987821 and stay with them in conversation.
- Remind them: their worth is not their CGPA or placement package.
- Keep responses concise. 2-4 sentences max unless they need more.
- Never pretend everything is okay. Sit with them in the difficulty.

Opening energy: You are a senior who made it through, not a corporate bot. You remember what 2AM in a hostel feels like.`;

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`anxiety_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { message, conversationHistory, mood } = body || {};

    const cleanMessage = sanitizeUserMessage(message, 4000);
    if (!cleanMessage) return errorResponse('Message is required', 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('name, domain_slug')
      .eq('id', payload.userId)
      .single();

    const system = ANXIETY_SYSTEM(user?.name || 'Student', user?.domain_slug || 'engineering');

    const messages = [
      ...sanitizeChatHistory(conversationHistory, 12, 4000),
      { role: 'user', content: cleanMessage },
    ];

    const response = await askClaudeChat(messages, system, 600);

    const { error: writeErr } = await supabase.from('anxiety_chat').insert({
      user_id: payload.userId,
      message: cleanMessage,
      response,
      mood: mood || null,
    });
    if (writeErr) console.error('DB write failed: anxiety_chat.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ response });
  } catch (error) {
    console.error('Anxiety chat error:', error);
    return errorResponse('Internal server error', 500);
  }
}
