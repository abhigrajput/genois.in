import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

// Shape MUST match a `coding_tests` row (title/problem/example_input/
// example_output/hints/difficulty) — that is what the coding page + roadmap
// render. It is returned under `codingTests`, the same key as a real hit, so the
// UI can display it. The synthetic `id` is recognised by /api/coding/submit,
// which reviews it and awards points without an FK-bound coding_tests row.
const FALLBACK_PROBLEM = {
  id: 'fallback-two-sum',
  title: "Two Sum",
  problem: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Assume exactly one solution exists and you may not use the same element twice.",
  difficulty: "Easy",
  example_input: "nums = [2,7,11,15], target = 9",
  example_output: "[0,1]",
  hints: [
    "A brute-force double loop is O(n²) — can you do better?",
    "Scan once, storing each value → its index in a hash map.",
    "For each element, check if (target − element) is already in the map.",
  ],
};

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const { day } = await params;
    const dayNumber = parseInt(day);
    if (isNaN(dayNumber)) return successResponse({ codingTests: [FALLBACK_PROBLEM] });
    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level')
      .eq('id', payload.userId)
      .single();

    if (!user) return errorResponse('User not found', 404);

    const { data: roadmap } = await supabase
      .from('roadmap')
      .select('topic, difficulty')
      .eq('domain_slug', user.domain_slug)
      .eq('day_number', dayNumber)
      .single();

    const topic = roadmap?.topic || user.domain_slug;
    const difficulty = user.level || 'beginner';

    const { data: existing } = await supabase
      .from('coding_tests')
      .select('id,title,problem,input_desc,output_desc,example_input,example_output,hints,difficulty,topic')
      .eq('domain_slug', user.domain_slug)
      .eq('topic', topic);

    if (existing && existing.length >= 5) {
      return successResponse({ codingTests: existing.slice(0, 5) });
    }

    let generated = null;
    try {
      generated = await askClaudeJSON(
        `Create exactly 5 different coding problems for a ${difficulty} engineering student.
Topic: "${topic}" in domain: "${user.domain_slug}".
Problems should vary in difficulty: 2 easy, 2 medium, 1 hard.
Return JSON array with exactly 5 objects:
[
  {
    "title": "short problem title",
    "problem": "full problem statement with clear requirements",
    "inputDesc": "describe the input format",
    "outputDesc": "describe the expected output",
    "exampleInput": "concrete example input",
    "exampleOutput": "concrete example output",
    "hints": ["hint 1", "hint 2", "hint 3"],
    "difficulty": "easy|medium|hard"
  }
]`,
        'Return ONLY a valid JSON array with exactly 5 objects. No markdown. No explanation.', 2000
      );
    } catch (aiErr) {
      console.error('Claude coding generation error:', aiErr);
      return successResponse({ codingTests: [FALLBACK_PROBLEM] });
    }

    if (!generated) return successResponse({ codingTests: [FALLBACK_PROBLEM] });

    const problems = Array.isArray(generated) ? generated : [generated];

    const savedTests = [];
    for (const prob of problems.slice(0, 5)) {
      const { data: existing_single } = await supabase
        .from('coding_tests')
        .select('id')
        .eq('domain_slug', user.domain_slug)
        .eq('topic', topic)
        .eq('title', prob.title)
        .single();

      if (!existing_single) {
        const { data: saved, error: writeErr } = await supabase
          .from('coding_tests')
          .insert({
            domain_slug: user.domain_slug,
            topic,
            title: prob.title,
            problem: prob.problem,
            input_desc: prob.inputDesc,
            output_desc: prob.outputDesc,
            example_input: prob.exampleInput,
            example_output: prob.exampleOutput,
            hints: prob.hints || [],
            difficulty: prob.difficulty || difficulty,
          })
          .select()
          .single();
        if (writeErr) console.error('DB write failed: coding_tests.insert', { code: writeErr.code, message: writeErr.message, details: writeErr.details });
        if (saved) savedTests.push(saved);
      } else {
        savedTests.push(existing_single);
      }
    }

    const allTests = [...(existing || []), ...savedTests].slice(0, 5);
    return successResponse({ codingTests: allTests });

  } catch (error) {
    console.error('Get coding tests error:', error);
    return successResponse({ codingTests: [FALLBACK_PROBLEM] });
  }
}
