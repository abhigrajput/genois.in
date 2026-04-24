import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

const LEVEL_CONFIG = {
  1: {
    name: 'Foundation',
    passScore: 85,
    points: 25,
    badge: 'bronze',
    prompt: (skill) => `Generate 15 FOUNDATION level questions for "${skill}".
Structure:
- 6 Theory (core concepts, terminology, basics)
- 5 Practical scenarios (common use cases)
- 4 Code reading (beginner-friendly code snippets with clear expected output)

Difficulty: medium only. Not trivially easy but accessible to someone who studied basics.

Every code reading question MUST include a "code" field with real runnable code.

Return ONLY valid JSON array with exactly 15 questions:
[
  {
    "question": "...",
    "code": "code snippet if type=code else null",
    "type": "theory|practical|code",
    "options": ["A","B","C","D"],
    "correct": "A",
    "explanation": "why correct and why others wrong",
    "topic": "specific topic",
    "points": 10
  }
]`,
  },
  2: {
    name: 'Practitioner',
    passScore: 87,
    points: 40,
    badge: 'silver',
    prompt: (skill) => `Generate 15 PRACTITIONER level questions for "${skill}".
Structure:
- 5 Code reading (medium-hard code snippets with tricky output)
- 5 Real-world problems (scenarios from actual projects)
- 3 Debugging (show buggy code, ask what is wrong)
- 2 Code writing (fill-in-blank or pick correct implementation)

Difficulty: medium and hard mixed.

Every code/debugging/writing question MUST include a "code" field.
For debugging questions, code should have a subtle bug.
For code writing fill-in-blank, use ___ for blanks.

Return ONLY valid JSON array with exactly 15 questions:
[
  {
    "question": "...",
    "code": "code snippet if applicable else null",
    "type": "code|practical|debugging|code_writing",
    "options": ["A","B","C","D"],
    "correct": "A",
    "explanation": "detailed explanation",
    "topic": "specific topic",
    "points": 13
  }
]`,
  },
  3: {
    name: 'Expert',
    passScore: 90,
    points: 75,
    badge: 'gold',
    prompt: (skill) => `Generate 15 EXPERT level questions for "${skill}".
Structure:
- 4 Edge cases and gotchas (subtle behaviors, common traps)
- 4 System design (architecture decisions, tradeoffs)
- 3 Advanced architecture (scaling, performance patterns)
- 2 Advanced code writing (pick correct implementation from 4 plausible options)
- 2 Performance optimization (identify bottleneck or best approach)

Difficulty: hard only. These must differentiate a real expert from an intermediate.

Every applicable question MUST include relevant code.
Wrong options must be highly plausible — all 4 should look correct to a non-expert.

Return ONLY valid JSON array with exactly 15 questions:
[
  {
    "question": "...",
    "code": "code snippet if applicable else null",
    "type": "edge_case|system_design|architecture|code_writing|performance",
    "options": ["A","B","C","D"],
    "correct": "A",
    "explanation": "detailed expert-level explanation",
    "topic": "specific topic",
    "points": 20
  }
]`,
  },
};

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`skill_gen_${payload.userId}`, 3, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const skillSlug = searchParams.get('skill');
    const skillName = searchParams.get('name');
    const level = parseInt(searchParams.get('level') || '1');

    if (!skillSlug || !skillName) return errorResponse('Skill required', 400);
    if (![1, 2, 3].includes(level)) return errorResponse('Invalid level', 400);

    const supabase = getAdminClient();

    if (level > 1) {
      const { data: prevLevel } = await supabase
        .from('skill_verifications')
        .select('status, expires_at')
        .eq('user_id', payload.userId)
        .eq('skill_slug', skillSlug)
        .eq('level', level - 1)
        .single();

      if (prevLevel?.status !== 'verified') return errorResponse(`Pass Level ${level - 1} first`, 400);
      if (prevLevel.expires_at && new Date(prevLevel.expires_at) < new Date()) {
        return errorResponse(`Level ${level - 1} badge expired. Renew it first.`, 400);
      }
    }

    const { data: existing } = await supabase
      .from('skill_verifications')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('skill_slug', skillSlug)
      .eq('level', level)
      .single();

    const isExpired = existing?.expires_at && new Date(existing.expires_at) < new Date();
    if (existing?.status === 'verified' && !isExpired) return errorResponse('Already verified at this level', 400);

    if (existing && !isExpired && existing.attempts >= 3) {
      return errorResponse('Maximum 3 attempts reached for this level', 400);
    }

    if (existing?.last_attempt_at && existing.attempts > 0 && !isExpired) {
      const hoursSince = (Date.now() - new Date(existing.last_attempt_at).getTime()) / 3600000;
      if (hoursSince < 24) {
        return errorResponse(`Cooldown active. Retry in ${Math.ceil(24 - hoursSince)} hour(s).`, 400);
      }
    }

    const text = await callClaude(LEVEL_CONFIG[level].prompt(skillName));
    let questions = [];
    try {
      questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!Array.isArray(questions) || questions.length < 10) throw new Error('Invalid format');
    } catch {
      return errorResponse('Failed to generate questions. Try again.', 500);
    }

    if (!existing || isExpired) {
      if (isExpired) {
        await supabase.from('skill_verifications').update({
          status: 'pending',
          attempts: 0,
          verified_at: null,
          expires_at: null,
        }).eq('id', existing.id);
      } else {
        await supabase.from('skill_verifications').insert({
          user_id: payload.userId,
          skill_name: skillName,
          skill_slug: skillSlug,
          level,
          status: 'pending',
          attempts: 0,
        });
      }
    }

    return successResponse({
      questions,
      skillName,
      skillSlug,
      level,
      levelName: LEVEL_CONFIG[level].name,
      passScore: LEVEL_CONFIG[level].passScore,
      pointsReward: LEVEL_CONFIG[level].points,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { skillSlug, skillName, level, answers, questions } = await request.json();
    if (![1, 2, 3].includes(level)) return errorResponse('Invalid level', 400);

    const supabase = getAdminClient();
    const config = LEVEL_CONFIG[level];

    const { data: existing } = await supabase
      .from('skill_verifications')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('skill_slug', skillSlug)
      .eq('level', level)
      .single();

    if (existing?.status === 'verified' && (!existing.expires_at || new Date(existing.expires_at) > new Date())) {
      return errorResponse('Already verified at this level', 400);
    }

    let score = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    const wrongTopics = [];
    const correctTopics = [];
    const detailedResults = [];

    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) { score += q.points || 10; if (q.topic) correctTopics.push(q.topic); }
      else if (q.topic) wrongTopics.push(q.topic);
      detailedResults.push({
        question: q.question,
        code: q.code || null,
        yourAnswer: answers[i] || 'Not answered',
        correctAnswer: q.correct,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        type: q.type,
      });
    });

    const percentage = Math.round((score / totalPoints) * 100);
    const verified = percentage >= config.passScore;
    const newAttempts = (existing?.attempts || 0) + 1;

    const expiresAt = verified ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null;

    await supabase.from('skill_verifications').upsert({
      user_id: payload.userId,
      skill_name: skillName,
      skill_slug: skillSlug,
      level,
      status: verified ? 'verified' : newAttempts >= 3 ? 'failed' : 'pending',
      score: percentage,
      badge: verified ? config.badge : null,
      weak_areas: [...new Set(wrongTopics)].slice(0, 5),
      strong_areas: [...new Set(correctTopics)].slice(0, 5),
      attempts: newAttempts,
      last_attempt_at: new Date().toISOString(),
      verified_at: verified ? new Date().toISOString() : null,
      expires_at: expiresAt,
    }, { onConflict: 'user_id,skill_slug,level' });

    if (verified) {
      const { data: currentScore } = await supabase.from('scores').select('total_score').eq('user_id', payload.userId).single();
      await supabase.from('scores').update({
        total_score: (currentScore?.total_score || 0) + config.points,
      }).eq('user_id', payload.userId);
    }

    return successResponse({
      score: percentage,
      passScore: config.passScore,
      verified,
      level,
      levelName: config.name,
      badge: verified ? config.badge : null,
      pointsEarned: verified ? config.points : 0,
      weakAreas: [...new Set(wrongTopics)].slice(0, 5),
      strongAreas: [...new Set(correctTopics)].slice(0, 5),
      attempts: newAttempts,
      attemptsLeft: Math.max(0, 3 - newAttempts),
      expiresAt,
      detailedResults,
      nextLevelUnlocked: verified && level < 3,
      allLevelsComplete: verified && level === 3,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
