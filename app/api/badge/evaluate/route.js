import { z } from 'zod';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { csrfCheck } from '@/lib/security';

export const dynamic = 'force-dynamic';

const PASS_SCORE = 70;
const BADGE_DAYS = 60;
const COOLDOWN_DAYS = 7;

async function callDeepSeekEvaluate(answers, domain, timeTaken) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const deepseekRes = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-ai/deepseek-r1',
      messages: [
        {
          role: 'system',
          content: 'You are a technical skill evaluator. Analyze badge verification test results and return ONLY valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Evaluate this ${domain} skill verification test:
Answers: ${JSON.stringify(answers)}
Time taken: ${timeTaken} seconds out of 2700 (45 minutes)
Passing score: ${PASS_SCORE}/100

Return exactly this JSON:
{
  "score": number 0-100,
  "passed": true or false,
  "level": "proficient" or "expert" or "master",
  "topicBreakdown": { "topicName": 0-100 },
  "strengths": ["topic1", "topic2"],
  "weaknesses": ["topic1", "topic2"],
  "feedback": "3-4 sentence personalized technical feedback mentioning specific areas"
}

Level: proficient=70-79, expert=80-89, master=90+. Below 70 = failed (still include all fields).`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!deepseekRes.ok) {
    const errText = await deepseekRes.text();
    throw new Error(`DeepSeek error ${deepseekRes.status}: ${errText}`);
  }

  const data = await deepseekRes.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function localEvaluate(answers, domain) {
  const totalCorrect = answers.filter(a => a.correct).length;
  const score = Math.round((totalCorrect / Math.max(answers.length, 1)) * 100);
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
  const strong = Object.entries(breakdown).filter(([, v]) => v >= 70).map(([k]) => k);
  const weak = Object.entries(breakdown).filter(([, v]) => v < 50).map(([k]) => k);
  let level = 'proficient';
  if (score >= 90) level = 'master';
  else if (score >= 80) level = 'expert';

  return {
    score,
    passed: score >= PASS_SCORE,
    level,
    topicBreakdown: breakdown,
    strengths: strong,
    weaknesses: weak,
    feedback: `You scored ${score}/100 on the ${domain} verification test. ${score >= PASS_SCORE ? 'Congratulations on passing!' : `You need ${PASS_SCORE - score} more points to pass.`} Focus on: ${weak.join(', ') || 'all topics'}.`,
  };
}

export async function POST(request) {
  // FIX 10: CSRF check
  const csrf = csrfCheck(request);
  if (csrf) return csrf;

  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`badge_eval_${payload.userId}`, 3, 300000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }
    const { answers, domain, timeTaken } = body || {};

    // FIX 08: Zod domain enum validation
    const VALID_DOMAINS = ['fullstack','dsa','cybersecurity','aiml','devops','android','datascience','blockchain','gamedev','systemdesign'];
    if (!domain || !VALID_DOMAINS.includes(domain)) {
      return errorResponse(`Invalid domain. Must be one of: ${VALID_DOMAINS.join(', ')}`, 400);
    }
    // FIX 08: answers array max 30
    if (!Array.isArray(answers) || answers.length < 25 || answers.length > 30) {
      return errorResponse('answers must be an array of 25–30 items', 400);
    }

    const supabase = getAdminClient();

    // Check cooldown
    const now = new Date().toISOString();
    const { data: cooldown } = await supabase
      .from('badge_cooldowns')
      .select('unlocks_at')
      .eq('user_id', payload.userId)
      .eq('domain', domain)
      .gt('unlocks_at', now)
      .single();

    if (cooldown) {
      return successResponse({
        blocked: true,
        unlocksAt: cooldown.unlocks_at,
        daysLeft: Math.ceil((new Date(cooldown.unlocks_at) - Date.now()) / (1000 * 60 * 60 * 24)),
      });
    }

    // Evaluate
    let result;
    try {
      result = await callDeepSeekEvaluate(answers, domain, timeTaken || 0);
    } catch (e) {
      console.error('[badge/evaluate] DeepSeek error, using fallback:', e.message);
      result = localEvaluate(answers, domain);
    }

    const passed = result.passed ?? result.score >= PASS_SCORE;

    if (passed) {
      const expiresAt = new Date(Date.now() + BADGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data: badge, error: writeErr3 } = await supabase
        .from('user_badges')
        .upsert({
          user_id: payload.userId,
          domain,
          score: result.score,
          level: result.level || 'proficient',
          status: 'active',
          earned_at: now,
          expires_at: expiresAt,
        }, { onConflict: 'user_id,domain' })
        .select()
        .single();
      if (writeErr3) console.error('DB write failed: user_badges.upsert', { code: writeErr3.code, message: writeErr3.message, details: writeErr3.details });

      // Clear any cooldown on pass
      const { error: writeErr } = await supabase.from('badge_cooldowns').delete()
        .eq('user_id', payload.userId).eq('domain', domain);
      if (writeErr) console.error('DB write failed: badge_cooldowns.delete', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

      return successResponse({
        passed: true,
        score: result.score,
        level: result.level,
        topicBreakdown: result.topicBreakdown || {},
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        feedback: result.feedback || '',
        badge: {
          id: badge?.id,
          domain,
          level: result.level,
          earnedAt: now,
          expiresAt,
        },
      });
    } else {
      const unlocksAt = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { error: writeErr2 } = await supabase.from('badge_cooldowns').upsert({
        user_id: payload.userId,
        domain,
        failed_at: now,
        unlocks_at: unlocksAt,
      }, { onConflict: 'user_id,domain' });
      if (writeErr2) console.error('DB write failed: badge_cooldowns.upsert', { code: writeErr2.code, message: writeErr2.message, details: writeErr2.details });

      return successResponse({
        passed: false,
        score: result.score,
        level: null,
        topicBreakdown: result.topicBreakdown || {},
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        feedback: result.feedback || '',
        cooldown: { unlocksAt, daysLeft: COOLDOWN_DAYS },
      });
    }
  } catch (error) {
    console.error('[badge/evaluate] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
