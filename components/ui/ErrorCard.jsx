'use client';

/**
 * Shared dead-end recovery card. One surface for every async failure — a
 * failed dashboard load, a timed-out AI generation, an empty result — always
 * with a way forward. Extracted from the aptitude page so other pages stop
 * re-implementing (or skipping) it.
 */
export default function ErrorCard({ icon = '⚠️', title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div style={{ maxWidth: 560, margin: '40px auto 0', fontFamily: 'var(--font-body)' }}>
      <div style={{ background: '#070f1f', border: '1px solid rgba(239,159,39,0.28)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: '#e8e8ed', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {primaryLabel && (
            <button onClick={onPrimary} style={{ flex: 1, minWidth: 160, padding: 13, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00d9a3,#ff6b4a)', color: '#020812', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>{primaryLabel}</button>
          )}
          {secondaryLabel && (
            <button onClick={onSecondary} style={{ flex: 1, minWidth: 160, padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', background: 'transparent', color: '#c8d8e8', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{secondaryLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Map a caught fetch error to the ACTUAL failure reason a user can act on,
 * instead of a generic "something went wrong".
 *   - timeout (apiFetchWithTimeout)  → "taking too long / AI busy"
 *   - network (fetch TypeError)      → "couldn't reach the server"
 *   - server-sent message            → shown as-is
 */
export function friendlyError(e, context = 'load this') {
  if (e?.timedOut) {
    return `The server is taking too long to ${context} — the AI may be busy. Retry in a moment.`;
  }
  if (e instanceof TypeError || /fetch|network/i.test(e?.message || '')) {
    return `Couldn't reach the server — check your internet connection and retry.`;
  }
  if (e?.message === 'Not logged in') {
    return 'Your session expired — log in again to continue.';
  }
  return e?.message || `Failed to ${context}. Retry in a moment.`;
}
