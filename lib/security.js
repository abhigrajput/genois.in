/**
 * lib/security.js
 * Shared security utilities: CSRF check, prompt sanitizer, password strength.
 */

const ALLOWED_ORIGINS = new Set([
  'https://www.genois.in',
  'https://genois.in',
]);

// In development, allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.add('http://localhost:3000');
  ALLOWED_ORIGINS.add('http://localhost:3001');
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ─── Trusted client-IP resolver ───────────────────────────────────────────────
/**
 * Get the client IP using only headers Vercel itself sets (not client-supplied
 * values appended to X-Forwarded-For). Order:
 *   1. x-real-ip          (set by Vercel, replaces any client value)
 *   2. last entry of x-forwarded-for (the value Vercel appended)
 *   3. 'unknown'
 *
 * Naïve `x-forwarded-for[0]` is client-controlled on Vercel and lets attackers
 * rotate apparent IPs to bypass per-IP lockouts. Always use this helper.
 */
export function getClientIp(request) {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}

/**
 * Constant-time string compare. Use for any secret comparison so the route's
 * response time doesn't reveal which prefix matched.
 *
 * Falls back to a manual constant-time loop if node:crypto isn't available
 * (Edge runtime). The loop reads every char of the longer string regardless of
 * mismatch position.
 */
export function timingSafeEqualStr(a, b) {
  const A = String(a ?? '');
  const B = String(b ?? '');
  const len = Math.max(A.length, B.length);
  let diff = A.length ^ B.length;
  for (let i = 0; i < len; i++) {
    diff |= (A.charCodeAt(i) || 0) ^ (B.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Authorize an incoming cron request against CRON_SECRET in constant time.
 * Returns true iff the Authorization header is `Bearer <CRON_SECRET>` and the
 * env var is set.
 */
export function isAuthorizedCron(request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  return timingSafeEqualStr(header, `Bearer ${expected}`);
}

export function isAllowedOrigin(origin) {
  return typeof origin === 'string' && ALLOWED_ORIGINS.has(origin);
}

/**
 * Resolve a request's origin from the Origin header, falling back to Referer.
 * Returns null if neither is parseable.
 */
export function resolveRequestOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const referer = request.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin; } catch { /* bad referer */ }
  }
  return null;
}

// ─── FIX 10: CSRF origin check ────────────────────────────────────────────────
/**
 * Verify the request Origin (or Referer fallback) is from an allowed origin.
 * Returns a 403 Response if rejected, or null if OK.
 * Only enforced for POST/PUT/PATCH/DELETE.
 *
 * Strict: requests with no Origin AND no Referer on state-changing methods are
 * rejected. Browsers always set one of these on same-origin POSTs; tooling
 * (curl, Postman, scripts) must set Origin explicitly to call state-changing
 * routes. Cron jobs / webhooks should be exempted at the middleware level.
 */
export function csrfCheck(request) {
  const method = request.method?.toUpperCase();
  if (!STATE_CHANGING_METHODS.has(method)) return null;

  const origin = resolveRequestOrigin(request);
  if (!isAllowedOrigin(origin)) {
    console.warn('[CSRF] Blocked request — origin:', origin || '(missing)');
    return new Response(
      JSON.stringify({ success: false, message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

// ─── FIX 05: Prompt injection sanitizer ──────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /system\s+prompt/gi,
  /\[INST\]/gi,
  /###/g,
  /<\|.*?\|>/g,
  /you\s+are\s+now/gi,
  /forget\s+(everything|all)/gi,
  /act\s+as\s+(a\s+)?(?!DSA|instructor|examiner)/gi, // allow legitimate "act as" for DSA context
  /jailbreak/gi,
  /DAN\b/g,
];

/**
 * Strip prompt injection attempts from user-controlled strings.
 * Hard-caps length to prevent context stuffing.
 */
export function sanitizeForAI(input, maxLen = 200) {
  let s = String(input ?? '').trim();
  for (const pattern of INJECTION_PATTERNS) {
    s = s.replace(pattern, '');
  }
  return s.slice(0, maxLen);
}

// ─── Chat history sanitizer ──────────────────────────────────────────────────
/**
 * Validate a user-supplied conversationHistory array before passing it to an LLM.
 * - Drops any role other than 'user' or 'assistant' (prevents 'system' override).
 * - Coerces content to a string and truncates to maxContentLen.
 * - Drops entries with empty content.
 * - Keeps only the last maxMessages entries.
 */
export function sanitizeChatHistory(history, maxMessages = 10, maxContentLen = 4000) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const entry of history) {
    if (!entry || typeof entry !== 'object') continue;
    const role = entry.role === 'assistant' ? 'assistant' : entry.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = String(entry.content ?? '').trim().slice(0, maxContentLen);
    if (!content) continue;
    cleaned.push({ role, content });
  }
  return cleaned.slice(-maxMessages);
}

/**
 * Cap a single user message and strip injection patterns.
 * Returns '' if the input is empty after cleaning.
 */
export function sanitizeUserMessage(input, maxLen = 4000) {
  return sanitizeForAI(input, maxLen);
}

// ─── FIX 12: Password strength ────────────────────────────────────────────────
/**
 * Returns null if strong enough, or an error string if not.
 */
export function checkPasswordStrength(pwd) {
  if (typeof pwd !== 'string') return 'Password must be a string';
  if (pwd.length < 8)   return 'Password must be at least 8 characters';
  if (pwd.length > 128) return 'Password must be at most 128 characters';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
  return null; // OK
}
