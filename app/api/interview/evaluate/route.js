import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

export const dynamic = 'force-dynamic';

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function gradeFromScore(s) {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 75) return 'B+';
  if (s >= 70) return 'B';
  if (s >= 65) return 'C+';
  if (s >= 55) return 'C';
  if (s >= 45) return 'D';
  return 'F';
}

function buildPrompt({ question, answer, domain, targetCompany, questionType, wordCount }) {
  return `You are an expert placement interviewer evaluating a student's VERBAL answer (transcribed from speech, so ignore minor punctuation/transcription noise). Be tough but fair. Indian engineering student context.

Target company: ${targetCompany || 'a top product company'}
Domain: ${domain || 'Software Engineering'}
Question type: ${questionType || 'technical'}
Question: ${question}
Student's answer (${wordCount} words): ${answer}

Evaluate on exactly 3 metrics (0-100 each):
1. TECHNICAL_ACCURACY: Correct concept? Right complexity/approach? (For behavioural questions, judge relevance, specificity, and use of a concrete example instead.)
2. COMMUNICATION_CLARITY: Clear, structured, easy to follow? Correct use of terms?
3. CONFIDENCE_SCORE: Completeness and directness. Penalise excessive hedging and filler; reward a decisive, well-scoped answer.

Also consider:
- Did they answer the ACTUAL question asked?
- Did they give a concrete example, or only abstract theory?
- Length: under 50 words is usually too short; over 300 is usually rambling.

Return ONLY this JSON object:
{
  "technicalAccuracy": 0-100,
  "communicationClarity": 0-100,
  "confidenceScore": 0-100,
  "overallScore": 0-100,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "strengths": ["short, specific point", "..."],
  "improvements": ["short, specific, actionable point", "..."],
  "idealAnswer": "2-3 sentence summary of what a perfect answer would cover",
  "verdict": "one-sentence honest verdict"
}`;
}

function normalize(raw, wordCount) {
  const technicalAccuracy = clamp(raw.technicalAccuracy);
  const communicationClarity = clamp(raw.communicationClarity);
  const confidenceScore = clamp(raw.confidenceScore);
  const overallScore = raw.overallScore != null
    ? clamp(raw.overallScore)
    : Math.round((technicalAccuracy + communicationClarity + confidenceScore) / 3);
  const arr = (v) => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).slice(0, 5) : [];
  return {
    technicalAccuracy,
    communicationClarity,
    confidenceScore,
    overallScore,
    grade: typeof raw.grade === 'string' && raw.grade.trim() ? raw.grade.trim() : gradeFromScore(overallScore),
    strengths: arr(raw.strengths),
    improvements: arr(raw.improvements),
    idealAnswer: typeof raw.idealAnswer === 'string' ? raw.idealAnswer : '',
    verdict: typeof raw.verdict === 'string' ? raw.verdict : '',
    wordCount,
  };
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`vi_e_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const body = await request.json();
    const question = (body.question || '').toString();
    const answer = (body.answer || '').toString().trim();
    if (!question || !answer) return errorResponse('Question and answer are required', 400);

    const wordCount = body.wordCount != null
      ? parseInt(body.wordCount, 10)
      : answer.split(/\s+/).filter(Boolean).length;

    const prompt = buildPrompt({
      question,
      answer,
      domain: body.domain,
      targetCompany: body.targetCompany,
      questionType: body.questionType,
      wordCount,
    });

    let evaluation = null;
    try {
      const raw = await askClaudeJSON(prompt, 'You are a strict but fair technical interviewer.', 1200);
      evaluation = normalize(raw, wordCount);
    } catch (e) {
      console.warn('[interview/evaluate] Claude failed:', e.message);
      // Neutral fallback so the session can continue and still feels honest.
      const base = wordCount < 30 ? 35 : 58;
      evaluation = normalize({
        technicalAccuracy: base,
        communicationClarity: base,
        confidenceScore: base,
        strengths: wordCount >= 30 ? ['You attempted a complete answer.'] : [],
        improvements: wordCount < 30
          ? ['Answer was very short — aim for a structured 60-90 second response.']
          : ['Add a concrete example and state your reasoning step by step.'],
        idealAnswer: '',
        verdict: 'Auto-scored — the AI evaluator was briefly unavailable, so treat this as approximate.',
      }, wordCount);
    }

    return successResponse({ evaluation });
  } catch (error) {
    console.error('[interview/evaluate] Error:', error);
    return errorResponse('Could not evaluate the answer. Try again.', 500);
  }
}
