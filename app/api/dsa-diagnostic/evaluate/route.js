import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck } from '@/lib/security';
import { saveAttemptReview } from '@/lib/attemptReview';

export const dynamic = 'force-dynamic';

async function callDeepSeek(answers, timeTaken) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const deepseekRes = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-ai/deepseek-r1',
      messages: [
        {
          role: 'system',
          content: 'You are a DSA evaluation expert. Analyze the student test results and return ONLY valid JSON, no markdown, no explanation.'
        },
        {
          role: 'user',
          content: `Analyze these DSA test results and return JSON:
Answers: ${JSON.stringify(answers)}
Time taken: ${timeTaken} seconds out of 1200

Return exactly this JSON structure:
{
  "level": "BEGINNER" or "INTERMEDIATE" or "ADVANCED",
  "score": number 0-100,
  "topicBreakdown": { "arrays": 0-100, "strings": 0-100, "linkedlist": 0-100, "trees": 0-100, "graphs": 0-100, "dp": 0-100, "greedy": 0-100, "sorting": 0-100 },
  "strengths": ["topic1", "topic2"],
  "weaknesses": ["topic1", "topic2"],
  "recommendation": "2-3 sentence personalized advice"
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!deepseekRes.ok) {
    const errText = await deepseekRes.text();
    throw new Error(`DeepSeek API error ${deepseekRes.status}: ${errText}`);
  }

  const data = await deepseekRes.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function fallbackEvaluate(answers, timeTaken) {
  const totalCorrect = answers.filter(a => a.correct).length;
  const score = Math.round((totalCorrect / answers.length) * 100);

  const topicBreakdown = {};
  answers.forEach(({ topic, correct }) => {
    if (!topicBreakdown[topic]) topicBreakdown[topic] = { c: 0, t: 0 };
    topicBreakdown[topic].t++;
    if (correct) topicBreakdown[topic].c++;
  });

  const breakdown = Object.entries(topicBreakdown).reduce((acc, [t, s]) => {
    acc[t] = Math.round((s.c / s.t) * 100);
    return acc;
  }, {});

  const strong = Object.entries(breakdown).filter(([, v]) => v >= 60).map(([k]) => k);
  const weak = Object.entries(breakdown).filter(([, v]) => v < 40).map(([k]) => k);

  let level = 'BEGINNER';
  if (score >= 70) level = 'ADVANCED';
  else if (score >= 35) level = 'INTERMEDIATE';

  return {
    level,
    score,
    topicBreakdown: breakdown,
    strengths: strong.length ? strong : ['Attempting the test'],
    weaknesses: weak.length ? weak : ['Needs more practice overall'],
    recommendation: `You scored ${score}/100. Focus on ${weak[0] || 'fundamentals'} to level up. Practice daily for 90 days with your assigned roadmap.`,
  };
}

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`diag_eval_${payload.userId}`, 3, 300000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { answers, timeTaken, questions } = body || {};

    // FIX 08: Zod validation
    if (!Array.isArray(answers) || answers.length < 15 || answers.length > 25) {
      return errorResponse('answers must be an array of 15–25 items', 400);
    }

    const supabase = getAdminClient();

    // Check if recent result exists (<30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('diagnostic_results')
      .select('level, score, breakdown, taken_at')
      .eq('user_id', payload.userId)
      .gte('taken_at', thirtyDaysAgo)
      .order('taken_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return successResponse({
        ...existing,
        topicBreakdown: existing.breakdown || {},
        strengths: [],
        weaknesses: [],
        recommendation: 'You recently completed the diagnostic. Your roadmap level is already set.',
        fromCache: true,
      });
    }

    // Evaluate with DeepSeek, fallback to local scoring
    let result;
    try {
      result = await callDeepSeek(answers, timeTaken || 0);
    } catch (e) {
      console.error('[dsa-diagnostic/evaluate] DeepSeek error, using fallback:', e.message);
      result = fallbackEvaluate(answers, timeTaken || 0);
    }

    const level = (result.level || 'BEGINNER').toUpperCase();
    const levelLower = level.toLowerCase();

    // Persist the full question set for the review page. The page sends the
    // questions it rendered (text/options/correct/explanation) alongside the
    // answers; older clients that omit them simply skip review persistence.
    let attemptId = null;
    if (Array.isArray(questions) && questions.length > 0) {
      const answerById = new Map(answers.map(a => [a.questionId, a]));
      attemptId = await saveAttemptReview({
        userId: payload.userId,
        attemptType: 'dsa_diagnostic',
        topic: 'DSA Diagnostic',
        score: result.score,
        questions: questions.slice(0, 25).map(q => {
          const a = answerById.get(q.id);
          const selected = a?.selected || null;
          return {
            question: q.question,
            code: q.code || null,
            options: q.options ?? null,
            correct_answer: q.correct,
            user_answer: selected,
            is_correct: selected != null && selected === q.correct,
            explanation: q.explanation,
            topic: q.topic,
          };
        }),
      });
    }

    // Save diagnostic result
    await supabase.from('diagnostic_results').insert({
      user_id: payload.userId,
      level,
      score: result.score,
      breakdown: result.topicBreakdown || {},
      taken_at: new Date().toISOString(),
    });

    // Update dsa_roadmap_progress so the roadmap knows the level
    const nextRetake = new Date();
    nextRetake.setDate(nextRetake.getDate() + 30);

    await supabase.from('dsa_roadmap_progress').upsert({
      user_id: payload.userId,
      level: levelLower,
      current_day: 1,
      diagnostic_score: result.score,
      diagnostic_taken_at: new Date().toISOString(),
      next_diagnostic_date: nextRetake.toISOString().split('T')[0],
      last_active_date: new Date().toISOString().split('T')[0],
      completed_days: [],
    }, { onConflict: 'user_id' });

    return successResponse({
      level,
      score: result.score,
      topicBreakdown: result.topicBreakdown || {},
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendation: result.recommendation || '',
      fromCache: false,
      attemptId,
    });
  } catch (error) {
    console.error('[dsa-diagnostic/evaluate] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
