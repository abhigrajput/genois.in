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
      <div style={{ background: 'var(--gx-bg)', border: '1px solid var(--gx-warning-border)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'var(--gx-text)', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'var(--gx-text)', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {primaryLabel && (
            <button onClick={onPrimary} style={{ flex: 1, minWidth: 160, padding: 13, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>{primaryLabel}</button>
          )}
          {secondaryLabel && (
            <button onClick={onSecondary} style={{ flex: 1, minWidth: 160, padding: 13, borderRadius: 12, border: '1px solid var(--gx-border)', cursor: 'pointer', background: 'transparent', color: 'var(--gx-text)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{secondaryLabel}</button>
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
