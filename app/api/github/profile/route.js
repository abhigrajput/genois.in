import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request) {
  try {
    const payload = await getUserFromRequest(request);
    if (!payload) return errorResponse('Unauthorized', 401);

    const supabase = getAdminClient();
    const { data: user } = await supabase
      .from('users')
      .select('github_username, github_url, github_connected, github_repos, github_stars, github_commits, github_languages, github_last_synced')
      .eq('id', payload.userId)
      .single();

    if (!user?.github_connected) {
      return successResponse({ connected: false });
    }

    const reposRes = await fetch(`https://api.github.com/users/${user.github_username}/repos?per_page=6&sort=updated`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GENOIS-App' },
    });

    const repos = reposRes.ok ? await reposRes.json() : [];

    return successResponse({
      connected: true,
      username: user.github_username,
      url: user.github_url,
      repos: user.github_repos,
      stars: user.github_stars,
      commits: user.github_commits,
      languages: user.github_languages || [],
      lastSynced: user.github_last_synced,
      recentRepos: repos.slice(0, 6).map(r => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.updated_at,
      })),
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
