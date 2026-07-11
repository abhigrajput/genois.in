// SMOKE: aptitude generation timeout -> "Still generating…" ErrorCard + Retry.
// Serves a real dashboard so the topic grid renders, then HANGS
// GET /api/aptitude/session so the deployed 45s AbortController fires. Asserts
// the timedOut branch (⏳ copy) renders and Retry re-enters generation.
//
// Slow by design: it waits out the real 45s timeout (~60s total).
import path from 'node:path';
import { Session, sleep } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute } from './lib/fixtures.mjs';

export const meta = {
  name: 'aptitude-gen-timeout',
  description: 'Generation times out -> "Still generating…" card + working Retry (~60s)',
};

const DASHBOARD = {
  data: {
    progress: { total_sessions: 3, current_streak: 2, quant_score: 60, logical_score: 55, verbal_score: 40 },
    categories: {
      quant: {
        icon: '🔢', color: '#00f0ff', label: 'Quantitative',
        description: 'Numbers, arithmetic & data interpretation',
        topics: [{ slug: 'percentage', name: 'Percentage' }, { slug: 'ratio', name: 'Ratio & Proportion' }],
      },
    },
  },
};

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  try {
    await session.ready();
    await seedAuthedSession(session);

    let sessionCalls = 0;
    session.route((req) => {
      const a = authRoute(req);
      if (a) return a;
      if (/\/api\/aptitude\/session/.test(req.url)) { sessionCalls++; return { hang: true }; } // force client timeout
      if (/\/api\/aptitude(\?|$)/.test(req.url)) return { fulfill: { status: 200, json: DASHBOARD } };
      return null;
    });

    await session.navigate(`${BASE}/aptitude`);

    check('reached level picker', await session.waitFor(`/Pick your aptitude level/i.test(document.body.innerText)`, { timeout: 15000 }));
    await session.clickByText(/Intermediate/i);
    check('topic grid rendered after level pick', await session.waitFor(`/Start →/.test(document.body.innerText)`, { timeout: 8000 }));

    await session.clickByText(/^10 Q/, { leafOnly: true }); // click a topic card
    check('generation started', await session.waitFor(`/Generating 10/i.test(document.body.innerText)`, { timeout: 8000 }));
    check('session endpoint was called', sessionCalls >= 1);

    // Wait out the real 45s AbortController timeout in the deployed bundle.
    const timedOut = await session.waitFor(`/Still generating/i.test(document.body.innerText)`, { timeout: 55000, interval: 1000 });
    check('timeout ErrorCard shown (⏳ Still generating…)', timedOut);
    check('Retry present', await session.eval(`!![...document.querySelectorAll('button')].find(b=>/retry/i.test(b.textContent))`));
    check('Back-to-topics present', await session.eval(`!![...document.querySelectorAll('button')].find(b=>/back to topics/i.test(b.textContent))`));

    const p1 = path.join(ARTIFACTS, 'aptitude-gen-timeout-1-card.png');
    await session.screenshot(p1); artifacts.push(p1);

    const before = sessionCalls;
    await session.clickByText(/retry/i);
    const back = await session.waitFor(`/Generating 10/i.test(document.body.innerText)`, { timeout: 8000 });
    check('Retry re-entered generation', back);
    // The re-issued request is intercepted a beat after the UI flips — poll for it.
    let reFired = false;
    for (let i = 0; i < 24 && !reFired; i++) { if (sessionCalls > before) reFired = true; else await sleep(250); }
    check('Retry re-fired the session request', reFired);

    const p2 = path.join(ARTIFACTS, 'aptitude-gen-timeout-2-retry.png');
    await session.screenshot(p2); artifacts.push(p2);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
