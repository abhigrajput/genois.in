import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { COMPANY_TYPES, ROUND_CONFIG } from '@/lib/interviewConfig';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';

async function callClaude(prompt, maxTokens = 3000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`interview_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return errorResponse('Session ID required', 400);

    const supabase = getAdminClient();
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', payload.userId)
      .single();

    if (!session) return errorResponse('Session not found', 404);

    const roundIndex = session.current_round;
    const rounds = session.rounds || [];
    if (roundIndex >= rounds.length) return errorResponse('All rounds complete', 400);

    const currentRound = rounds[roundIndex];
    if (currentRound.questions && currentRound.questions.length > 0) {
      return successResponse({
        round: currentRound,
        roundIndex,
        totalRounds: rounds.length,
        roundConfig: ROUND_CONFIG[currentRound.type],
        companyConfig: COMPANY_TYPES[session.company_type],
        companyName: session.company_name,
      });
    }

    const roundConfig = ROUND_CONFIG[currentRound.type];
    const companyConfig = COMPANY_TYPES[session.company_type];

    const isCodingRound = currentRound.type.includes('coding');
    const isHRRound = currentRound.type === 'hr';
    const isSystemDesign = currentRound.type === 'system_design';

    let prompt;
    if (isHRRound) {
      prompt = `You are conducting an HR interview for a ${session.role} role at ${session.company_name}.
${roundConfig.promptContext}

Return ONLY valid JSON array with exactly ${roundConfig.questionCount} questions:
[
  {
    "question": "full HR question",
    "type": "open_ended",
    "expectedDuration": "60 seconds",
    "evaluationCriteria": "clarity, specificity, ownership, cultural fit",
    "sampleGoodAnswer": "brief example of what a strong answer includes",
    "redFlags": "what would be a weak answer"
  }
]`;
    } else if (isCodingRound || isSystemDesign) {
      prompt = `You are conducting a technical interview for ${session.role} at ${session.company_name}.
${roundConfig.promptContext}

Return ONLY valid JSON array with exactly ${roundConfig.questionCount} questions:
[
  {
    "question": "full problem statement",
    "type": "coding_or_design",
    "constraints": "input size, edge cases",
    "expectedApproach": "brute force + optimal approach",
    "timeComplexity": "expected O(n) etc",
    "sampleSolutionOutline": "high-level solution steps",
    "hints": ["hint 1", "hint 2"]
  }
]`;
    } else {
      prompt = `You are conducting a technical interview for ${session.role} at ${session.company_name}.
${roundConfig.promptContext}

Return ONLY valid JSON array with exactly ${roundConfig.questionCount} questions:
[
  {
    "question": "full technical question",
    "type": "technical_mcq_or_open",
    "options": ["A","B","C","D"],
    "correct": "A",
    "expectedAnswer": "what a good answer looks like",
    "followUp": "potential follow-up question"
  }
]`;
    }

    // Retake randomization: rotate through 3 cached question pools per
    // (company type, round type) based on how many sessions this user has,
    // so a second mock interview doesn't replay the identical round.
    const { count: priorSessions } = await supabase
      .from('interview_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', payload.userId)
      .eq('company_type', session.company_type);

    const variant = Math.max(0, (priorSessions || 1) - 1) % 3;
    const cacheKey = buildCacheKey('interview', session.company_type, currentRound.type, `set${variant}`);
    const cachedQuestions = await getCached(cacheKey);
    if (cachedQuestions) {
      const updatedRounds = [...rounds];
      updatedRounds[roundIndex] = { ...currentRound, questions: cachedQuestions, status: 'in_progress' };
      await supabase.from('interview_sessions').update({ rounds: updatedRounds }).eq('id', sessionId);
      return successResponse({
        round: updatedRounds[roundIndex],
        roundIndex,
        totalRounds: rounds.length,
        roundConfig,
        companyConfig,
        companyName: session.company_name,
        fromCache: true,
      });
    }

    const text = await callClaude(prompt);
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!Array.isArray(questions)) throw new Error('Invalid');
      setCached(cacheKey, questions, 72);
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
    }

    const updatedRounds = [...rounds];
    updatedRounds[roundIndex] = { ...currentRound, questions, status: 'in_progress' };
    await supabase.from('interview_sessions').update({ rounds: updatedRounds }).eq('id', sessionId);

    return successResponse({
      round: updatedRounds[roundIndex],
      roundIndex,
      totalRounds: rounds.length,
      roundConfig,
      companyConfig,
      companyName: session.company_name,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { sessionId, roundIndex, answers } = await request.json();
    const supabase = getAdminClient();

    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', payload.userId)
      .single();

    if (!session) return errorResponse('Session not found', 404);
    const rounds = session.rounds || [];
    const currentRound = rounds[roundIndex];
    if (!currentRound) return errorResponse('Round not found', 404);

    const questions = currentRound.questions || [];
    const evalPrompt = `You are a senior interviewer at ${session.company_name}.
Evaluate this candidate's answers for ${ROUND_CONFIG[currentRound.type].label}.

Questions and answers:
${questions.map((q, i) => `Q${i + 1}: ${q.question}\nCandidate answer: ${answers[i] || '[No answer]'}\n`).join('\n')}

Evaluate each answer 0-100 and give overall round feedback.

Return ONLY valid JSON:
{
  "perQuestionScores": [score_q1, score_q2, ...],
  "roundScore": 75,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "detailedFeedback": "2-3 sentences of honest interviewer feedback",
  "verdict": "strong_hire|hire|maybe|no_hire",
  "improvementTips": ["tip 1", "tip 2", "tip 3"]
}`;

    let evaluation;
    try {
      const text = await (await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 2000,
          messages: [{ role: 'user', content: evalPrompt }],
        }),
      })).json();
      evaluation = JSON.parse(text.content[0].text.replace(/```json|```/g, '').trim());
    } catch {
      evaluation = { roundScore: 50, verdict: 'maybe', strengths: [], weaknesses: [], detailedFeedback: 'Evaluation failed', improvementTips: [] };
    }

    const updatedRounds = [...rounds];
    updatedRounds[roundIndex] = {
      ...currentRound,
      status: 'complete',
      answers,
      evaluation,
    };

    const isLastRound = roundIndex === rounds.length - 1;
    let overallScore = 0;
    let overallVerdict = null;
    let feedback = {};

    if (isLastRound) {
      overallScore = Math.round(updatedRounds.reduce((sum, r) => sum + (r.evaluation?.roundScore || 0), 0) / updatedRounds.length);
      const companyConfig = COMPANY_TYPES[session.company_type];
      overallVerdict = overallScore >= companyConfig.passingScore ? 'SELECTED' : 'NOT_SELECTED';

      const allStrengths = updatedRounds.flatMap(r => r.evaluation?.strengths || []);
      const allWeaknesses = updatedRounds.flatMap(r => r.evaluation?.weaknesses || []);
      const allTips = updatedRounds.flatMap(r => r.evaluation?.improvementTips || []);

      feedback = {
        overallScore,
        verdict: overallVerdict,
        topStrengths: [...new Set(allStrengths)].slice(0, 5),
        topWeaknesses: [...new Set(allWeaknesses)].slice(0, 5),
        actionItems: [...new Set(allTips)].slice(0, 8),
        roundBreakdown: updatedRounds.map(r => ({
          round: ROUND_CONFIG[r.type].label,
          score: r.evaluation?.roundScore || 0,
        })),
      };

      if (overallVerdict === 'SELECTED') {
        const { data: cur } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
        await supabase.from('scores').update({
          total_score: (cur?.total_score || 0) + 100,
        }).eq('user_id', payload.userId);
      }
    }

    await supabase.from('interview_sessions').update({
      rounds: updatedRounds,
      current_round: isLastRound ? rounds.length : roundIndex + 1,
      overall_score: overallScore,
      verdict: overallVerdict,
      feedback,
      completed: isLastRound,
      completed_at: isLastRound ? new Date().toISOString() : null,
    }).eq('id', sessionId);

    return successResponse({
      evaluation,
      isLastRound,
      overallFeedback: feedback,
      nextRoundIndex: roundIndex + 1,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
