import crypto from 'crypto';
import { Redis } from '@upstash/redis';

/**
 * lib/jwtBlacklist.js — revoked-token store.
 *
 * Logout has to revoke a JWT for every serverless instance, not just the one
 * that handled the logout request, so the blacklist lives in Upstash Redis.
 * Keys carry the token's own TTL, so entries evict themselves exactly when the
 * JWT would have expired anyway.
 *
 * Availability trade-off, stated plainly: if Redis is unreachable, writes fall
 * back to per-instance memory and reads can only consult that same memory. A
 * token revoked during an outage may still be accepted by other instances until
 * it expires naturally. The alternative — failing every authenticated request
 * when Upstash blips — is worse, and this matches the behaviour of the
 * pre-Redis implementation.
 */

// ─── Redis client (singleton) ─────────────────────────────────────────────────
let redis = null;
let redisChecked = false;

function getRedis() {
  if (redisChecked) return redis;
  redisChecked = true;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    // See lib/rateLimit.js — same reasoning: this runs on authenticated
    // requests, so a dead Redis must fail fast rather than retry for seconds.
    redis = new Redis({ url, token, retry: { retries: 1, backoff: () => 100 } });
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('JWTBLACKLIST_NO_REDIS: UPSTASH_REDIS_REST_URL/TOKEN unset — revocation is per-instance only.');
  }
  return redis;
}

// ─── Circuit breaker ──────────────────────────────────────────────────────────
const BREAKER_COOLDOWN_MS = 30_000;
let breakerOpenUntil = 0;
let lastBreakerLog = 0;

function redisAvailable() {
  return Boolean(getRedis()) && Date.now() >= breakerOpenUntil;
}

function tripBreaker(op, err) {
  breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
  const now = Date.now();
  if (now - lastBreakerLog > BREAKER_COOLDOWN_MS) {
    lastBreakerLog = now;
    console.error(`JWTBLACKLIST_REDIS_DOWN (${op}): ${err?.message || err} — using in-memory fallback for ${BREAKER_COOLDOWN_MS / 1000}s`);
  }
}

// ─── In-memory fallback ───────────────────────────────────────────────────────
const memBlacklist = new Map(); // hash → expiresAtMs

if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [hash, exp] of memBlacklist) {
      if (now > exp) memBlacklist.delete(hash);
    }
  }, 10 * 60 * 1000);
  timer.unref?.();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a JWT to the blacklist until its natural expiry.
 * @param {string} token      - Raw JWT string
 * @param {number} expiresAt  - Unix timestamp (seconds) when the JWT expires
 */
export async function blacklistToken(token, expiresAt) {
  const hash   = tokenHash(token);
  const ttlSec = expiresAt - Math.floor(Date.now() / 1000);
  if (ttlSec <= 0) return; // already expired — nothing to store

  // Always record locally as well: if Redis writes succeed but a later read
  // fails, this instance can still answer correctly.
  memBlacklist.set(hash, expiresAt * 1000);

  if (redisAvailable()) {
    try {
      // SET key "1" EX <ttl> — key auto-expires when the JWT would have expired
      await getRedis().set(`jbl:${hash}`, '1', { ex: ttlSec });
    } catch (e) {
      tripBreaker('blacklistToken', e);
    }
  }
}

/**
 * Check if a token is blacklisted.
 * @param {string} token - Raw JWT string
 * @returns {Promise<boolean>} true = revoked (deny), false = clean (allow)
 */
export async function isBlacklisted(token) {
  const hash = tokenHash(token);

  // Local hit is authoritative — no need to ask Redis.
  const exp = memBlacklist.get(hash);
  if (exp) {
    if (Date.now() <= exp) return true;
    memBlacklist.delete(hash);
  }

  if (redisAvailable()) {
    try {
      const val = await getRedis().get(`jbl:${hash}`);
      return val !== null && val !== undefined;
    } catch (e) {
      tripBreaker('isBlacklisted', e);
    }
  }

  return false;
}
