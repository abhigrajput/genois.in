import { fetchDSAVideo } from '@/lib/youtubeSearch';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!await rateLimit(`dsa_video_${payload.userId}`, 20, 60000)) return rateLimitResponse();

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');

  if (!topic || topic.length > 200) {
    return Response.json({ error: 'topic is required (max 200 chars)' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // --- 1. Check 30-day Supabase cache ---
  const { data: cached, error: cacheErr } = await supabase
    .from('video_cache')
    .select('video_url, updated_at')
    .eq('topic', topic)
    .single();

  if (!cacheErr && cached?.video_url) {
    const ageMs = Date.now() - new Date(cached.updated_at).getTime();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (ageMs < THIRTY_DAYS_MS) {
      return Response.json({ url: cached.video_url, cached: true });
    }
  }

  // --- 2. Fetch fresh from YouTube ---
  const url = await fetchDSAVideo(topic);
  if (!url) {
    return Response.json({ error: 'No video found for this topic' }, { status: 404 });
  }

  // --- 3. Upsert into cache ---
  await supabase.from('video_cache').upsert(
    { topic, video_url: url, updated_at: new Date().toISOString() },
    { onConflict: 'topic' }
  );

  return Response.json({ url, cached: false });
}
