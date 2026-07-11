'use client';
import { useState, useEffect } from 'react';

export function useToken() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem('genois_token');
    setToken(t);
    setReady(true);
  }, []);
  return { token, ready };
}

export async function apiFetch(url, token, method, body, signal) {
  if (!token) throw new Error('Not logged in');
  const res = await fetch(url, {
    method: method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal, // optional AbortSignal — lets callers enforce timeouts / cancel in-flight requests
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
