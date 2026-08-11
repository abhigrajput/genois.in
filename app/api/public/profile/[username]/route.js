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

    const myScore = score?.total_score || 0;
    const rank = (allScores || []).findIndex(s => s.total_score <= myScore) + 1 || 1;

    return successResponse({
      name: user.name,
      college: user.college,
      linkedinUrl: user.linkedin_url,
      githubUrl: user.github_url,
      rank,
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
