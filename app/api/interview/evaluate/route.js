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

// Round-type-aware rubric for the first metric. The metric KEY stays
// technicalAccuracy (it maps to the technical_accuracy DB column and the
// 3-metric UI) — only what it MEASURES shifts with the round. Technical (and
// mixed / absent mode) keeps the exact original wording.
function metricOneFor(mode) {
  if (mode === 'behavioral') {
    return '1. TECHNICAL_ACCURACY: STAR completeness — did they give a real Situation, their specific Task, concrete Actions THEY personally took, and a measurable Result? Penalise hypothetical answers and vague "we did" stories with no personal contribution.';
  }
  if (mode === 'hr') {
    return '1. TECHNICAL_ACCURACY: Fit & motivation quality — specific, researched reasons for this company/role, honest self-assessment, realistic career thinking; for salary/logistics questions, a tactful and reasoned position. Penalise generic flattery and memorised template lines.';
  }
  return '1. TECHNICAL_ACCURACY: Correct concept? Right complexity/approach? (For behavioural questions, judge relevance, specificity, and use of a concrete example instead.)';
}

function buildPrompt({ question, answer, domain, targetCompany, questionType, wordCount, mode }) {
  return `You are an expert placement interviewer evaluating a student's VERBAL answer (transcribed from speech, so ignore minor punctuation/transcription noise). Be tough but fair. Indian engineering student context.

Target company: ${targetCompany || 'a top product company'}
Domain: ${domain || 'Software Engineering'}
Question type: ${questionType || 'technical'}
Question: ${question}
Student's answer (${wordCount} words): ${answer}

Evaluate on exactly 3 metrics (0-100 each):
${metricOneFor(mode)}
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
      // Round type steers the metric-1 rubric only; unknown/absent → technical.
      mode: ['technical', 'behavioral', 'hr', 'mixed'].includes(body.mode) ? body.mode : 'technical',
    });

    // No fabricated fallback here: a word-count-derived score is worse than an
    // error — it lands in interview_results and contaminates the mentor's view
    // of the student. AI failures surface as a retryable 503 instead (same
    // guardrail as /api/resume/analyze: a real evaluation or a clean error).
    let evaluation;
    try {
      const raw = await askClaudeJSON(prompt, 'You are a strict but fair technical interviewer.', 1200);
      if (!raw || typeof raw !== 'object'
        || raw.technicalAccuracy == null
        || raw.communicationClarity == null
        || raw.confidenceScore == null) {
        throw new Error('AI returned an unusable evaluation');
      }
      evaluation = normalize(raw, wordCount);
    } catch (e) {
      console.warn('[interview/evaluate] Claude failed:', e.message);
      const busy = e.name === 'AbortError' || e.status === 529 || e.status === 429;
      return errorResponse(
        busy
          ? 'The evaluator is busy right now — retry in a moment.'
          : 'Evaluation unavailable — the AI could not score this answer. Retry.',
        503
      );
    }

    return successResponse({ evaluation });
  } catch (error) {
    console.error('[interview/evaluate] Error:', error);
    return errorResponse('Could not evaluate the answer. Try again.', 500);
  }
}
