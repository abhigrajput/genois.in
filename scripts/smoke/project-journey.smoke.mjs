// SMOKE: /projects renders the guided build journey — level tiers, per-phase
// build path with concepts + time estimates, and working phase checkboxes.
//
// Pre-seeds an authed session (cookie + localStorage token + profile mock) so
// the page gets past proxy.js + AppLayout, then stubs the three reads the page
// makes. The journey payload is a trimmed copy of what
// /api/projects/journey returns, so the assertions exercise the page's own
// merge logic (catalog prose ⨝ enrichment, by phase index) rather than a mock
// of it. The phase-toggle POST is stubbed too — nothing hits a real write.
import path from 'node:path';
import { Session } from './lib/cdp.mjs';
import { BASE, ARTIFACTS, seedAuthedSession, authRoute } from './lib/fixtures.mjs';

export const meta = {
  name: 'project-journey',
  description: '/projects shows level tiers, phase build paths and phase ticking',
};

// The stub user's domain_slug has no catalog, so the page falls back to
// `fullstack` — these keys must match what lib/projectLevels projectKey()
// produces for that same fallback.
const DOMAIN = 'software-engineering';
const KEY_W4 = `${DOMAIN}::w4::personal-portfolio-website`;
const KEY_W16 = `${DOMAIN}::w16::rest-api-with-node-js`;

function phase(index, name, skills, hours) {
  return {
    index, name, skills,
    hours: { min: hours, max: hours * 2, label: `${hours}–${hours * 2} h` },
    video: null, sheet: null,
  };
}

function journeyPayload() {
  return {
    success: true,
    data: {
      domain: DOMAIN,
      trackingAvailable: true,
      reason: null,
      inferred: { level: 'starter', source: 'default' },
      projects: [
        {
          key: KEY_W4, week: 4, title: 'Personal Portfolio Website',
          difficulty: 'beginner', tier: 'starter', phaseCount: 3,
          totalHours: { min: 10, max: 18 },
          phases: [
            {
              ...phase(0, 'Foundation', [{ id: 'cs.web-fundamentals', label: 'Web Fundamentals' }], 2),
              // A real curated entry (lib/curatedVideos.js, slug cs-web-fundamentals)
              // so the in-page player and the sheet deep link are both exercised.
              video: { slug: 'cs-web-fundamentals', id: 'AlkDbnbv7dk', title: 'What happens when you type a URL into your browser?', channel: 'ByteByteGo' },
              sheet: { id: 'web-fundamentals', title: 'Web Fundamentals' },
            },
            phase(1, 'Core build', [{ id: 'cs.web-fundamentals', label: 'Web Fundamentals' }], 5),
            phase(2, 'Polish & ship', [{ id: 'cs.git', label: 'Git & Version Control' }], 3),
          ],
          completedPhases: [0],
          completedAt: null,
        },
        {
          key: KEY_W16, week: 16, title: 'REST API with Node.js',
          difficulty: 'intermediate', tier: 'intermediate', phaseCount: 3,
          totalHours: { min: 17, max: 30 },
          phases: [
            phase(0, 'Foundation', [{ id: 'cs.db-sql', label: 'DBMS — SQL Queries' }], 4),
            phase(1, 'Core build', [{ id: 'cs.sd-api', label: 'System Design — API Design' }], 8),
            phase(2, 'Polish & ship', [{ id: 'comm.documentation', label: 'Technical Writing & Documentation' }], 5),
          ],
          completedPhases: [],
          completedAt: null,
        },
      ],
    },
  };
}

export async function run({ headful = false } = {}) {
  const session = await Session.launch({ headful });
  const checks = [];
  const artifacts = [];
  const check = (label, ok) => checks.push({ label, ok: !!ok });

  // Captured so we can assert the page sends the toggle the API expects.
  let lastToggle = null;

  const consoleErrors = [];

  try {
    await session.ready();
    session.on('Runtime.consoleAPICalled', (e) => {
      if (e?.type !== 'error') return;
      const text = (e.args || []).map(a => a.value ?? a.description).join(' ');
      // next-auth's SessionProvider polls /api/auth/session, which this harness
      // does not stub — it gets the app shell HTML back and logs a parse error.
      // That is an artefact of running stubbed, not something this page does.
      if (/next-auth/i.test(text)) return;
      consoleErrors.push(text);
    });
    await seedAuthedSession(session);
    // The level picker persists to localStorage; clear it so the run always
    // starts from the inferred tier rather than a previous run's choice.
    await session.addInitScript(`try{localStorage.removeItem('genois_project_level')}catch(e){}`);

    session.route((req) => {
      const auth = authRoute(req);
      if (auth) return auth;
      if (/\/api\/projects\/journey/.test(req.url)) {
        if (req.method === 'POST') {
          lastToggle = true;
          return { fulfill: { status: 200, json: { success: true, data: { projectKey: KEY_W4, completedPhases: [0, 1], completedAt: null, phaseCount: 3 } } } };
        }
        return { fulfill: { status: 200, json: journeyPayload() } };
      }
      if (/\/api\/projects\/history/.test(req.url)) {
        return { fulfill: { status: 200, json: { success: true, data: { projects: [] } } } };
      }
      if (/\/api\/roadmap\/daily/.test(req.url)) {
        return { fulfill: { status: 200, json: { success: true, data: { currentDay: 1 } } } };
      }
      return null;
    });

    await session.navigate(`${BASE}/projects`);
    // Generous: against a cold `next dev` the first compile of /projects and
    // its imports can take most of half a minute.
    const loaded = await session.waitFor(`/Guided Project Journey/i.test(document.body.innerText)`, { timeout: 45000 });

    check('reached /projects (not bounced to login)', (await session.eval('location.pathname')) === '/projects');
    check('journey header rendered', loaded);

    let body = await session.text();
    check('level picker offers all three tiers',
      /Starter/.test(body) && /Intermediate/.test(body) && /Advanced/.test(body));
    check('inferred level is explained, not silent', /Starting you at/i.test(body));

    // Starter is inferred, so only beginner-tier projects are listed.
    check('starter tier filters the list (w4 shown)', /Personal Portfolio Website/.test(body));
    check('starter tier filters the list (w16 hidden)', !/REST API with Node\.js/.test(body));

    // Progress from the journey payload, merged onto the catalog card.
    check('per-project progress shown (1/3 phases)', /1\/3 phases/.test(body));
    check('project time estimate shown', /~10–18 h/.test(body));
    check('journey summary counts in-progress builds', /In Progress/.test(body));

    const p1 = path.join(ARTIFACTS, 'project-journey-1-starter.png');
    await session.screenshot(p1); artifacts.push(p1);

    // Open the build path and check the enrichment landed on the right phases.
    await session.clickByText(/Open the guided build path/i);
    check('build path drawer opens',
      await session.waitFor(`document.querySelectorAll('input[type=checkbox]').length === 3`, { timeout: 10000 }));
    body = await session.text();
    check('build path lists authored phases', /Foundation/.test(body) && /Core build/.test(body) && /Polish & ship/.test(body));
    check('phase concepts rendered from the taxonomy', /Web Fundamentals/.test(body) && /Git & Version Control/.test(body));
    check('per-phase time estimate rendered', /~2–4 h/.test(body));
    check('authored step prose still rendered', /semantic HTML/i.test(body));
    check('resume bullets still present', /Resume bullets/i.test(body));
    check('reference link is a GitHub SEARCH, not a repo URL',
      await session.eval(`[...document.querySelectorAll('a[href*="github.com"]')].every(a=>a.href.includes('/search?'))`));

    // Per-phase resources: the video plays in-page (poster + modal, never a
    // youtube.com/results link) and the sheet deep-links into /notes.
    check('phase video renders as an in-page player, not a search link',
      await session.eval(`!!document.querySelector('button[aria-label^="Play:"]')`));
    check('no YouTube search link anywhere on the page',
      await session.eval(`![...document.querySelectorAll('a')].some(a=>/youtube\\.com\\/results/.test(a.href))`));
    check('phase study sheet deep-links into /notes',
      await session.eval(`!![...document.querySelectorAll('a')].find(a=>/\\/notes\\?sheet=web-fundamentals/.test(a.getAttribute('href')||''))`));

    const boxes = await session.eval(`document.querySelectorAll('input[type=checkbox]').length`);
    check('one checkbox per phase', boxes === 3);
    check('completed phase is pre-ticked',
      await session.eval(`document.querySelectorAll('input[type=checkbox]')[0].checked === true`));
    check('checkboxes are enabled when tracking is available',
      await session.eval(`![...document.querySelectorAll('input[type=checkbox]')].some(b=>b.disabled)`));

    const p2 = path.join(ARTIFACTS, 'project-journey-2-buildpath.png');
    await session.screenshot(p2); artifacts.push(p2);

    // Tick phase 2 and confirm the write goes out and the UI advances.
    await session.eval(`document.querySelectorAll('input[type=checkbox]')[1].click()`);
    await session.waitFor(`/2\/3 phases/.test(document.body.innerText)`, { timeout: 10000 });
    body = await session.text();
    check('ticking a phase POSTs to /api/projects/journey', lastToggle === true);
    check('progress advances to 2/3', /2\/3 phases/.test(body));

    const p3 = path.join(ARTIFACTS, 'project-journey-3-ticked.png');
    await session.screenshot(p3); artifacts.push(p3);

    // Switching tier re-filters without a reload.
    await session.clickByText(/^Intermediate$/);
    await session.waitFor(`/REST API with Node\.js/.test(document.body.innerText)`, { timeout: 10000 });
    body = await session.text();
    check('switching tier shows intermediate projects', /REST API with Node\.js/.test(body));
    check('switching tier hides starter projects', !/Personal Portfolio Website/.test(body));

    const p4 = path.join(ARTIFACTS, 'project-journey-4-intermediate.png');
    await session.screenshot(p4); artifacts.push(p4);

    // React key collisions, hydration mismatches and optimistic-update bugs all
    // surface here first, and none of them fail a text assertion.
    if (consoleErrors.length) console.error('  console errors:', consoleErrors.slice(0, 5));
    check('no console errors during the whole flow', consoleErrors.length === 0);
  } finally {
    await session.close();
  }

  return { name: meta.name, checks, artifacts };
}
