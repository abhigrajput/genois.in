import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { message, projectTitle, projectDescription, techStack, currentStep, history } = await request.json();

    const systemPrompt = `You are a friendly project mentor helping an Indian engineering student build: "${projectTitle}".
    
Project description: ${projectDescription}
Tech stack: ${(techStack || []).join(', ')}
Student is currently on step ${currentStep + 1} of 4.

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
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
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
    return errorResponse(error.message, 500);
  }
}
