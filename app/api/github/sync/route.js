import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('github_username')
      .eq('id', payload.userId)
      .single();

    if (!user?.github_username) return errorResponse('GitHub not connected', 400);

    const username = user.github_username;

    const [profileRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GENOIS-App' },
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GENOIS-App' },
      }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GENOIS-App' },
      }),
    ]);

    const profile = profileRes.ok ? await profileRes.json() : {};
    const repos = reposRes.ok ? await reposRes.json() : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 10);
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    const recentCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);

    await supabase.from('users').update({
      github_repos: profile.public_repos || 0,
      github_stars: totalStars,
      github_commits: recentCommits,
      github_languages: languages,
      github_last_synced: new Date().toISOString(),
    }).eq('id', payload.userId);

    return successResponse({
      repos: profile.public_repos || 0,
      stars: totalStars,
      commits: recentCommits,
      languages,
      synced: true,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
