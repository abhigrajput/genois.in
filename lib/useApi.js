'use client';
import { useState, useEffect } from 'react';

/**
 * Auth moved to an httpOnly `genois_token` cookie, which JS cannot read. When
 * localStorage has no token the session is still valid — it is just invisible
 * to the client — so useToken() returns this sentinel rather than null.
 *
 * Why a sentinel instead of null: ~29 pages gate their whole data layer on
 * `if (!ready || !token) return`. Returning null left every cookie-authenticated
 * user on a skeleton that never resolved, with no fetch and no error.
 *
 * The sentinel must never reach a header: extractToken() (lib/auth.js) returns
 * the Bearer value the moment an Authorization header exists and does NOT fall
 * back to the cookie, so sending it would turn a hang into a 401. authHeaders()
 * and apiFetch() below are the only places that decide, and both omit it.
 */
export const COOKIE_SESSION = '__genois_cookie_session__';

export function useToken() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem('genois_token');
    setToken(t || COOKIE_SESSION);
    setReady(true);
  }, []);
  return { token, ready };
}

/**
 * Authorization headers for a token from useToken(). Returns {} for a
 * cookie-only session so the browser's same-origin cookie authenticates
 * instead. Use this anywhere you would have written `'Bearer ' + token`.
 */
export function authHeaders(token) {
  return token && token !== COOKIE_SESSION ? { Authorization: 'Bearer ' + token } : {};
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
