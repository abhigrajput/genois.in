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
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

export async function GET(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const supabase = getAdminClient();

    const { data: roadmap } = await supabase
      .from('custom_roadmaps')
      .select('*')
      .eq('id', id)
      .eq('user_id', payload.userId)
      .single();

    if (!roadmap) return errorResponse('Roadmap not found', 404);

    const currentDayData = roadmap.roadmap_data[roadmap.current_day - 1];

    const { data: tasks } = await supabase
      .from('custom_tasks')
      .select('*')
      .eq('custom_roadmap_id', id)
      .eq('day_number', roadmap.current_day);

    return successResponse({ roadmap, currentDayData, tasks: tasks || [] });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request, context) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    const { id } = await context.params;
    const { action, taskType, dayNumber } = await request.json();
    const supabase = getAdminClient();

    const { data: roadmap } = await supabase
      .from('custom_roadmaps')
      .select('*')
      .eq('id', id)
      .eq('user_id', payload.userId)
      .single();

    if (!roadmap) return errorResponse('Roadmap not found', 404);

    if (action === 'complete_task') {
      const existing = await supabase
        .from('custom_tasks')
        .select('id')
        .eq('custom_roadmap_id', id)
        .eq('user_id', payload.userId)
        .eq('day_number', dayNumber || roadmap.current_day)
        .eq('type', taskType)
        .single();

      if (!existing.data) {
        await supabase.from('custom_tasks').insert({
          custom_roadmap_id: id,
          user_id: payload.userId,
          day_number: dayNumber || roadmap.current_day,
          type: taskType,
          status: 'completed',
          score: 10,
          completed_at: new Date().toISOString(),
        });
      }

      const { data: allTasks } = await supabase
        .from('custom_tasks')
        .select('type')
        .eq('custom_roadmap_id', id)
        .eq('day_number', roadmap.current_day)
        .eq('status', 'completed');

      const completedTypes = (allTasks || []).map(t => t.type);
      const requiredTypes = ['video', 'resource', 'coding', 'test', 'notes'];
      const allDone = requiredTypes.every(t => completedTypes.includes(t));

      if (allDone && roadmap.current_day < roadmap.total_days) {
        await supabase
          .from('custom_roadmaps')
          .update({ current_day: roadmap.current_day + 1 })
          .eq('id', id);
      } else if (allDone && roadmap.current_day >= roadmap.total_days) {
        await supabase
          .from('custom_roadmaps')
          .update({ status: 'completed' })
          .eq('id', id);
      }

      return successResponse({ completedCount: completedTypes.length + 1, allDone });
    }

    if (action === 'generate_test') {
      if (!await rateLimit(`custom_test_${payload.userId}`, 5, 60000)) return rateLimitResponse();

      const currentDayData = roadmap.roadmap_data[roadmap.current_day - 1];
      const prompt = `Generate 5 multiple choice questions about "${currentDayData?.topic}" for an engineering student.
Return ONLY valid JSON array:
[{"question":"...","options":["A","B","C","D"],"correct":"A","explanation":"..."}]`;

      const text = await callClaude(prompt);
      let questions = [];
      try {
        questions = JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch {
        questions = [];
      }

      return successResponse({ questions });
    }

    if (action === 'generate_notes') {
      if (!await rateLimit(`custom_notes_${payload.userId}`, 5, 60000)) return rateLimitResponse();

      const currentDayData = roadmap.roadmap_data[roadmap.current_day - 1];
      const prompt = `Generate concise study notes for "${currentDayData?.topic}".
Focus: ${currentDayData?.notes_focus || 'key concepts'}
Format as bullet points with emojis. Simple English. Max 15 points.
Return plain text only.`;

      const notes = await callClaude(prompt);
      return successResponse({ notes });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
