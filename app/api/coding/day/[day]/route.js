import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';

export async function GET(request, { params }) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const dayNumber = parseInt(params.day);
    const supabase = getAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level')
      .eq('id', payload.userId)
      .single();

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

    const generated = await askClaudeJSON(
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
        const { data: saved } = await supabase
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
        if (saved) savedTests.push(saved);
      } else {
        savedTests.push(existing_single);
      }
    }

    const allTests = [...(existing || []), ...savedTests].slice(0, 5);
    return successResponse({ codingTests: allTests });

  } catch (error) {
    console.error('Get coding tests error:', error);
    return errorResponse('Internal server error', 500);
  }
}
