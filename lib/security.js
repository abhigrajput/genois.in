/**
 * lib/security.js
 * Shared security utilities: CSRF check, prompt sanitizer, password strength.
 */

const ALLOWED_ORIGINS = [
  'https://www.genois.in',
  'https://genois.in',
];

// In development, allow localhost origins
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001');
}

// ─── FIX 10: CSRF origin check ────────────────────────────────────────────────
/**
 * Verify the request Origin is from genois.in.
 * Returns a 403 Response if the origin is bad, or null if OK.
 * Only enforced for POST/PUT/PATCH/DELETE.
 */
export function csrfCheck(request) {
  const method = request.method?.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;

  const origin = request.headers.get('origin');
  // If no origin header (server-to-server, curl): allow but log
  if (!origin) return null;

  if (!ALLOWED_ORIGINS.some(o => origin === o)) {
    console.warn('[CSRF] Blocked request from origin:', origin);
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
