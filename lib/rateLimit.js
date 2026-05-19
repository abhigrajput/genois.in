import { Redis } from '@upstash/redis';

// ─── Redis client (singleton) ─────────────────────────────────────────────────
// Falls back gracefully to in-memory if env vars are not yet set,
// so local dev without Upstash still works.
let redis = null;
function getRedis() {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

// ─── In-memory fallback (dev / missing env vars) ──────────────────────────────
const memMap   = new Map(); // key → { count, resetAt }
const lockMap  = new Map(); // ip  → { failCount, lockedUntil }

const LOCKOUT_THRESHOLD   = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Fallback GC every 5 min (only active when Redis is not available)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (getRedis()) return; // Redis is live — skip
    const now = Date.now();
    for (const [k, v] of memMap)  if (now > v.resetAt)      memMap.delete(k);
    for (const [k, v] of lockMap) if (now > v.lockedUntil)  lockMap.delete(k);
  }, 5 * 60 * 1000);
}

// ─── FIX 01: Brute-force IP lockout ──────────────────────────────────────────

/**
 * Record a failed login attempt for an IP.
 * Returns { locked: true, remainingMs } if now locked, else { locked: false }.
 */
export async function recordFailedLogin(ip) {
  const r = getRedis();
  if (r) {
    const key      = `lockout:${ip}`;
    const countKey = `lockout_count:${ip}`;
    const count    = await r.incr(countKey);
    if (count === 1) {
      // First failure — start the sliding window (2× lockout window so counter
      // survives long enough to hit the threshold)
      await r.expire(countKey, Math.ceil((LOCKOUT_DURATION_MS * 2) / 1000));
    }
    if (count >= LOCKOUT_THRESHOLD) {
      const ttlSec = Math.ceil(LOCKOUT_DURATION_MS / 1000);
      await r.set(key, '1', { ex: ttlSec, nx: true }); // nx = only set once per lockout period
      return { locked: true, remainingMs: LOCKOUT_DURATION_MS };
    }
    return { locked: false };
  }

  // ── Fallback ──
  const now   = Date.now();
  const entry = lockMap.get(ip) || { failCount: 0, lockedUntil: 0 };
  if (entry.lockedUntil > now) return { locked: true, remainingMs: entry.lockedUntil - now };
  entry.failCount += 1;
  if (entry.failCount >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    entry.failCount   = 0;
  }
  lockMap.set(ip, entry);
  return { locked: false };
}

/**
 * Check whether an IP is currently locked out.
 * Returns { locked: true, remainingMs } or { locked: false }.
 */
export async function isLockedOut(ip) {
  const r = getRedis();
  if (r) {
    const ttl = await r.ttl(`lockout:${ip}`);
    if (ttl > 0) return { locked: true, remainingMs: ttl * 1000 };
    return { locked: false };
  }

  // ── Fallback ──
  const now   = Date.now();
  const entry = lockMap.get(ip);
  if (!entry || entry.lockedUntil <= now) return { locked: false };
  return { locked: true, remainingMs: entry.lockedUntil - now };
}

/**
 * Clear failed-login counter on successful auth.
 */
export async function clearFailedLogins(ip) {
  const r = getRedis();
  if (r) {
    await r.del(`lockout:${ip}`, `lockout_count:${ip}`);
    return;
  }
  lockMap.delete(ip);
}

// ─── General rate limiter ─────────────────────────────────────────────────────

/**
 * Fixed-window rate limiter backed by Redis INCR + EXPIRE.
 * @returns {Promise<boolean>} true = allowed, false = rate-limited
 */
export async function rateLimit(identifier, maxRequests = 20, windowMs = 60000) {
  const r = getRedis();
  if (r) {
    const key      = `rl:${identifier}`;
    const windowSec = Math.ceil(windowMs / 1000);
    const count    = await r.incr(key);
    if (count === 1) {
      // First request in this window — set TTL
      await r.expire(key, windowSec);
    }
    return count <= maxRequests;
  }

  // ── Fallback (in-memory) ──
  const now    = Date.now();
  const record = memMap.get(identifier);
  if (!record || now > record.resetAt) {
    memMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  record.count++;
  return record.count <= maxRequests;
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function rateLimitResponse(retryAfterSec = 60) {
  return new Response(
    JSON.stringify({ success: false, message: 'Too many requests. Please slow down.' }),
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
