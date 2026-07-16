import { createHash } from 'crypto';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

// Deterministic RFC-4122 v5 UUID (SHA-1, fixed namespace). The `projects` table
// keys `project_progress.project_id` by UUID, but the portfolio catalog lives in
// code (lib/projectTemplates.js), not the DB. Deriving a stable UUID from
// domain+week+title lets us lazily create the parent `projects` row on first
// submission and have every later submit/read resolve to the same row — no
// migration or pre-seed required, and re-submits upsert instead of duplicating.
const NAMESPACE = '6f9619ff-8b86-d011-b42d-00cf4fc964ff';

function uuidv5(name) {
  const nsBytes = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC-4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function projectIdFor(domain, week, title) {
  return uuidv5(`${domain}::${week}::${title}`);
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { projectTitle, githubUrl, week, domain, difficulty, description, notes } = await request.json();
    if (!githubUrl) return errorResponse('GitHub URL required', 400);
    if (!githubUrl.includes('github.com')) return errorResponse('Must be a GitHub URL', 400);
    if (!projectTitle) return errorResponse('Project title required', 400);

    const supabase = getAdminClient();
    const projectId = projectIdFor(domain || 'fullstack', week || 0, projectTitle);

    // Ensure the parent projects row exists (FK target). Ignore-on-conflict so
    // concurrent/repeat submissions don't error. If this fails we can't satisfy
    // the FK, so surface a real error instead of a silent 500 later.
    const { error: projErr } = await supabase.from('projects').upsert({
      id: projectId,
      domain_slug: domain || 'fullstack',
      week_number: week || null,
      title: projectTitle,
      description: description || null,
      difficulty: difficulty || 'beginner',
    }, { onConflict: 'id', ignoreDuplicates: true });
    if (projErr) {
      console.error('Project row upsert failed:', projErr.message);
      return errorResponse('Could not register project', 500);
    }

    const { data: submission, error } = await supabase.from('project_progress').upsert({
      user_id: payload.userId,
      project_id: projectId,
      status: 'submitted',
      score: 0,
      ai_feedback: null,
      submitted_at: new Date().toISOString(),
      step_notes: [{ githubUrl, notes, submittedAt: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,project_id' }).select().single();

    if (error) {
      console.error('Project submit database error:', error.message);
      return errorResponse('Database submission failed', 500);
    }

    // Trigger AI review in background (non-blocking)
    reviewProjectWithAI(payload.userId, projectId, projectTitle, githubUrl, domain, week).catch(console.error);

    return successResponse({
      message: 'Project submitted! AI review will be ready in 2-3 minutes.',
      submissionId: submission?.id,
      githubUrl,
    });
  } catch (error) {
    console.error('Project submit handler error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Points live in the `scores` table (+ score_events) — the single source every
// dashboard/leaderboard reads. The previous version wrote users.total_score,
// which is dead and read by nothing, so project points never showed up.
async function awardProjectPoints(supabase, userId, points, projectTitle) {
  const { data: cur } = await supabase.from('scores').select('total_score').eq('user_id', userId).single();
  if (cur) {
    await supabase.from('scores').update({
      total_score: (cur.total_score || 0) + points,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } else {
    await supabase.from('scores').insert({ user_id: userId, total_score: points });
  }
  await supabase.from('score_events').insert({
    user_id: userId, type: 'project', points,
    reason: `Project reviewed: ${projectTitle}`,
  });
}

async function reviewProjectWithAI(userId, projectId, projectTitle, githubUrl, domain, week) {
  const supabase = getAdminClient();

  const prompt = `You are a senior ${domain} developer reviewing a student project.

Project: ${projectTitle}
GitHub URL: ${githubUrl}
Domain: ${domain}
Week: ${week} of 52

Based on the project title and GitHub URL, provide a constructive code review.
Assume the student is an Indian engineering student learning ${domain}.

Return ONLY valid JSON:
{
  "score": 85,
  "grade": "B+",
  "overall_feedback": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "next_steps": ["next step 1", "next step 2"],
  "estimated_time_spent": "10-15 hours",
  "code_quality": 80,
  "functionality": 85,
  "documentation": 75,
  "encouragement": "motivational message for Indian student"
}`;

  try {
    // Try DeepSeek first
    const res = await fetch(process.env.DEEPSEEK_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-r1',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const review = JSON.parse(content);

    await supabase.from('project_progress').update({
      score: review.score || 75,
      ai_feedback: JSON.stringify(review),
      status: 'reviewed',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('project_id', projectId);

    await awardProjectPoints(supabase, userId, review.score || 75, projectTitle);
  } catch (e) {
    console.error('AI review DeepSeek failed:', e.message);

    // Try Claude fallback
    try {
      const { askClaudeJSON } = await import('@/lib/claude');
      const review = await askClaudeJSON(prompt);
      await supabase.from('project_progress').update({
        score: review.score || 75,
        ai_feedback: JSON.stringify(review),
        status: 'reviewed',
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('project_id', projectId);
      await awardProjectPoints(supabase, userId, review.score || 75, projectTitle);
      return;
    } catch (e2) {
      console.error('Claude fallback failed too:', e2.message);
    }

    // Save default review
    const fallbackScore = 75;
    await supabase.from('project_progress').update({
      score: fallbackScore,
      ai_feedback: JSON.stringify({ score: fallbackScore, grade: 'B', overall_feedback: 'Good work! Keep building and improving.', strengths: ['Project completed', 'Pushed to GitHub'], improvements: ['Add more documentation', 'Add tests'], encouragement: 'Great job completing this project! Keep pushing forward!' }),
      status: 'reviewed',
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('project_id', projectId);
    await awardProjectPoints(supabase, userId, fallbackScore, projectTitle);
  }
}
