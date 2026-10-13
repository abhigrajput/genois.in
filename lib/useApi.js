'use client';
import { useState, useEffect } from 'react';

/**
 * The session is the httpOnly `genois_token` cookie alone: JS never holds the
 * token, and the browser sends the cookie on every same-origin request. Pages
 * still receive a "token" from useToken() so their existing
 * `if (!ready || !token) return` gates (~36 pages) keep working — this sentinel
 * is that value. It is not a credential and never goes in a header.
 */
export const COOKIE_SESSION = '__genois_cookie_session__';

// Returns null on the first render (matching the server render), then the
// sentinel once mounted, with ready=true.
export function useToken() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setToken(COOKIE_SESSION);
    setReady(true);
  }, []);
  return { token, ready };
}

/**
 * Kept so the call sites that spread it into fetch headers keep working.
 * Always {}: the cookie authenticates, and extractToken() (lib/auth.js)
 * ignores Authorization headers for user sessions. Callers still pass the
 * token from useToken(); it is ignored.
 */
export function authHeaders() {
  return {};
}

export async function apiFetch(url, token, method, body, signal) {
  if (!token) throw new Error('Not logged in');
  const res = await fetch(url, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal, // optional AbortSignal — lets callers enforce timeouts / cancel in-flight requests
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/**
 * apiFetch() with a hard wall-clock timeout via AbortController. On timeout the
 * thrown error carries `timedOut: true` so callers can branch to a retry
 * affordance instead of stranding the UI on a spinner. Shared by every page
 * that hits a slow AI/generation endpoint (interview, aptitude, …).
 * @param {string} url
 * @param {string|null} token
 * @param {string} method
 * @param {unknown} body
 * @param {number} timeoutMs
 */
export async function apiFetchWithTimeout(url, token, method, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await apiFetch(url, token, method, body, controller.signal);
  } catch (err) {
    if (err?.name === 'AbortError') {
      const e = new Error('The request took too long to respond.');
      e.timedOut = true;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
