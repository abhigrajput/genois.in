import { getAdminClient } from '@/lib/supabaseAdmin';
import { successResponse, errorResponse } from '@/lib/response';

// Public, unauthenticated profile. Opt-in only (users.profile_public) and
// deliberately thin: name, college, LinkedIn, GitHub, rank, streak. Everything
// the old version returned — email-adjacent identifiers, diagnostic score,
// domain, GitHub stats, placement CTC, skill tier — is off the public surface.
//
// TODO: name collisions possible; needs a slug column on users. Until then the
// first row matching the name wins.
const MISSING_COLUMN = new Set(['42703', 'PGRST204']);

export async function GET(request, context) {
  try {
    const { username } = await context.params;
    const supabase = getAdminClient();
    const decoded = decodeURIComponent(username || '').trim();
    if (!decoded) return notFound();

    // The URL form is the hyphenated name; the stored name has spaces.
    const spaced = decoded.replace(/-+/g, ' ');

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, college, linkedin_url, github_url, profile_public')
      .ilike('name', spaced)
      .eq('profile_public', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      if (MISSING_COLUMN.has(error.code)) {
        // Opt-in column not migrated yet — fail closed, never fall back to
        // serving profiles nobody consented to publish.
        console.warn('[public/profile] profile_public missing:', error.code);
        return notFound();
      }
      console.error('[public/profile] read failed:', error.code, error.message);
      return errorResponse('Internal server error', 500);
    }

    // Same 404 whether the user opted out or never existed — no enumeration.
    if (!user) return notFound();

    const [{ data: score }, { data: allScores }, { data: progress }] = await Promise.all([
      supabase.from('scores').select('total_score').eq('user_id', user.id).maybeSingle(),
      supabase.from('scores').select('total_score').order('total_score', { ascending: false }),
      supabase.from('progress').select('streak').eq('user_id', user.id).maybeSingle(),
    ]);

    // A rank only exists if this user actually has a score row. The previous
    // `findIndex(...) + 1 || 1` published anyone unscored as rank 1: findIndex
    // returns -1 when no row satisfies `<= 0`, and -1 + 1 = 0 is falsy, so the
    // `|| 1` fired. A brand-new account with zero activity was rendered as
    // "#1 Global Rank" under a "verified, not self-reported" badge.
    const scored = typeof score?.total_score === 'number';
    const myScore = score?.total_score ?? 0;
    const rank = scored
      ? (allScores || []).filter(s => s.total_score > myScore).length + 1
      : null;

    return successResponse({
      name: user.name,
      college: user.college,
      linkedinUrl: user.linkedin_url,
      githubUrl: user.github_url,
      rank,
      // Send the denominator too. Ranking first out of a handful of beta users
      // is not a global ranking, and the page should not imply that it is.
      rankTotal: scored ? (allScores || []).length : null,
      streak: progress?.streak || 0,
    });
  } catch (error) {
    console.error('[public/profile] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

function notFound() {
  return errorResponse('Profile not found', 404);
}
