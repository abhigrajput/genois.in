import crypto from 'crypto';
import { Redis } from '@upstash/redis';

// ─── Redis client (singleton) ─────────────────────────────────────────────────
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

// ─── In-memory fallback ───────────────────────────────────────────────────────
const memBlacklist = new Map(); // hash → expiresAtMs

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (getRedis()) return; // Redis live — skip
    const now = Date.now();
    for (const [hash, exp] of memBlacklist) {
      if (now > exp) memBlacklist.delete(hash);
    }
  }, 10 * 60 * 1000);
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

  const r = getRedis();
  if (r) {
    // SET key "1" EX <ttl> — key auto-expires when the JWT would have expired
    await r.set(`jbl:${hash}`, '1', { ex: ttlSec });
    return;
  }

  // ── Fallback ──
  memBlacklist.set(hash, expiresAt * 1000);
}

/**
 * Check if a token is blacklisted.
 * @param {string} token - Raw JWT string
 * @returns {Promise<boolean>} true = revoked (deny), false = clean (allow)
 */
export async function isBlacklisted(token) {
  const hash = tokenHash(token);

  const r = getRedis();
  if (r) {
    const val = await r.get(`jbl:${hash}`);
    return val !== null;
  }

  // ── Fallback ──
  const exp = memBlacklist.get(hash);
  if (!exp) return false;
  if (Date.now() > exp) {
    memBlacklist.delete(hash);
    return false;
  }
  return true;
}
