import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaude } from '@/lib/claude';
import { getCached, setCached, buildCacheKey } from '@/lib/aiCache';
import { DSA_LEVELS } from '@/lib/dsaCurriculumLevels';
import { sanitizeForAI } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`dsa_notes_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { searchParams } = new URL(request.url);
    const rawDay = searchParams.get('day');
    const day = parseInt(rawDay, 10);
    if (!rawDay || isNaN(day) || day < 1 || day > 90) {
      return errorResponse('day must be an integer between 1 and 90', 400);
    }

    const supabase = getAdminClient();
    const { data: progress } = await supabase
      .from('dsa_roadmap_progress')
      .select('level')
      .eq('user_id', payload.userId)
      .single();

    const level = progress?.level || 'beginner';
    const curriculum = DSA_LEVELS[level] || DSA_LEVELS.beginner;
    const dayData = curriculum?.find(d => d.day === day);

    if (!dayData) return errorResponse('Day not found', 404);

    const cacheKey = buildCacheKey('dsa_notes', level, day, dayData.topic);
    const cached = await getCached(cacheKey);
    if (cached) return successResponse({ notes: cached, topic: dayData.topic, day, fromCache: true });

    // FIX 05: Sanitize topic before inserting into AI prompt
    const safeTopic = sanitizeForAI(dayData.topic, 200);

    const prompt = `Generate comprehensive DSA notes for: ${safeTopic}
Level: ${level}
Day ${day} of 90.

Format as detailed markdown with:

# ${dayData.topic}

## Concept Explanation
2-3 paragraphs explaining the concept clearly with simple analogies.

## Key Points
Bullet point summary of must-know facts (5-8 points).

## Examples
2-3 worked examples with step-by-step explanations.

## Code Snippets
2-3 code snippets in C++ with comments. Show different approaches.

## Time & Space Complexity
Table showing best, average, worst case.

## Practice Tips
- Common mistakes to avoid
- How to identify when to use this
- Interview tips

Make it ${level} level appropriate. Be thorough but clear.`;

    let aiResponse = null;
    const notesSystemPrompt = 'You are a DSA instructor for C++ programmers. Always provide code examples in C++ only. Use STL wherever applicable (vector, map, unordered_map, set, stack, queue, priority_queue, sort, etc.). Never show Java, Python, or any other language. All implementations must be in C++.';
    try {
      aiResponse = await askClaude(prompt, notesSystemPrompt, 4000);
    } catch (e) {
      console.error('Notes AI error');
    }

    // Fallback if AI fails
    if (!aiResponse || aiResponse.length < 50) {
      aiResponse = `# ${safeTopic}

## Key Concepts
This topic covers **${dayData.topic}** which is essential for DSA preparation at ${level} level.

## What to Study Today
- Watch the video resource linked in your roadmap
- Read through the reference article carefully
- Solve the practice problem — don't skip this step
- Review time and space complexity for all approaches

## Study Approach
1. **Understand** — Read the concept without coding first
2. **Visualize** — Draw diagrams if needed
3. **Code** — Implement from scratch without looking at solutions
4. **Test** — Manually trace through with sample inputs
5. **Optimize** — Can you do better on time or space?

## Common Interview Questions on ${dayData.topic}
- Explain the concept in simple terms
- What is the time and space complexity?
- When would you use this over alternatives?
- Code a simple implementation from memory

## Practice Tips
- Always analyze the problem before jumping to code
- Think about edge cases: empty input, single element, all same elements
- Practice explaining your approach out loud (interview skill)

*Notes auto-generated. AI service temporarily unavailable — full notes will load on retry.*`;
    }

    try {
      setCached(cacheKey, aiResponse, 720);
    } catch (cacheErr) {
      console.error('Cache set error:', cacheErr.message);
    }

    return successResponse({ notes: aiResponse, topic: dayData.topic, day, level });
  } catch (error) {
    console.error('DSA Notes route error:', error);
    return errorResponse('Internal server error', 500);
  }
}
