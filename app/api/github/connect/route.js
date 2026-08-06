import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const { githubUsername } = await request.json();
    if (!githubUsername) return errorResponse('GitHub username required', 400);

    const cleanUsername = githubUsername.trim().replace('@', '');

    const profileRes = await fetch(`https://api.github.com/users/${cleanUsername}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GENOIS-App',
      },
    });

    if (!profileRes.ok) {
      return errorResponse('GitHub username not found. Check spelling.', 404);
    }

    const profile = await profileRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${cleanUsername}/repos?per_page=100&sort=updated`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GENOIS-App',
      },
    });

    const repos = reposRes.ok ? await reposRes.json() : [];

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 10);

    const eventsRes = await fetch(`https://api.github.com/users/${cleanUsername}/events/public?per_page=100`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GENOIS-App',
      },
    });

    const events = eventsRes.ok ? await eventsRes.json() : [];
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    const recentCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);

    const supabase = getAdminClient();
    const { error: writeErr } = await supabase.from('users').update({
      github_username: cleanUsername,
      github_url: profile.html_url,
      github_connected: true,
      github_repos: profile.public_repos || 0,
      github_stars: totalStars,
      github_commits: recentCommits,
      github_languages: languages,
      github_last_synced: new Date().toISOString(),
    }).eq('id', payload.userId);
    if (writeErr) console.error('DB write failed: users.update', { code: writeErr.code, message: writeErr.message, details: writeErr.details });

    return successResponse({
      username: cleanUsername,
      url: profile.html_url,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      repos: profile.public_repos || 0,
      followers: profile.followers || 0,
      stars: totalStars,
      commits: recentCommits,
      languages,
      name: profile.name,
    });
  } catch (error) {
    return errorResponse('Internal server error', 500);
  }
}
