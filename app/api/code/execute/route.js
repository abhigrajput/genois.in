import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
};

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`code_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { code, language, stdin, expectedOutput } = await request.json();
    if (!code || !language) return errorResponse('Code and language required', 400);

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) return errorResponse('Unsupported language', 400);

    if (!RAPIDAPI_KEY) {
      return errorResponse('Code execution not configured', 503);
    }

    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        expected_output: expectedOutput || null,
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
    });

    const result = await submitRes.json();

    const statusMap = {
      1: 'queued',
      2: 'processing',
      3: 'accepted',
      4: 'wrong_answer',
      5: 'time_limit_exceeded',
      6: 'compilation_error',
      7: 'runtime_error',
      8: 'runtime_error',
      9: 'runtime_error',
      10: 'runtime_error',
      11: 'runtime_error',
      12: 'runtime_error',
      13: 'internal_error',
      14: 'exec_format_error',
    };

    const status = statusMap[result.status?.id] || 'unknown';
    const passed = result.status?.id === 3;

    return successResponse({
      status,
      passed,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      time: result.time || null,
      memory: result.memory || null,
      statusId: result.status?.id,
      statusDescription: result.status?.description,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
