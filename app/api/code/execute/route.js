import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

// Judge0 via RapidAPI required a paid subscription even on its "free" tier, so
// every Run came back 403 and no student could execute anything. RAPIDAPI_KEY is
// no longer read here at all.
//
// Piston was the intended replacement, but its public instance closed on
// 2026-02-15 ("Public Piston API is now whitelist only" — 401 on /execute, while
// /runtimes still answers, which makes it look healthy until you actually run
// something). So there are two providers:
//
//   piston — used when CODE_EXEC_PISTON_URL points at a self-hosted or
//            whitelisted instance. Set that env var and this becomes the Piston
//            integration with no other change.
//   paiza  — the default. api.paiza.io's guest API: no key, no account, no card,
//            and verified to really compile and run Python/C++/Java/JS/C.
//
// Both adapters return the same shape, so the editor never learns which ran.
const PISTON_URL = (process.env.CODE_EXEC_PISTON_URL || '').replace(/\\[rnt]/g, '').trim().replace(/\/+$/, '');
const PAIZA_URL = 'https://api.paiza.io';
const PROVIDER = PISTON_URL ? 'piston' : 'paiza';

const EXEC_TIMEOUT_MS = 25000;   // our deadline on the whole provider round-trip
const RUN_TIMEOUT_MS = 5000;     // the student's program's own deadline (Piston)
const COMPILE_TIMEOUT_MS = 10000;
const MAX_CODE_CHARS = 50000;
const RUNTIMES_TTL_MS = 60 * 60 * 1000;

// GENOIS's language selector → each provider's name for the same runtime.
// `file` matters for Piston: it writes files[0] under that name, so `Main.java`
// is what lets javac find `public class Main` and the extension picks g++ vs gcc.
// `pistonFallbackVersion` is what keeps Run working if /runtimes is unreachable;
// Piston rejects a missing or unknown version outright.
const LANGUAGES = {
  python:     { paiza: 'python3',    piston: 'python',     file: 'main.py',   pistonFallbackVersion: '3.10.0' },
  // Piston serves both Deno and Node under "javascript"; Node is pinned because
  // the starter template assumes Node semantics.
  javascript: { paiza: 'javascript', piston: 'javascript', file: 'main.js',   pistonFallbackVersion: '18.15.0', pistonPreferVersion: '18.15.0' },
  java:       { paiza: 'java',       piston: 'java',       file: 'Main.java', pistonFallbackVersion: '15.0.2' },
  cpp:        { paiza: 'cpp',        piston: 'c++',        file: 'main.cpp',  pistonFallbackVersion: '10.2.0' },
  c:          { paiza: 'c',          piston: 'c',          file: 'main.c',    pistonFallbackVersion: '10.2.0' },
};

// Thrown by an adapter when the *service* failed, as opposed to the student's
// program failing. Everything the student sees for these is "couldn't run",
// never a result card — that distinction is the whole point of the three states.
class ExecUnavailable extends Error {
  constructor(message, httpStatus = 503, logLine = '') {
    super(message);
    this.httpStatus = httpStatus;
    this.logLine = logLine || message;
  }
}

const UNREACHABLE_MESSAGE =
  'Running code is temporarily unavailable — our execution service is unreachable. You can still write your solution and submit it for review; your score and progress are unaffected.';
const BUSY_MESSAGE =
  'The code runner is busy right now (it is a shared free service). Wait a moment and press Run again — your code is still here.';

function fetchWithDeadline(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/* ------------------------------------------------------------------ paiza */

// paiza reports numbers as strings ("0", "256", null). Number('') is 0, which
// would turn a missing exit code into a clean exit — hence the explicit guard.
function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function paizaExecute({ langCfg, code, stdin, deadlineAt }) {
  let createRes;
  try {
    createRes = await fetchWithDeadline(`${PAIZA_URL}/runners/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: code,
        language: langCfg.paiza,
        input: stdin || '',
        // Ask paiza to hold the connection until the run finishes; the poll loop
        // below is the fallback for when it returns early still "running".
        longpoll: true,
        longpoll_timeout: 20,
        api_key: 'guest',
      }),
    }, Math.max(1000, deadlineAt - Date.now()));
  } catch (netErr) {
    if (netErr?.name === 'AbortError') throw new ExecUnavailable('The code runner took too long to respond. Try running again — if your program has an infinite loop, fix that first.', 504, 'paiza create timed out');
    throw new ExecUnavailable(UNREACHABLE_MESSAGE, 503, `paiza create network error: ${netErr?.message || netErr}`);
  }

  const createBody = await createRes.text();
  if (createRes.status === 429) throw new ExecUnavailable(BUSY_MESSAGE, 429, 'paiza rate limited on create');
  if (!createRes.ok) {
    throw new ExecUnavailable(
      createRes.status >= 500
        ? 'The code runner is temporarily down on the provider side. Try again in a minute — you can still submit your solution for review.'
        : UNREACHABLE_MESSAGE,
      503,
      `paiza create HTTP ${createRes.status}: ${createBody.slice(0, 300)}`
    );
  }

  let created;
  try { created = JSON.parse(createBody); } catch {
    throw new ExecUnavailable('The code runner returned an unreadable response. Try running again.', 502, `paiza create bad JSON: ${createBody.slice(0, 300)}`);
  }
  if (created?.error || !created?.id) {
    throw new ExecUnavailable(UNREACHABLE_MESSAGE, 503, `paiza create rejected: ${createBody.slice(0, 300)}`);
  }

  let status = created.status;
  while (status !== 'completed') {
    if (Date.now() >= deadlineAt) {
      throw new ExecUnavailable('The code runner took too long to respond. Try running again — if your program has an infinite loop, fix that first.', 504, `paiza still ${status} at deadline`);
    }
    await new Promise(r => setTimeout(r, 700));
    let statusRes;
    try {
      statusRes = await fetchWithDeadline(`${PAIZA_URL}/runners/get_status?id=${encodeURIComponent(created.id)}&api_key=guest`, {}, Math.max(1000, deadlineAt - Date.now()));
    } catch {
      continue; // a dropped poll is not a failed run — the deadline above ends it
    }
    if (statusRes.status === 429) continue;
    if (!statusRes.ok) continue;
    try { status = (await statusRes.json())?.status; } catch { /* keep polling */ }
  }

  const detailRes = await fetchWithDeadline(`${PAIZA_URL}/runners/get_details?id=${encodeURIComponent(created.id)}&api_key=guest`, {}, Math.max(1000, deadlineAt - Date.now()));
  const detailBody = await detailRes.text();
  if (!detailRes.ok) {
    throw new ExecUnavailable(UNREACHABLE_MESSAGE, 503, `paiza details HTTP ${detailRes.status}: ${detailBody.slice(0, 300)}`);
  }
  let d;
  try { d = JSON.parse(detailBody); } catch {
    throw new ExecUnavailable('The code runner returned an unreadable response. Try running again.', 502, `paiza details bad JSON: ${detailBody.slice(0, 300)}`);
  }

  const buildExit = num(d.build_exit_code);
  const runExit = num(d.exit_code);
  const buildErr = d.build_stderr || '';

  // No build failure and no run result at all means nothing executed — that is a
  // provider problem, not a program that "ran and returned nothing".
  if (!(buildExit != null && buildExit !== 0) && runExit == null && d.result !== 'timeout') {
    throw new ExecUnavailable('The code runner returned an incomplete result. Try running again.', 502, `paiza no result: ${detailBody.slice(0, 300)}`);
  }

  return {
    compileFailed: buildExit != null && buildExit !== 0,
    compileOutput: buildErr || d.build_stdout || '',
    timedOut: d.result === 'timeout',
    killedBySignal: null,
    exitCode: runExit,
    stdout: d.stdout || '',
    stderr: d.stderr || '',
    // paiza reports seconds as a string and memory in bytes; the editor prints
    // "<time>s · <memory>KB", so memory is converted rather than mislabelled.
    time: d.time != null ? String(d.time) : null,
    memory: num(d.memory) != null ? Math.round(num(d.memory) / 1024) : null,
    runtime: `paiza ${d.language || langCfg.paiza}`,
  };
}

/* ----------------------------------------------------------------- piston */

let runtimeCache = { at: 0, versions: null };

async function pistonVersions() {
  if (runtimeCache.versions && Date.now() - runtimeCache.at < RUNTIMES_TTL_MS) return runtimeCache.versions;
  const versions = {};
  try {
    const res = await fetchWithDeadline(`${PISTON_URL}/runtimes`, {}, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    for (const [key, cfg] of Object.entries(LANGUAGES)) {
      const matches = (Array.isArray(list) ? list : []).filter(
        r => r.language === cfg.piston || (r.aliases || []).includes(cfg.piston)
      );
      const pinned = cfg.pistonPreferVersion && matches.find(r => r.version === cfg.pistonPreferVersion);
      versions[key] = (pinned || matches[0])?.version || cfg.pistonFallbackVersion;
    }
    runtimeCache = { at: Date.now(), versions };
  } catch (err) {
    // Not fatal, and deliberately not cached: retry the real list next run.
    console.error('CODE_EXEC_RUNTIMES:', err?.message || err);
    for (const [key, cfg] of Object.entries(LANGUAGES)) versions[key] = cfg.pistonFallbackVersion;
  }
  return versions;
}

async function pistonExecute({ langKey, langCfg, code, stdin, deadlineAt }) {
  const versions = await pistonVersions();

  let res;
  try {
    res = await fetchWithDeadline(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: langCfg.piston,
        version: versions[langKey],
        files: [{ name: langCfg.file, content: code }],
        stdin: stdin || '',
        run_timeout: RUN_TIMEOUT_MS,
        compile_timeout: COMPILE_TIMEOUT_MS,
      }),
    }, Math.max(1000, deadlineAt - Date.now()));
  } catch (netErr) {
    if (netErr?.name === 'AbortError') throw new ExecUnavailable('The code runner took too long to respond. Try running again — if your program has an infinite loop, fix that first.', 504, 'piston execute timed out');
    throw new ExecUnavailable(UNREACHABLE_MESSAGE, 503, `piston network error: ${netErr?.message || netErr}`);
  }

  const raw = await res.text();
  if (res.status === 429) throw new ExecUnavailable(BUSY_MESSAGE, 429, 'piston rate limited');
  if (res.status === 401 || res.status === 403) {
    // What the public instance now answers with. Naming it keeps the next person
    // from re-diagnosing a healthy-looking /runtimes against a closed /execute.
    throw new ExecUnavailable(UNREACHABLE_MESSAGE, 503, `piston rejected the request (${res.status}) — instance is whitelist-only or unauthorised: ${raw.slice(0, 200)}`);
  }
  if (!res.ok) {
    if (res.status >= 500) throw new ExecUnavailable('The code runner is temporarily down on the provider side. Try again in a minute — you can still submit your solution for review.', 503, `piston HTTP ${res.status}: ${raw.slice(0, 200)}`);
    let msg = '';
    try { msg = String(JSON.parse(raw)?.message || ''); } catch {}
    // A 400 here is an unknown language/version on our side, not the student's
    // mistake — say what happened rather than blaming their code.
    throw new ExecUnavailable(
      msg ? `The code runner rejected this run: ${msg.slice(0, 200)}` : `The code runner rejected this run (error ${res.status}). Try again in a moment.`,
      502, `piston HTTP ${res.status}: ${raw.slice(0, 200)}`
    );
  }

  let result;
  try { result = JSON.parse(raw); } catch {
    throw new ExecUnavailable('The code runner returned an unreadable response. Try running again.', 502, `piston bad JSON: ${raw.slice(0, 300)}`);
  }
  if (!result?.run || typeof result.run !== 'object') {
    throw new ExecUnavailable(
      result?.message ? `The code runner could not run this: ${String(result.message).slice(0, 200)}` : 'The code runner returned an incomplete result. Try running again.',
      502, `piston no run block: ${raw.slice(0, 300)}`
    );
  }

  const compile = result.compile || null;
  return {
    compileFailed: !!compile && compile.code !== 0,
    compileOutput: compile ? (compile.stderr || compile.stdout || '') : '',
    // Piston kills a program that outlives run_timeout with SIGKILL.
    timedOut: result.run.signal === 'SIGKILL',
    killedBySignal: result.run.signal && result.run.signal !== 'SIGKILL' ? result.run.signal : null,
    exitCode: result.run.code,
    stdout: result.run.stdout || '',
    stderr: result.run.stderr || '',
    // Piston reports neither, and inventing them would be a lie on the result
    // card; the editor already hides the row when they are absent.
    time: null,
    memory: null,
    runtime: `piston ${result.language || langCfg.piston} ${result.version || versions[langKey]}`,
  };
}

/* ------------------------------------------------------------------ route */

/**
 * Lets the editor learn up front whether "Run" can work, so it can label the
 * button honestly instead of letting the student write code, hit Run and get a
 * failure. Neither provider needs a key, so execution is configured by
 * definition; a real outage is reported by the POST, from the provider's answer.
 */
export async function GET(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) return errorResponse('Unauthorized', 401);
  return successResponse({
    configured: true,
    provider: PROVIDER,
    languages: Object.keys(LANGUAGES),
    message: null,
  });
}

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`code_${payload.userId}`, 10, 60000)) return rateLimitResponse();

    const { code, language, stdin, expectedOutput } = await request.json();
    if (!code || !String(code).trim()) return errorResponse('Write some code before running it.', 400);
    if (!language) return errorResponse('Pick a language before running.', 400);
    if (String(code).length > MAX_CODE_CHARS) {
      return errorResponse(`Your code is too long to run (limit ${MAX_CODE_CHARS.toLocaleString()} characters).`, 400);
    }

    const langKey = String(language).toLowerCase();
    const langCfg = LANGUAGES[langKey];
    if (!langCfg) {
      return errorResponse(`"${language}" can't be run here. Supported: ${Object.keys(LANGUAGES).join(', ')}.`, 400);
    }

    const deadlineAt = Date.now() + EXEC_TIMEOUT_MS;

    let exec;
    try {
      exec = PROVIDER === 'piston'
        ? await pistonExecute({ langKey, langCfg, code, stdin, deadlineAt })
        : await paizaExecute({ langCfg, code, stdin, deadlineAt });
    } catch (err) {
      if (err instanceof ExecUnavailable) {
        console.error(`CODE_EXEC_PROVIDER[${PROVIDER}]: ${err.logLine}`);
        return errorResponse(err.message, err.httpStatus);
      }
      throw err;
    }

    // Compilation is checked first: when javac or g++ fails there is no run to
    // report, and the compiler's own message is the only useful thing to show.
    let status, statusNote;
    if (exec.compileFailed) {
      status = 'compilation_error';
      statusNote = 'Your code did not compile. See the compile output below.';
    } else if (exec.timedOut) {
      status = 'time_limit_exceeded';
      statusNote = 'Your program ran out of time — check for an infinite loop or a slower-than-needed algorithm.';
    } else if (exec.killedBySignal) {
      status = 'runtime_error';
      statusNote = `Your program was terminated by ${exec.killedBySignal} — usually an out-of-bounds access, infinite recursion, or too much memory.`;
    } else if (exec.exitCode !== 0) {
      status = 'runtime_error';
      statusNote = `Your program exited with code ${exec.exitCode}. See the error output below.`;
    } else {
      status = 'accepted';
      statusNote = 'Your program ran successfully.';
    }

    // The example output is compared here, whitespace-tolerantly, and reported as
    // advisory information — never as the verdict. Byte-exact comparison used to
    // fail a correct answer printed as "[0, 1]" against an example of "[0,1]".
    const stdout = exec.stdout || '';
    const norm = s => String(s ?? '').replace(/\r\n/g, '\n').trim().replace(/[ \t]+/g, ' ');
    const hasExpected = expectedOutput != null && String(expectedOutput).trim() !== '';
    const outputMatches = hasExpected && status === 'accepted' ? norm(stdout) === norm(expectedOutput) : null;

    return successResponse({
      status,
      statusNote,
      // `passed` means "it ran clean, and matched the example when we had one to
      // compare against" — never a silent false caused by formatting.
      passed: status === 'accepted' && outputMatches !== false,
      ran: status === 'accepted',
      outputMatches,
      expectedOutput: hasExpected ? String(expectedOutput) : null,
      stdout,
      stderr: exec.stderr || '',
      compile_output: exec.compileFailed ? exec.compileOutput : '',
      message: '',
      time: exec.time,
      memory: exec.memory,
      exitCode: exec.exitCode,
      statusDescription: status.replace(/_/g, ' ').toUpperCase(),
      provider: PROVIDER,
      runtime: exec.runtime,
    });
  } catch (error) {
    console.error('CODE_EXEC_UNHANDLED:', error?.message || error);
    return errorResponse('Something went wrong while running your code. Try again — if it keeps failing, submit your solution for review instead.', 500);
  }
}
