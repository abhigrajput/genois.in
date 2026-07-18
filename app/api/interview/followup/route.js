import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

export const dynamic = 'force-dynamic';

// Adaptive follow-up decision for the voice interview. Given the question just
// asked and the candidate's spoken answer, decide whether ONE targeted
// follow-up is warranted — a pointed clarification for a vague answer, or a
// deeper probe for a strong one. A null follow-up is a normal, expected
// outcome (most answers should NOT trigger one), and every failure path also
// degrades to null so the interview flow is never blocked.

// Server-side bound mirroring the client's cap — even a misbehaving client
// can't turn a 10-question interview into a 30-question one.
const MAX_FOLLOWUPS_PER_SESSION = 3;

const ROUND_FLAVOUR = {
  technical: 'This is a TECHNICAL round — a follow-up must stay technical (probe complexity, edge cases, trade-offs, or a claim they made).',
  behavioral: 'This is a BEHAVIOURAL round — a follow-up must stay situational (probe the missing Situation/Task/Action/Result piece, or their personal contribution).',
  hr: 'This is an HR round — a follow-up must stay on motivation, fit, self-awareness, or logistics (never a technical quiz).',
  mixed: 'Match the follow-up to the type of the question just asked (technical question → technical probe, behavioural → situational probe).',
};

function buildPrompt({ question, hint, answer, wordCount, mode, domain, targetCompany, level, recentTurns }) {
  const context = (recentTurns || [])
    .filter(t => t && (t.question || t.answer))
    .slice(-3)
    .map((t, i) => `Earlier Q${i + 1}: ${t.question}\nEarlier answer: ${t.answer}`)
    .join('\n');

  return `You are the interviewer in a live spoken placement interview at ${targetCompany || 'a top product company'} (candidate: ${level || 'Fresher'}, domain: ${domain || 'Software Engineering'}). The answer below was transcribed from speech — ignore punctuation/transcription noise.

${ROUND_FLAVOUR[mode] || ROUND_FLAVOUR.technical}
${context ? `\nTranscript so far (for context only — do not re-ask these):\n${context}\n` : ''}
Question you just asked: ${question}
${hint ? `What a strong answer covers: ${hint}` : ''}
Candidate's spoken answer (${wordCount} words): ${answer}

Decide if ONE short follow-up is genuinely warranted:
- VAGUE or evasive answer → ask ONE pointed clarification that names the specific vague part ("You said X — be specific about ...").
- EXCEPTIONALLY STRONG answer → ask ONE deeper probe that tests the edge of what they claimed.
- Adequate but unremarkable answer → NO follow-up. Expect to follow up on roughly 1 in 3 answers, not every answer.
The follow-up must be answerable verbally in 30-60 seconds and must reference what the candidate actually said.

Return ONLY this JSON object:
{
  "shouldFollowUp": true or false,
  "reason": "vague" or "probe" or "none",
  "question": "the follow-up phrased as the interviewer speaking (empty string if none)",
  "type": "technical|behavioral|situational",
  "hint": "what a strong answer to the follow-up covers (used only for grading)"
}`;
}

function normalizeFollowup(raw) {
  if (!raw || raw.shouldFollowUp !== true) return null;
  const q = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (!q) return null;
  return {
    question: q,
    type: ['technical', 'behavioral', 'situational'].includes(raw.type) ? raw.type : 'technical',
    hint: typeof raw.hint === 'string' ? raw.hint : '',
    difficulty: 'medium',
    reason: ['vague', 'probe'].includes(raw.reason) ? raw.reason : 'probe',
  };
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`vi_f_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const body = await request.json();
    const question = (body.question || '').toString().trim();
    const answer = (body.answer || '').toString().trim();
    if (!question || !answer) return errorResponse('Question and answer are required', 400);

    const followupsUsed = parseInt(body.followupsUsed, 10) || 0;
    if (followupsUsed >= MAX_FOLLOWUPS_PER_SESSION) {
      return successResponse({ followup: null, source: 'capped' });
    }

    const mode = ['technical', 'behavioral', 'hr', 'mixed'].includes(body.mode) ? body.mode : 'technical';
    const wordCount = body.wordCount != null
      ? parseInt(body.wordCount, 10)
      : answer.split(/\s+/).filter(Boolean).length;

    const prompt = buildPrompt({
      question,
      hint: typeof body.hint === 'string' ? body.hint : '',
      answer,
      wordCount,
      mode,
      domain: body.domain,
      targetCompany: body.targetCompany,
      level: body.level,
      recentTurns: Array.isArray(body.recentTurns) ? body.recentTurns.slice(-3) : [],
    });

    let followup = null;
    try {
      const raw = await askClaudeJSON(prompt, 'You are a sharp interviewer deciding whether one follow-up question is warranted.', 500);
      followup = normalizeFollowup(raw);
    } catch (e) {
      // No follow-up is a perfectly fine interview — never surface this.
      console.warn('[interview/followup] Claude failed:', e.message);
    }

    return successResponse({ followup, source: followup ? 'claude' : 'none' });
  } catch (error) {
    console.error('[interview/followup] Error:', error);
    // Even a hard failure must not break the interview loop on the client.
    return successResponse({ followup: null, source: 'error' });
  }
}
