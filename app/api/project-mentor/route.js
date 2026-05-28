import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { sanitizeChatHistory, sanitizeUserMessage, sanitizeForAI } from '@/lib/security';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`project_mentor_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }
    const { message, projectTitle, projectDescription, techStack, currentStep, history } = body || {};

    const cleanMessage = sanitizeUserMessage(message, 4000);
    if (!cleanMessage) return errorResponse('Message is required', 400);

    const cleanTitle = sanitizeForAI(projectTitle, 200);
    const cleanDescription = sanitizeForAI(projectDescription, 1000);
    const cleanTech = Array.isArray(techStack)
      ? techStack.slice(0, 20).map(t => sanitizeForAI(t, 50)).filter(Boolean)
      : [];
    const stepNum = Number.isFinite(Number(currentStep)) ? Math.max(0, Math.min(3, Number(currentStep))) : 0;

    const systemPrompt = `You are a friendly project mentor helping an Indian engineering student build: "${cleanTitle}".

Project description: ${cleanDescription}
Tech stack: ${cleanTech.join(', ')}
Student is currently on step ${stepNum + 1} of 4.

Your personality:
- Talk like a friendly senior developer
- Use simple English, no complex jargon
- Guide with hints and questions, do NOT give complete code solutions
- If they are stuck, give small hints one at a time
- Encourage them when they make progress
- Keep responses SHORT — maximum 3-4 sentences
- Use emojis occasionally to be friendly

If student asks for complete code: say "I will guide you step by step instead — which part are you stuck on specifically?"
If student seems frustrated: be extra encouraging`;

    const messages = [
      ...sanitizeChatHistory(history, 10, 4000),
      { role: 'user', content: cleanMessage }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.text || 'Let me think about that...';
    return successResponse({ reply });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
