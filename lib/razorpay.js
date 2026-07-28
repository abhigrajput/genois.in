/**
 * lib/razorpay.js — SERVER ONLY.
 *
 * Server-side Razorpay payment verification. Never import this from a client
 * component: it reads RAZORPAY_KEY_SECRET, which must never reach the browser.
 * (`NEXT_PUBLIC_RAZORPAY_KEY_ID` is the only Razorpay value safe on the client.)
 *
 * Why this file exists
 * --------------------
 * `/api/subscription/activate` and `/api/prep-packs/purchase` used to trust a
 * client-supplied `paymentId` and grant premium on the strength of it. Anyone
 * who could reach the endpoint could mint themselves a paid plan. Every grant
 * now has to come through `verifyPayment()` below, which asks Razorpay — over
 * the server-to-server API, authenticated with the secret key — whether that
 * payment actually exists, was actually captured, and was for the amount the
 * server expects (never the amount the client claims).
 *
 * Billing is currently suspended (`/api/payment/create-order` returns 503), so
 * `isBillingEnabled()` keeps the whole path closed until PAYMENTS_ENABLED is
 * explicitly flipped to "true". The verification code stays wired and ready.
 */

import crypto from 'crypto';
import { errorResponse } from '@/lib/response';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const FETCH_TIMEOUT_MS = 8000;

// ─── Billing kill-switch ──────────────────────────────────────────────────────

/**
 * Billing is enabled only when it is explicitly turned on AND the server has
 * the credentials needed to verify a payment. Fail closed: an unset, empty, or
 * malformed PAYMENTS_ENABLED means "off", and missing keys mean "off" even if
 * the flag says on — better to reject a real payment than to grant an unverified
 * one.
 */
export function isBillingEnabled() {
  const flag = String(process.env.PAYMENTS_ENABLED || '').trim().toLowerCase();
  if (flag !== 'true') return false;
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function billingDisabledResponse() {
  return errorResponse(
    'Billing is disabled. Payments are suspended during the Placement Beta — no plan changes can be processed.',
    403,
  );
}

// ─── Checkout signature ───────────────────────────────────────────────────────

/**
 * Verify the Razorpay Checkout handler signature:
 *   HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
 *
 * Only meaningful when the payment was created against an Order. Returns false
 * on any missing input rather than throwing.
 */
export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Both are hex of the same length; timingSafeEqual needs equal-length buffers.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─── Server-to-server lookup ──────────────────────────────────────────────────

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

/**
 * Fetch a payment from Razorpay by id. Returns the payment object, or null if
 * it does not exist / the call fails. Never throws — callers treat null as
 * "unverified" and reject.
 */
export async function fetchRazorpayPayment(paymentId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${RAZORPAY_API}/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: { Authorization: authHeader(), Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('RAZORPAY_LOOKUP_FAILED:', res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('RAZORPAY_LOOKUP_ERROR:', e?.name || 'error');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Full verification ────────────────────────────────────────────────────────

/** A payment id looks like `pay_XXXXXXXXXXXXXX`. Reject anything else early. */
export function isPlausiblePaymentId(id) {
  return typeof id === 'string' && /^pay_[A-Za-z0-9]{6,32}$/.test(id);
}

/**
 * Verify a payment end-to-end before any entitlement is granted.
 *
 * @param {object}  args
 * @param {string}  args.paymentId            - razorpay_payment_id from the client
 * @param {string} [args.orderId]             - razorpay_order_id, when Checkout used an Order
 * @param {string} [args.signature]           - razorpay_signature, paired with orderId
 * @param {number}  args.expectedAmountPaise  - price the SERVER says this item costs
 * @param {string} [args.expectedCurrency]    - defaults to INR
 *
 * @returns {Promise<{ok: true, payment: object} | {ok: false, reason: string}>}
 *
 * `reason` is for server logs. Callers return a generic message to the client so
 * a probe can't learn which check it tripped.
 */
export async function verifyPayment({
  paymentId,
  orderId,
  signature,
  expectedAmountPaise,
  expectedCurrency = 'INR',
}) {
  if (!isPlausiblePaymentId(paymentId)) {
    return { ok: false, reason: 'malformed payment id' };
  }
  if (!Number.isInteger(expectedAmountPaise) || expectedAmountPaise <= 0) {
    return { ok: false, reason: 'server has no price for this item' };
  }

  // When the client supplies an order + signature, the HMAC must hold. A wrong
  // signature is an active forgery attempt — stop before spending an API call.
  if (orderId || signature) {
    if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
      return { ok: false, reason: 'checkout signature mismatch' };
    }
  }

  const payment = await fetchRazorpayPayment(paymentId);
  if (!payment || !payment.id) {
    return { ok: false, reason: 'payment not found at Razorpay' };
  }

  // 'captured' is the only state where the money is actually ours. 'authorized'
  // means funds are on hold and can still vanish; everything else is a failure.
  if (payment.status !== 'captured') {
    return { ok: false, reason: `payment status is ${payment.status}` };
  }

  // Amount comes from the server-side price table, never from the request body.
  if (payment.amount !== expectedAmountPaise) {
    return { ok: false, reason: `amount mismatch: paid ${payment.amount}, expected ${expectedAmountPaise}` };
  }

  if (String(payment.currency).toUpperCase() !== expectedCurrency.toUpperCase()) {
    return { ok: false, reason: `currency mismatch: ${payment.currency}` };
  }

  // If an order id was claimed, it has to be the order Razorpay has on file —
  // a valid signature for a *different* order must not pass.
  if (orderId && payment.order_id && payment.order_id !== orderId) {
    return { ok: false, reason: 'order id does not match the payment' };
  }

  return { ok: true, payment };
}
