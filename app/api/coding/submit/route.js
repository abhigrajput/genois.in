import { getAdminClient, logWriteError } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { reviewCode } from '@/lib/claudeHelpers';
import { parseKbOaId, kbContentHash, titleFromContent } from '@/lib/companyPractice';

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

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { codingTestId, code, language } = await request.json();
    if (!codingTestId || !code) return errorResponse('codingTestId and code are required', 400);

    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

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
    if (!dbTest && !isFallback && !kbOaTest) return errorResponse('Coding test not found', 404);

    const codingTest = dbTest || kbOaTest || { id: null, title: FALLBACK_TITLE, problem: FALLBACK_PROBLEM };

    const review = await reviewCode(
      codingTest.problem, code,
      language || 'javascript',
      user.level, user.domain_slug
    );

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

    return successResponse({ submission, review, points, status });
  } catch (error) {
    console.error('Submit coding error:', error);
    return errorResponse('Internal server error', 500);
  }
}
