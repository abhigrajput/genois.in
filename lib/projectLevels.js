/**
 * Project journey levels — the client-safe half of Feature C.
 *
 * WHY THIS IS SEPARATE FROM lib/projectJourney.js
 * -----------------------------------------------
 * The /projects page needs the level vocabulary and the project key format in
 * the browser. The journey *enrichment* needs lib/studySheets, which pulls in
 * every curated sheet body — several hundred KB the page has no use for. So the
 * small shared vocabulary lives here (imported by both the page and the API)
 * and the heavy enrichment stays server-side.
 *
 * THREE TIERS, NOT FOUR. lib/projectTemplates.js grades projects on four
 * difficulties (beginner / intermediate / advanced / expert) because that is
 * how the 52-week track was authored. The journey presents THREE, because a
 * student choosing where to start does not benefit from splitting hairs
 * between "advanced" and "expert" — both mean "you have shipped things before".
 */

/** The tiers a student picks between, easiest first. */
export const LEVELS = [
  {
    id: 'starter',
    label: 'Starter',
    blurb: 'Zero experience. You have written some code in class and never shipped anything.',
    difficulties: ['beginner'],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    blurb: 'You have built a small app end-to-end and can read documentation on your own.',
    difficulties: ['intermediate'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    blurb: 'You have shipped a real project and want something an interviewer will dig into.',
    difficulties: ['advanced', 'expert'],
  },
];

export const LEVEL_IDS = LEVELS.map(l => l.id);

/** 'all' is a view, not a level — it shows the whole track in week order. */
export const ALL_LEVELS = 'all';

const TIER_BY_DIFFICULTY = new Map();
for (const level of LEVELS) {
  for (const d of level.difficulties) TIER_BY_DIFFICULTY.set(d, level.id);
}

/** A template's `difficulty` → the tier it is shown under. Unknown → starter. */
export function tierForDifficulty(difficulty) {
  return TIER_BY_DIFFICULTY.get(difficulty) || 'starter';
}

export function levelMeta(id) {
  return LEVELS.find(l => l.id === id) || null;
}

/**
 * Stable identifier for one catalog project.
 *
 * TEXT, and deliberately NOT the deterministic UUID that /api/projects/submit
 * derives for the `projects` table. That UUID exists to satisfy a foreign key;
 * this key exists to be readable in a database row and in a diff, the same
 * reasoning as `dsa_pattern_progress.pattern_id`. The two live side by side —
 * phase progress is keyed by this, submissions stay keyed by the UUID, and
 * neither migration touches the other.
 */
export function projectKey(domain, week, title) {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${domain}::w${week || 0}::${slug}`;
}

/**
 * Where to start a student who has not picked a level.
 *
 * Uses signals we already collect — the diagnostic's skill level and how many
 * projects they have had audited — and nothing else. No AI call, no guessing
 * from their college or branch. When there is no signal at all the answer is
 * `starter`, because the cost of starting someone too low (a fast first win)
 * is much smaller than the cost of starting them too high (they stall).
 *
 * @param {{skillLevel?: string|null, reviewedProjects?: number}} signals
 * @returns {{level: string, source: 'diagnostic'|'portfolio'|'default'}}
 */
export function inferLevel({ skillLevel = null, reviewedProjects = 0 } = {}) {
  if (reviewedProjects >= 4) return { level: 'advanced', source: 'portfolio' };
  if (skillLevel === 'advanced') return { level: 'advanced', source: 'diagnostic' };
  if (reviewedProjects >= 2) return { level: 'intermediate', source: 'portfolio' };
  if (skillLevel === 'intermediate') return { level: 'intermediate', source: 'diagnostic' };
  return { level: 'starter', source: 'default' };
}
