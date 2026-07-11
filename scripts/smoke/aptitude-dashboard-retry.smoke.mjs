// SMOKE: aptitude dashboard-load failure -> ErrorCard + Retry.
// Forces GET /api/aptitude to 503 and asserts the page shows a recoverable
// "Couldn't load aptitude" card whose Retry button actually re-fires the request
// (instead of the old permanent "Loading…" dead-end).
import path from 'node:path';
import { Session, sleep } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute } from './lib/fixtures.mjs';

export const meta = {
  name: 'aptitude-dashboard-retry',
  description: 'Dashboard load fails -> ErrorCard + working Retry',
};

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  try {
    await session.ready();
    await seedAuthedSession(session);

    let dashCalls = 0;
    session.route((req) => {
      const a = authRoute(req);
      if (a) return a;
      if (/\/api\/aptitude(\?|$)/.test(req.url)) {
        dashCalls++;
        return { fulfill: { status: 503, json: { message: 'Service Unavailable (smoke)' } } };
      }
      return null;
    });

    await session.navigate(`${BASE}/aptitude`);
    const shown = await session.waitFor(`/couldn.t load aptitude/i.test(document.body.innerText)`, { timeout: 15000 });

    check('reached /aptitude (not bounced to login)', (await session.eval('location.pathname')) === '/aptitude');
    check('ErrorCard shown on dashboard failure', shown);
    check('Retry button present', await session.eval(`!![...document.querySelectorAll('button')].find(b=>/retry/i.test(b.textContent))`));

    const p1 = path.join(ARTIFACTS, 'aptitude-dashboard-retry-1-error.png');
    await session.screenshot(p1); artifacts.push(p1);

    const before = dashCalls;
    await session.clickByText(/retry/i);
    await sleep(2500);
    check('Retry re-fired the dashboard request', dashCalls > before);
    check('Card persists gracefully after 2nd failure', await session.eval(`/couldn.t load aptitude/i.test(document.body.innerText)`));

    const p2 = path.join(ARTIFACTS, 'aptitude-dashboard-retry-2-afterclick.png');
    await session.screenshot(p2); artifacts.push(p2);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
