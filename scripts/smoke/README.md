# Smoke tests

Post-deploy smoke tests that drive the **real deployed site** with headless
Chrome (via the DevTools Protocol) and assert that critical failure-recovery UI
still works. Built to re-verify the stability safeguards added to the aptitude
and voice-interview flows.

## Run

```bash
npm run smoke                 # all smokes against https://genois.in
npm run smoke:fast            # just the quick ones (skips the ~60s timeout test)

# or directly, with options:
node scripts/smoke/run.mjs --base http://localhost:3000
node scripts/smoke/run.mjs --only aptitude
node scripts/smoke/run.mjs --headful        # watch in a real window
node scripts/smoke/run.mjs --list           # list smokes, run nothing
```

Run from the repo root. Exits non-zero if any check fails (CI-friendly).
Screenshots land in `scripts/smoke/artifacts/` (gitignored).

## Requirements

- **Node ≥ 22** — uses the built-in global `WebSocket`, so there is **nothing to
  install**.
- **Chrome/Chromium** — auto-detected on Windows/macOS/Linux, or set `CHROME_BIN`.

## How it works

The app is gated twice: the edge proxy (`proxy.js`) checks for a `genois_token`
cookie, then `AppLayout` validates the localStorage token via `/api/auth/profile`
and redirects invalid sessions to `/login` before the page mounts. Rather than
using real credentials, each smoke satisfies these **preconditions** by:

1. setting a placeholder `genois_token` cookie (passes the edge proxy),
2. stubbing `/api/auth/profile` + `/api/user/me` → an on-trial user (passes the
   `AppLayout` auth check and every `PermissionGate`),

then controls the **one endpoint under test** to trigger the failure. The
recovery UI being asserted is 100% the deployed bundle; only network conditions
are staged, and every stubbed call is a read — **nothing is written to prod**.

## Smokes

| Name | What it proves | Time |
|------|----------------|------|
| `aptitude-dashboard-retry` | `GET /api/aptitude` 503 → "Couldn't load aptitude" ErrorCard, and Retry re-fires the request | ~5s |
| `aptitude-gen-timeout` | `GET /api/aptitude/session` hangs → the deployed 45s `AbortController` fires → ⏳ "Still generating…" card, and Retry re-enters generation | ~50s |
| `aptitude-scoring-failure` | `POST /api/aptitude/session` 503 → error toast, Submit un-sticks from "Scoring…" with answers kept, and re-submit re-fires | ~5s |
| `voice-interview-eval-retry` | `POST /api/interview/evaluate` 503 → "Scoring hiccuped" card (Retry evaluation / End interview — never an estimated score), and Retry re-fires | ~5s |

> The voice smoke disables `webkitSpeechRecognition` so the page renders its
> typed-answer `<textarea>` fallback (headless Chrome exposes the API but never
> returns speech results). See `disableSpeech` in `lib/fixtures.mjs`.

## Adding a smoke

Create `<name>.smoke.mjs` exporting:

```js
export const meta = { name: 'my-check', description: 'one-liner' };
export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });
  try {
    await session.ready();
    // … drive the page, assert with check(...)
  } finally { await session.close(); }
  return { name: meta.name, checks, artifacts: [] };
}
```

See `lib/cdp.mjs` for the `Session` API (`route`, `waitFor`, `clickByText`,
`eval`, `screenshot`) and `lib/fixtures.mjs` for the auth-stub helpers. The runner
auto-discovers any `*.smoke.mjs` file here.
