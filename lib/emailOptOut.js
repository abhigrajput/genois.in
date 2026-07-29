/**
 * lib/emailOptOut.js
 * Unsubscribe tokens + opt-out enforcement for NON-TRANSACTIONAL email.
 *
 * ── What this governs ──────────────────────────────────────────────────────
 * Marketing / digest / nudge mail ONLY:
 *   weekly digest, trial reminders, streak-break nudges, daily digest,
 *   motivational notification emails.
 *
 * It is deliberately NOT consulted for signup verification, email
 * re-verification or password reset. Those are required account mail — an
 * opted-out user must still be able to verify their address and reset their
 * password, and they carry no unsubscribe link.
 *
 * ── Backing column ─────────────────────────────────────────────────────────
 * public.users.email_opted_out, added by
 * supabase/migrations/20260729_email_opt_out.sql, which as of writing has NOT
 * been applied. Everything here degrades gracefully until it is — see
 * loadOptOutSet's `status` contract below.
 */

import crypto from 'crypto';

// PostgREST's code for "column does not exist". This is what every read here
// gets back until the migration runs.
const UNDEFINED_COLUMN = '42703';

/**
 * The signing secret. EMAIL_UNSUBSCRIBE_SECRET is preferred but optional —
 * falling back to JWT_SECRET means production needs no new env var, since
 * JWT_SECRET is already set there.
 *
 * Returns null when neither is set (local dev has both empty). A null secret
 * means no token can be produced, so no unsubscribe link is rendered — better
 * a missing link than a dead one that always reports an invalid token.
 */
function getSecret() {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || '';
  return secret.length > 0 ? secret : null;
}

function appUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://www.genois.in';
  return raw.trim().replace(/\/+$/, '');
}

const b64url    = buf => Buffer.from(buf).toString('base64url');
const unb64url  = str => Buffer.from(str, 'base64url').toString('utf8');

// Namespaced so a signature minted here can never be replayed against another
// HMAC that happens to share JWT_SECRET.
const sign = (secret, userId) =>
  crypto.createHmac('sha256', secret).update(`unsubscribe:v1:${userId}`).digest();

/**
 * Mint an unsubscribe token for a user. Format: `v1.<b64url(id)>.<b64url(sig)>`
 *
 * The id travels inside the token but the signature is what authorises the
 * write, so editing the id to a stranger's invalidates the token — one user
 * cannot unsubscribe another. Tokens deliberately never expire: an unsubscribe
 * link has to keep working in an inbox years later.
 *
 * Returns null when no secret is configured.
 */
export function signUnsubscribeToken(userId) {
  const secret = getSecret();
  if (!secret || !userId) return null;
  const id = String(userId);
  return `v1.${b64url(id)}.${b64url(sign(secret, id))}`;
}

/**
 * Verify a token and return the user id it authorises, or null.
 * Constant-time comparison, so a near-miss signature leaks nothing.
 */
export function verifyUnsubscribeToken(token) {
  const secret = getSecret();
  if (!secret || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;

  try {
    const id       = unb64url(parts[1]);
    const provided = Buffer.from(parts[2], 'base64url');
    const expected = sign(secret, id);
    // timingSafeEqual throws on a length mismatch — check first.
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(provided, expected)) return null;
    return id || null;
  } catch {
    return null;
  }
}

/** Absolute unsubscribe URL for a user, or null when unsignable. */
export function unsubscribeUrl(userId) {
  const token = signUnsubscribeToken(userId);
  return token ? `${appUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}` : null;
}

/**
 * Footer markup for a non-transactional email. Returns '' when no token can be
 * minted, so a template can interpolate this unconditionally and simply render
 * nothing rather than a broken link.
 */
export function unsubscribeFooterHtml(userId) {
  const url = unsubscribeUrl(userId);
  if (!url) return '';
  return `<div style="margin-top:16px;color:#3a4a5a;font-size:11px;line-height:1.6;text-align:center;">`
    + `You are receiving this because you have a GENOIS account.<br>`
    + `<a href="${url}" style="color:#5a7a9a;text-decoration:underline;">Unsubscribe from these emails</a>`
    + ` · Account emails like password resets will still be sent.`
    + `</div>`;
}

/**
 * RFC 8058 one-click unsubscribe headers. Gmail and Outlook surface these as a
 * native "Unsubscribe" control next to the sender name, and bulk senders are
 * expected to honour them. The POST target is handled by the same route.
 *
 * Returns {} when unsignable, which spreads into a Resend payload harmlessly.
 */
export function unsubscribeHeaders(userId) {
  const url = unsubscribeUrl(userId);
  if (!url) return {};
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/**
 * Load the set of opted-out user ids.
 *
 * `userIds` optionally scopes the query to a specific batch; omit it to load
 * every opt-out.
 *
 * Returns { ids, status } where status is:
 *   'ok'     — read succeeded, `ids` is authoritative.
 *   'absent' — users.email_opted_out does not exist yet (migration not run).
 *              `ids` is empty and callers SHOULD send: no opt-out can have
 *              been recorded, so this exactly reproduces today's behaviour.
 *   'error'  — the read failed for any other reason. `ids` is empty but callers
 *              MUST NOT send, because an opt-out may exist and be invisible.
 *              Skipping one digest run is recoverable; mailing someone who
 *              unsubscribed is not.
 */
export async function loadOptOutSet(supabase, userIds = null) {
  try {
    let query = supabase.from('users').select('id').eq('email_opted_out', true);
    if (Array.isArray(userIds)) {
      if (userIds.length === 0) return { ids: new Set(), status: 'ok' };
      query = query.in('id', userIds);
    }
    const { data, error } = await query;

    if (error) {
      if (error.code === UNDEFINED_COLUMN) {
        console.warn('[emailOptOut] users.email_opted_out missing — migration 20260729_email_opt_out.sql not applied; treating all users as opted in.');
        return { ids: new Set(), status: 'absent' };
      }
      console.error(`[emailOptOut] opt-out read failed: ${error.message}${error.code ? ` (${error.code})` : ''}`);
      return { ids: new Set(), status: 'error' };
    }

    return { ids: new Set((data || []).map(r => r.id)), status: 'ok' };
  } catch (e) {
    console.error('[emailOptOut] opt-out read threw:', e?.message || e);
    return { ids: new Set(), status: 'error' };
  }
}

/** True when the caller must abort sending because opt-out state is unknown. */
export const optOutUnknown = status => status === 'error';

/** Single-user check. Same contract as loadOptOutSet, collapsed to one id. */
export async function isOptedOut(supabase, userId) {
  const { ids, status } = await loadOptOutSet(supabase, [String(userId)]);
  if (optOutUnknown(status)) return true; // unknown → do not send
  return ids.has(String(userId));
}

/**
 * Record an opt-out. Returns { ok, reason }.
 *
 * `reason: 'absent'` means the column does not exist yet — the caller MUST
 * surface this as a failure rather than confirming an unsubscribe that was
 * never stored.
 *
 * notification_preferences.email_enabled is mirrored best-effort so the
 * existing /notifications settings toggle reflects reality, and so
 * /api/notifications-v2/send (which reads that flag) stops too. A failure to
 * mirror does not fail the opt-out — users.email_opted_out is the source of
 * truth and every non-transactional sender checks it.
 */
export async function recordOptOut(supabase, userId) {
  const { error } = await supabase
    .from('users')
    .update({ email_opted_out: true, email_opted_out_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    if (error.code === UNDEFINED_COLUMN) {
      console.error('[emailOptOut] cannot record opt-out — migration 20260729_email_opt_out.sql not applied.');
      return { ok: false, reason: 'absent' };
    }
    console.error(`[emailOptOut] opt-out write failed: ${error.message}${error.code ? ` (${error.code})` : ''}`);
    return { ok: false, reason: 'error' };
  }

  const { error: prefError } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, email_enabled: false, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' });
  if (prefError) {
    console.error(`[emailOptOut] notification_preferences mirror failed: ${prefError.message}`);
  }

  return { ok: true };
}

/**
 * Clear an opt-out. Called when a user re-enables email in settings, so the two
 * flags can never disagree in the direction that silently keeps mail off.
 * Best-effort: a missing column is not an error worth failing the caller over.
 */
export async function clearOptOut(supabase, userId) {
  const { error } = await supabase
    .from('users')
    .update({ email_opted_out: false, email_opted_out_at: null })
    .eq('id', userId);
  if (error && error.code !== UNDEFINED_COLUMN) {
    console.error(`[emailOptOut] opt-out clear failed: ${error.message}${error.code ? ` (${error.code})` : ''}`);
  }
}
