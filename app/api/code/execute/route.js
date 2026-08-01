import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';

// The env var has been seen carrying a trailing literal "\r\n" (same defect
// lib/claude.js guards against). API keys never contain whitespace, so strip
// it rather than shipping a header the provider will reject with a 403.
const RAPIDAPI_KEY = (process.env.RAPIDAPI_KEY || '').replace(/\\[rnt]/g, '').replace(/\s/g, '');

// A RapidAPI key is a 50-char token. Anything shorter is a truncated paste or a
// placeholder — it will 403 on every call, so treat it as "not configured"
// instead of burning a round-trip to find out.
const KEY_LOOKS_VALID = RAPIDAPI_KEY.length >= 40;

const EXEC_TIMEOUT_MS = 20000;
const MAX_CODE_CHARS = 50000;

const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
};

// Every Judge0 status id, mapped to a status the UI styles and a sentence the
// student can act on. The old map produced 'unknown' for anything unlisted and
// left the reason blank — which is exactly what "unknown error appeared" was.
const STATUS_MAP = {
  1:  ['queued', 'Queued — waiting for a runner.'],
  2:  ['processing', 'Running…'],
  3:  ['accepted', 'Your program ran successfully.'],
  4:  ['wrong_answer', 'Your program ran, but the output did not match the expected output.'],
  5:  ['time_limit_exceeded', 'Your program took longer than 5 seconds — check for an infinite loop or a slower-than-needed algorithm.'],
  6:  ['compilation_error', 'Your code did not compile. See the compile output below.'],
  7:  ['runtime_error', 'Runtime error (SIGSEGV) — usually an out-of-bounds access or infinite recursion.'],
  8:  ['runtime_error', 'Runtime error (SIGXFSZ) — your program wrote too much output.'],
  9:  ['runtime_error', 'Runtime error (SIGFPE) — usually a division by zero.'],
  10: ['runtime_error', 'Runtime error (SIGABRT) — your program aborted.'],
  11: ['runtime_error', 'Runtime error (NZEC) — your program exited with a non-zero code. See the error output below.'],
  12: ['runtime_error', 'Runtime error. See the error output below.'],
  13: ['internal_error', 'The code runner hit an internal error. Try running again.'],
  14: ['exec_format_error', 'The runner could not execute the compiled program.'],
};

// One message per provider failure, so the student is told what is actually
// wrong and whether waiting will help. `retryable` drives the UI's wording.
function providerFailure(httpStatus, bodyText) {
  const detail = String(bodyText || '').slice(0, 300);
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      message: 'The code runner is not available right now — our execution service rejected the request (subscription or API key issue). You can still write your solution and submit it for review.',
      logLine: `Judge0 auth/subscription failure (${httpStatus}): ${detail}`,
      status: 503,
    };
  }
  if (httpStatus === 429) {
    return {
      message: 'The code runner has hit its usage limit for now. Wait a minute and run again — you can still submit your solution for review meanwhile.',
      logLine: `Judge0 quota exhausted (429): ${detail}`,
      status: 503,
    };
  }
  if (httpStatus >= 500) {
    return {
      message: 'The code runner is temporarily down on the provider side. Try again in a minute — you can still submit your solution for review.',
      logLine: `Judge0 upstream error (${httpStatus}): ${detail}`,
      status: 503,
    };
  }
  return {
    message: `The code runner rejected this submission (error ${httpStatus}). Check your language selection and try again.`,
    logLine: `Judge0 unexpected response (${httpStatus}): ${detail}`,
    status: 502,
  };
}

const NOT_CONFIGURED_MESSAGE =
  'Running code is temporarily unavailable — our execution service is not configured. You can still write your solution and submit it for review; your score and progress are unaffected.';

/**
 * Lets the editor learn up front whether "Run" can work, so it can label the
 * button honestly instead of letting the student write code, hit Run and get a
 * failure. No secrets are returned — only whether execution is usable.
 */
export async function GET(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) return errorResponse('Unauthorized', 401);
  return successResponse({
    configured: KEY_LOOKS_VALID,
    languages: Object.keys(LANGUAGE_IDS),
    message: KEY_LOOKS_VALID ? null : NOT_CONFIGURED_MESSAGE,
  });
}

export async function POST(request) {
  let payload;
  try {
    payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`code_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { code, language, stdin, expectedOutput } = await request.json();
    if (!code || !String(code).trim()) return errorResponse('Write some code before running it.', 400);
    if (!language) return errorResponse('Pick a language before running.', 400);
    if (String(code).length > MAX_CODE_CHARS) {
      return errorResponse(`Your code is too long to run (limit ${MAX_CODE_CHARS.toLocaleString()} characters).`, 400);
    }

    const languageId = LANGUAGE_IDS[String(language).toLowerCase()];
    if (!languageId) {
      return errorResponse(`"${language}" can't be run here. Supported: ${Object.keys(LANGUAGE_IDS).join(', ')}.`, 400);
    }

    if (!KEY_LOOKS_VALID) {
      if (RAPIDAPI_KEY) {
        console.error(`CODE_EXEC_MISCONFIGURED: RAPIDAPI_KEY is ${RAPIDAPI_KEY.length} chars — a RapidAPI key is 50. Execution disabled.`);
      } else {
        console.error('CODE_EXEC_MISCONFIGURED: RAPIDAPI_KEY is unset. Execution disabled.');
      }
      return errorResponse(NOT_CONFIGURED_MESSAGE, 503);
    }

    // Judge0's `wait=true` holds the connection until the run finishes. Without
    // our own deadline a stalled runner strands the student on "Running…".
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXEC_TIMEOUT_MS);

    let submitRes;
    try {
      submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        // expected_output is deliberately NOT sent. Judge0 compares it byte for
        // byte, so a correct answer printed as "[0, 1]" against an example
        // output of "[0,1]" came back as WRONG ANSWER with no explanation. The
        // comparison is done below, whitespace-tolerantly, and reported as
        // advisory information rather than as a verdict.
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || '',
          cpu_time_limit: 5,
          memory_limit: 128000,
        }),
        signal: controller.signal,
      });
    } catch (netErr) {
      if (netErr?.name === 'AbortError') {
        return errorResponse('The code runner took too long to respond. Try running again — if your program has an infinite loop, fix that first.', 504);
      }
      console.error('CODE_EXEC_NETWORK:', netErr?.message || netErr);
      return errorResponse("Couldn't reach the code runner. Check your connection and try again.", 503);
    } finally {
      clearTimeout(timer);
    }

    const rawBody = await submitRes.text();

    if (!submitRes.ok) {
      const failure = providerFailure(submitRes.status, rawBody);
      console.error(`CODE_EXEC_PROVIDER: ${failure.logLine}`);
      return errorResponse(failure.message, failure.status);
    }

    let result;
    try {
      result = JSON.parse(rawBody);
    } catch {
      console.error('CODE_EXEC_BAD_JSON:', rawBody.slice(0, 300));
      return errorResponse('The code runner returned an unreadable response. Try running again.', 502);
    }

    // A 200 with no status block means the provider answered with something
    // other than a submission (e.g. a plan/quota notice). Surface it as a
    // provider problem instead of rendering an empty "unknown" result card.
    if (!result?.status?.id) {
      console.error('CODE_EXEC_NO_STATUS:', rawBody.slice(0, 300));
      return errorResponse(
        result?.message
          ? `The code runner could not run this: ${String(result.message).slice(0, 200)}`
          : 'The code runner returned an incomplete result. Try running again.',
        502
      );
    }

    const [status, statusNote] = STATUS_MAP[result.status.id] || [
      'runner_error',
      `The runner reported an unrecognised state (${result.status.description || result.status.id}).`,
    ];

    const stdout = result.stdout || '';
    const norm = s => String(s ?? '').replace(/\r\n/g, '\n').trim().replace(/[ \t]+/g, ' ');
    const hasExpected = expectedOutput != null && String(expectedOutput).trim() !== '';
    const outputMatches = hasExpected && status === 'accepted'
      ? norm(stdout) === norm(expectedOutput)
      : null;

    return successResponse({
      status,
      statusNote,
      // `passed` now means "it ran clean, and matched the example when we had
      // one to compare against" — never a silent false caused by formatting.
      passed: status === 'accepted' && outputMatches !== false,
      ran: status === 'accepted',
      outputMatches,
      expectedOutput: hasExpected ? String(expectedOutput) : null,
      stdout,
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      message: result.message || '',
      time: result.time || null,
      memory: result.memory || null,
      statusId: result.status.id,
      statusDescription: result.status.description,
    });
  } catch (error) {
    console.error('CODE_EXEC_UNHANDLED:', error?.message || error);
    return errorResponse('Something went wrong while running your code. Try again — if it keeps failing, submit your solution for review instead.', 500);
  }
}
