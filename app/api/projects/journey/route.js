import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { successResponse, errorResponse } from '@/lib/response';
import { isMissingTable } from '@/lib/applicationRecords';
import { buildJourney, journeyKeys } from '@/lib/projectJourney';
import { inferLevel } from '@/lib/projectLevels';

export const dynamic = 'force-dynamic';

/**
 * Feature C — the guided build path for /projects, plus this student's
 * per-phase progress on it.
 *
 * WHY THE ENRICHMENT HAPPENS HERE AND NOT IN THE PAGE
 * ---------------------------------------------------
 * The phases, skill chips and time estimates could all be derived in the
 * browser — but resolving the per-phase study sheet needs lib/studySheets,
 * which carries every curated sheet body. Shipping that to a page that only
 * wants sheet ids and titles would cost the student hundreds of KB for nothing.
 * So the catalog prose stays client-side (the page already imports
 * lib/projectTemplates for the existing timeline) and the enrichment comes from
 * here, keyed by the phase index the two agree on.
 *
 * SCOPING. Every row read or written belongs to exactly one user. The filter is
 * `user_id = payload.userId` from the verified token, never from the body or a
 * query parameter, and writes hard-assign the same value — a body carrying its
 * own `user_id` is ignored rather than honoured. The DOMAIN is read from the
 * users table too, not accepted from the client, so a caller cannot widen the
 * write allowlist by claiming a domain whose catalog they are not on.
 */

/**
 * Which catalog the student is on. Authoritative, and read on writes too — the
 * domain is what bounds the set of project keys they may write, so taking it
 * from the request would let a caller widen their own allowlist.
 */
async function readDomain(supabase, userId) {
  const { data } = await supabase.from('users').select('domain_slug').eq('id', userId).maybeSingle();
  return data?.domain_slug || 'fullstack';
}

/** The two signals inferLevel() uses. Read-path only. */
async function readLevelSignals(supabase, userId) {
  const [diagnostic, identity, reviewed] = await Promise.all([
    supabase.from('diagnostic_tests').select('skill_level').eq('user_id', userId).maybeSingle(),
    supabase.from('skill_identity').select('skill_level').eq('user_id', userId).maybeSingle(),
    supabase.from('project_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'reviewed'),
  ]);

  return {
    // The diagnostic is the more direct measurement, so it wins; skill_identity
    // is the aggregate and only fills in when no diagnostic has been taken.
    skillLevel: diagnostic.data?.skill_level || identity.data?.skill_level || null,
    reviewedProjects: reviewed.count || 0,
  };
}

/** DB row → API shape, with phase indexes the catalog no longer has dropped. */
function serializeProgress(row, phaseCount) {
  const raw = Array.isArray(row?.completed_phases) ? row.completed_phases : [];
  const completed = [...new Set(
    raw.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < phaseCount),
  )].sort((a, b) => a - b);
  return { completedPhases: completed, completedAt: row?.completed_at || null };
}

/** GET /api/projects/journey — the build path + where this student is on it. */
export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`project_journey_read_${payload.userId}`, 60, 60000)) return rateLimitResponse();

    const supabase = getAdminClient();
    const [domain, { skillLevel, reviewedProjects }] = await Promise.all([
      readDomain(supabase, payload.userId),
      readLevelSignals(supabase, payload.userId),
    ]);

    const journey = buildJourney(domain);

    const { data, error } = await supabase
      .from('project_phase_progress')
      .select('project_key, completed_phases, completed_at')
      .eq('user_id', payload.userId);

    // A missing table means the migration has not run here. Returning an empty
    // board would look identical to "this student has not started anything", so
    // the UI is told which one it is and disables the checkboxes.
    let trackingAvailable = true;
    let reason = null;
    if (error) {
      console.warn('[projects/journey] read failed:', error.code, error.message);
      trackingAvailable = false;
      reason = isMissingTable(error) ? 'not_migrated' : 'unavailable';
    }

    const byKey = new Map((data || []).map(r => [r.project_key, r]));

    return successResponse({
      domain,
      trackingAvailable,
      reason,
      inferred: inferLevel({ skillLevel, reviewedProjects }),
      projects: journey.map(p => ({ ...p, ...serializeProgress(byKey.get(p.key), p.phaseCount) })),
    });
  } catch (error) {
    console.error('[projects/journey] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

const MIGRATION_HINT =
  'Build tracking isn\'t set up on this environment yet — the 20260810 migration hasn\'t been applied.';

/** POST /api/projects/journey — tick or untick one phase of one project. */
export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);
    if (!await rateLimit(`project_journey_write_${payload.userId}`, 60, 60000)) return rateLimitResponse();

    let body;
    try { body = await request.json(); } catch { return errorResponse('Invalid JSON', 400); }

    const supabase = getAdminClient();
    const domain = await readDomain(supabase, payload.userId);

    // The allowlist: only the catalog of the student's OWN domain, and only a
    // phase index that project actually has.
    const phaseCount = journeyKeys(domain).get(body?.projectKey);
    if (!phaseCount) return errorResponse('Unknown project', 400);

    const phaseIndex = Number(body?.phaseIndex);
    if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= phaseCount) {
      return errorResponse('Invalid phase', 400);
    }
    const done = body?.done !== false;

    const { data: existing, error: readErr } = await supabase
      .from('project_phase_progress')
      .select('completed_phases, completed_at')
      .eq('user_id', payload.userId)
      .eq('project_key', body.projectKey)
      .maybeSingle();

    if (readErr && isMissingTable(readErr)) return errorResponse(MIGRATION_HINT, 503);
    if (readErr) {
      console.error('DB read failed: project_phase_progress.select', { code: readErr.code, message: readErr.message });
      return errorResponse('Could not load your build progress', 500);
    }

    // Whole-set rewrite, never an append — a double-click cannot duplicate.
    const current = new Set(serializeProgress(existing, phaseCount).completedPhases);
    if (done) current.add(phaseIndex); else current.delete(phaseIndex);
    const completedPhases = [...current].sort((a, b) => a - b);

    // Stamped once, on the first completion, and never cleared: unticking a
    // phase later to revisit it does not un-happen finishing the build.
    const completedAt = existing?.completed_at
      || (completedPhases.length === phaseCount ? new Date().toISOString() : null);

    const { data, error } = await supabase
      .from('project_phase_progress')
      .upsert({
        user_id: payload.userId,   // from the verified token, never from the body
        project_key: body.projectKey,
        completed_phases: completedPhases,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,project_key' })
      .select('project_key, completed_phases, completed_at')
      .single();

    if (error) {
      console.error('DB write failed: project_phase_progress.upsert', { code: error.code, message: error.message, details: error.details });
      if (isMissingTable(error)) return errorResponse(MIGRATION_HINT, 503);
      return errorResponse('Could not save your build progress', 500);
    }

    return successResponse({
      projectKey: data.project_key,
      ...serializeProgress(data, phaseCount),
      phaseCount,
    });
  } catch (error) {
    console.error('[projects/journey] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
