import { Redis } from '@upstash/redis';

/**
 * lib/rateLimit.js — distributed rate limiting + brute-force lockout.
 *
 * On Vercel every serverless instance gets its own memory, so a `Map`-based
 * limiter only ever throttles the instance that happens to serve the request.
 * State lives in Upstash Redis so all instances share one counter.
 *
 * Redis is best-effort, never load-bearing: every call is wrapped so that an
 * Upstash outage degrades to the per-instance in-memory limiter instead of
 * throwing a 500 into the user's face. Weaker limits beat a dead site.
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
    // The SDK defaults to 5 retries with exponential backoff (~4s worst case).
    // A rate-limit check sits in front of every request — it must never cost the
    // user seconds. One quick retry absorbs a transient blip; anything worse is
    // the circuit breaker's job.
    redis = new Redis({ url, token, retry: { retries: 1, backoff: () => 100 } });
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('RATELIMIT_NO_REDIS: UPSTASH_REDIS_REST_URL/TOKEN unset — falling back to per-instance memory. Limits will not hold across Vercel instances.');
  }
  return redis;
}

// ─── Circuit breaker ──────────────────────────────────────────────────────────
// When Redis starts failing, stop paying the round-trip on every request. After
// COOLDOWN_MS we try again. Keeps a Upstash outage from adding latency to the
// whole API.
const BREAKER_COOLDOWN_MS = 30_000;
let breakerOpenUntil = 0;
let lastBreakerLog = 0;

function redisAvailable() {
  return Boolean(getRedis()) && Date.now() >= breakerOpenUntil;
}

function tripBreaker(op, err) {
  breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
  // Log at most once per cooldown so an outage doesn't flood the logs.
  const now = Date.now();
  if (now - lastBreakerLog > BREAKER_COOLDOWN_MS) {
    lastBreakerLog = now;
    console.error(`RATELIMIT_REDIS_DOWN (${op}): ${err?.message || err} — using in-memory fallback for ${BREAKER_COOLDOWN_MS / 1000}s`);
  }
}

// ─── Shared limit presets ─────────────────────────────────────────────────────
/**
 * Policy: auth and other credential-handling routes are strictly tighter than
 * ordinary API routes. Anything that accepts a password, PIN, token or email
 * should use LIMITS.auth (or LIMITS.authSlow for send-an-email flows); regular
 * data routes use LIMITS.general.
 */
export const LIMITS = {
  auth:     { max: 5,  windowMs: 60_000 },      // 5/min  — login, signup, PIN
  authSlow: { max: 3,  windowMs: 3_600_000 },   // 3/hour — password reset, verification email
  general:  { max: 30, windowMs: 60_000 },      // 30/min — ordinary reads/writes
};

// ─── In-memory fallback (dev / Redis outage) ─────────────────────────────────
const memMap   = new Map(); // key → { count, resetAt }
const lockMap  = new Map(); // ip  → { failCount, lockedUntil }

const LOCKOUT_THRESHOLD   = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// GC unconditionally — the fallback maps can fill up during a Redis outage even
// when a client is configured. Lockout entries are dropped once they are past
// their lockout AND have gone untouched for a full lockout window, so a
// half-finished failure streak isn't wiped early.
const LOCK_ENTRY_TTL_MS = LOCKOUT_DURATION_MS * 2;

if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memMap) if (now > v.resetAt) memMap.delete(k);
    for (const [k, v] of lockMap) {
      if (now > v.lockedUntil && now - (v.touchedAt || 0) > LOCK_ENTRY_TTL_MS) lockMap.delete(k);
    }
  }, 5 * 60 * 1000);
  timer.unref?.();
}

// ─── FIX 01: Brute-force IP lockout ──────────────────────────────────────────

function memRecordFailedLogin(ip) {
  const now   = Date.now();
  const entry = lockMap.get(ip) || { failCount: 0, lockedUntil: 0, touchedAt: now };
  entry.touchedAt = now;
  if (entry.lockedUntil > now) return { locked: true, remainingMs: entry.lockedUntil - now };
  entry.failCount += 1;
  if (entry.failCount >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    entry.failCount   = 0;
    lockMap.set(ip, entry);
    return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
  }
  lockMap.set(ip, entry);
  return { locked: false };
}

/**
 * Record a failed login attempt for an IP.
 * Returns { locked: true, remainingMs } if now locked, else { locked: false }.
 */
export async function recordFailedLogin(ip) {
  if (redisAvailable()) {
    try {
      const r        = getRedis();
      const key      = `lockout:${ip}`;
      const countKey = `lockout_count:${ip}`;
      const count    = await r.incr(countKey);

      if (count === 1) {
        // First failure — start the sliding window. If EXPIRE fails the key
        // would live forever and lock this IP out permanently, so drop it.
        try {
          await r.expire(countKey, Math.ceil((LOCKOUT_DURATION_MS * 2) / 1000));
        } catch (e) {
          await r.del(countKey).catch(() => {});
          throw e;
        }
      }

      if (count >= LOCKOUT_THRESHOLD) {
        const ttlSec = Math.ceil(LOCKOUT_DURATION_MS / 1000);
        await r.set(key, '1', { ex: ttlSec });
        // Reset the counter so the next lockout needs a fresh 5 failures rather
        // than re-locking on the first attempt after this one expires.
        await r.del(countKey).catch(() => {});
        return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
      }
      return { locked: false };
    } catch (e) {
      tripBreaker('recordFailedLogin', e);
    }
  }
  return memRecordFailedLogin(ip);
}

/**
 * Check whether an IP is currently locked out.
 * Returns { locked: true, remainingMs } or { locked: false }.
 */
export async function isLockedOut(ip) {
  if (redisAvailable()) {
    try {
      const ttl = await getRedis().ttl(`lockout:${ip}`);
      if (ttl > 0) return { locked: true, remainingMs: ttl * 1000 };
      return { locked: false };
    } catch (e) {
      tripBreaker('isLockedOut', e);
    }
  }

  const now   = Date.now();
  const entry = lockMap.get(ip);
  if (!entry || entry.lockedUntil <= now) return { locked: false };
  return { locked: true, remainingMs: entry.lockedUntil - now };
}

/**
 * Clear failed-login counter on successful auth.
 */
export async function clearFailedLogins(ip) {
  if (redisAvailable()) {
    try {
      await getRedis().del(`lockout:${ip}`, `lockout_count:${ip}`);
    } catch (e) {
      tripBreaker('clearFailedLogins', e);
    }
  }
  // Always clear the local copy too — this instance may have recorded failures
  // in memory during an outage.
  lockMap.delete(ip);
}

// ─── General rate limiter ─────────────────────────────────────────────────────

function memRateLimit(identifier, maxRequests, windowMs) {
  const now    = Date.now();
  const record = memMap.get(identifier);
  if (!record || now > record.resetAt) {
    memMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  record.count++;
  return record.count <= maxRequests;
}

/**
 * Fixed-window rate limiter backed by Redis INCR + EXPIRE, shared across all
 * serverless instances. Falls back to per-instance memory if Redis is down.
 *
 * @returns {Promise<boolean>} true = allowed, false = rate-limited
 */
export async function rateLimit(identifier, maxRequests = 20, windowMs = 60000) {
  if (redisAvailable()) {
    try {
      const r         = getRedis();
      const key       = `rl:${identifier}`;
      const windowSec = Math.ceil(windowMs / 1000);
      const count     = await r.incr(key);

      if (count === 1) {
        // Without a TTL the key never resets and the caller is throttled
        // forever. If EXPIRE fails, delete the key and let the fallback decide.
        try {
          await r.expire(key, windowSec);
        } catch (e) {
          await r.del(key).catch(() => {});
          throw e;
        }
      }
      return count <= maxRequests;
    } catch (e) {
      tripBreaker('rateLimit', e);
    }
  }
  return memRateLimit(identifier, maxRequests, windowMs);
}

// ─── Response helpers ─────────────────────────────────────────────────────────

/**
 * `message` lets a route say what the student actually hit ("you're running code
 * too fast") instead of the generic wording. It is our own copy, never anything
 * derived from an error — nothing internal can reach the client through it.
 */
export function rateLimitResponse(retryAfterSec = 60, message = 'Too many requests. Please slow down.') {
  return new Response(
    JSON.stringify({ success: false, message }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}

export function lockoutResponse(remainingMs) {
  const remainingMin = Math.ceil(remainingMs / 60000);
  return new Response(
    JSON.stringify({
      success: false,
      message: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin !== 1 ? 's' : ''}.`,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
