// SMOKE: voice-interview evaluation failure -> "Scoring hiccuped" screen + Retry.
// Speech is disabled so the page renders its typed-answer <textarea>. Starts an
// interview (stubbed question), submits a typed answer, and forces
// POST /api/interview/evaluate to 503 — asserting the evalFailed recovery screen
// (Retry evaluation + Use estimated score) appears and Retry re-fires scoring,
// instead of stranding the user on the evaluating spinner.
import path from 'node:path';
import { Session, sleep } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute, disableSpeech } from './lib/fixtures.mjs';

export const meta = {
  name: 'voice-interview-eval-retry',
  description: 'Answer scoring fails -> "Scoring hiccuped" card + working Retry',
};

const QUESTION = { data: { question: { question: 'What is a closure in JavaScript?', type: 'technical', difficulty: 'easy' } } };
const ANSWER = 'A closure is a function that captures variables from its surrounding lexical scope and keeps them alive after the outer function returns.';

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  try {
    await session.ready();
    await seedAuthedSession(session);
    await disableSpeech(session); // force the typed-answer fallback

    let evalCalls = 0;
    session.route((req) => {
      const a = authRoute(req);
      if (a) return a;
      if (/\/api\/interview\/questions/.test(req.url)) return { fulfill: { status: 200, json: QUESTION } };
      if (/\/api\/interview\/evaluate/.test(req.url)) { evalCalls++; return { fulfill: { status: 503, json: { message: 'Scoring unavailable (smoke)' } } }; }
      return null;
    });

    await session.navigate(`${BASE}/voice-interview`);
    check('reached voice-interview selection screen', await session.waitFor(`/Voice Mock Interview/i.test(document.body.innerText)`, { timeout: 15000 }));

    await session.clickByText(/Start .*Voice Interview/i);
    check('question screen rendered', await session.waitFor(`/Interviewer asks/i.test(document.body.innerText)`, { timeout: 10000 }));
    check('typed-answer fallback present', await session.eval(`!!document.querySelector('textarea')`));

    await session.setValue('textarea', ANSWER);
    check('answer accepted (Submit enabled)', await session.waitFor(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Submit Answer/i.test(x.textContent));return b && !b.disabled;})()`, { timeout: 5000 }));

    await session.clickByText(/Submit Answer/i);
    const failed = await session.waitFor(`/Scoring hiccuped/i.test(document.body.innerText)`, { timeout: 15000 });
    check('evalFailed card shown (Scoring hiccuped)', failed);
    check('Retry-evaluation button present', await session.eval(`!![...document.querySelectorAll('button')].find(b=>/retry evaluation/i.test(b.textContent))`));
    check('Use-estimated-score option present', await session.eval(`!![...document.querySelectorAll('button')].find(b=>/estimated score/i.test(b.textContent))`));

    const p1 = path.join(ARTIFACTS, 'voice-interview-eval-retry-1-failed.png');
    await session.screenshot(p1); artifacts.push(p1);

    const before = evalCalls;
    await session.clickByText(/retry evaluation/i);
    let reFired = false;
    for (let i = 0; i < 24 && !reFired; i++) { if (evalCalls > before) reFired = true; else await sleep(250); }
    check('Retry re-fired the evaluate request', reFired);
    check('Card persists gracefully after 2nd failure', await session.waitFor(`/Scoring hiccuped/i.test(document.body.innerText)`, { timeout: 8000 }));

    const p2 = path.join(ARTIFACTS, 'voice-interview-eval-retry-2-afterclick.png');
    await session.screenshot(p2); artifacts.push(p2);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
