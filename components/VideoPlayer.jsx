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
 * Two shapes, same iframe:
 *   <VideoPlayer video={entry} />            inline 16:9 player
 *   <VideoPlayer video={entry} asModal />    click a thumbnail → dialog
 */
import { useEffect, useRef, useState } from 'react';
import { embedUrl, thumbnailUrl } from '@/lib/curatedVideos';

// `youtube-nocookie.com` is used by embedUrl(): same player, no ad-tracking
// cookie until the student actually presses play.
function Frame({ video, autoplay = false }) {
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
      <iframe
        src={embedUrl(video, { autoplay })}
        title={video.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
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
 */
function Poster({ video, onPlay }) {
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
      <img
        src={thumbnailUrl(video)}
        alt=""
        loading="lazy"
        style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
      />
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

function Modal({ video, onClose }) {
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
        <Frame video={video} autoplay />
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

  // No curated video for this topic. We show nothing rather than inventing a
  // link — see the header note.
  if (!video) return empty;

  function start() {
    setOpen(true);
    onPlay?.();
  }

  if (asModal) {
    return (
      <div>
        <Poster video={video} onPlay={start} />
        <Caption video={video} />
        {open && <Modal video={video} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div>
      <Frame video={video} />
      <Caption video={video} />
    </div>
  );
}
