import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { reviewCode } from '@/lib/claudeHelpers';
import { parseKbOaId, kbContentHash, titleFromContent } from '@/lib/companyPractice';
import { saveAttemptReview } from '@/lib/attemptReview';

// Resolve an ephemeral company-practice id (kb-oa:<company>:<hash>) back to
// the knowledge_base row it was minted from. The hash is re-derived from DB
// content, so the id can only select trusted server-side text — it can never
// carry client-supplied problem text into the AI reviewer.
async function resolveKbOaProblem(supabase, codingTestId) {
  const parsed = parseKbOaId(codingTestId);
  if (!parsed) return null;
  const { data: rows } = await supabase
    .from('knowledge_base')
    .select('content')
    .eq('category', 'oa_question')
    .eq('company', parsed.company)
    .eq('domain', 'dsa');
  const match = (rows || []).find(r => kbContentHash(r.content) === parsed.hash);
  if (!match) return null;
  return { id: null, title: titleFromContent(match.content), problem: match.content };
}

const MAX_CODE_CHARS = 20000;

// The AI reviewer can fail in ways the student should be told apart: it may be
// overloaded (retry works), it may have timed out (retry works), or it may have
// returned unparseable JSON (retry usually works too, but it is our bug). None
// of those are "Internal server error", which is what every one of them used to
// surface as.
function reviewerFailureMessage(err) {
  const status = err?.status;
  const name = String(err?.name || '');
  const msg = String(err?.message || '');
  if (name === 'AbortError' || /abort|timed? ?out/i.test(msg)) {
    return 'The AI reviewer took too long to respond. Your code was not lost — press Submit again in a moment.';
  }
  if (status === 429 || /rate.?limit/i.test(msg)) {
    return 'The AI reviewer is rate-limited right now. Wait about a minute and submit again.';
  }
  if (status === 529 || status === 503 || /overloaded/i.test(msg)) {
    return 'The AI reviewer is overloaded right now. Try submitting again in a minute.';
  }
  if (status === 401 || status === 403) {
    return 'Code review is unavailable right now (our AI service rejected the request). We are on it — try again shortly.';
  }
  // AiFormatError (lib/claude.js) means the model answered but not in a shape we
  // can read — wrapped in prose, fenced, truncated, or malformed. That is our
  // bug, not an outage, and it almost always clears on one retry. Name the
  // actual format problem rather than saying "unknown error".
  if (err?.code === 'AI_FORMAT' || err instanceof SyntaxError || /JSON/i.test(msg)) {
    if (/cut off/i.test(msg)) {
      return 'The AI reviewer ran out of room mid-response. Press Submit again — a shorter solution reviews more reliably.';
    }
    return 'The AI reviewer returned an unexpected format. Press Submit again — this usually clears on a retry.';
  }
  return 'Code review is temporarily unavailable. Your code was not lost — press Submit again in a moment.';
}

// Never trust the model's JSON shape blindly: a missing/NaN score used to render
// as "Score: undefined/100" and silently award the lowest bucket.
function normalizeReview(raw) {
  const review = (raw && typeof raw === 'object') ? raw : {};
  const parsed = Number(review.score);
  const score = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : null;
  return {
    ...review,
    score,
    isCorrect: score != null ? score >= 70 : !!review.isCorrect,
    feedback: typeof review.feedback === 'string' && review.feedback.trim()
      ? review.feedback
      : 'The reviewer did not return written feedback for this submission.',
  };
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    // Each submission costs an AI call. Without a limit a stuck client could
    // loop the reviewer; with one, the student gets a clear message instead.
    if (!await rateLimit(`coding_submit_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { codingTestId, code, language } = await request.json();
    if (!codingTestId) return errorResponse('No problem selected — reload the page and try again.', 400);
    if (!code || !String(code).trim()) return errorResponse('Write your solution before submitting.', 400);
    if (String(code).length > MAX_CODE_CHARS) {
      return errorResponse(`Your submission is too long to review (limit ${MAX_CODE_CHARS.toLocaleString()} characters).`, 400);
    }

    const supabase = getAdminClient();

    // A missing profile row used to throw on `user.level` and surface as
    // "Internal server error"; the review works fine with defaults.
    const { data: userRow } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();
    const user = userRow || { domain_slug: 'dsa', level: 'beginner' };

    // A non-UUID id (e.g. the "fallback-two-sum" problem served when AI
    // generation is unavailable) can't match the uuid PK, so this returns null —
    // fall back to an inline problem instead of 404ing the submission.
    const { data: dbTest } = await supabase
      .from('coding_tests').select('*').eq('id', codingTestId).single();

    const FALLBACK_TITLE = 'Two Sum';
    const FALLBACK_PROBLEM = 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.';
    const isFallback = !dbTest && codingTestId === 'fallback-two-sum';
    // Ephemeral company-practice problem (real KB OA question served while the
    // coding_tests bank migration is pending) — resolves from knowledge_base.
    const kbOaTest = !dbTest && !isFallback ? await resolveKbOaProblem(supabase, codingTestId) : null;
    if (!dbTest && !isFallback && !kbOaTest) {
      return errorResponse("That problem is no longer available — reload the page to get today's challenge.", 404);
    }

    const codingTest = dbTest || kbOaTest || { id: null, title: FALLBACK_TITLE, problem: FALLBACK_PROBLEM };

    let review;
    try {
      review = normalizeReview(await reviewCode(
        codingTest.problem, code,
        language || 'javascript',
        user.level, user.domain_slug
      ));
    } catch (reviewErr) {
      console.error('Coding review failed:', reviewErr?.status || '', reviewErr?.message || reviewErr);
      // 503 rather than 500: this is a retryable dependency outage, and the
      // student is told so instead of seeing "Internal server error". Nothing
      // is written, so a retry can't double-award points.
      return errorResponse(reviewerFailureMessage(reviewErr), 503);
    }

    // A review with no usable score can't be scored, can't be trusted as
    // evidence, and must not be written into the readiness bus as a zero.
    if (review.score == null) {
      console.error('Coding review returned no usable score:', JSON.stringify(review).slice(0, 300));
      return errorResponse('The AI reviewer returned an incomplete result. Press Submit again — nothing was lost.', 503);
    }

    let status = 'incorrect';
    let points = 5;
    if (review.score >= 70) { status = 'correct'; points = 20; }
    else if (review.score >= 40) { status = 'partial'; points = 10; }

    const { data: submission, error: submissionErr } = await supabase.from('coding_submissions').insert({
      user_id: payload.userId,
      coding_test_id: codingTest.id, // null for the inline fallback (FK is nullable)
      code,
      language: language || 'javascript',
      status,
      score: points,
      ai_feedback: JSON.stringify(review),
    }).select().single();
    logWriteError('coding/submit', 'coding_submissions.insert', submissionErr);

    const { data: currentScore } = await supabase
      .from('scores').select('total_score, coding_score').eq('user_id', payload.userId).single();

    if (currentScore) {
      const { error: scoresErr } = await supabase.from('scores').update({
        total_score: (currentScore.total_score || 0) + points,
        coding_score: (currentScore.coding_score || 0) + points,
      }).eq('user_id', payload.userId);
      logWriteError('coding/submit', 'scores.update(award)', scoresErr);
    }

    const { error: eventErr } = await supabase.from('score_events').insert({
      user_id: payload.userId,
      type: 'coding',
      points,
      reason: `Coding: ${codingTest.title} — ${review.score}/100`,
    });
    logWriteError('coding/submit', 'score_events.insert', eventErr);

    // Evidence bus: a coding submission is one piece of evidence about one
    // skill. `coding_submissions` kept the code and an AI score but no topic
    // link, so a solved graph problem never counted as graph evidence.
    // The skill resolves from the coding_tests topic, falling back to the
    // problem title ("Detect Cycle in a Linked List" → dsa.cycle-detection).
    // Company-practice topics are prefixed ("Company OA (Real): X") — the
    // resolver's phrase search sees through that.
    //
    // Everything from here on is post-scoring bookkeeping. The student's points
    // are already awarded, so nothing below may be allowed to throw the request
    // into the catch-all and tell them the submission failed — that would show a
    // failure for a submission that actually succeeded, and invite a retry that
    // double-awards. saveAttemptReview swallows its own errors by design; the
    // explicit guard here makes that contract enforced rather than assumed.
    let attemptId = null;
    try {
      attemptId = await saveAttemptReview({
        userId: payload.userId,
        attemptType: 'coding',
        sourceId: codingTest.id,
        topic: codingTest.topic || codingTest.title,
        score: review.score,
        skillDomains: ['dsa'],
        questions: [{
          question: codingTest.title || 'Coding problem',
          // Trimmed: the full submission already lives in coding_submissions —
          // this copy exists so /review can show what was written.
          code: String(code).slice(0, 4000),
          correct_answer: '',
          user_answer: String(code).slice(0, 4000),
          // Same threshold the points award uses above, so "correct" here means
          // the same thing it means to the student on the results screen.
          is_correct: review.score >= 70,
          explanation: [review.correctnessNote, review.feedback].filter(Boolean).join(' — ').slice(0, 2000),
          topic: codingTest.topic || codingTest.title || null,
        }],
      });
      if (!attemptId) {
        console.error(`EVIDENCE_BUS_MISS: coding submission for user ${payload.userId} scored but wrote no test_questions row — readiness will not see it.`);
      }
    } catch (evidenceErr) {
      console.error('EVIDENCE_BUS_THREW:', evidenceErr?.message || evidenceErr);
    }

    return successResponse({
      submission, review, points, status, attemptId,
      // The verdict came from an AI reviewer reading the code, not from running
      // it against test cases. The UI states this; the flag keeps the claim
      // accurate at the source rather than relying on copy staying in sync.
      evaluation: 'ai_review',
      evidenceSaved: !!attemptId,
    });
  } catch (error) {
    console.error('Submit coding error:', error);
    return errorResponse("Your submission couldn't be saved. Your code is still in the editor — press Submit again in a moment.", 500);
  }
}
