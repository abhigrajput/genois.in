import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { askClaudeJSON } from '@/lib/claude';
import { COMPANY_PROFILES } from '@/lib/curriculumGenerator';
import { realTopic, practiceTopic, TASK_STATEMENT, titleFromContent, kbOaId } from '@/lib/companyPractice';

const TARGET_COUNT = 5;
const TEST_COLUMNS = 'id,title,problem,input_desc,output_desc,example_input,example_output,hints,difficulty,topic';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`api_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level, target_companies')
      .eq('id', payload.userId)
      .single();
    if (!user) return errorResponse('User not found', 404);

    const companyNames = Object.keys(COMPANY_PROFILES);
    const requested = new URL(request.url).searchParams.get('company');

    // ── List mode: companies + default picked from profile target_companies ──
    if (!requested) {
      const targets = Array.isArray(user.target_companies) ? user.target_companies : [];
      const defaultCompany = targets
        .map(t => companyNames.find(n => n.toLowerCase() === String(t).toLowerCase()))
        .find(Boolean) || null;
      return successResponse({
        companies: companyNames.map(name => ({ name, focus: COMPANY_PROFILES[name] })),
        defaultCompany,
      });
    }

    // ── Problems mode ──
    const company = companyNames.find(n => n.toLowerCase() === requested.toLowerCase());
    if (!company) return errorResponse('Unknown company — pick one from the list', 400);

    const REAL = realTopic(company);
    const PRACTICE = practiceTopic(company);

    // If this select errors the problem bank itself is unavailable (the
    // coding_tests migration hasn't been applied) — degrade to serving real KB
    // questions ephemerally and skip AI generation (nothing could be saved).
    const { data: existingRows, error: bankError } = await supabase
      .from('coding_tests')
      .select(TEST_COLUMNS)
      .eq('domain_slug', user.domain_slug)
      .in('topic', [REAL, PRACTICE]);
    let bankAvailable = !bankError;

    const realRows = (existingRows || []).filter(r => r.topic === REAL);
    const aiRows = (existingRows || []).filter(r => r.topic === PRACTICE);

    // RAG first: real OA questions for this company from the knowledge base.
    const { data: kbData } = await supabase
      .from('knowledge_base')
      .select('content, difficulty')
      .eq('category', 'oa_question')
      .eq('company', company)
      .eq('domain', 'dsa');
    const kbEntries = kbData || [];

    // Persist verbatim task statements so they're submittable bank rows; while
    // the bank is down, serve them ephemerally via self-verifying kb-oa ids
    // that /api/coding/submit resolves back to trusted knowledge_base content.
    for (const entry of kbEntries.filter(e => TASK_STATEMENT.test(e.content))) {
      const title = titleFromContent(entry.content);
      if (!title || realRows.some(r => r.title === title)) continue;

      let saved = null;
      if (bankAvailable) {
        const { data, error } = await supabase
          .from('coding_tests')
          .insert({
            domain_slug: user.domain_slug,
            topic: REAL,
            title,
            problem: entry.content,
            hints: [],
            difficulty: entry.difficulty || 'medium',
          })
          .select(TEST_COLUMNS)
          .single();
        saved = data;
        if (error) bankAvailable = false;
      }

      realRows.push(saved || {
        id: kbOaId(company, entry.content),
        title,
        problem: entry.content,
        hints: [],
        difficulty: entry.difficulty || 'medium',
        topic: REAL,
      });
    }

    // Top up with AI-generated problems in the company's style — never labeled
    // real. Skipped while the bank is down: generated problems couldn't be
    // saved, so they'd be unsubmittable and the tokens wasted.
    const needed = TARGET_COUNT - realRows.length - aiRows.length;
    let generationFailed = false;
    if (needed > 0 && bankAvailable) {
      const patternNotes = kbEntries
        .filter(e => !TASK_STATEMENT.test(e.content))
        .map(e => `- ${e.content}`)
        .join('\n');
      const avoidTitles = [...realRows, ...aiRows].map(r => r.title).filter(Boolean);
      try {
        const generated = await askClaudeJSON(
          `Create exactly ${needed} coding practice problems in the style of ${company}'s online assessment, for a ${user.level || 'beginner'} engineering student in the "${user.domain_slug}" domain.

${company} interview focus: ${COMPANY_PROFILES[company]}
${patternNotes ? `\nVERIFIED ${company} OA PATTERNS (match difficulty and topics to these):\n${patternNotes}\n` : ''}
These are practice problems in ${company}'s style — never claim they are real past questions.
${avoidTitles.length ? `Do NOT reuse these existing titles: ${avoidTitles.join('; ')}` : ''}

Return JSON array with exactly ${needed} objects:
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
          'Return ONLY a valid JSON array. No markdown. No explanation.', 2400
        );
        const problems = Array.isArray(generated) ? generated : (generated ? [generated] : []);
        if (!problems.length) generationFailed = true;
        for (const prob of problems.slice(0, needed)) {
          if (!prob?.title || !prob?.problem) continue;
          if ([...realRows, ...aiRows].some(r => r.title === prob.title)) continue;
          const { data: saved, error } = await supabase
            .from('coding_tests')
            .insert({
              domain_slug: user.domain_slug,
              topic: PRACTICE,
              title: prob.title,
              problem: prob.problem,
              input_desc: prob.inputDesc,
              output_desc: prob.outputDesc,
              example_input: prob.exampleInput,
              example_output: prob.exampleOutput,
              hints: prob.hints || [],
              difficulty: prob.difficulty || 'medium',
            })
            .select(TEST_COLUMNS)
            .single();
          if (saved) aiRows.push(saved);
          else if (error) { bankAvailable = false; break; }
        }
      } catch (aiErr) {
        console.error(`Company practice generation failed for ${company}:`, aiErr);
        generationFailed = true;
      }
    }

    const codingTests = [
      ...realRows.map(r => ({ ...r, source: 'real' })),
      ...aiRows.map(r => ({ ...r, source: 'ai' })),
    ].slice(0, TARGET_COUNT);

    if (!codingTests.length) {
      return errorResponse(
        !bankAvailable
          ? `The ${company} problem bank isn't ready yet and there are no verified past questions for it. Try another company (TCS has real OA questions) or check back soon.`
          : generationFailed
            ? `Problem generation for ${company} is unavailable right now and no verified OA questions exist for it yet. Try again in a minute.`
            : `No problems available for ${company} yet. Try again in a minute.`,
        503
      );
    }

    return successResponse({
      company,
      focus: COMPANY_PROFILES[company],
      codingTests,
      realCount: codingTests.filter(t => t.source === 'real').length,
      aiCount: codingTests.filter(t => t.source === 'ai').length,
    });
  } catch (error) {
    console.error('Company practice error:', error);
    return errorResponse('Internal server error', 500);
  }
}
