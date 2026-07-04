// Shared YouTube URL helpers.
//
// YouTube refuses to be framed from watch / results / channel URLs (it serves
// them with `X-Frame-Options`, which the browser surfaces as
// "www.youtube.com refused to connect"). Any URL that ends up in an <iframe>
// MUST first be converted to its `/embed/<id>` form. Keep this the single
// source of truth so the two render sites (dashboard + daily roadmap) can never
// drift apart again.

const ID_PATTERNS = [
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  /youtu\.be\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
];

// Extract the 11-char video id from any common YouTube URL shape.
// Returns null for channel/playlist/search URLs (which are NOT embeddable).
export function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  for (const p of ID_PATTERNS) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Convert any YouTube URL into a frameable embed URL.
// Returns null when the URL has no embeddable video id — callers should fall
// back to a plain "Watch on YouTube" link in that case.
export function toEmbedUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}
