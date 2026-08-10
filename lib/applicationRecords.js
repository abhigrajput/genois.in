/**
 * Shared plumbing for the application tracker routes.
 *
 * Lives here rather than in app/api/applications/route.js because Next type-checks
 * the exports of a route module against the handler signature — a route file may
 * export GET/POST/… and little else, so helpers shared between the collection
 * route and the per-id route need their own module.
 */

/** PostgREST's missing-relation signals, i.e. the 20260808 migration is unapplied. */
export function isMissingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205' ||
         /relation .* does not exist|could not find the table/i.test(error?.message || '');
}

/** Trim to a bounded string, or null. Empty/whitespace becomes null, not ''. */
export function boundedText(v, max) {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t.length ? t : null;
}

/**
 * YYYY-MM-DD only. Anything else returns null and the caller rejects or drops
 * it — a malformed date is never coerced to today, because recording a date the
 * student did not give us would be inventing a fact about them.
 */
export function isoDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : v;
}

/** The columns both routes select — kept in one place so they cannot drift. */
export const APPLICATION_COLUMNS =
  'id, company, role, applied_on, stage, source, notes, created_at, updated_at';

/** DB row → API shape. */
export function serializeApplication(row) {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    appliedOn: row.applied_on,
    stage: row.stage,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Hard cap on rows per student — bounds both the list query and inserts. */
export const MAX_APPLICATIONS = 300;
