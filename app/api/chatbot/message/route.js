import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaudeChat } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

function buildChatbotSystem(domain, level, mode) {
  const modeInstructions = {
    general: 'Answer general CS and engineering questions clearly.',
    coding: 'Focus on clean working code with clear explanations. Always use code blocks.',
    domain: `Go technically deep on ${domain}. Give expert-level domain knowledge.`,
    project: 'Give practical project advice. Suggest tech stacks, architectures, implementation steps.',
    career: 'Give India-specific tech career advice. Focus on placement, internships, skills for Indian companies.',
  };

  return `You are GENOIS Chatbot — a helpful assistant for engineering students in India.
Student is learning ${domain} at ${level} level.
Mode: ${mode}. ${modeInstructions[mode] || modeInstructions.general}

Rules:
- Be concise and practical
- Use code blocks with language tag for any code
- Be relevant to Tier 2/3 college engineering students in India
- Never give wrong info — say "I am not sure" if uncertain
- Keep responses focused and actionable`;
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 15, 60000)) return rateLimitResponse();

    const allowed = rateLimit(`chat_${payload.userId}`, 15, 60000);
    if (!allowed) return rateLimitResponse();

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { message, mode, conversationHistory } = body || {};
    if (!message) return errorResponse('Message is required', 400);

    const validModes = ['general', 'coding', 'domain', 'project', 'career'];
    const selectedMode = validModes.includes(mode) ? mode : 'general';

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const system = buildChatbotSystem(
      user?.domain_slug || 'fullstack',
      user?.level || 'beginner',
      selectedMode
    );

    const messages = [
      ...(conversationHistory || []).slice(-8),
      { role: 'user', content: message },
    ];

    const response = await askClaudeChat(messages, system, 1200);

    await supabase.from('chat_history').insert({
      user_id: payload.userId,
      message,
      response,
      mode: selectedMode,
      domain: user?.domain_slug,
    });

    return successResponse({ response, mode: selectedMode });
  } catch (error) {
    console.error('Chatbot error:', error);
    return errorResponse('Internal server error', 500);
  }
}
