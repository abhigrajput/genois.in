import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askClaude(prompt, systemPrompt = '', maxTokens = 1500) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: maxTokens,
    ...(systemPrompt && { system: systemPrompt }),
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].text.trim();
}

export async function askClaudeJSON(prompt, systemPrompt = '', maxTokens = 2000) {
  const fullSystem = (systemPrompt || '') +
    '\nIMPORTANT: Return ONLY valid JSON. No markdown. No explanation. No code blocks. Raw JSON only.';
  const text = await askClaude(prompt, fullSystem, maxTokens);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function askClaudeChat(messages, systemPrompt = '', maxTokens = 1500) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: maxTokens,
    ...(systemPrompt && { system: systemPrompt }),
    messages: messages.slice(-10),
  });
  return response.content[0].text.trim();
}

export default anthropic;
