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
      max_tokens: 3000,
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
    const supabase = getAdminClient();

    const { data: roadmaps } = await supabase
      .from('custom_roadmaps')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    return successResponse({ roadmaps: roadmaps || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`custom_roadmap_${payload.userId}`, 5, 60000)) return rateLimitResponse();

    const { topic, alreadyKnow, goal, days } = await request.json();
    if (!topic || topic.trim().length < 3) return errorResponse('Topic too short', 400);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, name')
      .eq('id', payload.userId)
      .single();

    const totalDays = Math.min(Math.max(parseInt(days) || 7, 3), 30);

    const prompt = `You are a senior ${user?.domain_slug} engineer creating a personalized learning roadmap.

Student wants to learn: "${topic}"
They already know: "${alreadyKnow || 'nothing about this topic'}"
Their goal: "${goal || 'understand and apply this topic'}"
Their domain: ${user?.domain_slug}
Days to complete: ${totalDays}

Create a ${totalDays}-day focused roadmap for ONLY this specific topic.
Skip what they already know. Start from where they are.

Return ONLY valid JSON with no markdown:
{
  "title": "short roadmap title",
  "description": "2 sentence description of what they will learn",
  "days": [
    {
      "day": 1,
      "topic": "specific topic for this day",
      "description": "what they will learn and do today in 2 sentences",
      "video_search": "exact YouTube search query to find best video",
      "resource_url": "best documentation or article URL",
      "coding_task": "specific hands-on task to build or practice today",
      "test_topics": ["topic1", "topic2", "topic3"],
      "notes_focus": "what to focus on when taking notes today"
    }
  ]
}`;

    const responseText = await callClaude(prompt);
    let roadmapData;
    try {
      roadmapData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
    } catch {
      return errorResponse('Failed to generate roadmap. Try again.', 500);
    }

    const { data: roadmap, error: writeErr } = await supabase
      .from('custom_roadmaps')
      .insert({
        user_id: payload.userId,
        topic: topic.trim(),
        description: roadmapData.description,
        total_days: totalDays,
        current_day: 1,
        status: 'active',
        roadmap_data: roadmapData.days,
      })
      .select()
      .single();
    if (writeErr) console.error('DB write failed: custom_roadmaps.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({ roadmap, roadmapData });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
