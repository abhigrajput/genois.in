import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { curatedVideoForDay } from '@/lib/curatedVideos';

export const runtime = 'nodejs';

/**
 * Resolve a DSA topic to its curated video.
 *
 * WHAT THIS USED TO DO, AND WHY IT DOESN'T ANYMORE
 * ------------------------------------------------
 * It called the YouTube Data API for "<topic> DSA C++ tutorial", cached the
 * winner in a `video_cache` table for 30 days, and — when there was no
 * YOUTUBE_API_KEY, which is the case in this project — returned a
 * `results?search_query=` link. So in practice every DSA day handed the student
 * a search page and sent them off the site.
 *
 * Now the answer comes from lib/curatedVideos.js: static, hand-verified, and
 * the same for every student. That removes the API key dependency, the network
 * call, the 30-day cache table, and the search fallback in one go — a topic
 * either has a curated video or the page shows none.
 *
 * The route survives only because the DSA roadmap page already fetches it. It
 * is now a pure function over a static map; no DB read, no outbound request.
 */
export async function GET(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!await rateLimit(`dsa_video_${payload.userId}`, 60, 60000)) return rateLimitResponse();

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic || topic.length > 200) {
    return Response.json({ error: 'topic is required (max 200 chars)' }, { status: 400 });
  }

  // null when the topic is not curated — the client renders no video rather
  // than falling back to anything.
  return Response.json({ video: curatedVideoForDay(topic) });
}
