import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import {
  verifyUnsubscribeToken,
  recordOptOut,
  clearOptOut,
} from '@/lib/emailOptOut';

/**
 * Unsubscribe endpoint for non-transactional email.
 *
 * Auth is the signed token itself — no session, because the whole point is that
 * it works from an inbox years later on a device that has never logged in. The
 * token carries the user id and an HMAC over it, so a tampered id fails
 * verification and one user cannot unsubscribe another.
 *
 *   GET  ?token=…                     → opt out,  redirect to /unsubscribed
 *   GET  ?token=…&action=resubscribe  → opt back in, redirect to /unsubscribed
 *   POST ?token=…                     → RFC 8058 one-click, plain 200/400
 *
 * The redirect targets are the honest outcome, never a blanket success:
 *   status=ok           the flag is now set in the database
 *   status=resubscribed the flag is now cleared
 *   status=invalid      missing, malformed or wrongly-signed token
 *   status=error        verified fine, but the write did not land — including
 *                       the pre-migration case where the column is absent. The
 *                       page tells the user plainly that it did NOT work.
 */

/**
 * The token is carried through to the landing page on the two success states so
 * the page can offer a one-click undo. That matters: mail scanners (Outlook
 * Safe Links and friends) fetch every URL in a message, and a GET-triggered
 * unsubscribe can therefore fire without the user ever clicking. Making the
 * reversal one click is the practical mitigation.
 *
 * It is the same token that was already sitting in the user's inbox, so this
 * exposes nothing new, and the page loads no third-party resources that could
 * leak it via Referer.
 */
function landing(request, status, token) {
  const url = new URL(`/unsubscribed?status=${status}`, request.nextUrl.origin);
  if (token && (status === 'ok' || status === 'resubscribed')) {
    url.searchParams.set('token', token);
  }
  return NextResponse.redirect(url, { status: 303 }); // 303: the POST path must not be re-POSTed
}

async function apply(token, action) {
  const userId = verifyUnsubscribeToken(token);
  if (!userId) return 'invalid';

  const supabase = getAdminClient();

  if (action === 'resubscribe') {
    await clearOptOut(supabase, userId);
    return 'resubscribed';
  }

  const { ok } = await recordOptOut(supabase, userId);
  return ok ? 'ok' : 'error';
}

export async function GET(request) {
  try {
    const token  = request.nextUrl.searchParams.get('token');
    const action = request.nextUrl.searchParams.get('action');
    return landing(request, await apply(token, action), token);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return landing(request, 'error');
  }
}

/**
 * RFC 8058 one-click. Gmail/Outlook POST here when the user clicks the native
 * unsubscribe control, with no interactive session and no interest in HTML —
 * so this returns bare text, not a redirect. A non-200 makes the mail client
 * report the unsubscribe as failed, which is exactly what should happen when
 * the write did not land.
 */
export async function POST(request) {
  try {
    const status = await apply(request.nextUrl.searchParams.get('token'), null);
    if (status === 'ok') return new Response('Unsubscribed', { status: 200 });
    if (status === 'invalid') return new Response('Invalid token', { status: 400 });
    return new Response('Unsubscribe failed', { status: 500 });
  } catch (error) {
    console.error('Unsubscribe (one-click) error:', error);
    return new Response('Unsubscribe failed', { status: 500 });
  }
}
