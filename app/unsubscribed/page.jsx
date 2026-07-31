/**
 * Confirmation page for /api/email/unsubscribe.
 *
 * Every state here reports what actually happened in the database. There is no
 * generic "you're unsubscribed" fallback, because a confirmation the backend
 * did not earn is worse than an error message — the user walks away believing
 * the mail has stopped.
 *
 * Styling follows /privacy: plain inline styles on the existing font variables,
 * no design-system imports.
 */

export const metadata = {
  title: 'Email preferences · GENOIS',
  robots: { index: false, follow: false },
};

const STATES = {
  ok: {
    heading: 'You are unsubscribed',
    tone: 'var(--gx-accent)',
    body: 'You will no longer receive weekly digests, trial reminders or streak nudges from GENOIS.',
    note: 'Account emails — verifying your address and resetting your password — will still be sent. Those are required to keep your account usable and cannot be turned off.',
  },
  resubscribed: {
    heading: 'You are subscribed again',
    tone: 'var(--gx-accent)',
    body: 'Weekly digests, trial reminders and streak nudges will resume.',
    note: 'You can unsubscribe again from the footer of any of those emails, or from Settings → Notifications.',
  },
  invalid: {
    heading: 'This link is not valid',
    tone: 'var(--gx-warning)',
    body: 'The unsubscribe link was incomplete or has been altered, so we could not tell which account it belongs to. Nothing has been changed.',
    note: 'Open the most recent GENOIS email and use the unsubscribe link in its footer, or turn email off in Settings → Notifications. If neither works, email support@genois.in and we will do it by hand.',
  },
  error: {
    heading: 'We could not unsubscribe you',
    tone: 'var(--gx-danger)',
    body: 'Your link was valid, but saving the change failed. You are still subscribed — we would rather say so than show a confirmation we cannot back up.',
    note: 'Please try the link again in a few minutes. If it keeps failing, email support@genois.in and we will unsubscribe you manually.',
  },
};

export default async function UnsubscribedPage({ searchParams }) {
  const params = await searchParams;
  const status = typeof params?.status === 'string' ? params.status : 'invalid';
  const token  = typeof params?.token === 'string' ? params.token : null;
  const state  = STATES[status] || STATES.invalid;

  // Undo is only offered where it is meaningful: after a state actually changed.
  const undo = token && (status === 'ok' || status === 'resubscribed')
    ? {
        href: `/api/email/unsubscribe?token=${encodeURIComponent(token)}${status === 'ok' ? '&action=resubscribe' : ''}`,
        label: status === 'ok' ? 'Undo — keep sending me these emails' : 'Unsubscribe again',
      }
    : null;

  return (
    <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 20px', fontFamily: 'var(--font-body)', color: 'var(--gx-text)' }}>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        <span style={{ color: 'var(--gx-accent)' }}>GEN</span><span>OIS</span>
      </div>
      <div style={{ height: 2, background: state.tone, marginBottom: 32 }} />

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: state.tone, marginBottom: 16 }}>
        {state.heading}
      </h1>
      <p style={{ color: 'var(--gx-text-muted)', lineHeight: 1.8, fontSize: 15, marginBottom: 20 }}>{state.body}</p>
      <p style={{ color: 'var(--gx-text-muted)', lineHeight: 1.8, fontSize: 13, marginBottom: 32 }}>{state.note}</p>

      {undo && (
        <p style={{ marginBottom: 24 }}>
          <a href={undo.href} style={{ color: 'var(--gx-text-muted)', fontSize: 13, textDecoration: 'underline' }}>{undo.label}</a>
        </p>
      )}

      <a
        href="/dashboard"
        style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: 10, fontWeight: 800, fontSize: 14,
          background: 'var(--gx-accent)', color: 'var(--gx-text-inverse)', textDecoration: 'none',
        }}
      >
        Back to GENOIS
      </a>
    </div>
  );
}
