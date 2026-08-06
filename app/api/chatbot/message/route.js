import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaudeChat } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeChatHistory, sanitizeUserMessage } from '@/lib/security';
import { updateStreak, getStreakDay, getStreakDayStart } from '@/lib/streak';
import { buildFullStudentContext, buildMentorPrompt } from '@/lib/contextBuilder';
import { searchKnowledgeBase, formatRagContext } from '@/lib/ragSearch';
import { getMentorEvidence, buildEvidenceBlock, buildActionInstructions } from '@/lib/mentorEvidence';

function buildChatbotSystem(mentorPrompt, domain, mode, ragContext = '', evidenceBlock = '', actionInstructions = '') {
  const modeInstructions = {
    general: 'Answer general CS and engineering questions clearly.',
    coding: 'Focus on clean working code with clear explanations. Always use code blocks.',
    domain: `Go technically deep on ${domain}. Give expert-level domain knowledge.`,
    project: 'Give practical project advice. Suggest tech stacks, architectures, implementation steps.',
    career: 'Give India-specific tech career advice. Focus on placement, internships, skills for Indian companies.',
  };

  return `${mentorPrompt}
${ragContext}
${evidenceBlock}
${actionInstructions}

=== THIS CONVERSATION ===
Mode: ${mode}. ${modeInstructions[mode] || modeInstructions.general}

Formatting rules:
- Be concise and practical
- Use code blocks with language tag for any code
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

    // Deep, performance-aware student context → personalized mentor prompt.
    const ctx = await buildFullStudentContext(payload.userId);
    const mentorPrompt = buildMentorPrompt(ctx);
    const primaryTarget = ctx.targetCompanies[0] || null;

    // Evidence-awareness. Everything the student's own assessments, readiness
    // and pattern roadmap actually say — so an answer can be grounded in
    // "Trees, 31% over 16 questions" instead of generic advice. Never fatal:
    // if any of it is unavailable the mentor falls back to exactly the prompt
    // it used before this existed, which claims nothing it can't back up.
    let evidenceBlock = '';
    let actionInstructions = '';
    try {
      const evidence = await getMentorEvidence(payload.userId, {
        // Shaped from the context we already loaded — no extra users read.
        user: {
          domain_slug: ctx.domain,
          level: ctx.selfReportedLevel,
          target_companies: ctx.targetCompanies,
          weak_subjects: ctx.weakSubjects,
          months_to_placement: ctx.monthsToPlacement,
        },
        currentDay: ctx.currentDay,
      });
      evidenceBlock = buildEvidenceBlock(evidence);
      actionInstructions = buildActionInstructions(evidence, cleanMessage);
    } catch (e) {
      console.warn('[chatbot] evidence context unavailable:', e.message);
    }

    const ragResults = await searchKnowledgeBase(cleanMessage, ctx.domain, primaryTarget, 3);
    const ragContext = formatRagContext(ragResults);

    const system = buildChatbotSystem(
      mentorPrompt,
      ctx.domain,
      selectedMode,
      ragContext,
      evidenceBlock,
      actionInstructions
    );

    const messages = [
      ...sanitizeChatHistory(conversationHistory, 8, 4000),
      { role: 'user', content: cleanMessage },
    ];

    const response = await askClaudeChat(messages, system, 1200);

    const { error: writeErr } = await supabase.from('chat_history').insert({
      user_id: payload.userId,
      message: cleanMessage,
      response,
      mode: selectedMode,
      domain: ctx.domain,
    });
    if (writeErr) console.error('DB write failed: chat_history.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

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
