import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaudeChat } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeChatHistory, sanitizeUserMessage } from '@/lib/security';
import { updateStreak, getStreakDay, getStreakDayStart } from '@/lib/streak';
import { buildUserContext } from '@/lib/contextBuilder';
import { searchKnowledgeBase, formatRagContext } from '@/lib/ragSearch';

function buildChatbotSystem(domain, level, mode, userContext = '') {
  const modeInstructions = {
    general: 'Answer general CS and engineering questions clearly.',
    coding: 'Focus on clean working code with clear explanations. Always use code blocks.',
    domain: `Go technically deep on ${domain}. Give expert-level domain knowledge.`,
    project: 'Give practical project advice. Suggest tech stacks, architectures, implementation steps.',
    career: 'Give India-specific tech career advice. Focus on placement, internships, skills for Indian companies.',
  };

  return `${userContext}

You are GENOIS AI Mentor — a brutally honest placement coach for Indian engineering students.
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
    if (!await rateLimit(`chat_${payload.userId}`, 15, 60000)) return rateLimitResponse();

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }
    const { message, mode, conversationHistory } = body || {};

    const cleanMessage = sanitizeUserMessage(message, 4000);
    if (!cleanMessage) return errorResponse('Message is required', 400);

    const validModes = ['general', 'coding', 'domain', 'project', 'career'];
    const selectedMode = validModes.includes(mode) ? mode : 'general';

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level, college, college_tier, cgpa, target_companies, weak_subjects, months_to_placement')
      .eq('id', payload.userId)
      .single();

    const { systemContext, primaryTarget } = buildUserContext(user);

    const ragResults = await searchKnowledgeBase(cleanMessage, user?.domain_slug, primaryTarget, 3);
    const ragContext = formatRagContext(ragResults);

    const system = buildChatbotSystem(
      user?.domain_slug || 'fullstack',
      user?.level || 'beginner',
      selectedMode,
      systemContext + ragContext
    );

    const messages = [
      ...sanitizeChatHistory(conversationHistory, 8, 4000),
      { role: 'user', content: cleanMessage },
    ];

    const response = await askClaudeChat(messages, system, 1200);

    await supabase.from('chat_history').insert({
      user_id: payload.userId,
      message: cleanMessage,
      response,
      mode: selectedMode,
      domain: user?.domain_slug,
    });

    // Trigger streak on 3rd message of the streak day
    const streakDayStart = getStreakDayStart(getStreakDay());
    const { count } = await supabase
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.userId)
      .gte('created_at', streakDayStart.toISOString());
    if ((count || 0) >= 3) {
      await updateStreak(payload.userId);
    }

    return successResponse({ response, mode: selectedMode });
  } catch (error) {
    console.error('Chatbot error:', error);
    return errorResponse('Internal server error', 500);
  }
}
