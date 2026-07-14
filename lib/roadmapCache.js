import { getAdminClient } from './supabaseAdmin.js';

// ─────────────────────────────────────────────────────────────────────────────
// Roadmap cache invalidation + timeline sizing.
//
// The roadmap cache used to be keyed ONLY by (domain_slug, day_number) — a
// domain-GLOBAL cache. The first student to generate a given day "won" and every
// other student in that domain inherited their company/weakness personalization.
// The 20260713_roadmap_per_user migration re-keys the cache per user; this module
// holds the two helpers that make profile changes actually reshape the roadmap.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * months_to_placement → total roadmap length in days. A shorter runway compresses
 * the plan so the student still traverses the full syllabus — just faster and
 * harder per day (see the pace scaling in curriculumGenerator.generateDayContent).
 *
 * Unset (null/undefined) preserves the original 365-day behavior, so existing
 * users who never picked a timeline are unaffected.
 *
 * @param {number|null|undefined} months
 * @returns {number}
 */
export function roadmapTotalDays(months) {
  if (months == null) return 365;
  if (months <= 3) return 60;   // 1-3 months  → aggressive
  if (months <= 6) return 120;  // 4-6 months
  if (months <= 9) return 180;  // 7-9 months
  if (months <= 12) return 270; // 10-12 months
  return 365;                    // 12+ months → full plan
}

/**
 * Invalidate a user's generated roadmap so the next daily fetch regenerates it
 * against their CURRENT profile (target companies, weak subjects, timeline,
 * domain).
 *
 * We deliberately do NOT DELETE roadmap rows: tasks, tests and notes all
 * FK-reference roadmap(id) with no cascade, so a delete would either be blocked
 * or force us to wipe real performance history. Instead we blank the enrichment
 * (objectives/cached_at) so isComplete() in the daily route fails and the row is
 * regenerated IN PLACE via upsert (same id → every reference stays valid). Notes
 * are AI summaries of the OLD topics, so those we drop outright to regenerate.
 *
 * Deploy-safe: if the per-user migration hasn't been applied yet, the roadmap
 * update simply errors on the missing user_id column and no-ops — and the daily
 * route already regenerates on every miss in that state, so behavior is correct
 * either way.
 *
 * @param {string} userId
 * @param {import('@supabase/supabase-js').SupabaseClient} [supabase]
 * @returns {Promise<void>}
 */
export async function invalidateUserRoadmap(userId, supabase = getAdminClient()) {
  const results = await Promise.allSettled([
    supabase.from('roadmap').update({ objectives: null, cached_at: null }).eq('user_id', userId),
    supabase.from('notes').delete().eq('user_id', userId),
  ]);
  results.forEach((r, i) => {
    const label = ['roadmap invalidate', 'notes clear'][i];
    if (r.status === 'rejected') console.error(`[roadmapCache] ${label} threw:`, r.reason);
    else if (r.value?.error) console.warn(`[roadmapCache] ${label} soft-failed:`, r.value.error.message);
  });
}
