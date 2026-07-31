import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getSkillEvidence, getSkillStrengths } from '@/lib/skillEvidence';
import { TAXONOMY_STATS, SKILL_DOMAINS, SKILLS } from '@/lib/skillTaxonomy';

export const dynamic = 'force-dynamic';

/**
 * Evidence bus — debug read. JSON only, no UI, scoped to the signed-in user.
 *
 * GET /api/evidence/skills                  → aggregate by skill tag
 * GET /api/evidence/skills?debug=1          → + taxonomy stats and unclassified topics
 * GET /api/evidence/skills?strengths=1      → weakest/strongest slice (min 3 questions)
 * GET /api/evidence/skills?taxonomy=1       → dump the controlled vocabulary itself
 * GET /api/evidence/skills?types=aptitude,daily  → restrict to those attempt_types
 * GET /api/evidence/skills?minEvidence=3    → drop skills with thinner evidence
 *
 * Degrades to `available: false` (never 500) when test_questions or the
 * 20260731 skill columns are missing.
 */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === '1';

    if (searchParams.get('taxonomy') === '1') {
      return successResponse({
        stats: TAXONOMY_STATS,
        domains: SKILL_DOMAINS,
        skills: SKILLS.map(({ id, label, domain, group }) => ({ id, label, domain, group })),
      });
    }

    const types = searchParams.get('types');
    const opts = {
      attemptTypes: types ? types.split(',').map(t => t.trim()).filter(Boolean) : null,
      since: searchParams.get('since') || null,
      minEvidence: Math.max(1, parseInt(searchParams.get('minEvidence') || '1', 10) || 1),
    };

    if (searchParams.get('strengths') === '1') {
      return successResponse(await getSkillStrengths(payload.userId, {
        ...opts,
        minEvidence: Math.max(opts.minEvidence, 3),
      }));
    }

    const evidence = await getSkillEvidence(payload.userId, opts);

    if (!debug) {
      // Lean shape — what readiness will actually consume. The unclassified
      // bucket is a taxonomy-maintenance signal, not evidence, so it stays
      // behind ?debug=1.
      const lean = { ...evidence };
      delete lean.unclassified;
      return successResponse(lean);
    }

    return successResponse({
      ...evidence,
      _debug: {
        taxonomy: TAXONOMY_STATS,
        // Non-empty means the vocabulary is missing aliases for real topic
        // strings the generators are producing — add them to lib/skillTaxonomy.js.
        unclassifiedTopics: evidence.unclassified.sampleTopics,
        unclassifiedQuestions: evidence.unclassified.total,
        note: evidence.available
          ? 'Rows written before the evidence bus carry no skill tag; their topics are resolved at read time.'
          : 'test_questions is unreachable — the 20260715 migration is not applied on this database.',
      },
    });
  } catch (error) {
    console.error('[evidence/skills] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
