import Anthropic from '@anthropic-ai/sdk';

// Defensive: the Vercel env var has been seen with a trailing literal "\r\n"
// (and stray whitespace) appended, which makes Anthropic reject the key with a
// 401 and silently pushes every generation onto the static fallback. API keys
// never contain whitespace or escape sequences, so strip them unconditionally.
const anthropic = new Anthropic({
  apiKey: (process.env.ANTHROPIC_API_KEY || '').replace(/\\[rnt]/g, '').replace(/\s/g, ''),
});

export async function askClaude(prompt, systemPrompt = '', maxTokens = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      ...(systemPrompt && { system: systemPrompt }),
      messages: [{ role: 'user', content: prompt }],
    }, { signal: controller.signal });
    clearTimeout(timeout);
    return response.content[0].text.trim();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function askClaudeJSON(prompt, systemPrompt = '', maxTokens = 2000) {
  const fullSystem = (systemPrompt || '') +
    '\nIMPORTANT: Return ONLY valid JSON. No markdown. No explanation. No code blocks. Raw JSON only.';
  const text = await askClaude(prompt, fullSystem, maxTokens);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function askClaudeChat(messages, systemPrompt = '', maxTokens = 1500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      ...(systemPrompt && { system: systemPrompt }),
      messages: messages.slice(-10),
    }, { signal: controller.signal });
    clearTimeout(timeout);
    return response.content[0].text.trim();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export default anthropic;
