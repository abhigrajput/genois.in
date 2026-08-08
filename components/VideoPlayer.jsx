'use client';
/**
 * In-page video player — the only way GENOIS shows a video.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every "watch" task used to be a link to a YouTube *search* page opened in a
 * new tab. That is the worst of both worlds: the student leaves the product,
 * lands on a page of unvetted results, and has to pick a video themselves —
 * which is the one job the roadmap was supposed to do for them. A real user and
 * the founder both flagged it.
 *
 * So: the video plays HERE. `lib/curatedVideos.js` decides *which* video (a
 * hand-verified id per topic), and this component is the surface that plays it.
 *
 * RULES THIS COMPONENT ENFORCES
 * -----------------------------
 *   · Never `window.open`, never a `youtube.com/results?search_query=` URL.
 *   · Only `/embed/<id>` sources, which is the only YouTube URL shape that is
 *     actually frameable (watch/results/channel URLs send X-Frame-Options and
 *     render as "refused to connect").
 *   · No video → render NOTHING (or a plain caption). A missing video is a gap
 *     we own, not an excuse to bounce the student to a search page.
 *
 * WHEN A CURATED VIDEO DIES
 * -------------------------
 * Curation is verified at authoring time, but a video can be deleted, made
 * private, or have embedding switched off by its owner at any point afterwards.
 * When that happens YouTube still serves a document into the iframe — so the
 * frame "loads" successfully and `onError` never fires — and the student is
 * left staring at a black rectangle reading "Video unavailable". We detect that
 * and replace the player with a card that says what happened:
 *
 *   gone     the video no longer exists (deleted / private). No link out: the
 *            watch page is dead too, so a link would just move the dead end.
 *   blocked  the video exists but the owner forbids embedding. This is the ONE
 *            case that gets a "Watch on YouTube" link, because there the video
 *            really is watchable and we have nothing else to offer.
 *
 * Detection is deliberately belt-and-braces, because neither signal is complete:
 *   1. oEmbed, fetched once per id. Non-2xx means the video is gone; 401 means
 *      it exists but embedding is refused. Catches the case where the player
 *      never even reports an error.
 *   2. The player's own postMessage `onError` (100 gone, 101/150 embed-refused),
 *      which catches owner/region restrictions oEmbed answers 200 for.
 *
 * Both FAIL OPEN. A network error, an ad blocker, an offline student or a
 * service worker eating the request must never hide a video that works — this
 * session already saw a service worker silently break every cross-origin
 * request on the site, and a fail-closed check would have blanked all 68
 * videos on top of it. We only ever downgrade on a definite answer from YouTube.
 *
 * Two shapes, same iframe:
 *   <VideoPlayer video={entry} />            inline 16:9 player
 *   <VideoPlayer video={entry} asModal />    click a thumbnail → dialog
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { embedUrl, thumbnailUrl, watchUrl } from '@/lib/curatedVideos';

/** 'ok' | 'gone' | 'blocked', remembered per video id for the page's lifetime. */
const STATUS_CACHE = new Map();

/** YouTube player error codes → our states. 2 and 5 are player/parameter
 *  faults rather than availability facts, so they are ignored: guessing
 *  "unavailable" from them would hide working videos. */
function codeToStatus(code) {
  if (code === 100) return 'gone';
  if (code === 101 || code === 150) return 'blocked';
  return null;
}

/**
 * Availability of one video. Starts optimistic so the happy path paints a
 * player immediately and never waits on a round-trip; only a definite answer
 * from YouTube downgrades it.
 */
function useVideoStatus(id) {
  const [status, setStatus] = useState(() => (id && STATUS_CACHE.get(id)) || 'ok');

  useEffect(() => {
    if (!id) return;
    const known = STATUS_CACHE.get(id);
    if (known) { setStatus(known); return; }

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(
            `https://www.youtube.com/watch?v=${id}`
          )}&format=json`,
          { signal: ac.signal }
        );
        // 401: the video is there, the owner refuses embedding.
        // Any other non-2xx: deleted, private, or never existed.
        const next = res.ok ? 'ok' : res.status === 401 ? 'blocked' : 'gone';
        STATUS_CACHE.set(id, next);
        setStatus(next);
      } catch {
        // Aborted, offline, blocked by an extension — not evidence of anything.
        // Leave the player up; the postMessage listener is still watching.
      }
    })();
    return () => ac.abort();
  }, [id]);

  const report = useCallback((code) => {
    const next = codeToStatus(code);
    if (!next || !id) return;
    STATUS_CACHE.set(id, next);
    setStatus(next);
  }, [id]);

  return [status, report];
}

// `youtube-nocookie.com` is used by embedUrl(): same player, no ad-tracking
// cookie until the student actually presses play.
function Frame({ video, autoplay = false, onPlayerError }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);

  // The jsapi channel needs the page's own origin, which only exists in the
  // browser — so the src is built after mount rather than during render.
  useEffect(() => {
    setSrc(embedUrl(video, { autoplay, jsapi: true, origin: window.location.origin }));
  }, [video, autoplay]);

  useEffect(() => {
    if (!src) return;

    function onMessage(e) {
      if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin)) return;
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data?.event === 'onError') onPlayerError?.(data.info);
      else if (typeof data?.info?.errorCode === 'number') onPlayerError?.(data.info.errorCode);
    }
    window.addEventListener('message', onMessage);

    // The player only emits events after something subscribes. It can miss a
    // handshake sent before it finishes booting, so send a few and stop.
    let tries = 0;
    const handshake = setInterval(() => {
      ref.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 'gx-player', channel: 'widget' }),
        '*'
      );
      if (++tries >= 4) clearInterval(handshake);
    }, 700);

    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(handshake);
    };
  }, [src, onPlayerError]);

  return (
    <div
      style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        borderRadius: 'var(--gx-radius, 12px)',
        overflow: 'hidden',
        border: '1px solid var(--gx-border)',
        background: 'var(--gx-surface)',
      }}
    >
      {src && (
        <iframe
          ref={ref}
          src={src}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      )}
    </div>
  );
}

/**
 * Shown instead of a dead player. Says what happened in the student's terms,
 * and offers the one action that can still work — which for a deleted video is
 * no action at all, so we don't invent one.
 */
function Unavailable({ video, reason }) {
  const blocked = reason === 'blocked';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 8,
        aspectRatio: '16 / 9',
        padding: '18px 20px',
        borderRadius: 'var(--gx-radius, 12px)',
        border: '1px dashed var(--gx-border)',
        background: 'var(--gx-surface)',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 650, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gx-text-subtle)' }}>
        {blocked ? 'Cannot play here' : 'Video unavailable'}
      </span>
      <span style={{ fontSize: 14, fontWeight: 650, color: 'var(--gx-text)', lineHeight: 1.4 }}>
        {video.title}
      </span>
      <span style={{ fontSize: 13, color: 'var(--gx-text-muted)', lineHeight: 1.55, maxWidth: '52ch' }}>
        {blocked
          ? `${video.channel} does not allow this video to play outside YouTube. Everything else in today's plan still counts.`
          : `This video has been removed from YouTube since we picked it. We will swap in a replacement — everything else in today's plan still counts.`}
      </span>
      {blocked && (
        <a
          href={watchUrl(video)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 2,
            fontSize: 13,
            fontWeight: 650,
            color: 'var(--gx-accent)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Watch on YouTube ↗
        </a>
      )}
    </div>
  );
}

/** Attribution line. The channel is shown because the student is owed it. */
function Caption({ video }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
        fontSize: 12.5,
        color: 'var(--gx-text-muted)',
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontWeight: 650, color: 'var(--gx-text)' }}>{video.title}</span>
      <span style={{ color: 'var(--gx-text-subtle)' }}>· {video.channel}</span>
    </div>
  );
}

/**
 * Poster + play button. Used by the modal variant so a page with several topics
 * does not boot several YouTube players on load.
 *
 * A failed thumbnail is NOT treated as a dead video: an ad blocker or a broken
 * service worker can kill i.ytimg.com while the player itself is perfectly
 * fine. It falls back to a plain tile so the student still gets a play button
 * instead of a broken-image glyph.
 */
function Poster({ video, onPlay }) {
  const [thumbBroken, setThumbBroken] = useState(false);

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play: ${video.title}`}
      style={{
        display: 'block',
        width: '100%',
        padding: 0,
        border: '1px solid var(--gx-border)',
        borderRadius: 'var(--gx-radius, 12px)',
        overflow: 'hidden',
        background: 'var(--gx-surface)',
        cursor: 'pointer',
        position: 'relative',
        lineHeight: 0,
      }}
    >
      {thumbBroken ? (
        <span style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', background: 'var(--gx-surface-2, var(--gx-surface))' }} />
      ) : (
        <img
          src={thumbnailUrl(video)}
          alt=""
          loading="lazy"
          onError={() => setThumbBroken(true)}
          style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
        />
      )}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--gx-accent)',
          color: 'var(--gx-text-inverse)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 20,
          boxShadow: 'var(--gx-shadow-md, 0 4px 16px rgba(0,0,0,.18))',
        }}
      >
        ▶
      </span>
    </button>
  );
}

function Modal({ video, onClose, onPlayerError }) {
  const closeRef = useRef(null);

  // Esc to close, and the page behind must not scroll under the dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'color-mix(in srgb, var(--gx-text) 45%, transparent)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="gx-card"
        style={{ width: 'min(880px, 100%)', padding: 16, background: 'var(--gx-bg)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="gx-section-label">Watching</span>
          <button
            ref={closeRef}
            className="gx-btn gx-btn--ghost gx-btn--sm"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            Close ✕
          </button>
        </div>
        <Frame video={video} autoplay onPlayerError={onPlayerError} />
        <Caption video={video} />
      </div>
    </div>
  );
}

/**
 * @param {object|null} video    entry from lib/curatedVideos (null → renders `empty`)
 * @param {boolean} asModal      thumbnail that opens a dialog, instead of inline
 * @param {React.ReactNode} empty  what to show when there is no curated video
 * @param {() => void} onPlay     fired the first time the student starts it
 */
export default function VideoPlayer({ video, asModal = false, empty = null, onPlay }) {
  const [open, setOpen] = useState(false);
  const [status, reportError] = useVideoStatus(video?.id || null);

  // No curated video for this topic. We show nothing rather than inventing a
  // link — see the header note.
  if (!video) return empty;

  // Curated, but no longer playable. Say so plainly instead of handing the
  // student a black rectangle. Applies to both shapes: there is no point
  // opening a dialog onto a dead player.
  if (status !== 'ok') return <Unavailable video={video} reason={status} />;

  function start() {
    setOpen(true);
    onPlay?.();
  }

  if (asModal) {
    return (
      <div>
        <Poster video={video} onPlay={start} />
        <Caption video={video} />
        {open && <Modal video={video} onClose={() => setOpen(false)} onPlayerError={reportError} />}
      </div>
    );
  }

  return (
    <div>
      <Frame video={video} onPlayerError={reportError} />
      <Caption video={video} />
    </div>
  );
}
