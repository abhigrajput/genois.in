import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getMentorEvidence } from '@/lib/mentorEvidence';
import { getJourneySignals, deriveMentorFocus } from '@/lib/mentorJourney';

export const dynamic = 'force-dynamic';

/**
 * Feature D — the mentor's PROACTIVE nudge: "what to focus on now".
 *
 * NO MODEL RUNS HERE. The focus is derived in lib/mentorJourney.js from four
 * real reads — skill evidence, placement readiness, the pattern roadmap, the
 * build tracker and the application tracker — and every string it returns is
 * assembled from values that came out of those reads. That is deliberate: this
 * is the one surface that speaks before the student asks anything, so it is the
 * one place a fabricated number would never be challenged. There is no code
 * path from this endpoint to an LLM, which makes "the nudge cannot be invented"
 * a property of the architecture rather than a prompt instruction.
 *
 * It also means the endpoint is free to call, so it needs no daily cache the
 * way /api/mentor/insight does — and unlike that cache, this reflects an action
 * the student took two minutes ago.
 *
 * SCOPING. Every read is filtered by `payload.userId` from the verified token.
 * The domain is read from the users table, never accepted from the client.
 */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`mentor_focus_${payload.userId}`, 30, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();

    // The users row is the only thing both signal loaders need up front, and
    // getMentorEvidence takes it by injection rather than re-reading it.
    const { data: user } = await supabase
      .from('users')
      .select('domain_slug, level, target_companies, weak_subjects, months_to_placement')
      .eq('id', payload.userId)
      .maybeSingle();

    const { data: progress } = await supabase
      .from('progress')
      .select('current_day')
      .eq('user_id', payload.userId)
      .maybeSingle();

    const [ev, journey] = await Promise.all([
      getMentorEvidence(payload.userId, {
        user: user || undefined,
        currentDay: progress?.current_day || 1,
      }).catch((e) => {
        console.warn('[mentor/focus] evidence unavailable:', e.message);
        return null;
      }),
      getJourneySignals(payload.userId, { domain: user?.domain_slug }).catch((e) => {
        console.warn('[mentor/focus] journey signals unavailable:', e.message);
        return null;
      }),
    ]);

    const focus = deriveMentorFocus({ ev, journey });

    // A compact, already-grounded summary for the card. Only fields that came
    // from a read are exposed — the client cannot compute anything new from it.
    const signals = {
      evidence: ev?.available
        ? {
            hasAnyEvidence: !!ev.hasAnyEvidence,
            questionsScanned: ev.questionsScanned,
            weakest: ev.weakest.slice(0, 3).map(s => ({
              label: s.label, accuracy: s.accuracy, correct: s.correct, total: s.total,
            })),
          }
        : null,
      readiness: ev?.readiness?.available
        ? {
            hasTargets: !!ev.readiness.hasTargets,
            companies: (ev.readiness.companies || []).slice(0, 3).map(c => ({
              company: c.company, scored: !!c.scored, overall: c.overall ?? null,
            })),
          }
        : null,
      pattern: ev?.pattern
        ? {
            name: ev.pattern.name,
            state: ev.pattern.state,
            mastered: ev.pattern.mastered,
            patternsTotal: ev.pattern.patternsTotal,
          }
        : null,
      projects: journey?.projects?.available
        ? {
            available: true,
            startedCount: journey.projects.startedCount,
            completedCount: journey.projects.completedCount,
            catalogSize: journey.projects.catalogSize,
            current: journey.projects.current
              ? {
                  title: journey.projects.current.title,
                  phasesDone: journey.projects.current.phasesDone,
                  phaseCount: journey.projects.current.phaseCount,
                  daysSinceUpdate: journey.projects.current.daysSinceUpdate,
                }
              : null,
          }
        : { available: false, reason: journey?.projects?.reason || 'unavailable' },
      applications: journey?.applications?.available
        ? {
            available: true,
            total: journey.applications.total,
            byStage: journey.applications.byStage,
            lastAppliedOn: journey.applications.lastAppliedOn,
            daysSinceLast: journey.applications.daysSinceLast,
          }
        : { available: false, reason: journey?.applications?.reason || 'unavailable' },
    };

    return successResponse({ focus, signals });
  } catch (error) {
    console.error('[mentor/focus] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
