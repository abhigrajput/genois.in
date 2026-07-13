// SMOKE: in-app /subscription renders the Placement Beta Gate (not a paywall).
// Pre-seeds an authed session (cookie + localStorage token + profile mock) so the
// page gets past proxy.js + AppLayout's auth gate, then asserts the beta-gate CTA
// is present and the old ₹ price matrix is gone. Read-only; nothing hits prod writes.
import path from 'node:path';
import { Session, sleep } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute } from './lib/fixtures.mjs';

export const meta = {
  name: 'subscription-beta-gate',
  description: '/subscription shows Beta Gate CTA, no ₹ price matrix',
};

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  try {
    await session.ready();
    await seedAuthedSession(session);

    // Only stub the auth preconditions AppLayout needs; everything else (static
    // beta-gate markup) renders client-side with no data dependency.
    session.route((req) => authRoute(req) || null);

    await session.navigate(`${BASE}/subscription`);

    // Wait for the gate CTA to mount (after the profile mock resolves the gate).
    const ctaShown = await session.waitFor(
      `/Apply for Free Beta Access/i.test(document.body.innerText)`,
      { timeout: 15000 },
    );

    check('reached /subscription (not bounced to login)',
      (await session.eval('location.pathname')) === '/subscription');
    check('"Apply for Free Beta Access" CTA present', ctaShown);
    check('Beta framing present ("Placement Beta")',
      await session.eval(`/Placement Beta/i.test(document.body.innerText)`));
    check('CTA is a real <button>',
      await session.eval(`!![...document.querySelectorAll('button')].find(b=>/Apply for Free Beta Access/i.test(b.textContent))`));

    // The old paywall must be gone: no ₹ prices, no per-plan CTAs/badges.
    const body = await session.text();
    check('no ₹ price matrix (199/299/499)', !/[₹]?\s?(199|299|499)/.test(body));
    check('no "MOST POPULAR" badge', !/most popular/i.test(body));
    check('no per-plan CTA ("Go Performer/Dominator")', !/go (performer|dominator)/i.test(body));

    const p1 = path.join(ARTIFACTS, 'subscription-beta-gate-1-gate.png');
    await session.screenshot(p1); artifacts.push(p1);

    // The gate CTA routes to /dashboard — click it and confirm navigation.
    await session.clickByText(/Apply for Free Beta Access/i);
    await sleep(2000);
    check('CTA routes to /dashboard',
      (await session.eval('location.pathname')) === '/dashboard');

    const p2 = path.join(ARTIFACTS, 'subscription-beta-gate-2-afterclick.png');
    await session.screenshot(p2); artifacts.push(p2);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
