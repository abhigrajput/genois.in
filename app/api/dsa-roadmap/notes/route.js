import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaude } from '@/lib/claude';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!rateLimit(`dsa_notes_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const day = parseInt(searchParams.get('day') || '1');

    const supabase = getAdminClient();
    const { data: progress } = await supabase
      .from('dsa_roadmap_progress')
      .select('level')
      .eq('user_id', payload.userId)
      .single();

    const level = progress?.level || 'beginner';
    const curriculum = DSA_LEVELS[level] || DSA_LEVELS.beginner;
    const dayData = curriculum.find(d => d.day === day);

    if (!dayData) return errorResponse('Day not found', 404);

    const cacheKey = buildCacheKey('dsa_notes', level, day, dayData.topic);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ notes: cached, topic: dayData.topic, day, fromCache: true });

    const prompt = `Generate comprehensive DSA notes for: ${dayData.topic}
Level: ${level}
Day ${day} of 90.

Format the notes as detailed markdown with:

# ${dayData.topic}

## Concept Explanation
2-3 paragraphs explaining the concept clearly with simple analogies.

## Key Points
Bullet point summary of must-know facts (5-8 points).

## Examples
2-3 worked examples with step-by-step explanations.

## Code Snippets
2-3 code snippets in C++ with comments. Show different approaches.

## Practice Tips
- Common mistakes to avoid
- How to identify when to use this
- Time/space complexity tips

Make it ${level} level appropriate. Be thorough but clear.`;

    const aiResponse = await askClaude(prompt, '', 4000);
    
    if (!aiResponse) return errorResponse('Failed to generate notes', 500);

    setCached(cacheKey, aiResponse, 720);

    return successResponse({ notes: aiResponse, topic: dayData.topic, day, level });
  } catch (error) {
    console.error('AI Notes error:', error);
    return errorResponse(error.message || 'Notes generation failed', 500);
  }
}
