/**
 * Fetches the best matching DSA video for a topic from YouTube Data API v3.
 * Prefers Striver / takeUforward channel, falls back to first result.
 *
 * @param {string} topic  — e.g. "Binary Search", "Segment Tree"
 * @returns {string|null} — full YouTube watch URL or null on failure
 */
export async function fetchDSAVideo(topic) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[youtubeSearch] YOUTUBE_API_KEY not set');
    return null;
  }

  const query = encodeURIComponent(`${topic} DSA C++ tutorial`);

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=5&relevanceLanguage=en&key=${apiKey}`,
    { next: { revalidate: 2592000 } } // 30-day cache at fetch level
  );

  if (!res.ok) {
    console.error('[youtubeSearch] YouTube API error:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  // Prefer Striver / takeUforward / Abdul Bari
  const PREFERRED_CHANNELS = ['takeuforward', 'striver', 'abdul bari', 'apna college'];
  const preferred = data.items.find(item => {
    const ch = (item.snippet?.channelTitle || '').toLowerCase();
    return PREFERRED_CHANNELS.some(p => ch.includes(p));
  });

  const best = preferred || data.items[0];
  return `https://www.youtube.com/watch?v=${best.id.videoId}`;
}
