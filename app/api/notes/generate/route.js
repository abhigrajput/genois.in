import { getUserFromRequest } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';
import { askClaude } from '@/lib/claude';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    
    const body = await request.json();
    let { topic, day, domain, roadmapId, noteType } = body;
    
    const supabase = getAdminClient();

    if (roadmapId) {
      const { data: roadmap } = await supabase.from('roadmap').select('topic, domain_slug, day_number').eq('id', roadmapId).single();
      if (roadmap) {
        topic = topic || roadmap.topic;
        domain = domain || roadmap.domain_slug;
        day = day || roadmap.day_number;
      }
    }

    if (!topic) return errorResponse('Topic required', 400);

    // Check cache first
    const cacheKey = `notes_${domain || 'dsa'}_day${day || 1}_${topic.substring(0,30)}`;
    const { data: cached } = await supabase.from('ai_cache').select('response').eq('cache_key', cacheKey).gt('expires_at', new Date().toISOString()).single();
    if (cached) return successResponse({ notes: cached.response, note: { content: cached.response }, cached: true });

    // Generate with Claude
    const prompt = `Create comprehensive study notes for a CS student learning "${topic}" in C++.
Include:
1. Concept explanation (2-3 paragraphs, simple language)
2. Key points to remember (5-7 bullet points)
3. C++ code example with comments
4. Time & Space complexity
5. Common mistakes to avoid
6. Interview tips

Format with clear headings. Use simple Hinglish-friendly English (Indian student level).`;

    let notes = '';
    try {
      notes = await askClaude(prompt, 800);
    } catch (e) {
      // DeepSeek fallback
      try {
        const res = await fetch(process.env.DEEPSEEK_BASE_URL + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY },
          body: JSON.stringify({ model: 'deepseek-ai/deepseek-r1', messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
        });
        const data = await res.json();
        notes = data.choices?.[0]?.message?.content || '';
      } catch (e2) {
        notes = `# ${topic} - Study Notes\n\n## Key Concepts\n${topic} is an important DSA topic.\n\n## C++ Example\n\`\`\`cpp\n// Practice ${topic} in C++\nint main() {\n    // Your code here\n    return 0;\n}\n\`\`\`\n\n## Tips\n- Practice daily\n- Understand time complexity\n- Solve LeetCode problems`;
      }
    }

    // Cache for 30 days
    await supabase.from('ai_cache').upsert({ cache_key: cacheKey, response: notes, expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), hits: 1 }, { onConflict: 'cache_key' });

    // If it was roadmap daily note generation, let's also insert into the 'notes' table for the user's dashboard notes list
    if (roadmapId) {
      try {
        await supabase.from('notes').upsert({
          user_id: payload.userId,
          roadmap_id: roadmapId,
          domain_slug: domain || 'fullstack',
          topic: topic,
          type: noteType || 'theory',
          content: notes,
          ai_generated: true,
        }, { onConflict: 'user_id,roadmap_id,type' });
      } catch (e) {
        console.error('Failed to save to user notes table:', e);
      }
    }

    // Return format that matches both requirements
    return successResponse({ 
      notes, 
      note: { content: notes },
      cached: false 
    });
  } catch (error) {
    console.error('notes/generate error:', error);
    return errorResponse('Internal server error', 500);
  }
}
