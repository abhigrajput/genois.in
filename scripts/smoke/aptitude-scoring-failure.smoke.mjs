// SMOKE: aptitude answer scoring failure -> toast + Submit re-enabled (not stuck).
// Generation SUCCEEDS (GET /api/aptitude/session returns a question) so the test
// renders; then POST /api/aptitude/session (scoring) is forced to 503. Asserts
// the user is NOT stranded on a "Scoring…" spinner — an error toast appears, the
// Submit button re-enables with answers preserved, and clicking it re-fires.
import path from 'node:path';
import { Session, sleep } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute } from './lib/fixtures.mjs';

export const meta = {
  name: 'aptitude-scoring-failure',
  description: 'Scoring POST fails -> toast + Submit re-enabled (answers kept) + re-fires',
};

const DASHBOARD = {
  data: {
    progress: { total_sessions: 1, current_streak: 1, quant_score: 50, logical_score: 50, verbal_score: 50 },
    categories: {
      quant: {
        icon: '🔢', color: '#00f0ff', label: 'Quantitative', description: 'Arithmetic',
        topics: [{ slug: 'percentage', name: 'Percentage' }],
      },
    },
  },
};
const GENERATED = { data: { session: { id: 'smoke-session' }, questions: [{ question: 'What is 2 + 2?', options: ['3', '4', '5', '6'] }] } };
const SCORE_ERR = 'Scoring service unavailable (smoke)';

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  try {
    await session.ready();
    await seedAuthedSession(session);

    let submitCalls = 0;
    session.route((req) => {
      const a = authRoute(req);
      if (a) return a;
      if (/\/api\/aptitude\/session/.test(req.url)) {
        if (req.method === 'POST') { submitCalls++; return { fulfill: { status: 503, json: { message: SCORE_ERR } } }; }
        return { fulfill: { status: 200, json: GENERATED } }; // GET = generate
      }
      if (/\/api\/aptitude(\?|$)/.test(req.url)) return { fulfill: { status: 200, json: DASHBOARD } };
      return null;
    });

    await session.navigate(`${BASE}/aptitude`);
    check('reached level picker', await session.waitFor(`/Pick your aptitude level/i.test(document.body.innerText)`, { timeout: 15000 }));
    await session.clickByText(/Intermediate/i);
    check('topic grid rendered', await session.waitFor(`/Start →/.test(document.body.innerText)`, { timeout: 8000 }));

    await session.clickByText(/^10 Q/, { leafOnly: true });
    check('test rendered with generated question', await session.waitFor(`/What is 2 \\+ 2/.test(document.body.innerText)`, { timeout: 10000 }));

    // Select an option, then submit (single question => Submit shows immediately).
    await session.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^[A-D]\\./.test(x.textContent.trim()));if(b)b.click();return !!b;})()`);
    await session.clickByText(/Submit \d/i);

    // Recovery: the toast surfaces the error and Submit un-sticks from "Scoring…".
    const toastShown = await session.waitFor(`document.body.innerText.includes(${JSON.stringify(SCORE_ERR)})`, { timeout: 5000 });
    check('error toast shown', toastShown);
    check('scoring POST was attempted', submitCalls >= 1);
    check('Submit re-enabled (not stuck on "Scoring…")', await session.waitFor(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Submit \\d/.test(x.textContent));return b && !b.disabled;})()`, { timeout: 8000 }));
    check('still on the test — answers preserved', await session.eval(`/What is 2 \\+ 2/.test(document.body.innerText)`));

    const p1 = path.join(ARTIFACTS, 'aptitude-scoring-failure-1-toast.png');
    await session.screenshot(p1); artifacts.push(p1);

    const before = submitCalls;
    await session.clickByText(/Submit \d/i);
    let reFired = false;
    for (let i = 0; i < 24 && !reFired; i++) { if (submitCalls > before) reFired = true; else await sleep(250); }
    check('Re-submit re-fired the scoring request', reFired);

    const p2 = path.join(ARTIFACTS, 'aptitude-scoring-failure-2-resubmit.png');
    await session.screenshot(p2); artifacts.push(p2);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
