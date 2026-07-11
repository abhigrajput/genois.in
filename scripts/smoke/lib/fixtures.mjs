// Shared fixtures for GENOIS smoke tests: base URL, artifact dir, and the
// auth-precondition stubbing every authed page needs.
//
// The app is double-gated: the edge proxy (proxy.js) checks for the presence of
// a `genois_token` cookie, then AppLayout validates the localStorage token via
// /api/auth/profile and redirects invalid ones to /login before the page mounts.
// To smoke-test an authed page we satisfy BOTH cheaply — a placeholder cookie
// plus a stubbed profile — WITHOUT real credentials. Nothing is written to prod;
// all stubbed calls are reads inside a throwaway browser.
import path from 'node:path';

export const BASE = (process.env.SMOKE_BASE_URL || 'https://genois.in').replace(/\/$/, '');
export const ARTIFACTS = path.join(process.cwd(), 'scripts', 'smoke', 'artifacts');

// A user on an active trial. getEffectivePlan() maps trial -> 'dominator', which
// clears every PermissionGate (aptitude_training, etc.).
export function onTrialUser() {
  const trialEnds = new Date(Date.now() + 20 * 864e5).toISOString();
  return {
    data: {
      user: {
        id: 'smoke-user', name: 'Smoke Test', email: 'smoke@example.com',
        domain_slug: 'software-engineering',
        subscription_plan: 'spectator', is_on_trial: true, trial_ends_at: trialEnds,
      },
      progress: {}, score: {}, skill: {},
    },
  };
}

// Seed cookie + localStorage token so the request reaches the page's own logic.
export async function seedAuthedSession(session) {
  await session.setCookie('genois_token', 'smoke-placeholder-cookie', BASE);
  await session.seedLocalStorage('genois_token', 'smoke.stub.token');
}

// Route helper: fulfills the auth endpoints AppLayout + usePermission call,
// returns null for everything else so the smoke can add its own rules.
export function authRoute({ url }) {
  if (/\/api\/(auth\/profile|user\/me)/.test(url)) {
    return { fulfill: { status: 200, json: onTrialUser() } };
  }
  return null;
}
