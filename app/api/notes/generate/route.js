import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaude } from '@/lib/claude';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const NOTE_PROMPTS = {
  theory: (topic) => `Generate concise study notes for a student learning about "${topic}".
Format as bullet points only. Maximum 8 bullets.
Each bullet must be:
- One sentence maximum
- Simple English that a 15-year-old can understand
- No jargon without explanation
- Start with an emoji that matches the concept

Example format:
- 🔐 Encryption scrambles your data so only the right person can read it
- 🔑 A key is a secret code used to lock and unlock encrypted data
- 🛡️ HTTPS uses encryption to protect websites you visit

Return plain text with bullet points. No markdown headers. No bold text.`,

  coding: (topic) => `Generate concise coding notes for a student learning about "${topic}".
Format as bullet points only. Maximum 8 bullets.
Each bullet must be:
- One sentence maximum with a tiny code snippet if needed
- Simple English that a 15-year-old can understand
- Start with an emoji that matches the concept

Example format:
- 💻 Use console.log("hello") to print text to the screen in JavaScript
- 🔁 A for loop repeats code — for(let i=0; i<5; i++) runs 5 times
- ⚠️ Always put a semicolon at the end of each line in JavaScript

Return plain text with bullet points. No markdown headers. No bold text.`,

  full: (topic) => `Generate concise study notes for a student learning about "${topic}".
Format as bullet points only. Maximum 10 bullets covering both theory and code.
Each bullet must be:
- One sentence maximum
- Simple English that a 15-year-old can understand
- Start with an emoji that matches the concept

Return plain text with bullet points. No markdown headers. No bold text.`,

  revision: (topic) => `Generate quick revision notes for a student about to take a test on "${topic}".
Format as bullet points only. Maximum 6 bullets — only the most important facts.
Each bullet must be:
- One sentence maximum — something CRITICAL to remember
- Start with an emoji
- Simple English

Return plain text with bullet points. No markdown headers. No bold text. These are last-minute reminders only.`,
};

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const allowed = rateLimit(`notes_${payload.userId}`, 10, 60000);
    if (!allowed) return rateLimitResponse();

    const { roadmapId, noteType } = await request.json();
    if (!roadmapId || !noteType) {
      return errorResponse('roadmapId and noteType are required', 400);
    }

    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('roadmap_id', roadmapId)
      .eq('type', noteType)
      .single();

    if (existing) {
      return successResponse({ note: existing, isNew: false });
    }

    const { data: user } = await supabase
      .from('users').select('domain_slug, level').eq('id', payload.userId).single();

    const { data: roadmap } = await supabase
      .from('roadmap').select('topic').eq('id', roadmapId).single();

    if (!roadmap) return errorResponse('Roadmap item not found', 404);

    const promptFn = NOTE_PROMPTS[noteType];
    if (!promptFn) return errorResponse('Invalid note type. Use: theory, coding, full, revision', 400);

    const prompt = promptFn(roadmap.topic);
    const content = await askClaude(prompt, '', 2000);

    const { data: note, error } = await supabase.from('notes').insert({
      user_id: payload.userId,
      roadmap_id: roadmapId,
      domain_slug: user.domain_slug,
      topic: roadmap.topic,
      type: noteType,
      content,
      ai_generated: true,
    }).select().single();

    if (error) throw new Error(error.message);

    return successResponse({ note, isNew: true });
  } catch (error) {
    console.error('Generate notes error:', error);
    return errorResponse('Internal server error', 500);
  }
}
