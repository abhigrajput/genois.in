// Client-safe profile helpers (no server-only imports — usable in components).

/**
 * A profile is "complete" enough to leave onboarding once we know WHAT to teach
 * (domain), WHO the student is (college), and WHERE they're aiming (at least one
 * target company). Anything less produces a generic default roadmap, so we gate
 * /dashboard on this and route incomplete users into /onboarding.
 *
 * @param {{domain_slug?: string, college?: string, target_companies?: string[]}|null|undefined} user
 * @returns {boolean}
 */
export function isProfileComplete(user) {
  return !!(
    user &&
    user.domain_slug &&
    user.college &&
    Array.isArray(user.target_companies) &&
    user.target_companies.length > 0
  );
}
