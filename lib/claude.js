import Anthropic from '@anthropic-ai/sdk';

// Defensive: the Vercel env var has been seen with a trailing literal "\r\n"
// (and stray whitespace) appended, which makes Anthropic reject the key with a
// 401 and silently pushes every generation onto the static fallback. API keys
// never contain whitespace or escape sequences, so strip them unconditionally.
const anthropic = new Anthropic({
  apiKey: (process.env.ANTHROPIC_API_KEY || '').replace(/\\[rnt]/g, '').replace(/\s/g, ''),
});

/**
 * Thrown when the model answered, but not with JSON we can use. Distinct from a
 * transport failure: retrying usually works, nothing upstream is down, and the
 * caller should say so specifically instead of reporting "unknown error".
 */
export class AiFormatError extends Error {
  constructor(message, raw = '') {
    super(message);
    this.name = 'AiFormatError';
    this.code = 'AI_FORMAT';
    // Kept short — this gets logged, never shown to a student.
    this.raw = String(raw).slice(0, 500);
  }
}

// Pull the first complete JSON value out of a model response.
//
// The old one-liner (`text.replace(/```json|```/g, '')`) only handled a bare
// ```json fence. It fell over on ```JSON, on ```javascript, and on any prose
// wrapper ("Here's the review:" / "Hope this helps!") — each of which reached
// JSON.parse and threw a SyntaxError whose message ("Unexpected token H in JSON
// at position 0") was useless to both the student and the log.
//
// Instead of stripping what we don't want, scan for what we do: the first
// brace/bracket, then its true match, tracking string literals and escapes so a
// `}` inside a feedback sentence can't close the object early.
function extractJson(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new AiFormatError('The AI returned an empty response.', trimmed);

  // Drop fences first so a fence's own backticks can't be mistaken for content.
  const unfenced = trimmed
    .replace(/^\s*```[a-zA-Z0-9_+-]*[ \t]*\r?\n?/, '')
    .replace(/```\s*$/, '')
    .trim();

  const start = unfenced.search(/[{[]/);
  if (start === -1) {
    throw new AiFormatError('The AI response contained no JSON at all.', unfenced);
  }

  const open = unfenced[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  // Never closed → the model hit its token ceiling mid-object. That is a
  // different bug from "wrapped in prose" and deserves a different log line.
  if (end === -1) {
    throw new AiFormatError('The AI response was cut off before the JSON finished.', unfenced.slice(-200));
  }

  const candidate = unfenced
    .slice(start, end + 1)
    // Trailing commas are the single most common way a model produces JSON that
    // is otherwise perfectly correct.
    .replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(candidate);
  } catch (e) {
    throw new AiFormatError(`The AI returned malformed JSON (${e.message}).`, candidate);
  }
}

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
    // `content[0]` is not guaranteed to be a text block, and a refusal/stop can
    // leave `content` empty — both used to throw a bare TypeError that surfaced
    // as a generic 500.
    const block = (response?.content || []).find(c => c?.type === 'text' && typeof c.text === 'string');
    if (!block) {
      throw new AiFormatError(`The AI returned no text (stop_reason: ${response?.stop_reason || 'unknown'}).`);
    }
    return block.text.trim();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function askClaudeJSON(prompt, systemPrompt = '', maxTokens = 2000) {
  const fullSystem = (systemPrompt || '') +
    '\nIMPORTANT: Return ONLY valid JSON. No markdown. No explanation. No code blocks. Raw JSON only.';
  const text = await askClaude(prompt, fullSystem, maxTokens);
  try {
    return extractJson(text);
  } catch (e) {
    if (e instanceof AiFormatError) {
      console.error(`AI_JSON_PARSE_FAILED: ${e.message} | raw: ${e.raw}`);
    }
    throw e;
  }
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
    // Same guard as askClaude above, and for the same reason: `content[0]` is
    // not guaranteed to be a text block, and a refusal or a stop can leave
    // `content` empty. Indexing it blind threw a bare TypeError that every
    // caller reported as a generic 500, which told the student nothing and the
    // log even less. Throwing the shared AiFormatError instead keeps the
    // "returns a string" contract these callers already rely on — no caller
    // has to learn a new return shape — while naming the failure so a route
    // can catch it and answer honestly.
    const block = (response?.content || []).find(c => c?.type === 'text' && typeof c.text === 'string');
    if (!block) {
      throw new AiFormatError(`The AI returned no text (stop_reason: ${response?.stop_reason || 'unknown'}).`);
    }
    return block.text.trim();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export default anthropic;
